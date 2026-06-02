from pathlib import Path
from tempfile import TemporaryDirectory
import sys
import unittest
from unittest.mock import patch


SCRAPER_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = SCRAPER_DIR.parent
if str(SCRAPER_DIR) not in sys.path:
    sys.path.insert(0, str(SCRAPER_DIR))

from scrapers.fake_shop import FakeShopScraper  # noqa: E402
from scrapers.registry import create_scraper  # noqa: E402
from services.tracked_check_service import scrape_tracked_product  # noqa: E402
from storage import repositories  # noqa: E402
from storage.database import connect, init_db  # noqa: E402


FAKE_SHOP_FILE = PROJECT_DIR / "fake-shop" / "index.html"


class ScraperRegistryTest(unittest.TestCase):
    def test_create_fake_shop_scraper(self) -> None:
        scraper = create_scraper(
            scraper_key="fake_shop",
            source_url=str(FAKE_SHOP_FILE),
            target_price=55.0,
        )

        self.assertIsInstance(scraper, FakeShopScraper)
        self.assertEqual(scraper.source_url, str(FAKE_SHOP_FILE))
        self.assertEqual(scraper.target_price, 55.0)

    def test_create_not_configured_scraper_raises_clear_error(self) -> None:
        with self.assertRaisesRegex(ValueError, "Scraper inconnu: not_configured"):
            create_scraper(
                scraper_key="not_configured",
                source_url=str(FAKE_SHOP_FILE),
                target_price=55.0,
            )


class MultipleTrackedProductsTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "cardsnip-test.sqlite3"
        init_db(self.db_path)
        self.connection = connect(self.db_path)

        self.shop = repositories.create_shop(
            self.connection,
            {
                "name": "Fake Shop",
                "url": "http://localhost:8080",
                "scraper_key": "fake_shop",
                "active": True,
                "trusted": True,
            },
        )

        self.tracked_products = []
        for index in range(2):
            product = repositories.create_product(
                self.connection,
                {
                    "name": f"Produit demo {index + 1}",
                    "category": "ETB",
                    "language": "FR",
                    "extension": "Demo",
                    "image_url": None,
                },
            )
            tracked_product = repositories.create_tracked_product(
                self.connection,
                {
                    "product_id": product["id"],
                    "shop_id": self.shop["id"],
                    "source_url": str(FAKE_SHOP_FILE),
                    "target_price": 55.0,
                    "active": True,
                },
            )
            self.tracked_products.append(tracked_product)

    def tearDown(self) -> None:
        self.connection.close()
        self.temp_dir.cleanup()

    def run_all_tracked_products_once(self) -> tuple[int, int]:
        observations = 0
        alerts = 0
        for tracked_product in repositories.list_tracked_products(self.connection, active_only=True):
            result = scrape_tracked_product(self.connection, tracked_product)
            observations += result["observations"]
            alerts += result["alerts"]

        return observations, alerts

    @patch("services.tracked_check_service.log_product_check")
    @patch("services.tracked_check_service.AlertService.send_alerts", return_value=None)
    def test_multiple_fake_shop_tracked_products_create_observations_and_dedupe_alerts(
        self,
        _send_alerts: object,
        _log_product_check: object,
    ) -> None:
        first_observations, first_alerts = self.run_all_tracked_products_once()
        self.assertEqual(first_observations, 2)
        self.assertEqual(first_alerts, 4)

        observations_after_first_run = repositories.list_observations(self.connection, limit=10)
        alerts_after_first_run = repositories.list_alerts(self.connection, limit=10)
        self.assertEqual(len(observations_after_first_run), 2)
        self.assertEqual(len(alerts_after_first_run), 4)

        second_observations, second_alerts = self.run_all_tracked_products_once()
        self.assertEqual(second_observations, 2)
        self.assertEqual(second_alerts, 0)

        observations_after_second_run = repositories.list_observations(self.connection, limit=10)
        alerts_after_second_run = repositories.list_alerts(self.connection, limit=10)
        self.assertEqual(len(observations_after_second_run), 4)
        self.assertEqual(len(alerts_after_second_run), 4)

        alert_tracked_ids = {alert["tracked_product_id"] for alert in alerts_after_second_run}
        self.assertEqual(alert_tracked_ids, {tracked_product["id"] for tracked_product in self.tracked_products})


if __name__ == "__main__":
    unittest.main()
