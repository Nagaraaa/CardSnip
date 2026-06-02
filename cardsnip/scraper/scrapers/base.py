from abc import ABC, abstractmethod
from typing import ClassVar

from models.product_check import ProductCheck


class BaseScraper(ABC):
    scraper_key: ClassVar[str]

    def __init__(self, source_url: str, target_price: float) -> None:
        self.source_url = source_url
        self.target_price = target_price

    @abstractmethod
    def scrape(self) -> ProductCheck:
        """Read one source URL and return one normalized product check."""
