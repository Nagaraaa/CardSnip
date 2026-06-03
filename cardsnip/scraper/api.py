from typing import Annotated, Any

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import sqlite3

from storage.database import get_connection, init_db
from storage import repositories
from services.tracked_check_service import run_tracked_products


app = FastAPI(title="CardSnip Local API", version="0.1.0")
MAX_PAGE_LIMIT = 200

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
    scraper_key: str = "not_configured"
    country: str = "unknown"
    type: str = "tcg_specialist"
    priority: str = "medium"
    difficulty: str = "unknown"
    integration_status: str = "to_analyze"
    notes: str | None = None
    active: bool = True
    trusted: bool = True


class TrackedProductCreate(BaseModel):
    product_id: int
    shop_id: int
    source_url: str = Field(min_length=1)
    target_price: float = Field(gt=0)
    active: bool = True


def normalize_pagination(limit: int, offset: int) -> tuple[int, int]:
    clean_limit = max(1, min(limit, MAX_PAGE_LIMIT))
    clean_offset = max(0, offset)
    return clean_limit, clean_offset


def raise_not_found(entity: str, entity_id: int) -> None:
    raise HTTPException(status_code=404, detail=f"{entity} introuvable: {entity_id}")


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/products")
def list_products(connection: DbConnection, limit: int = 100, offset: int = 0) -> list[dict]:
    limit, offset = normalize_pagination(limit, offset)
    return repositories.list_products(connection, limit=limit, offset=offset)


@app.get("/products/{product_id}")
def get_product(product_id: int, connection: DbConnection) -> dict:
    try:
        return repositories.get_product(connection, product_id)
    except ValueError:
        raise_not_found("Produit", product_id)


@app.post("/products", status_code=201)
def create_product(payload: ProductCreate, connection: DbConnection) -> dict:
    return repositories.create_product(connection, payload.model_dump())


@app.get("/shops")
def list_shops(connection: DbConnection, limit: int = 100, offset: int = 0) -> list[dict]:
    limit, offset = normalize_pagination(limit, offset)
    return repositories.list_shops(connection, limit=limit, offset=offset)


@app.get("/shops/status")
def list_shop_statuses(connection: DbConnection, limit: int = 100, offset: int = 0) -> list[dict]:
    limit, offset = normalize_pagination(limit, offset)
    return repositories.list_shop_statuses(connection, limit=limit, offset=offset)


@app.get("/shops/{shop_id}")
def get_shop(shop_id: int, connection: DbConnection) -> dict:
    try:
        return repositories.get_shop(connection, shop_id)
    except ValueError:
        raise_not_found("Boutique", shop_id)


@app.post("/shops", status_code=201)
def create_shop(payload: ShopCreate, connection: DbConnection) -> dict:
    try:
        return repositories.create_shop(connection, payload.model_dump())
    except sqlite3.IntegrityError as error:
        raise HTTPException(status_code=409, detail="Shop already exists") from error


@app.get("/tracked-products")
def list_tracked_products(
    connection: DbConnection,
    active_only: bool = False,
    limit: int = 100,
    offset: int = 0,
) -> list[dict]:
    limit, offset = normalize_pagination(limit, offset)
    return repositories.list_tracked_products(connection, active_only=active_only, limit=limit, offset=offset)


@app.get("/tracked-products/{tracked_product_id}")
def get_tracked_product(tracked_product_id: int, connection: DbConnection) -> dict:
    try:
        return repositories.get_tracked_product(connection, tracked_product_id)
    except ValueError:
        raise_not_found("Produit suivi", tracked_product_id)


@app.post("/tracked-products", status_code=201)
def create_tracked_product(payload: TrackedProductCreate, connection: DbConnection) -> dict:
    try:
        repositories.get_product(connection, payload.product_id)
        repositories.get_shop(connection, payload.shop_id)
        return repositories.create_tracked_product(connection, payload.model_dump())
    except ValueError as error:
        detail = str(error)
        if detail.startswith("Product not found"):
            raise_not_found("Produit", payload.product_id)
        if detail.startswith("Shop not found"):
            raise_not_found("Boutique", payload.shop_id)
        raise HTTPException(status_code=400, detail=detail) from error
    except sqlite3.IntegrityError as error:
        raise HTTPException(status_code=400, detail="Invalid product_id or shop_id") from error


@app.get("/observations")
def list_observations(connection: DbConnection, limit: int = 50, offset: int = 0) -> list[dict]:
    try:
        limit, offset = normalize_pagination(limit, offset)
        return repositories.list_observations(connection, limit=limit, offset=offset)
    except sqlite3.Error as error:
        raise HTTPException(status_code=503, detail="SQLite local indisponible pour les observations.") from error


@app.get("/observations/latest")
def list_latest_observations(connection: DbConnection) -> list[dict]:
    try:
        return repositories.list_latest_observations(connection)
    except sqlite3.Error as error:
        raise HTTPException(status_code=503, detail="SQLite local indisponible pour les dernieres observations.") from error


@app.get("/alerts")
def list_alerts(connection: DbConnection, limit: int = 50, offset: int = 0) -> list[dict]:
    try:
        limit, offset = normalize_pagination(limit, offset)
        return repositories.list_alerts(connection, limit=limit, offset=offset)
    except sqlite3.Error as error:
        raise HTTPException(status_code=503, detail="SQLite local indisponible pour les alertes.") from error


@app.post("/scraper/run")
def run_scraper() -> dict[str, Any]:
    return run_tracked_products()
