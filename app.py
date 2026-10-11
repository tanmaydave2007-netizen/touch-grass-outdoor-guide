from __future__ import annotations

import json
import math
import os
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from threading import Lock
from time import monotonic
from typing import Any

import requests
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

_WEATHER_CACHE_TTL_SECONDS = 600
_WEATHER_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}
_WEATHER_CACHE_LOCK = Lock()

OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models"
OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"
OPEN_METEO_GEO_URL = "https://geocoding-api.open-meteo.com/v1/search"
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_AQ_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

WEATHER_CODES = {
    0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing rime fog", 51: "Light drizzle", 53: "Drizzle",
    55: "Dense drizzle", 56: "Freezing drizzle", 57: "Dense freezing drizzle",
    61: "Slight rain", 63: "Rain", 65: "Heavy rain", 66: "Freezing rain",
    67: "Heavy freezing rain", 71: "Slight snow", 73: "Snow", 75: "Heavy snow",
    77: "Snow grains", 80: "Rain showers", 81: "Rain showers", 82: "Heavy rain showers",
    85: "Snow showers", 86: "Heavy snow showers", 95: "Thunderstorm",
    96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail",
}

# The Gemma 4 model IDs below were checked against OpenRouter's model pages
# on 2026-10-10. Live listings can change, so the dropdown refreshes the API.
# Gemma 4's official model card lists Apache 2.0. Other families need their own
# exact model-card/license check before a submission makes a licensing claim.
PREFERRED_GEMMA_MODEL = "google/gemma-4-26b-a4b-it:free"
GEMMA_4_MODEL_CARD = "https://ai.google.dev/gemma/docs/core/model_card_4"
# OPEN_WEIGHT_FAMILY_PREFIXES = (
#     "qwen/", "meta-llama/", "mistralai/", "deepseek/", "google/gemma",
#     "microsoft/phi", "nvidia/", "cohere/",
# )
# MODEL_FALLBACKS = [
#     {"id": "google/gemma-4-26b-a4b-it:free", "name": "Gemma 4 26B A4B IT · Free · Apache 2.0", "license": "Apache-2.0", "model_card_url": GEMMA_4_MODEL_CARD},
#     {"id": "google/gemma-4-31b-it:free", "name": "Gemma 4 31B IT · Free · Apache 2.0", "license": "Apache-2.0", "model_card_url": GEMMA_4_MODEL_CARD},
# ]


OPEN_WEIGHT_FAMILY_PREFIXES = (
    "qwen/", "meta-llama/", "mistralai/", "deepseek/",
    "microsoft/phi", "nvidia/", "cohere/",
)

MODEL_FALLBACKS = []

def safe_float(value: Any, default: float | None = None) -> float | None:
    try:
        return float(value) if value is not None else default
    except (TypeError, ValueError):
        return default


def outdoor_score(feels: float, rain: float, aqi: float | None, uv: float, wind: float = 0) -> int:
    """A simple heuristic score, not an official safety assessment."""
    score = 100
    if feels > 40:
        score -= 35
    elif feels > 36:
        score -= 22
    elif feels > 32:
        score -= 10
    elif feels < 8:
        score -= 22
    elif feels < 15:
        score -= 10

    if rain > 70:
        score -= 25
    elif rain > 40:
        score -= 12

    if aqi is not None:
        if aqi > 200:
            score -= 45
        elif aqi > 150:
            score -= 30
        elif aqi > 100:
            score -= 18
        elif aqi > 50:
            score -= 8

    if uv >= 11:
        score -= 20
    elif uv >= 8:
        score -= 12
    elif uv >= 6:
        score -= 6

    if wind >= 50:
        score -= 8
    return max(0, min(100, round(score)))


def score_label(score: int) -> str:
    if score >= 80:
        return "Great conditions"
    if score >= 60:
        return "Good with precautions"
    if score >= 40:
        return "Choose your time carefully"
    return "Consider an indoor plan"


def geocode_city(city: str) -> dict[str, Any] | None:
    response = requests.get(
        OPEN_METEO_GEO_URL,
        params={"name": city, "count": 1, "language": "en", "format": "json"},
        timeout=12,
    )
    response.raise_for_status()
    results = response.json().get("results") or []
    if not results:
        return None
    place = results[0]
    return {
        "name": place.get("name", city),
        "country": place.get("country", ""),
        "admin1": place.get("admin1", ""),
        "latitude": place["latitude"],
        "longitude": place["longitude"],
        "timezone": place.get("timezone", "auto"),
    }


