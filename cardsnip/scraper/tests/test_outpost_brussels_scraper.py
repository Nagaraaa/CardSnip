from pathlib import Path
import sys
import unittest


SCRAPER_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = SCRAPER_DIR.parent
if str(SCRAPER_DIR) not in sys.path:
    sys.path.insert(0, str(SCRAPER_DIR))

from scrapers.outpost_brussels import OutpostBrusselsScraper  # noqa: E402
from scrapers.registry import create_scraper  # noqa: E402


SNAPSHOT_DIR = PROJECT_DIR / "docs" / "shop-analysis" / "snapshots"
OUT_OF_STOCK = SNAPSHOT_DIR / "outpost-product-stock-check.html"
PREORDER_IN_STOCK = SNAPSHOT_DIR / "outpost-product-preorder.html"
PREORDER_OUT_OF_STOCK = SNAPSHOT_DIR / "outpost-product-preorder-out-of-stock.html"


class OutpostBrusselsScraperTest(unittest.TestCase):
    def test_out_of_stock_snapshot(self) -> None:
        scraper = OutpostBrusselsScraper(source_url=str(OUT_OF_STOCK), target_price=45.0)

        check = scraper.scrape()

        self.assertEqual(check.name, "Pokémon - Collection Spéciale Accessoires - Evolutions Prismatiques - FR")
        self.assertEqual(check.price, 44.99)
        self.assertFalse(check.in_stock)
        self.assertEqual(check.stock_label, "Rupture")

    def test_preorder_in_stock_snapshot(self) -> None:
        scraper = OutpostBrusselsScraper(source_url=str(PREORDER_IN_STOCK), target_price=1300.0)

        check = scraper.scrape()

        self.assertEqual(check.name, "Pokémon - ME05 - Case Display Boosters Nuit Noire - FR")
        self.assertEqual(check.price, 1229.99)
        self.assertTrue(check.in_stock)
        self.assertEqual(check.stock_label, "En stock")

    def test_preorder_out_of_stock_snapshot(self) -> None:
        scraper = OutpostBrusselsScraper(source_url=str(PREORDER_OUT_OF_STOCK), target_price=210.0)

        check = scraper.scrape()

        self.assertEqual(check.name, "Pokémon - ME05 - Display Boosters Nuit Noire (36) - FR")
        self.assertEqual(check.price, 204.99)
        self.assertFalse(check.in_stock)
        self.assertEqual(check.stock_label, "Rupture")

    def test_registry_creates_outpost_brussels_scraper(self) -> None:
        scraper = create_scraper(
            scraper_key="outpost_brussels",
            source_url=str(PREORDER_IN_STOCK),
            target_price=1300.0,
        )

        self.assertIsInstance(scraper, OutpostBrusselsScraper)


if __name__ == "__main__":
    unittest.main()
