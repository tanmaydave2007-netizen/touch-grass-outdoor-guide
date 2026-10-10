## Performance notes

- Charts, the park map, and the live AI model list are loaded only when needed.
- System fonts replace the remote Google Fonts request to improve initial rendering.
- Weather data is cached for 10 minutes per city, and the weather/air-quality requests run in parallel after city geocoding.
- Translations and text scaling process only newly added fragments instead of repeatedly scanning the entire dashboard.

# Touch Grass Outdoor Guide 🌿

A responsive full-stack outdoor companion built to encourage shorter screen sessions and more time in nature. It combines weather-aware planning, nearby green-space discovery, Nature Bingo, and local progress tracking.

## Design previews

- `previews/design_preview.png`
- `previews/design_preview_alternate.png`

These are visual mockups, not captures of a running app. The app's actual weather values and map results come from live services and can differ.

## Main features

- Responsive desktop, tablet, and phone layout
- Larger default text with adjustable A− / A+ text-size controls (saved in the browser)
- English, Gujarati, and Hindi interface; demo plans and model-backed plans follow the selected language
- The language and text-size choices are remembered in the current browser. Place names, model names/IDs, and some external-provider data may remain in their original form; create a new plan after switching languages to get its content in that language.
- Live current weather, feels-like temperature, humidity, UV, air quality, and a seven-day forecast
- Transparent heuristic Outdoor Score (not an official safety assessment)
- Personalized outdoor plan with steps, packing checklist, safety reminders, and a screen-free challenge
- Nearby green spaces from OpenStreetMap / Overpass with Leaflet map
- Nature Bingo, grass points, achievements, weekly goals, and local outing history
- Exportable plans and local progress data
- Demo plan if no API key is provided, clearly marked as demo

## Open-weight AI choice for this challenge

The planner can call a text model through OpenRouter's chat-completions API. Its recommended selection is **Gemma 4 26B A4B Instruct** with model ID `google/gemma-4-26b-a4b-it:free`. OpenRouter's model page lists this free variant and states that it is released under Apache 2.0. Google's official Gemma 4 model card is linked in the app and in the submission draft.

- OpenRouter model page: <https://openrouter.ai/google/gemma-4-26b-a4b-it:free>
- Official Gemma 4 model card: <https://ai.google.dev/gemma/docs/core/model_card_4>
- OpenRouter models API: <https://openrouter.ai/docs/api/api-reference/models/get-models>

**Important accuracy note:** this application uses *hosted inference through OpenRouter*. The model weights are not downloaded or run locally by this website, and the app does not work offline. Free endpoint availability can change. Verify the exact selected model ID and its model card immediately before submitting. Other model families displayed in the app have their own terms and should not be described as Apache 2.0 unless their model cards say so.

## Tech stack

- Python + Flask
- HTML, CSS, JavaScript
- Chart.js for graphs
- Leaflet + OpenStreetMap for maps
- Open-Meteo for geocoding, weather and air quality
- OpenRouter for optional hosted model inference
- Browser `localStorage` for profile/progress on the same browser

## Run locally on Windows (VS Code)

1. Extract the ZIP and open the `Touch_Grass_Challenge_Ready` folder in VS Code.
2. Choose **Terminal → New Terminal**.
3. Run these commands one at a time on first setup:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

4. Open <http://127.0.0.1:5000>.

After the first setup, on later laptop sessions, open the same project folder and run just:

```powershell
.\.venv\Scripts\Activate.ps1
python app.py
```

Keep the terminal open while using the site. To stop the local server, press `Ctrl+C` in that terminal.

If PowerShell blocks activation, use a VS Code `cmd` terminal instead: ` .venv\Scripts\activate.bat `, then `python app.py`.

## Connect the AI model

1. Open **Plan my outing**.
2. Expand **AI connection settings**.
3. Create an OpenRouter key at <https://openrouter.ai/settings/keys> and enter it in the password field. Never paste the key into source code or commit it to GitHub.
4. Select **Gemma 4 26B A4B IT · Apache 2.0** if it appears in the current free model list.
5. Generate a plan. Confirm the result badge names the model ID and is marked hosted/open-weight, not demo mode.

When no API key is provided, the app returns a deterministic local demo template. Do not describe that response as model-generated. The app does not persist the key, but sends it through the local Flask server to OpenRouter for the selected request. OpenRouter and its selected provider process the prompt under their own policies. Avoid sending private/sensitive information.

## Test the app

Install dependencies first, then run:

```powershell
python -m unittest discover -s tests -v
python -m py_compile app.py
node --check static/app.js
```

The smoke tests cover the health endpoint, home route, demo mode, supported model-family guard, and Outdoor Score sanity. A successful test run does not prove the upstream AI request works; perform one real request with your own key before publishing.

## Deploy (optional)

The repository includes `render.yaml` and `Procfile` to simplify a Render web-service setup. Push the project to a **new public GitHub repository**, sign in to Render, create a new Blueprint/web service from that repository, and wait for deployment. Then open `/api/health` on the public URL and test the app. This deployment requires the user's own accounts and cannot be completed from these local files alone.

## Data and privacy

- Profile, points, bingo state, and outing history stay in the browser's local storage unless the user exports them.
- The OpenRouter key is not saved in browser local storage or a project file by this application.
- Weather and geocoding data go to Open-Meteo. Park searches and map tiles use OpenStreetMap services.
- AI prompts go to OpenRouter and the selected upstream model provider. Current app prompts can include city, chosen activity, duration, mood, fitness level, group, vibe, and weather context.
- The development server binds to `127.0.0.1` by default for local use. Deploying publicly changes the trust boundary; review key handling and privacy before exposing it to others.

## Before submitting to DEV

- Confirm you are eligible to enter and that this project/repository meets the challenge's new-project date rules.
- Make one successful AI request with the exact Gemma 4 model ID and keep a screenshot/video of the actual app response.
- Make a public repository and either deploy the app or record a demo video. Replace all placeholders in `SUBMISSION_DRAFT.md`.
- Include 2–4 genuine screenshots from your running app. The preview mockups are concepts, not proof of working features.
- Only opt into **Best Use of Gemma** if you really ran a Gemma model; only opt into **Best Use of Render** if you deploy on Render.
- Do not claim offline inference, local model execution, or full local privacy.
- The challenge page says entries and repositories must be new and built during the challenge window; check the official page before reusing work prepared for another event.

Official challenge: <https://dev.to/challenges/hacktoberfest-week1-2026-10-05>