def get_aqi(lat: float, lon: float) -> float | None:
    try:
        response = requests.get(
            OPEN_METEO_AQ_URL,
            params={"latitude": lat, "longitude": lon, "current": "us_aqi", "timezone": "auto"},
            timeout=10,
        )
        response.raise_for_status()
        value = (response.json().get("current") or {}).get("us_aqi")
        return safe_float(value)
    except (requests.RequestException, ValueError, KeyError):
        return None


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "service": "Touch Grass Outdoor Guide"})


@app.get("/api/weather")
def api_weather():
    city = (request.args.get("city") or "Ahmedabad").strip()[:80]
    if not city:
        return jsonify({"error": "Enter a city name."}), 400
    cache_key = city.casefold()
    force_refresh = request.args.get("refresh") == "1"
    now = monotonic()
    with _WEATHER_CACHE_LOCK:
        cached = _WEATHER_CACHE.get(cache_key)
        if not force_refresh and cached and now - cached[0] < _WEATHER_CACHE_TTL_SECONDS:
            cached_response = jsonify(cached[1])
            cached_response.headers["X-Touch-Grass-Cache"] = "HIT"
            return cached_response
        if cached:
            _WEATHER_CACHE.pop(cache_key, None)
    try:
        place = geocode_city(city)
        if not place:
            return jsonify({"error": f"I couldn't find '{city}'. Try a nearby city name."}), 404

        params = {
            "latitude": place["latitude"],
            "longitude": place["longitude"],
            "timezone": "auto",
            "forecast_days": 7,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
            "hourly": "temperature_2m,apparent_temperature,precipitation_probability,uv_index,weather_code",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,sunrise,sunset",
        }
        with ThreadPoolExecutor(max_workers=2) as pool:
            forecast_future = pool.submit(requests.get, OPEN_METEO_URL, params=params, timeout=15)
            aqi_future = pool.submit(get_aqi, place["latitude"], place["longitude"])
            response = forecast_future.result()
            response.raise_for_status()
            data = response.json()
            aqi = aqi_future.result()
        current = data.get("current") or {}
        daily = data.get("daily") or {}
        hourly = data.get("hourly") or {}

        now_time = current.get("time", "")
        now_date = now_time[:10]
        now_hour = int(now_time[11:13]) if len(now_time) >= 13 else 12
        idx = next((i for i, item in enumerate(hourly.get("time", [])) if item[:10] == now_date and int(item[11:13]) >= now_hour), 0)
        rain_prob = safe_float((hourly.get("precipitation_probability") or [0])[idx] if hourly.get("precipitation_probability") else 0, 0) or 0
        uv = safe_float((hourly.get("uv_index") or [0])[idx] if hourly.get("uv_index") else 0, 0) or 0
        feels = safe_float(current.get("apparent_temperature"), 0) or 0
        wind = safe_float(current.get("wind_speed_10m"), 0) or 0
        score = outdoor_score(feels, rain_prob, aqi, uv, wind)

        forecast = []
        for i, day in enumerate(daily.get("time", [])[:7]):
            high = (daily.get("temperature_2m_max") or [None] * 7)[i]
            low = (daily.get("temperature_2m_min") or [None] * 7)[i]
            code = (daily.get("weather_code") or [None] * 7)[i]
            daily_uv = (daily.get("uv_index_max") or [None] * 7)[i]
            daily_rain = (daily.get("precipitation_probability_max") or [None] * 7)[i]
            forecast.append({
                "date": day,
                "label": datetime.strptime(day, "%Y-%m-%d").strftime("%a"),
                "date_label": datetime.strptime(day, "%Y-%m-%d").strftime("%d %b"),
                "high": high,
                "low": low,
                "code": code,
                "condition": WEATHER_CODES.get(code, "Conditions unavailable"),
                "uv": daily_uv,
                "rain": daily_rain,
            })

        hours = []
        hourly_times = hourly.get("time") or []
        for i in range(min(len(hourly_times), len(hourly.get("temperature_2m", [])))):
            if hourly_times[i][:10] != now_date:
                continue
            try:
                hh = int(hourly_times[i][11:13])
            except (ValueError, TypeError):
                continue
            if hh < now_hour:
                continue
            if len(hours) >= 12:
                break
            h_feels = safe_float((hourly.get("apparent_temperature") or [None] * len(hourly_times))[i], feels)
            h_rain = safe_float((hourly.get("precipitation_probability") or [None] * len(hourly_times))[i], 0) or 0
            h_uv = safe_float((hourly.get("uv_index") or [None] * len(hourly_times))[i], 0) or 0
            h_score = outdoor_score(h_feels or feels, h_rain, aqi, h_uv, wind)
            hours.append({
                "time": f"{hh:02d}:00",
                "label": datetime.strptime(hourly_times[i], "%Y-%m-%dT%H:%M").strftime("%I %p").lstrip("0"),
                "temperature": (hourly.get("temperature_2m") or [None] * len(hourly_times))[i],
                "score": h_score,
            })

        payload = {
            "place": {
                "name": place["name"], "country": place["country"], "admin1": place["admin1"],
                "latitude": place["latitude"], "longitude": place["longitude"],
            },
            "updated": now_time,
            "current": {
                "temperature": current.get("temperature_2m"),
                "feels_like": current.get("apparent_temperature"),
                "humidity": current.get("relative_humidity_2m"),
                "wind": current.get("wind_speed_10m"),
                "rain": rain_prob,
                "uv": uv,
                "aqi": aqi,
                "code": current.get("weather_code"),
                "condition": WEATHER_CODES.get(current.get("weather_code"), "Conditions unavailable"),
                "is_day": bool(current.get("is_day", 1)),
                "score": score,
                "score_label": score_label(score),
            },
            "forecast": forecast,
            "hours": hours,
            "sunrise": (daily.get("sunrise") or [None])[0],
            "sunset": (daily.get("sunset") or [None])[0],
            "source": "Open-Meteo",
        }
        with _WEATHER_CACHE_LOCK:
            _WEATHER_CACHE[cache_key] = (monotonic(), payload)
        cached_response = jsonify(payload)
        cached_response.headers["X-Touch-Grass-Cache"] = "MISS"
        return cached_response
    except requests.Timeout:
        return jsonify({"error": "The weather service took too long. Please try again."}), 504
    except requests.RequestException:
        return jsonify({"error": "Could not load live weather. Check your internet connection and try again."}), 502
    except (ValueError, KeyError, IndexError, TypeError):
        return jsonify({"error": "The weather response was incomplete. Please try again in a moment."}), 502

    
    # except requests.RequestException as e:
    #   app.logger.exception("Weather API request failed for city=%s", city)
    # return jsonify({
    #     "error": "Could not load live weather. Check your internet connection and try again."
    # }), 502



