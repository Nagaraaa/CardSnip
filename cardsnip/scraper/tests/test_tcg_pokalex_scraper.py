from pathlib import Path
import sys
import unittest


SCRAPER_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = SCRAPER_DIR.parent
if str(SCRAPER_DIR) not in sys.path:
    sys.path.insert(0, str(SCRAPER_DIR))

from scrapers.fake_shop import FakeShopScraper  # noqa: E402
from scrapers.otakuland import OtakulandScraper  # noqa: E402
from scrapers.outpost_brussels import OutpostBrusselsScraper  # noqa: E402
from scrapers.registry import create_scraper  # noqa: E402
from scrapers.tcg_pokalex import TcgPokalexScraper  # noqa: E402


SNAPSHOT_DIR = PROJECT_DIR / "docs" / "shop-analysis" / "snapshots"
IN_STOCK = SNAPSHOT_DIR / "tcg-pokalex-product-in-stock.html"
OUT_OF_STOCK = SNAPSHOT_DIR / "tcg-pokalex-product-out-of-stock.html"
PREORDER_OUT_OF_STOCK = SNAPSHOT_DIR / "tcg-pokalex-product-preorder.html"


class TcgPokalexScraperTest(unittest.TestCase):
    def test_in_stock_snapshot(self) -> None:
        scraper = TcgPokalexScraper(source_url=str(IN_STOCK), target_price=70.0)

        check = scraper.scrape()

        self.assertIn("Coffret Dresseur", check.name)
        self.assertEqual(check.price, 69.99)
        self.assertTrue(check.in_stock)
        self.assertEqual(check.stock_label, "En stock")

    def test_out_of_stock_snapshot(self) -> None:
        scraper = TcgPokalexScraper(source_url=str(OUT_OF_STOCK), target_price=300.0)

        check = scraper.scrape()

        self.assertIn("Display Pack 36 Booster", check.name)
        self.assertEqual(check.price, 299.0)
        self.assertFalse(check.in_stock)
        self.assertEqual(check.stock_label, "Rupture")

    def test_preorder_out_of_stock_snapshot(self) -> None:
        scraper = TcgPokalexScraper(source_url=str(PREORDER_OUT_OF_STOCK), target_price=270.0)

        check = scraper.scrape()

        self.assertIn("Nuit Noire", check.name)
        self.assertEqual(check.price, 269.99)
        self.assertFalse(check.in_stock)
        self.assertEqual(check.stock_label, "Rupture")

    def test_registry_creates_tcg_pokalex_scraper(self) -> None:
        scraper = create_scraper(
            scraper_key="tcg_pokalex",
            source_url=str(IN_STOCK),
            target_price=70.0,
        )

        self.assertIsInstance(scraper, TcgPokalexScraper)

    def test_existing_scrapers_are_still_registered(self) -> None:
        self.assertIsInstance(
            create_scraper("fake_shop", "http://localhost:8080/index.html?price=39.99&stock=in", 45.0),
            FakeShopScraper,
        )
        self.assertIsInstance(create_scraper("otakuland", str(IN_STOCK), 45.0), OtakulandScraper)
        self.assertIsInstance(create_scraper("outpost_brussels", str(IN_STOCK), 45.0), OutpostBrusselsScraper)


if __name__ == "__main__":
    unittest.main()
