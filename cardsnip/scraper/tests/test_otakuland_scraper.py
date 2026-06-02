from pathlib import Path
import sys
import unittest


SCRAPER_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = SCRAPER_DIR.parent
if str(SCRAPER_DIR) not in sys.path:
    sys.path.insert(0, str(SCRAPER_DIR))

from scrapers.otakuland import OtakulandScraper  # noqa: E402
from scrapers.registry import create_scraper  # noqa: E402


SNAPSHOT_DIR = PROJECT_DIR / "docs" / "shop-analysis" / "snapshots"
ETB_OUT_OF_STOCK = SNAPSHOT_DIR / "otakuland-product-sample-1.html"
TRIPACK_IN_STOCK = SNAPSHOT_DIR / "otakuland-product-sample-2.html"
BOOSTER_OPTIONS_REQUIRED = SNAPSHOT_DIR / "otakuland-product-sample-3.html"


class OtakulandScraperTest(unittest.TestCase):
    def test_etb_out_of_stock_snapshot(self) -> None:
        scraper = OtakulandScraper(source_url=str(ETB_OUT_OF_STOCK), target_price=55.0)

        check = scraper.scrape()

        self.assertEqual(
            check.name,
            "Pokémon JCC : ETB Coffret Dresseur d'Élite Méga-Évolution ME04 Chaos Ascendant - FR",
        )
        self.assertEqual(check.price, 59.99)
        self.assertFalse(check.in_stock)
        self.assertEqual(check.stock_label, "Rupture")

    def test_tripack_in_stock_snapshot(self) -> None:
        scraper = OtakulandScraper(source_url=str(TRIPACK_IN_STOCK), target_price=25.0)

        check = scraper.scrape()

        self.assertEqual(check.name, "Pokémon JCC : Tripack Reptincel Méga-Évolution ME04 Chaos Ascendant - FR")
        self.assertEqual(check.price, 19.99)
        self.assertTrue(check.in_stock)
        self.assertEqual(check.stock_label, "En stock")

    def test_booster_options_required_is_not_supported_in_v1(self) -> None:
        scraper = OtakulandScraper(source_url=str(BOOSTER_OPTIONS_REQUIRED), target_price=8.0)

        with self.assertRaisesRegex(ValueError, "options obligatoires detectees"):
            scraper.scrape()

    def test_registry_creates_otakuland_scraper(self) -> None:
        scraper = create_scraper(
            scraper_key="otakuland",
            source_url=str(TRIPACK_IN_STOCK),
            target_price=25.0,
        )

        self.assertIsInstance(scraper, OtakulandScraper)


if __name__ == "__main__":
    unittest.main()
