from pathlib import Path
import argparse
import os

from scrapers.fake_shop import FakeShopScraper
from services.alert_service import AlertService
from services.logger import log_product_check
from services.tracked_check_service import run_tracked_products


def build_parser() -> argparse.ArgumentParser:
    default_source = Path(__file__).resolve().parents[1] / "fake-shop" / "index.html"

    parser = argparse.ArgumentParser(description="CardSnip MVP scraper")
    parser.add_argument(
        "--source",
        default=str(default_source),
        help="Chemin local ou URL de la fake shop.",
    )
    parser.add_argument(
        "--target-price",
        type=float,
        default=None,
        help="Prix cible pour declencher une alerte bon deal.",
    )
    parser.add_argument(
        "--single",
        action="store_true",
        help="Force le mode historique: scrape uniquement --source sans lire SQLite.",
    )
    return parser


def load_local_env() -> None:
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        clean_line = line.strip()
        if not clean_line or clean_line.startswith("#") or "=" not in clean_line:
            continue

        key, value = clean_line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def main() -> None:
    load_local_env()
    args = build_parser().parse_args()

    if args.single:
        target_price = args.target_price if args.target_price is not None else 55.00
        run_single_check(args.source, target_price)
        return

    run_tracked_products()


def run_single_check(source_url: str, target_price: float) -> None:
    scraper = FakeShopScraper(source_url=source_url, target_price=target_price)
    check = scraper.scrape()

    log_product_check(check)
    AlertService().send_alerts(check)


if __name__ == "__main__":
    main()
