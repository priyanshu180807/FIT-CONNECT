# FitConnect frontend

React + Vite single-page app. See the project [README](../README.md) for local setup, GitHub upload steps, production frontend/backend deployment, and environment-variable configuration.

## Build

Run `npm ci`, set `VITE_API_BASE_URL` to the public HTTPS FitConnect backend origin, then run `npm run build`. The static site is written to `dist/`. Production builds intentionally fail when the API URL is missing or points to a local/HTTP address.

For local Vite development, `VITE_API_BASE_URL` defaults to `http://127.0.0.1:8000`.
