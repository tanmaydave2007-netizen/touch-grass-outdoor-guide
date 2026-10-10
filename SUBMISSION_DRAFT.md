---
title: "Touch Grass: A Weather-Aware Outdoor Companion Powered by Open-Weight AI"
published: false
tags: devchallenge, hf26challenge, python, webdev
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05).* 

## What I Built

I built **Touch Grass Outdoor Guide**, a responsive web app that helps people make a simple plan to step away from their screens and spend time outdoors. It brings together a local weather and air-quality snapshot, a seven-day forecast, nearby parks and gardens, a personalized outing planner, Nature Bingo, and a small progress tracker.

The idea is to keep planning short and make the offline activity the main event. The planner turns a few preferences into suggested steps, a packing checklist, basic safety reminders, and a screen-free challenge. Its Outdoor Score is a simple planning heuristic, not an official safety rating.

## Demo

<!-- REQUIRED BEFORE PUBLISHING: replace this line with the public deployed app URL or a short demo video. -->
[Add the live demo or video link here]

## Code

<!-- REQUIRED BEFORE PUBLISHING: replace this line with your public GitHub repository URL. -->
[Add the public GitHub repository link here]

## How I Built It

The interface uses HTML, CSS, and JavaScript. The backend is Python with Flask. Chart.js powers the forecast and progress visualizations, Leaflet displays the park map, Open-Meteo provides weather and air-quality data, and OpenStreetMap supplies community-maintained park data.

For model-backed planning, the app can call a selected model through OpenRouter's chat-completions API. The recommended model is **Gemma 4 26B A4B Instruct** (`google/gemma-4-26b-a4b-it:free`). OpenRouter's [model page](https://openrouter.ai/google/gemma-4-26b-a4b-it:free) lists the free variant and Apache 2.0 licence. Google's [official Gemma 4 model card](https://ai.google.dev/gemma/docs/core/model_card_4) provides the model-family details.

<!-- REQUIRED BEFORE PUBLISHING: only say you successfully used Gemma 4 after generating a real plan with that exact model ID. If another model was actually used, name that model and link its own model card instead. Keep a screenshot of the successful output. -->

This app uses **hosted inference through OpenRouter**, not local inference. It does not download or run the model weights on the laptop, and it needs an internet connection for the AI, weather, and map features. Without an API key, the app creates a clearly labelled local demo template; that template is not model-generated.

## Why Does Open Innovation Matter?

An open-weight model gives me more flexibility to experiment with model choices and adapt the prompt and output structure to a practical outdoor-planning task. Rather than designing around only one closed-model API, I can try different supported model families and check their published weights, model cards, and licence terms. For the Gemma 4 option, the official model card lists Apache 2.0.

I chose hosted inference because it is easier to try without downloading large weights or needing a local GPU. That convenience comes with trade-offs: the app needs internet, and the prompt is processed by OpenRouter and the selected provider. Prompts can include the chosen city, activity, duration, mood, fitness level, group, vibe, and available weather context, so users should avoid entering sensitive information. This version does not claim offline inference or complete local privacy.

The model can be changed, but availability and free-tier limits may change too. I will identify the exact model that successfully generated my demo rather than claiming that every listed model has the same licence or capabilities.

## My Agent Session

Optional: [Add a DevRelay agent-session link if you have saved one.]

## Prize Categories

<!-- Keep Best Use of Gemma only if the final demo successfully runs Gemma 4. Keep Best Use of Render only if you actually deploy the app on Render. Remove categories you did not use. -->
- Best Use of Gemma (only if confirmed by a successful Gemma 4 run)
- Best Use of Render (only if actually deployed on Render)

## What I Tested Outside

<!-- Complete this only after actually taking the app outside. Do not invent a park visit or results. -->
I tried the plan at [actual park/place] on [date]. The plan suggested [what it suggested]. What worked was [your real observation], and one thing I would improve is [your real observation].
