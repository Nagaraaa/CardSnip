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
from scrapers.strategy_games import OUT_OF_STOCK_WITHOUT_PRICE_MESSAGE, StrategyGamesScraper  # noqa: E402
from scrapers.tcg_pokalex import TcgPokalexScraper  # noqa: E402


SNAPSHOT_DIR = PROJECT_DIR / "docs" / "shop-analysis" / "snapshots"
IN_STOCK = SNAPSHOT_DIR / "strategy-games-product-in-stock.html"
PREORDER = SNAPSHOT_DIR / "strategy-games-product-preorder.html"
OUT_OF_STOCK_WITHOUT_PRICE = SNAPSHOT_DIR / "strategy-games-product-out-of-stock.html"


class StrategyGamesScraperTest(unittest.TestCase):
    def test_in_stock_snapshot(self) -> None:
        scraper = StrategyGamesScraper(source_url=str(IN_STOCK), target_price=8.0)

        check = scraper.scrape()

        self.assertIn("Blister ME02", check.name)
        self.assertEqual(check.price, 7.50)
        self.assertTrue(check.in_stock)
        self.assertEqual(check.stock_label, "En stock")

    def test_preorder_snapshot_is_available_for_cardsnip_v1(self) -> None:
        scraper = StrategyGamesScraper(source_url=str(PREORDER), target_price=8.0)

        check = scraper.scrape()

        self.assertIn("Blister ME05", check.name)
        self.assertEqual(check.price, 7.99)
        self.assertTrue(check.in_stock)
        self.assertEqual(check.stock_label, "En stock")

    def test_out_of_stock_without_price_is_rejected_cleanly(self) -> None:
        scraper = StrategyGamesScraper(source_url=str(OUT_OF_STOCK_WITHOUT_PRICE), target_price=10.0)

        with self.assertRaisesRegex(ValueError, OUT_OF_STOCK_WITHOUT_PRICE_MESSAGE):
            scraper.scrape()

    def test_registry_creates_strategy_games_scraper(self) -> None:
        scraper = create_scraper(
            scraper_key="strategy_games",
            source_url=str(IN_STOCK),
            target_price=8.0,
        )

        self.assertIsInstance(scraper, StrategyGamesScraper)

    def test_existing_scrapers_are_still_registered(self) -> None:
        self.assertIsInstance(
            create_scraper("fake_shop", "http://localhost:8080/index.html?price=39.99&stock=in", 45.0),
            FakeShopScraper,
        )
        self.assertIsInstance(create_scraper("otakuland", str(IN_STOCK), 45.0), OtakulandScraper)
        self.assertIsInstance(create_scraper("outpost_brussels", str(IN_STOCK), 45.0), OutpostBrusselsScraper)
        self.assertIsInstance(create_scraper("tcg_pokalex", str(IN_STOCK), 45.0), TcgPokalexScraper)


if __name__ == "__main__":
    unittest.main()
