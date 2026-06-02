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
        {
            "name": "Fake Shop",
            "url": "http://localhost:8080",
            "scraper_key": "fake_shop",
            "country": "local",
            "type": "fake",
            "priority": "high",
            "difficulty": "easy",
            "integration_status": "functional",
            "notes": "Boutique locale de test.",
            "active": True,
            "trusted": True,
        },
        {
            "name": "Otakuland-Manga Passion",
            "url": "https://otakuland-mangapassion.com",
            "scraper_key": "otakuland",
            "country": "BE/FR",
            "type": "tcg_specialist",
            "priority": "high",
            "difficulty": "medium",
            "integration_status": "functional",
            "notes": "Fonctionnel uniquement pour OtakulandScraper V1 : pages produit simples sans options obligatoires.",
            "active": False,
            "trusted": True,
        },
        {
            "name": "Kuro Star",
            "url": "https://kurostar.com",
            "scraper_key": "not_configured",
            "country": "FR/EU",
            "type": "tcg_specialist",
            "priority": "high",
            "difficulty": "unknown",
            "integration_status": "to_analyze",
            "notes": None,
            "active": False,
            "trusted": True,
        },
        {
            "name": "Pikastore",
            "url": "https://www.pikastore.fr",
            "scraper_key": "not_configured",
            "country": "FR/EU",
            "type": "tcg_specialist",
            "priority": "high",
            "difficulty": "unknown",
            "integration_status": "to_analyze",
            "notes": None,
            "active": False,
            "trusted": True,
        },
        {
            "name": "UltraJeux",
            "url": "https://www.ultrajeux.com",
            "scraper_key": "not_configured",
            "country": "FR",
            "type": "tcg_specialist",
            "priority": "medium",
            "difficulty": "unknown",
            "integration_status": "to_analyze",
            "notes": None,
            "active": False,
            "trusted": True,
        },
        {
            "name": "Fnac BE",
            "url": "https://www.fr.fnac.be",
            "scraper_key": "not_configured",
            "country": "BE",
            "type": "retailer",
            "priority": "medium",
            "difficulty": "unknown",
            "integration_status": "to_analyze",
            "notes": None,
            "active": False,
            "trusted": True,
        },
        {
            "name": "Fnac FR",
            "url": "https://www.fnac.com",
            "scraper_key": "not_configured",
            "country": "FR",
            "type": "retailer",
            "priority": "medium",
            "difficulty": "unknown",
            "integration_status": "to_analyze",
            "notes": None,
            "active": False,
            "trusted": True,
        },
        {
            "name": "Coolblue",
            "url": "https://www.coolblue.be",
            "scraper_key": "not_configured",
            "country": "BE/NL",
            "type": "retailer",
            "priority": "low",
            "difficulty": "unknown",
            "integration_status": "to_analyze",
            "notes": None,
            "active": False,
            "trusted": True,
        },
        {
            "name": "Amazon",
            "url": "https://www.amazon.fr",
            "scraper_key": "not_configured",
            "country": "EU",
            "type": "marketplace",
            "priority": "later",
            "difficulty": "hard",
            "integration_status": "later",
            "notes": "Marketplace complexe, invitations, vendeurs tiers, anti-bot possible.",
            "active": False,
            "trusted": True,
        },
        {
            "name": "Cardmarket",
            "url": "https://www.cardmarket.com",
            "scraper_key": "not_configured",
            "country": "EU",
            "type": "marketplace_reference",
            "priority": "later",
            "difficulty": "hard",
            "integration_status": "later",
            "notes": "Utile comme reference marche plus tard, pas pour le premier scraper.",
            "active": False,
            "trusted": True,
        },
        {
            "name": "eBay",
            "url": "https://www.ebay.fr",
            "scraper_key": "not_configured",
            "country": "global",
            "type": "marketplace",
            "priority": "later",
            "difficulty": "hard",
            "integration_status": "later",
            "notes": "Secondaire, beaucoup de bruit, pas MVP.",
            "active": False,
            "trusted": True,
        },
    ]

    with connect() as connection:
        connection.execute(
            """
            update shops
            set name = 'Otakuland-Manga Passion'
            where name = 'Otakuland'
            """
        )
        existing_names = {shop["name"] for shop in list_shops(connection)}
        for shop in shops:
            if shop["name"] not in existing_names:
                create_shop(connection, shop)
            else:
                connection.execute(
                    """
                    update shops
                    set
                      url = :url,
                      scraper_key = :scraper_key,
                      country = :country,
                      type = :type,
                      priority = :priority,
                      difficulty = :difficulty,
                      integration_status = :integration_status,
                      notes = :notes,
                      active = :active,
                      trusted = :trusted
                    where name = :name
                    """,
                    {
                        **shop,
                        "active": int(bool(shop["active"])),
                        "trusted": int(bool(shop["trusted"])),
                    },
                )
        connection.commit()


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
