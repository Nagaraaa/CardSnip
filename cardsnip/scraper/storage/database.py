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
    with connect(db_path) as connection:
        connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))


def get_connection() -> Iterator[sqlite3.Connection]:
    connection = connect()
    try:
        yield connection
    finally:
        connection.close()
