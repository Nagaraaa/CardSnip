from scrapers.base import BaseScraper
from scrapers.fake_shop import FakeShopScraper
from scrapers.otakuland import OtakulandScraper
from scrapers.outpost_brussels import OutpostBrusselsScraper
from scrapers.tcg_pokalex import TcgPokalexScraper


SCRAPER_REGISTRY: dict[str, type[BaseScraper]] = {
    FakeShopScraper.scraper_key: FakeShopScraper,
    OtakulandScraper.scraper_key: OtakulandScraper,
    OutpostBrusselsScraper.scraper_key: OutpostBrusselsScraper,
    TcgPokalexScraper.scraper_key: TcgPokalexScraper,
}


def create_scraper(scraper_key: str, source_url: str, target_price: float) -> BaseScraper:
    scraper_class = SCRAPER_REGISTRY.get(scraper_key)
    if scraper_class is None:
        available = ", ".join(sorted(SCRAPER_REGISTRY))
        raise ValueError(f"Scraper inconnu: {scraper_key}. Scrapers disponibles: {available}")

    return scraper_class(source_url=source_url, target_price=target_price)
