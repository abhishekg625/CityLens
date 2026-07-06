# CityLens — React frontend

Mumbai street-condition survey dashboard (Vite + React 18 + React Router), extracted
from the [CityLens](https://github.com/parakram10/CityLens) monorepo as a standalone
frontend.

## Run

```bash
npm install
npm run dev
```

## Data

This repo ships only the frontend. It expects, at the web root:

- `/assets/*` — evidence photos
- `/runs/*` — per-trip dashcam clips
- `/live.json` — live detector output (polled every 8s; the app degrades gracefully
  if it 404s)

In the full monorepo these are served by `backend/serve.py` straight from the repo
root. To run this standalone copy against real data, either:

- symlink a CityLens checkout's `assets/` and `runs/` folders into `public/`, and
  drop a `js/live.json`-equivalent at `../js/live.json` relative to this project
  (the dev server proxies `/live.json` from there — see `vite.config.js`), or
- point `/assets`, `/runs`, `/live.json` at a deployed backend via a reverse proxy.

Without any of that, the app still runs — it just shows empty categories where the
live detector feed would populate.

## Build

```bash
npm run build
```

Outputs to `dist/` (`_assets/` for the JS/CSS bundle, to avoid colliding with the
`/assets/` evidence-photo path in production).
