import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

# Vercel sets the VERCEL environment variable in all deployments.  Treat the
# Vercel serverless environment as production regardless of whether the
# deployer remembered to set APP_ENV, so we never silently fall back to
# SQLite on the read-only Vercel filesystem.
_on_vercel = bool(os.getenv("VERCEL"))
if _on_vercel and APP_ENV != "production":
    APP_ENV = "production"

if APP_ENV == "production":
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL must be set to a managed PostgreSQL connection string "
            "in the Vercel (or production) environment variables.  SQLite is not "
            "supported in production because the filesystem is read-only."
        )
    if not DATABASE_URL.lower().startswith(("postgres://", "postgresql://", "postgresql+psycopg://")):
        raise RuntimeError(
            "Production requires a PostgreSQL DATABASE_URL (postgres://, "
            "postgresql://, or postgresql+psycopg://).  The current value does "
            "not match any supported scheme."
        )
elif not DATABASE_URL:
    local_database = Path(__file__).resolve().parents[2] / "fitconnect.db"
    DATABASE_URL = f"sqlite:///{local_database.as_posix()}"

# Hosted PostgreSQL providers may supply either legacy postgres:// or the
# SQLAlchemy default postgresql:// scheme. Use psycopg 3 explicitly.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgres://"):]
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgresql://"):]

engine_options = {"pool_pre_ping": True}
if DATABASE_URL.lower().startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}
else:
    engine_options.update({"pool_recycle": 300, "pool_size": 3, "max_overflow": 2})

engine = create_engine(DATABASE_URL, **engine_options)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """FastAPI Dependency for database session management"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
