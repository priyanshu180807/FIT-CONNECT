import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if APP_ENV == "production":
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL must be configured for production.")
    if DATABASE_URL.lower().startswith("sqlite"):
        raise RuntimeError("Production requires a persistent managed database; SQLite is development-only.")
elif not DATABASE_URL:
    DATABASE_URL = "sqlite:///./fitconnect.db"

engine_options = {"pool_pre_ping": True}
if DATABASE_URL.lower().startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}
else:
    engine_options.update({"pool_recycle": 3600, "pool_size": 10, "max_overflow": 20})

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
