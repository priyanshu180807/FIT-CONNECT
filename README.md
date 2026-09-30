# FitConnect

FitConnect is a React + Vite single-page frontend backed by a FastAPI service and SQLAlchemy database. The frontend is a static site; authentication, activity records, challenges, rankings, and rewards require the backend API and a persistent database.

## Local development

### Backend (PowerShell)

```powershell
cd "backend"
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
$env:APP_ENV = "development"
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The local backend uses `backend/fitconnect.db` (ignored by Git) unless `DATABASE_URL` is set. API documentation is available at `http://127.0.0.1:8000/docs`; health check: `http://127.0.0.1:8000/health`.

### Frontend (second terminal)

```powershell
cd "frontend"
npm ci
$env:VITE_API_BASE_URL = "http://127.0.0.1:8000"
npm run dev
```

Vite prints the local frontend URL. In development the API URL defaults to `http://127.0.0.1:8000` if `VITE_API_BASE_URL` is omitted.

## GitHub upload

1. Review `.gitignore`; it excludes environment files, local databases, Python virtual environments, Node dependencies, and build output.
2. Copy `frontend/.env.example` and `backend/.env.example` only when you need local environment files. Replace placeholders locally; never commit `.env`, `.env.local`, credentials, database URLs, or generated secrets. The example files contain placeholders only.
3. Review `git status --short` and ensure no database, environment file, key, password, or personal data is staged.
4. Initialize/commit/push the project using your GitHub repository URL:

```sh
git init
git add .
git status --short
git commit -m "Prepare FitConnect for deployment"
git branch -M main
git remote add origin <your-github-repository-url>
git push -u origin main
```

Use a GitHub-provided authentication flow (credential manager, browser sign-in, or SSH). Do not place a GitHub token in the remote URL or source files.

## Frontend deployment (Vercel, Netlify, or another static host)

1. Create a static-site project connected to the GitHub repository.
2. Set the project/root directory to `frontend`.
3. Build command: `npm ci && npm run build`.
4. Publish/output directory: `dist` (relative to `frontend`).
5. Set the build environment variable `VITE_API_BASE_URL` to the public HTTPS base URL of the deployed backend, for example `https://api.your-domain.example` (no trailing slash and no `/api` suffix).
6. Redeploy after changing this variable. Vite embeds it at build time; changing it on a running static host without rebuilding has no effect.
7. Configure the host to serve `index.html` as the fallback for unknown paths. `frontend/public/_redirects` provides the standard Netlify SPA fallback. The app's own page switching is client-side.

Production Vite builds fail early if the API URL is missing, not HTTPS, or points to a loopback/local host. The default Vite base is `/`; deploy the built site at the domain root unless you intentionally update the Vite base configuration.

## Backend deployment (required for real data)

The frontend alone is not a complete deployment: deploy the FastAPI backend as a separate Python web service and connect it to a persistent managed database. Example provider-neutral settings:

- Backend/root directory: `backend`
- Python runtime: Python 3.12
- Install/build command: `pip install -r requirements.txt`
- Start command: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT` (configure the host's port variable; use its documented syntax)
- Health-check path: `/health`
- HTTPS: enable the provider's public HTTPS endpoint.

Use a managed MySQL database supported by the existing PyMySQL driver. Provide its connection URL as a private environment variable. The application creates missing SQLAlchemy tables on startup and applies the existing hostel-column compatibility change, but database backups, availability, networking, and any provider-specific migrations remain the operator's responsibility. Do not use the local SQLite file on an ephemeral production filesystem.

Provision the first administrator account securely in the database/through a private one-off administrative process before using admin-only challenge creation. Public registration creates student accounts; there is no public admin-registration flow.

## Environment variables

Set these in the hosting provider's environment settings, not in Git. See `backend/.env.example` and `frontend/.env.example` for placeholder-only templates.

| Variable | Where | Required | Purpose |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Frontend build environment | Yes, production | Public HTTPS API origin, e.g. `https://api.your-domain.example`; compiled into frontend assets. |
| `APP_ENV` | Backend | Yes, production | Set to `production` to enable production checks and disable the development seed endpoint. |
| `DATABASE_URL` | Backend | Yes, production | Persistent managed database URL, e.g. `mysql+pymysql://USER:PASSWORD@HOST:3306/DATABASE?charset=utf8mb4`. URL-encode reserved characters in credentials. |
| `JWT_SECRET_KEY` | Backend secret store | Yes, production | Unique random secret of at least 32 characters. Generate one with `python -c "import secrets; print(secrets.token_urlsafe(48))"`. Keep private and rotate deliberately. |
| `CORS_ORIGINS` | Backend | Yes, production | Comma-separated exact browser origins, such as `https://fitconnect.example` (no path/trailing slash). Include every deployed frontend origin. |
| `PORT` | Backend host | Usually supplied by host | Listening port used in the service start command. |

The backend rejects production startup when the signing key, production database URL, or explicit CORS origins are missing/unsafe. Wildcard CORS and SQLite are not accepted in production. Never expose `DATABASE_URL` or `JWT_SECRET_KEY` as frontend variables; only `VITE_` variables are shipped to browsers.

## Production API URL and frontend/backend communication

`VITE_API_BASE_URL` must be the backend's externally reachable HTTPS origin, such as `https://api.your-domain.example`. The client appends endpoint paths (`/api/...`) itself. The backend's `CORS_ORIGINS` must include the exact frontend origin, such as `https://fitconnect.your-domain.example`. After setting both values, rebuild/redeploy the frontend and restart/redeploy the backend. Verify `GET <backend-url>/health`, then use the frontend and check the browser Network panel for successful API requests. If requests are blocked, check CORS origin spelling, HTTPS, DNS, and backend availability.

## Checks before publishing

```sh
cd frontend
npm ci
npm run lint
VITE_API_BASE_URL=https://api.your-domain.example npm run build
```

On PowerShell set the variable with `$env:VITE_API_BASE_URL = "https://api.your-domain.example"` before `npm run build`.

The production build output is `frontend/dist`. No deployment is performed by these instructions.
