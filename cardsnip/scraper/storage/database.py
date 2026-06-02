from pathlib import Path
import sqlite3
from typing import Iterator


SCRAPER_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = SCRAPER_DIR.parent
DEFAULT_DB_PATH = PROJECT_DIR / "data" / "cardsnip.local.sqlite3"
SCHEMA_PATH = SCRAPER_DIR / "storage" / "schema.sql"


def get_db_path() -> Path:
    return DEFAULT_DB_PATH


def connect(db_path: Path | None = None) -> sqlite3.Connection:
    path = db_path or get_db_path()
    path.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(path, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("pragma foreign_keys = on")
    connection.execute("pragma busy_timeout = 10000")
    connection.execute("pragma journal_mode = wal")
    return connection


def init_db(db_path: Path | None = None) -> None:
    connection = connect(db_path)
    try:
        connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        ensure_schema_compatibility(connection)
    finally:
        connection.close()


def ensure_schema_compatibility(connection: sqlite3.Connection) -> None:
    shop_columns = {
        row["name"]
        for row in connection.execute("pragma table_info(shops)").fetchall()
    }

    if "scraper_key" not in shop_columns:
        connection.execute("alter table shops add column scraper_key text not null default 'not_configured'")

    shop_defaults = {
        "country": "unknown",
        "type": "tcg_specialist",
        "priority": "medium",
        "difficulty": "unknown",
        "integration_status": "to_analyze",
        "notes": None,
    }

    for column_name, default_value in shop_defaults.items():
        if column_name in shop_columns:
            continue

        if default_value is None:
            connection.execute(f"alter table shops add column {column_name} text")
        else:
            connection.execute(f"alter table shops add column {column_name} text not null default '{default_value}'")

    connection.commit()


def get_connection() -> Iterator[sqlite3.Connection]:
    connection = connect()
    try:
        yield connection
    finally:
        connection.close()
