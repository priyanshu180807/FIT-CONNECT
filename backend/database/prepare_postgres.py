"""Create FitConnect tables and initialize default rewards in PostgreSQL.

Run once (or as a controlled release step) against the managed PostgreSQL URL
before sending production traffic. This is intentionally not invoked by Vercel
function cold starts. Existing SQLite records can instead be copied with
migrate_sqlite_to_postgres.py before running this script.

Usage:
    APP_ENV=production DATABASE_URL=postgresql://... python -m database.prepare_postgres
"""
import os

from sqlalchemy import inspect, text

from app.core.database import Base, SessionLocal, engine
from app.models import entities  # noqa: F401 - register ORM tables with Base


def main() -> None:
    app_env = os.getenv("APP_ENV", "").strip().lower()
    if app_env not in ("production", "staging"):
        raise SystemExit(
            "Set APP_ENV=production (or staging) to run this PostgreSQL "
            "preparation command."
        )
    if engine.dialect.name != "postgresql":
        raise SystemExit("DATABASE_URL must point to PostgreSQL.")

    # create_all is idempotent — it will only create tables that do not exist.
    Base.metadata.create_all(bind=engine)

    # Hostel migration guard for databases created before the column was added.
    columns = {column["name"] for column in inspect(engine).get_columns("users")}
    if "hostel" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE users ADD COLUMN hostel VARCHAR(100)"))

    from app.main import ensure_reward_catalog

    with SessionLocal() as db:
        ensure_reward_catalog(db)
    print("PostgreSQL schema is ready and the default badge/perk catalog is initialized.")


if __name__ == "__main__":
    main()