@app.get("/api/parks")
def api_parks():
    city = (request.args.get("city") or "Ahmedabad").strip()[:80]
    radius = min(max(int(request.args.get("radius", "8000")), 1000), 15000)
    try:
        place = geocode_city(city)
        if not place:
            return jsonify({"error": f"I couldn't find '{city}'."}), 404
        lat, lon = place["latitude"], place["longitude"]
        query = (
            f'[out:json][timeout:20];'
            f'nwr["leisure"~"^(park|garden|nature_reserve)$"]["name"](around:{radius},{lat},{lon});'
            f'out center 40;'
        )
        response = requests.post(
            OVERPASS_URL,
            data={"data": query},
            headers={"User-Agent": "TouchGrassOutdoorGuide/1.0 (local student project)"},
            timeout=25,
        )
        response.raise_for_status()
        elements = response.json().get("elements", [])
        parks: list[dict[str, Any]] = []
        seen: set[tuple[str, int, int]] = set()
        for element in elements:
            tags = element.get("tags") or {}
            name = str(tags.get("name", "")).strip()
            coords = element.get("center") or element
            p_lat = safe_float(coords.get("lat"))
            p_lon = safe_float(coords.get("lon"))
            if not name or p_lat is None or p_lon is None:
                continue
            key = (name.casefold(), round(p_lat * 10000), round(p_lon * 10000))
            if key in seen:
                continue
            seen.add(key)
            distance = haversine(lat, lon, p_lat, p_lon)
            parks.append({
                "name": name,
                "latitude": p_lat,
                "longitude": p_lon,
                "distance_km": round(distance, 1),
                "kind": tags.get("leisure", "green space").replace("_", " ").title(),
                "map_url": f"https://www.openstreetmap.org/?mlat={p_lat}&mlon={p_lon}#map=16/{p_lat}/{p_lon}",
            })
        parks.sort(key=lambda item: item["distance_km"])
        return jsonify({"city": place["name"], "center": {"latitude": lat, "longitude": lon}, "parks": parks[:18], "source": "OpenStreetMap"})
    except (ValueError, requests.RequestException):
        return jsonify({"error": "The park map service is busy or unavailable. Please try again."}), 502


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(a))


