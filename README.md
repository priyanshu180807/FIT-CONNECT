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
$env:VITE_API_URL = "http://localhost:8000"
npm run dev
```

Vite prints the local frontend URL. In development the API URL defaults to `http://localhost:8000` if `VITE_API_URL` is omitted.

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

## Vercel deployment

Deploy the existing frontend and API as **two Vercel projects** connected to this same GitHub repository:

### Frontend Vercel project

1. Set the project's Root Directory to `frontend`.
2. Framework preset: Vite. Install command: `npm ci`. Build command: `npm run build`. Output Directory: `dist`.
3. Set `VITE_API_URL` in Vercel's Production Environment Variables to the deployed backend's public HTTPS origin. Do not include a trailing slash or `/api` suffix.
4. Redeploy after changing the variable: Vite embeds it at build time.
5. Client-side navigation stays inside the SPA. Vercel's Vite framework preset should provide SPA routing; `frontend/public/_redirects` is also present for Netlify-compatible static hosts.

Production Vite builds fail early if `VITE_API_URL` is missing, not HTTPS, or points to a loopback/local host. The default Vite base is `/`; deploy the frontend at its domain root.

### FastAPI backend Vercel project

1. Create a second Vercel project from the same repository and set its Root Directory to `backend`.
2. Vercel's current Python framework runtime reads `backend/pyproject.toml` (`[tool.vercel].entrypoint = "app.main:app"`) and `backend/requirements.txt`. No legacy `vercel_runtime` adapter import or hand-written `vc_handler` is required. There is intentionally no `vercel.json`; Vercel detects the FastAPI entrypoint natively.
3. The Python function entrypoint is the existing FastAPI `app` object. The API routes remain under `/api/...`; the health endpoint is `/health`.
4. Set backend Production Environment Variables: `APP_ENV=production`, `DATABASE_URL`, `JWT_SECRET_KEY`, and `CORS_ORIGINS`.
5. Use the generated public backend HTTPS domain as the frontend project's `VITE_API_URL`, and set the exact deployed frontend origin in backend `CORS_ORIGINS`.

The prior `vc_handler` import error is from an obsolete/incorrect Vercel Python runtime adapter. This repository does not contain `vc_handler` imports or a `vercel.json` that references one; it exports FastAPI natively using Vercel's current `tool.vercel.entrypoint` configuration. In Vercel, use the Python framework preset/current runtime and remove any old custom Build/Output settings or legacy adapter code configured outside this repository.

## Database configuration

SQLite remains the convenient local-development default at the ignored path `backend/fitconnect.db`. Vercel's function filesystem is ephemeral and read-only for this database use case, so production **must** use a managed PostgreSQL database and its pooled connection URL in `DATABASE_URL`. SQLAlchemy normalizes common `postgres://` and `postgresql://` URLs to the installed psycopg 3 driver. The existing models are retained. Vercel cold starts do not create/migrate application tables. Before routing production traffic, set `APP_ENV=production`, `DATABASE_URL`, `JWT_SECRET_KEY`, and `CORS_ORIGINS` in a local shell and run `python database/prepare_postgres.py` from `backend/` as a one-time release step. This creates missing tables, applies the hostel-column compatibility change, and initializes default rewards. Store database backups and credentials with the database provider; never commit the URL.

If the local SQLite database contains records that must be retained, migrate them **before the first production backend request**. Create an empty PostgreSQL database, set its URL temporarily in your local backend shell, and run `python database/migrate_sqlite_to_postgres.py` from the `backend` directory. The migration copies existing rows and IDs in foreign-key order, advances PostgreSQL ID sequences, refuses a non-empty target, and leaves the SQLite file untouched. Verify the reported row counts before pointing Vercel at the database. Do not run the legacy MySQL `database/init_db.py` or MySQL-specific `schema.sql`/`seed.sql` against PostgreSQL.

`bootstrap_reward_catalog()` is retained and uses PostgreSQL/SQLite conflict-safe inserts against the unique badge names and perk titles. Repeated or simultaneous function starts do not create duplicate default badges/perks. The local SQLite file must not be uploaded to Vercel.

Provision the first administrator account privately in PostgreSQL before using admin-only challenge creation. Public registration creates student accounts; there is no public admin-registration flow.

## Environment variables

Set these in the hosting provider's environment settings, not in Git. See `backend/.env.example` and `frontend/.env.example` for placeholder-only templates.

| Variable | Where | Required | Purpose |
| --- | --- | --- | --- |
| `VITE_API_URL` | Frontend build environment | Yes, production | Public HTTPS API origin, e.g. the Vercel backend domain; compiled into frontend assets. |
| `APP_ENV` | Backend | Yes, production | Set to `production` to enable production checks and disable the development seed endpoint. |
| `DATABASE_URL` | Backend | Yes, production | Persistent managed PostgreSQL URL using `postgresql://` or `postgresql+psycopg://`; use the provider's pooled endpoint when available. URL-encode reserved characters in credentials. |
| `JWT_SECRET_KEY` | Backend secret store | Yes, production | Unique random secret of at least 32 characters. Generate one with `python -c "import secrets; print(secrets.token_urlsafe(48))"`. Keep private and rotate deliberately. |
| `CORS_ORIGINS` | Backend | Yes, production | Comma-separated exact browser origins, e.g. the frontend's `https://...vercel.app` domain (no path/trailing slash). Include production and preview origins only if required. |

The backend rejects production startup when the signing key, PostgreSQL URL, or explicit CORS origins are missing/unsafe. Wildcard CORS and SQLite are not accepted in production. Never expose `DATABASE_URL` or `JWT_SECRET_KEY` as frontend variables; only `VITE_` variables are shipped to browsers.

## Production API URL and frontend/backend communication

`VITE_API_URL` must be the backend's externally reachable HTTPS origin. The client appends API paths itself. The backend's `CORS_ORIGINS` must include the exact browser frontend origin. After setting both values, redeploy the frontend and backend. Verify `GET <backend-url>/health`, then use the frontend and check the browser Network panel for successful API requests. If requests are blocked, check CORS origin spelling, HTTPS, DNS, and backend availability.

## Checks before publishing

```sh
cd frontend
npm ci
npm run lint
VITE_API_URL=https://your-backend.vercel.app npm run build
```

On PowerShell set the variable with `$env:VITE_API_URL = "https://your-backend.vercel.app"` before `npm run build`.

The production build output is `frontend/dist`. No deployment is performed by these instructions.
