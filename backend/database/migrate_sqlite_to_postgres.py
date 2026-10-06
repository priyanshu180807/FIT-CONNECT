"""Copy an existing FitConnect SQLite database into an empty PostgreSQL database.

Set DATABASE_URL to the managed PostgreSQL URL before running this script.
The script never deletes or modifies the source SQLite file, and refuses to
copy into a PostgreSQL database that already contains FitConnect rows.
"""
import argparse
import os
from pathlib import Path

from sqlalchemy import create_engine, func, inspect, select, text

from app.core.database import Base
from app.models import entities  # noqa: F401 - register ORM tables with Base


def normalize_postgres_url(url: str) -> str:
    url = url.strip()
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


def main() -> None:
    default_sqlite = Path(__file__).resolve().parents[1] / "fitconnect.db"
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sqlite-path", type=Path, default=default_sqlite)
    args = parser.parse_args()

    target_url = normalize_postgres_url(os.getenv("DATABASE_URL", ""))
    if not target_url.startswith("postgresql+psycopg://"):
        raise SystemExit("Set DATABASE_URL to a PostgreSQL URL using the psycopg driver.")
    if not args.sqlite_path.is_file():
        raise SystemExit(f"SQLite source database not found: {args.sqlite_path}")

    source_engine = create_engine(
        f"sqlite:///{args.sqlite_path.resolve().as_posix()}",
        connect_args={"check_same_thread": False},
    )
    target_engine = create_engine(target_url, pool_pre_ping=True)
    tables = Base.metadata.sorted_tables

    try:
        existing_tables = set(inspect(target_engine).get_table_names())
        for table in tables:
            if table.name in existing_tables:
                with target_engine.connect() as connection:
                    row_count = connection.execute(
                        select(func.count()).select_from(table)
                    ).scalar_one()
                if row_count:
                    raise SystemExit(
                        f"Target table {table.name!r} already contains rows; "
                        "refusing to overwrite or merge data. Use an empty database."
                    )

        Base.metadata.create_all(bind=target_engine)
        source_tables = set(inspect(source_engine).get_table_names())
        copied = {}
        with source_engine.connect() as source, target_engine.begin() as destination:
            for table in tables:
                if table.name not in source_tables:
                    continue
                result = source.execute(select(table))
                rows = [dict(row._mapping) for row in result]
                if rows:
                    destination.execute(table.insert(), rows)
                copied[table.name] = len(rows)

            # Advance PostgreSQL SERIAL sequences beyond the explicit IDs copied
            # from SQLite so subsequent registrations/inserts do not collide.
            for table in tables:
                primary_key = next(iter(table.primary_key.columns), None)
                if primary_key is None or not table.name in copied:
                    continue
                sequence_name = destination.execute(
                    text("SELECT pg_get_serial_sequence(:table_name, :column_name)"),
                    {"table_name": table.name, "column_name": primary_key.name},
                ).scalar_one_or_none()
                max_id = destination.execute(
                    select(func.max(primary_key)).select_from(table)
                ).scalar_one_or_none()
                if sequence_name and max_id is not None:
                    destination.execute(
                        text("SELECT setval(CAST(:sequence_name AS regclass), :max_id, true)"),
                        {"sequence_name": sequence_name, "max_id": max_id},
                    )

        for table_name, count in copied.items():
            print(f"{table_name}: copied {count} rows")
        print("Migration complete. The SQLite source file was left unchanged.")
    finally:
        source_engine.dispose()
        target_engine.dispose()


if __name__ == "__main__":
    main()