def clean_plan(plan: Any, prefs: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(plan, dict):
        plan = {}
    duration = int(prefs.get("duration", 45) or 45)
    steps = plan.get("steps")
    if not isinstance(steps, list) or not steps:
        steps = [
            {"time": f"0–{max(5, duration // 4)} min", "title": "Arrive and notice your surroundings", "detail": "Put your phone on silent, breathe slowly, and look around."},
            {"time": f"{max(5, duration // 4)}–{max(10, duration // 2)} min", "title": "Move at a comfortable pace", "detail": "Walk, stretch, or begin your selected activity gently."},
            {"time": f"{max(10, duration // 2)}–{max(15, duration - 5)} min", "title": "Explore without scrolling", "detail": "Notice three small details in nature and enjoy the moment."},
            {"time": f"Last 5 min", "title": "Wrap up mindfully", "detail": "Take a sip of water and check how you feel."},
        ]
    normalized_steps = []
    for item in steps[:8]:
        if isinstance(item, str):
            normalized_steps.append({"time": "During your outing", "title": item, "detail": "Keep a comfortable pace and stay aware of your surroundings."})
        elif isinstance(item, dict):
            normalized_steps.append({
                "time": str(item.get("time", "During your outing"))[:50],
                "title": str(item.get("title", "Outdoor activity"))[:120],
                "detail": str(item.get("detail", "Enjoy the outdoors at a comfortable pace."))[:320],
            })
    checklist = plan.get("checklist")
    if not isinstance(checklist, list) or not checklist:
        checklist = ["Water bottle", "Comfortable shoes", "Sun protection", "Small bag"]
    safety = plan.get("safety")
    if not isinstance(safety, list) or not safety:
        safety = ["Check current local conditions before leaving.", "Tell someone your route if going alone.", "Stay on public paths and keep water with you."]
    return {
        "title": str(plan.get("title") or f"{prefs.get('activity', 'Outdoor')} plan")[:120],
        "summary": str(plan.get("summary") or "A simple plan to spend meaningful time outside.")[:600],
        "best_time": str(plan.get("best_time") or "Choose a comfortable daylight window after checking local conditions.")[:240],
        "steps": normalized_steps,
        "checklist": [str(x)[:100] for x in checklist[:10]],
        "safety": [str(x)[:220] for x in safety[:5]],
        "screen_free_challenge": str(plan.get("screen_free_challenge") or "Keep your phone in your bag for 10 minutes and name five things you notice.")[:300],
        "nature_fact": str(plan.get("nature_fact") or "Take a moment to listen for different natural sounds around you.")[:300],
    }


def demo_plan(prefs: dict[str, Any], reason: str | None = None) -> dict[str, Any]:
    activity = str(prefs.get("activity", "Hiking / Walk"))
    duration = int(prefs.get("duration", 45) or 45)
    mood = str(prefs.get("mood", "Okay"))
    city = str(prefs.get("city", "your area"))
    vibe = str(prefs.get("vibe", "Relaxing"))
    group = str(prefs.get("group", "Solo"))
    steps = [
        {"time": f"0–{max(5, duration // 6)} min", "title": "Arrive and reset", "detail": f"Reach a safe public green space in {city}. Silence non-essential notifications and take five slow breaths."},
        {"time": f"{max(5, duration // 6)}–{max(12, duration // 2)} min", "title": f"Start your {activity.lower()}", "detail": f"Keep the pace comfortable. Aim for a {vibe.lower()} experience, not a performance target."},
        {"time": f"{max(12, duration // 2)}–{max(18, duration - 8)} min", "title": "Try a nature noticing challenge", "detail": "Find one leaf shape, one natural sound, and one colour you had not noticed before."},
        {"time": f"Last {min(8, duration)} min", "title": "Pause and check in", "detail": f"Notice whether your mood feels different from when you arrived. {'Stay together and agree on a return time.' if group != 'Solo' else 'If alone, stay in public areas and let someone know when you are heading back.'}"},
    ]
    plan = {
        "title": f"{activity} reset in {city}",
        "summary": f"A {duration}-minute, {vibe.lower()} outdoor plan designed around your current mood ({mood.lower()}). Keep it simple and let nature be the main event.",
        "best_time": "Use the live conditions panel to choose a comfortable time. Avoid intense activity during high heat, poor air quality, or heavy rain.",
        "steps": steps,
        "checklist": ["Water bottle", "Comfortable shoes", "Sun protection", "Phone on silent", "Any personal essentials"],
        "safety": ["Check the latest weather and air quality before leaving.", "Stay on public, familiar paths and be aware of traffic.", "If conditions feel unsafe, shorten the outing or choose another time."],
        "screen_free_challenge": "Keep the phone out of your hand for the first 15 minutes. Notice five things around you and remember them without taking a photo.",
        "nature_fact": "Spending time in green spaces can feel restorative, though individual experiences vary. Treat this outing as a small experiment in how you feel.",
    }
    plan = clean_plan(plan, prefs)
    language = prefs.get("language", "English")
    if language == "Gujarati":
        activity_gu = {"Hiking / Walk":"હાઇકિંગ / ચાલવું", "Gardening":"બાગકામ", "Bird Watching":"પક્ષીઓ નિહાળવા", "Outdoor Sports":"બહારની રમતો", "Picnic":"પિકનિક", "Yoga in Nature":"પ્રકૃતિમાં યોગ", "Cycling":"સાયકલ ચલાવવી", "Photography Walk":"ફોટોગ્રાફી માટે ચાલવું", "Jogging":"જોગિંગ"}.get(activity, activity)
        plan = {
            "title": f"{activity_gu} · {city}માં તાજગીનો વિરામ",
            "summary": f"તમારા હાલના મૂડ ({mood}) અને પસંદગી પ્રમાણે {duration} મિનિટનો સરળ બહારનો પ્લાન. ધીમે ચાલો અને પ્રકૃતિનો આનંદ માણો.",
            "best_time": "હવામાન અને હવાની ગુણવત્તા તપાસીને આરામદાયક સમય પસંદ કરો. વધુ ગરમી, ખરાબ હવાની ગુણવત્તા અથવા ભારે વરસાદમાં જોરદાર પ્રવૃત્તિ ટાળો.",
            "steps": [
                {"time": f"0–{max(5, duration // 6)} મિનિટ", "title": "સુરક્ષિત જગ્યાએ પહોંચો અને શાંતિ મેળવો", "detail": f"{city}માં જાહેર અને સુરક્ષિત હરિયાળી જગ્યાએ પહોંચો. જરૂરી ન હોય તેવી સૂચનાઓ બંધ કરો અને ધીમા પાંચ શ્વાસ લો."},
                {"time": f"{max(5, duration // 6)}–{max(12, duration // 2)} મિનિટ", "title": f"{activity_gu} શરૂ કરો", "detail": f"તમારી અનુકૂળ ગતિ રાખો. લક્ષ્ય પૂરું કરવાની દોડ કરતાં {vibe} અનુભવ પર ધ્યાન આપો."},
                {"time": f"{max(12, duration // 2)}–{max(18, duration - 8)} મિનિટ", "title": "પ્રકૃતિને ધ્યાનથી નિહાળો", "detail": "પાનનો એક આકાર, પ્રકૃતિનો એક અવાજ અને પહેલાં ન જોયેલો એક રંગ શોધો."},
                {"time": f"છેલ્લી {min(8, duration)} મિનિટ", "title": "થોભો અને પોતાની લાગણી તપાસો", "detail": "આવ્યા ત્યારે અને હવે તમારા મૂડમાં શું ફેરફાર છે તે નોંધો. એકલા હો તો જાહેર જગ્યાએ રહો અને કોઈને પરત ફરવાનો સમય જણાવો."},
            ],
            "checklist": ["પાણીની બોટલ", "આરામદાયક જૂતાં", "સૂર્યથી બચાવ", "ફોન સાઇલન્ટ પર", "જરૂરી વ્યક્તિગત વસ્તુઓ"],
            "safety": ["નીકળતાં પહેલાં હવામાન અને હવાની ગુણવત્તા તપાસો.", "જાહેર અને ઓળખીતા રસ્તે રહો અને ટ્રાફિકનું ધ્યાન રાખો.", "અસલામત લાગે તો સમય ઓછો કરો અથવા બીજો સમય પસંદ કરો."],
            "screen_free_challenge": "પ્રથમ 15 મિનિટ ફોન હાથમાં ન લો. આસપાસની પાંચ બાબતો નિહાળો અને ફોટો લીધા વગર યાદ રાખો.",
            "nature_fact": "હરિયાળી જગ્યામાં સમય વિતાવવાથી તાજગી અનુભવાઈ શકે છે, પરંતુ દરેક વ્યક્તિનો અનુભવ અલગ હોઈ શકે છે. તમારા અનુભવને નાનો પ્રયોગ માનો.",
        }
    elif language == "Hindi":
        activity_hi = {"Hiking / Walk":"हाइकिंग / पैदल चलना", "Gardening":"बागवानी", "Bird Watching":"पक्षी देखना", "Outdoor Sports":"बाहरी खेल", "Picnic":"पिकनिक", "Yoga in Nature":"प्रकृति में योग", "Cycling":"साइकिल चलाना", "Photography Walk":"फोटोग्राफी वॉक", "Jogging":"जॉगिंग"}.get(activity, activity)
        plan = {
            "title": f"{city} में {activity_hi} और ताज़गी",
            "summary": f"आपके मौजूदा मूड ({mood}) और पसंद के अनुसार {duration} मिनट की सरल बाहरी योजना। धीरे चलें और प्रकृति का आनंद लें।",
            "best_time": "मौसम और हवा की गुणवत्ता जाँचकर आरामदायक समय चुनें। तेज़ गर्मी, खराब हवा या भारी बारिश में ज़ोरदार गतिविधि से बचें।",
            "steps": [
                {"time": f"0–{max(5, duration // 6)} मिनट", "title": "सुरक्षित जगह पहुँचें और शांत हों", "detail": f"{city} में किसी सुरक्षित सार्वजनिक हरियाली वाली जगह पर पहुँचें। गैर-ज़रूरी सूचनाएँ बंद करें और धीरे-धीरे पाँच साँसें लें।"},
                {"time": f"{max(5, duration // 6)}–{max(12, duration // 2)} मिनट", "title": f"{activity_hi} शुरू करें", "detail": f"अपनी सहज गति रखें। प्रदर्शन का लक्ष्य बनाने के बजाय {vibe} अनुभव पर ध्यान दें."},
                {"time": f"{max(12, duration // 2)}–{max(18, duration - 8)} मिनट", "title": "प्रकृति को ध्यान से देखें", "detail": "पत्ते का एक आकार, प्रकृति की एक आवाज़ और ऐसा एक रंग खोजें जिस पर पहले ध्यान नहीं गया था।"},
                {"time": f"आख़िरी {min(8, duration)} मिनट", "title": "रुकें और अपना हाल जानें", "detail": "आने से पहले और अब अपने मूड में अंतर देखें। अकेले हों तो सार्वजनिक जगह पर रहें और किसी को वापसी का समय बता दें।"},
            ],
            "checklist": ["पानी की बोतल", "आरामदायक जूते", "धूप से बचाव", "फोन साइलेंट पर", "ज़रूरी निजी सामान"],
            "safety": ["निकलने से पहले मौसम और हवा की गुणवत्ता जाँचें।", "सार्वजनिक और परिचित रास्तों पर रहें और ट्रैफ़िक से सावधान रहें।", "असुरक्षित लगे तो समय कम करें या दूसरा समय चुनें।"],
            "screen_free_challenge": "पहले 15 मिनट फोन हाथ में न लें। आसपास की पाँच चीज़ें देखें और बिना फोटो लिए उन्हें याद रखें।",
            "nature_fact": "हरियाली में समय बिताना सुकून दे सकता है, हालाँकि हर व्यक्ति का अनुभव अलग हो सकता है। इस सैर को अपने अनुभव का छोटा प्रयोग मानें।",
        }
    if reason:
        plan["note"] = reason
    return plan


@app.get("/api/models")
def api_models():
    """Return currently listed free text models from common open-weight model families.

    The list is a convenience, not proof of a model's license. Users should verify
    the model card and terms before claiming a model is open source/open weight.
    """
    allowed_prefixes = OPEN_WEIGHT_FAMILY_PREFIXES
    try:
        response = requests.get(OPENROUTER_MODELS_URL, timeout=12)
        response.raise_for_status()
        raw = response.json().get("data", [])
        models = []
        for model in raw:
            model_id = str(model.get("id", ""))
            if not model_id or not model_id.startswith(allowed_prefixes):
                continue
            # Use the explicit :free variant so the selector and request validator agree.
            free = model_id.endswith(":free")
            architecture = model.get("architecture") or {}
            output_modes = architecture.get("output_modalities") or ["text"]
            if free and "text" in output_modes and "image" not in output_modes:
                is_gemma4 = model_id.startswith("google/gemma-4-")
                raw_name = str(model.get("name") or model_id)[:100]
                display_name = f"{raw_name} · Apache 2.0" if is_gemma4 else f"{raw_name} · verify exact license"
                models.append({
                    "id": model_id,
                    "name": display_name,
                    "license": "Apache-2.0" if is_gemma4 else "verify model card",
                    "model_card_url": GEMMA_4_MODEL_CARD if is_gemma4 else f"https://openrouter.ai/{model_id}",
                })
        # Prefer Gemma 4 26B A4B so the default selection matches the challenge's
        # Gemma partner category. Availability is still checked when the request runs.
        models.sort(key=lambda item: (
            0 if item["id"] == PREFERRED_GEMMA_MODEL else
            1 if item["id"] == "google/gemma-4-31b-it:free" else 2,
            item["name"].lower(),
        ))
        if models:
            return jsonify({
                "models": models[:70], "live": True,
                "note": "Recommended: Gemma 4 26B A4B IT (Apache 2.0). This uses hosted inference through OpenRouter, not local/offline inference. Availability can change; verify the exact model card before publishing.",
            })
    except (requests.RequestException, ValueError):
        pass
    return jsonify({
        "models": MODEL_FALLBACKS, "live": False,
        "note": "The live list could not be loaded. Gemma 4 IDs are suggested fallbacks, but availability may change. This is hosted inference through OpenRouter, not local/offline inference.",
    })


@app.post("/api/plan")
def api_plan():
    body = request.get_json(silent=True) or {}
    prefs = body.get("preferences") or {}
    if not isinstance(prefs, dict):
        prefs = {}
    prefs = {
        "city": str(prefs.get("city", "Ahmedabad"))[:80],
        "activity": str(prefs.get("activity", "Hiking / Walk"))[:80],
        "duration": max(10, min(240, int(prefs.get("duration", 45) or 45))),
        "fitness": str(prefs.get("fitness", "Beginner"))[:40],
        "mood": str(prefs.get("mood", "Okay"))[:40],
        "vibe": str(prefs.get("vibe", "Relaxing"))[:60],
        "group": str(prefs.get("group", "Solo"))[:40],
        "language": str(prefs.get("language", "English")) if str(prefs.get("language", "English")) in {"English", "Gujarati", "Hindi"} else "English",
    }
    api_key = str(body.get("api_key", "")).strip()
    model = str(body.get("model", "")).strip()[:180]
    weather = body.get("weather") if isinstance(body.get("weather"), dict) else {}

    if not api_key:
        plan = demo_plan(prefs)
        demo_messages = {
            "English": "Demo plan generated locally. Add an OpenRouter key and choose a verified open-weight model to generate an AI plan.",
            "Gujarati": "ડેમો પ્લાન સ્થાનિક રીતે બનાવ્યો છે. AI પ્લાન માટે OpenRouter કી ઉમેરો અને ચકાસેલું ઓપન-વેઇટ મોડલ પસંદ કરો.",
            "Hindi": "डेमो योजना स्थानीय रूप से बनाई गई है। AI योजना के लिए OpenRouter कुंजी जोड़ें और सत्यापित ओपन-वेट मॉडल चुनें।",
        }
        return jsonify({
            "plan": plan,
            "source": "demo",
            "message": demo_messages.get(prefs["language"], demo_messages["English"]),
        })

    if not api_key.startswith("sk-or-"):
        return jsonify({"error": "The OpenRouter key should normally start with sk-or-. Check the key and try again."}), 400
    if not model:
        return jsonify({"error": "Choose a model from the model list first."}), 400
    # The planner only accepts free-variant model IDs from model families that
    # commonly publish weights. This is a guardrail, not a substitute for reading
    # the exact model card and license (the user may type a model ID manually).
    if not model.endswith(":free") or not model.startswith(OPEN_WEIGHT_FAMILY_PREFIXES):
        return jsonify({
            "error": "For this challenge-ready build, choose a listed :free model from a supported open-weight family. Verify its exact model card and license before submission."
        }), 400

    weather_line = "Live weather is not available. Do not invent current weather values."
    if weather:
        weather_line = (
            f"Live conditions: temperature {weather.get('temperature')}°C, feels like {weather.get('feels_like')}°C, "
            f"AQI {weather.get('aqi')}, UV {weather.get('uv')}, rain chance {weather.get('rain')}%, "
            f"outdoor score {weather.get('score')}/100. Use these values as context, but advise checking conditions before travel."
        )

    requested_language = prefs.get("language", "English")
    system_prompt = (
        "You are Grassy, a careful outdoor activity guide. Help the user spend less time on screens and more time safely outside. "
        "Never claim you are a medical professional. Do not encourage trespassing, unsafe solo routes, or risky activities. "
        "Return valid JSON only, with keys: title, summary, best_time, steps, checklist, safety, screen_free_challenge, nature_fact. "
        "steps must be an array of objects with time, title, detail. Keep wording clear and practical. "
        f"Write every user-facing string value naturally in {requested_language}; keep the JSON keys in English. "
        "Do not include English translations alongside the requested language."
    )
    user_prompt = f"""Create a personalized outdoor plan.
Output language: {requested_language}. Keep all JSON key names in English.
City: {prefs['city']}
Activity: {prefs['activity']}
Duration: {prefs['duration']} minutes
Fitness level: {prefs['fitness']}
Mood: {prefs['mood']}
Vibe: {prefs['vibe']}
Going with: {prefs['group']}
{weather_line}
Give 3-5 timed steps that total about {prefs['duration']} minutes. Include a short packing checklist, specific safety notes, a screen-free challenge, and one accurate, modest nature fact. If the weather is not suitable, suggest a safer time or shorter low-intensity option. Return JSON only."""
    try:
        response = requests.post(
            OPENROUTER_CHAT_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://127.0.0.1:5000",
                "X-Title": "Touch Grass Outdoor Guide",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.65,
                "max_tokens": 1400,
            },
            timeout=(10, 75),
        )
        if response.status_code != 200:
            try:
                message = response.json().get("error", {}).get("message", response.text)
            except (ValueError, AttributeError):
                message = response.text
            # Do not echo the API key or full request into the response.
            return jsonify({"error": f"The selected model did not answer (HTTP {response.status_code}). Try another currently available model. Details: {str(message)[:240]}"}), 502
        content = response.json()["choices"][0]["message"]["content"]
        content = str(content).strip()
        match = re.search(r"\{.*\}", content, flags=re.DOTALL)
        if match:
            content = match.group(0)
        try:
            parsed = json.loads(content)
        except ValueError:
            # Retain useful model output while keeping rendering safe and structured.
            parsed = {
                "title": f"{prefs['activity']} plan",
                "summary": content[:1200],
                "best_time": "Check the current local conditions before leaving.",
            }
        plan = clean_plan(parsed, prefs)
        is_gemma4 = model.startswith("google/gemma-4-")
        message = (
            "Generated with Gemma 4 through OpenRouter hosted inference. The official Gemma 4 model card lists Apache 2.0. This is not local or offline inference."
            if is_gemma4 else
            "Generated through OpenRouter hosted inference. Verify the exact model card, weights availability, and license before describing this model as open-weight. This is not local/offline inference."
        )
        return jsonify({
            "plan": plan, "source": "openrouter", "model": model,
            "license": "Apache-2.0" if is_gemma4 else "verify model card",
            "model_card_url": GEMMA_4_MODEL_CARD if is_gemma4 else f"https://openrouter.ai/{model}",
            "inference_mode": "hosted via OpenRouter",
            "message": message,
        })
    except requests.Timeout:
        return jsonify({"error": "The AI request timed out. Try a smaller model or try again."}), 504
    except requests.RequestException:
        return jsonify({"error": "Could not connect to OpenRouter. Check your internet connection and model availability."}), 502
    except (KeyError, TypeError, ValueError, IndexError):
        return jsonify({"error": "The AI response could not be read. Try another model."}), 502


if __name__ == "__main__":
    # Local-only by default so it is not exposed to your Wi-Fi/network.
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5000")), debug=False)
