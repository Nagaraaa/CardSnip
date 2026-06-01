from abc import ABC, abstractmethod

from models.product_check import ProductCheck


class BaseScraper(ABC):
    def __init__(self, source_url: str, target_price: float) -> None:
        self.source_url = source_url
        self.target_price = target_price

    @abstractmethod
    def scrape(self) -> ProductCheck:
        """Return the latest product check for this source."""
