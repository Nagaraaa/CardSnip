from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.error import URLError
from urllib.request import Request, urlopen

from models.product_check import ProductCheck
from scrapers.base import BaseScraper


class OtakulandProductParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_product_page = False
        self.product_depth = 0
        self.capture_field: str | None = None
        self.values: dict[str, str] = {}
        self.stock_classes: set[str] = set()
        self.stock_attrs: dict[str, str] = {}
        self.is_option_required = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {name: value or "" for name, value in attrs}
        classes = set(attributes.get("class", "").split())

        if tag == "main" and "ProductPage" in classes:
            self.in_product_page = True
            self.product_depth = 1
            return

        if self.in_product_page:
            self.product_depth += 1

        if not self.in_product_page:
            return

        if tag == "h1" and attributes.get("itemprop") == "name":
            self.capture_field = "name"
            return

        if "Price-value" in classes and attributes.get("itemprop") == "price":
            content_price = attributes.get("content", "").strip()
            if content_price and "price" not in self.values:
                self.values["price"] = content_price
            else:
                self.capture_field = "price"
            return

        if "ProductStock-info" in classes:
            self.capture_field = "stock"
            self.stock_classes = classes
            self.stock_attrs = attributes

    def handle_data(self, data: str) -> None:
        if (
            '"isOptionRequired":true' in data
            or "\\u0022isOptionRequired\\u0022\\u003Atrue" in data
        ):
            self.is_option_required = True

        if not self.in_product_page:
            return

        if not self.capture_field:
            return

        cleaned = " ".join(data.split())
        if cleaned and self.capture_field not in self.values:
            self.values[self.capture_field] = cleaned

    def handle_endtag(self, tag: str) -> None:
        if self.capture_field and tag in {"h1", "span", "div"}:
            self.capture_field = None

        if self.in_product_page:
            self.product_depth -= 1
            if self.product_depth <= 0:
                self.in_product_page = False


class OtakulandScraper(BaseScraper):
    scraper_key = "otakuland"
    unsupported_options_message = "Page Otakuland non supportee en V1 : options obligatoires detectees."

    def scrape(self) -> ProductCheck:
        html = self._load_html()
        parser = OtakulandProductParser()
        parser.feed(html)

        if parser.is_option_required:
            raise ValueError(self.unsupported_options_message)

        name = parser.values.get("name", "").strip()
        if not name:
            raise ValueError("Page Otakuland invalide : titre produit introuvable.")

        raw_price = parser.values.get("price", "").strip()
        if not raw_price:
            raise ValueError("Page Otakuland invalide : prix produit introuvable.")

        if "stock" not in parser.values and not parser.stock_classes:
            raise ValueError("Page Otakuland invalide : stock produit introuvable.")

        return ProductCheck(
            name=name,
            price=self._parse_price(raw_price),
            in_stock=self._parse_stock(parser),
            source_url=self.source_url,
            checked_at=datetime.now(),
            target_price=self.target_price,
        )

    def _load_html(self) -> str:
        if self.source_url.startswith(("http://", "https://")):
            request = Request(
                self.source_url,
                headers={"User-Agent": "CardSnip local MVP scraper/0.1"},
            )
            try:
                with urlopen(request, timeout=15) as response:
                    return response.read().decode("utf-8")
            except TimeoutError as error:
                raise ConnectionError("Otakuland-Manga Passion inaccessible : delai depasse.") from error
            except URLError as error:
                raise ConnectionError("Otakuland-Manga Passion inaccessible : verifie l'URL source.") from error

        path = Path(self.source_url).expanduser().resolve()
        if not path.exists():
            raise FileNotFoundError(f"Snapshot Otakuland introuvable: {path}")
        return path.read_text(encoding="utf-8")

    @staticmethod
    def _parse_price(raw_price: str) -> float:
        match = re.search(r"(\d+(?:[,.]\d+)?)", raw_price)
        if not match:
            raise ValueError(f"Prix Otakuland impossible a lire: {raw_price}")
        return float(match.group(1).replace(",", "."))

    @staticmethod
    def _parse_stock(parser: OtakulandProductParser) -> bool:
        stock_text = parser.values.get("stock", "").strip().lower()

        if "out_of_stock" in parser.stock_classes or parser.stock_attrs.get("data-sold-out") == "true":
            return False

        if "in_stock" in parser.stock_classes or "en stock" in stock_text:
            return True

        if "epuise" in stock_text or "épuisé" in stock_text:
            return False

        raise ValueError("Page Otakuland invalide : statut stock non reconnu.")
