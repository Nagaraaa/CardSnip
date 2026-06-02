from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import parse_qs, urlparse
from urllib.error import URLError
from urllib.request import urlopen

from models.product_check import ProductCheck
from scrapers.base import BaseScraper


class ProductHtmlParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.current_field: str | None = None
        self.values: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_names = {name for name, value in attrs}

        if "data-product-name" in attr_names:
            self.current_field = "name"
        elif "data-product-price" in attr_names:
            self.current_field = "price"
        elif "data-product-stock" in attr_names:
            self.current_field = "stock"

    def handle_data(self, data: str) -> None:
        if self.current_field and data.strip():
            self.values[self.current_field] = data.strip()

    def handle_endtag(self, tag: str) -> None:
        self.current_field = None


class FakeShopScraper(BaseScraper):
    scraper_key = "fake_shop"

    def scrape(self) -> ProductCheck:
        html = self._load_html()
        parser = ProductHtmlParser()
        parser.feed(html)

        if not {"name", "price", "stock"}.issubset(parser.values):
            raise ValueError("La page fake-shop ne contient pas les champs produit attendus.")

        scenario = self._scenario_from_url()
        price = scenario.get("price", parser.values["price"])
        stock = scenario.get("stock", parser.values["stock"])

        return ProductCheck(
            name=parser.values["name"],
            price=self._parse_price(price),
            in_stock=self._parse_stock(stock),
            source_url=self.source_url,
            checked_at=datetime.now(),
            target_price=self.target_price,
        )

    def _load_html(self) -> str:
        if self.source_url.startswith(("http://", "https://")):
            try:
                with urlopen(self.source_url, timeout=10) as response:
                    return response.read().decode("utf-8")
            except TimeoutError as error:
                raise ConnectionError(
                    "Fake shop inaccessible: delai depasse. Lance `python -m http.server 8080` dans le dossier fake-shop."
                ) from error
            except URLError as error:
                raise ConnectionError(
                    "Fake shop inaccessible: verifie que http://localhost:8080 repond et que l'URL source est correcte."
                ) from error

        path = Path(self.source_url).expanduser().resolve()
        if not path.exists():
            raise FileNotFoundError(f"Fake shop introuvable: {path}")
        return path.read_text(encoding="utf-8")

    def _scenario_from_url(self) -> dict[str, str]:
        if not self.source_url.startswith(("http://", "https://")):
            return {}

        params = parse_qs(urlparse(self.source_url).query)
        scenario: dict[str, str] = {}

        if params.get("price"):
            scenario["price"] = params["price"][0]

        if params.get("stock"):
            scenario["stock"] = "En stock" if params["stock"][0] == "in" else "Rupture"

        return scenario

    @staticmethod
    def _parse_price(raw_price: str) -> float:
        match = re.search(r"(\d+(?:[,.]\d+)?)", raw_price)
        if not match:
            raise ValueError(f"Prix impossible a lire: {raw_price}")
        return float(match.group(1).replace(",", "."))

    @staticmethod
    def _parse_stock(raw_stock: str) -> bool:
        normalized = raw_stock.strip().lower()
        return "en stock" in normalized
