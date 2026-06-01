from pathlib import Path
import sys


SCRAPER_DIR = Path(__file__).resolve().parents[1]
if str(SCRAPER_DIR) not in sys.path:
    sys.path.insert(0, str(SCRAPER_DIR))

from storage.database import connect, get_db_path, init_db  # noqa: E402
from storage.repositories import create_product, create_shop, create_tracked_product, list_products, list_shops  # noqa: E402


FAKE_SHOP_URL = "http://localhost:8080/index.html?price=39.99&stock=in"


def seed_shops() -> None:
    shops = [
        {"name": "Fake Shop", "url": "http://localhost:8080", "active": True, "trusted": True},
        {"name": "Cardmarket", "url": None, "active": False, "trusted": True},
        {"name": "Kuro Star", "url": None, "active": False, "trusted": True},
        {"name": "Pikastore", "url": None, "active": False, "trusted": True},
        {"name": "UltraJeux", "url": None, "active": False, "trusted": True},
        {"name": "Otakuland", "url": None, "active": False, "trusted": True},
    ]

    with connect() as connection:
        existing_names = {shop["name"] for shop in list_shops(connection)}
        for shop in shops:
            if shop["name"] not in existing_names:
                create_shop(connection, shop)


def seed_demo_product() -> None:
    with connect() as connection:
        products = list_products(connection)
        if products:
            return

        product = create_product(
            connection,
            {
                "name": "Elite Trainer Box - Edition Demo",
                "category": "ETB",
                "language": "FR",
                "extension": "Demo",
                "image_url": None,
            },
        )
        fake_shop = next(shop for shop in list_shops(connection) if shop["name"] == "Fake Shop")
        create_tracked_product(
            connection,
            {
                "product_id": product["id"],
                "shop_id": fake_shop["id"],
                "source_url": FAKE_SHOP_URL,
                "target_price": 45.0,
                "active": True,
            },
        )


def main() -> None:
    init_db()
    seed_shops()
    seed_demo_product()
    print(f"Base SQLite initialisee: {get_db_path()}")
    print("Seed: boutiques mockees + produit demo fake shop.")


if __name__ == "__main__":
    main()
