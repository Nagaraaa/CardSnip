from typing import Annotated, Any

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import sqlite3

from storage.database import get_connection, init_db
from storage import repositories
from services.tracked_check_service import run_tracked_products


app = FastAPI(title="CardSnip Local API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


DbConnection = Annotated[sqlite3.Connection, Depends(get_connection)]


class ProductCreate(BaseModel):
    name: str = Field(min_length=1)
    category: str = "other"
    language: str = "FR"
    extension: str | None = None
    image_url: str | None = None


class ShopCreate(BaseModel):
    name: str = Field(min_length=1)
    url: str | None = None
    active: bool = True
    trusted: bool = True


class TrackedProductCreate(BaseModel):
    product_id: int
    shop_id: int
    source_url: str = Field(min_length=1)
    target_price: float = Field(gt=0)
    active: bool = True


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/products")
def list_products(connection: DbConnection) -> list[dict]:
    return repositories.list_products(connection)


@app.post("/products", status_code=201)
def create_product(payload: ProductCreate, connection: DbConnection) -> dict:
    return repositories.create_product(connection, payload.model_dump())


@app.get("/shops")
def list_shops(connection: DbConnection) -> list[dict]:
    return repositories.list_shops(connection)


@app.post("/shops", status_code=201)
def create_shop(payload: ShopCreate, connection: DbConnection) -> dict:
    try:
        return repositories.create_shop(connection, payload.model_dump())
    except sqlite3.IntegrityError as error:
        raise HTTPException(status_code=409, detail="Shop already exists") from error


@app.get("/tracked-products")
def list_tracked_products(connection: DbConnection, active_only: bool = False) -> list[dict]:
    return repositories.list_tracked_products(connection, active_only=active_only)


@app.post("/tracked-products", status_code=201)
def create_tracked_product(payload: TrackedProductCreate, connection: DbConnection) -> dict:
    try:
        return repositories.create_tracked_product(connection, payload.model_dump())
    except sqlite3.IntegrityError as error:
        raise HTTPException(status_code=400, detail="Invalid product_id or shop_id") from error


@app.get("/observations")
def list_observations(connection: DbConnection, limit: int = 50) -> list[dict]:
    try:
        return repositories.list_observations(connection, limit=limit)
    except sqlite3.Error as error:
        raise HTTPException(status_code=503, detail="SQLite local indisponible pour les observations.") from error


@app.get("/observations/latest")
def list_latest_observations(connection: DbConnection) -> list[dict]:
    try:
        return repositories.list_latest_observations(connection)
    except sqlite3.Error as error:
        raise HTTPException(status_code=503, detail="SQLite local indisponible pour les dernieres observations.") from error


@app.get("/alerts")
def list_alerts(connection: DbConnection, limit: int = 50) -> list[dict]:
    try:
        return repositories.list_alerts(connection, limit=limit)
    except sqlite3.Error as error:
        raise HTTPException(status_code=503, detail="SQLite local indisponible pour les alertes.") from error


@app.post("/scraper/run")
def run_scraper() -> dict[str, Any]:
    return run_tracked_products()
