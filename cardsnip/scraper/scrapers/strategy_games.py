from __future__ import annotations

from datetime import datetime
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

from models.product_check import ProductCheck
from scrapers.base import BaseScraper


OUT_OF_STOCK_WITHOUT_PRICE_MESSAGE = (
    "Page Strategy Games non supportee en V1 : prix introuvable sur produit en rupture."
)


class StrategyGamesProductParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.capture_script = False
        self.capture_h1 = False
        self.capture_price = False
        self.capture_stock = False
        self.capture_preorder_date = False
        self.capture_add_button = False
        self.script_buffer: list[str] = []
        self.json_ld_scripts: list[str] = []
        self.in_product = False
        self.product_depth = 0
        self.in_summary = False
        self.summary_depth = 0
        self.product_classes: set[str] = set()
        self.h1: str | None = None
        self.price_parts: list[str] = []
        self.stock_parts: list[str] = []
        self.preorder_parts: list[str] = []
        self.add_button_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {name: value or "" for name, value in attrs}
        classes = set(attributes.get("class", "").split())

        if tag == "script" and attributes.get("type") == "application/ld+json":
            self.capture_script = True
            self.script_buffer = []
            return

        if tag == "div" and attributes.get("id", "").startswith("product-") and "product" in classes:
            self.in_product = True
            self.product_depth = 1
            self.product_classes = classes
            return

        if not self.in_product:
            return

        self.product_depth += 1

        if tag == "div" and "summary" in classes:
            self.in_summary = True
            self.summary_depth = 1
            return

        if self.in_summary:
            self.summary_depth += 1

        if not self.in_summary:
            return

        if tag == "h1" and self.h1 is None:
            self.capture_h1 = True
            return

        if tag == "span" and "woocommerce-Price-amount" in classes:
            self.capture_price = True
            return

        if tag == "p" and "stock" in classes:
            self.capture_stock = True
            return

        if tag == "div" and "wpro-pre-order-availability-date" in classes:
            self.capture_preorder_date = True
            return

        if tag == "button" and "single_add_to_cart_button" in classes:
            self.capture_add_button = True

    def handle_data(self, data: str) -> None:
        cleaned = " ".join(data.split())

        if self.capture_script:
            self.script_buffer.append(data)
        if self.capture_h1 and cleaned and self.h1 is None:
            self.h1 = cleaned
        if self.capture_price and cleaned:
            self.price_parts.append(cleaned)
        if self.capture_stock and cleaned:
            self.stock_parts.append(cleaned)
        if self.capture_preorder_date and cleaned:
            self.preorder_parts.append(cleaned)
        if self.capture_add_button and cleaned:
            self.add_button_parts.append(cleaned)

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self.capture_script:
            self.json_ld_scripts.append("".join(self.script_buffer).strip())
            self.capture_script = False
            self.script_buffer = []

        if tag == "h1":
            self.capture_h1 = False
        if tag == "span":
            self.capture_price = False
        if tag == "p":
            self.capture_stock = False
        if tag == "div":
            self.capture_preorder_date = False
        if tag == "button":
            self.capture_add_button = False

        if self.in_summary:
            self.summary_depth -= 1
            if self.summary_depth <= 0:
                self.in_summary = False

        if self.in_product:
            self.product_depth -= 1
            if self.product_depth <= 0:
                self.in_product = False

    @property
    def preorder_text(self) -> str:
        return " ".join(self.preorder_parts).strip()


class StrategyGamesScraper(BaseScraper):
    scraper_key = "strategy_games"

    def scrape(self) -> ProductCheck:
        html = self._load_html()
        parser = StrategyGamesProductParser()
        parser.feed(html)

        product = self._find_product_json_ld(parser.json_ld_scripts)
        name = self._extract_name(product, parser)
        price = self._extract_price(product, parser)
        in_stock = self._extract_stock(product, parser)

        return ProductCheck(
            name=name,
            price=price,
            in_stock=in_stock,
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
                raise ConnectionError("Strategy Games inaccessible : delai depasse.") from error
            except URLError as error:
                raise ConnectionError("Strategy Games inaccessible : verifie l'URL source.") from error

        path = Path(self.source_url).expanduser().resolve()
        if not path.exists():
            raise FileNotFoundError(f"Snapshot Strategy Games introuvable: {path}")
        return path.read_text(encoding="utf-8")

    def _find_product_json_ld(self, scripts: list[str]) -> dict[str, Any]:
        for script in scripts:
            try:
                payload = json.loads(script)
            except json.JSONDecodeError:
                continue

            product = self._find_product_object(payload)
            if product is not None:
                return product

        raise ValueError("Page Strategy Games invalide : JSON-LD Product introuvable ou invalide.")

    def _find_product_object(self, payload: Any) -> dict[str, Any] | None:
        if isinstance(payload, dict):
            item_type = payload.get("@type")
            if item_type == "Product" or (isinstance(item_type, list) and "Product" in item_type):
                return payload

            graph = payload.get("@graph")
            if isinstance(graph, list):
                for item in graph:
                    product = self._find_product_object(item)
                    if product is not None:
                        return product

        if isinstance(payload, list):
            for item in payload:
                product = self._find_product_object(item)
                if product is not None:
                    return product

        return None

    def _extract_name(self, product: dict[str, Any], parser: StrategyGamesProductParser) -> str:
        name = str(product.get("name") or "").strip()
        if name.endswith(" - Strategy Games"):
            name = name.removesuffix(" - Strategy Games").strip()
        if not name:
            name = (parser.h1 or "").strip()

        if not name:
            raise ValueError("Page Strategy Games invalide : titre produit introuvable.")
        return name

    def _extract_price(self, product: dict[str, Any], parser: StrategyGamesProductParser) -> float:
        offers = self._get_offers(product)
        raw_price = str(offers.get("price") or "").strip()

        if not raw_price and parser.price_parts:
            raw_price = "".join(parser.price_parts)

        if not raw_price:
            if self._is_out_of_stock(product, parser):
                raise ValueError(OUT_OF_STOCK_WITHOUT_PRICE_MESSAGE)
            raise ValueError("Page Strategy Games invalide : prix produit introuvable.")
        return self._parse_price(raw_price)

    def _extract_stock(self, product: dict[str, Any], parser: StrategyGamesProductParser) -> bool:
        offers = self._get_offers(product)
        availability = str(offers.get("availability") or "").strip().lower()

        if availability:
            if "instock" in availability or "preorder" in availability:
                return True
            if "outofstock" in availability or "soldout" in availability:
                return False
            raise ValueError(f"Disponibilite Strategy Games non reconnue: {availability}")

        if "outofstock" in parser.product_classes:
            return False

        stock_text = " ".join(parser.stock_parts).lower()
        if "en stock" in stock_text or parser.preorder_text:
            return True

        raise ValueError("Page Strategy Games invalide : disponibilite produit introuvable.")

    def _is_out_of_stock(self, product: dict[str, Any], parser: StrategyGamesProductParser) -> bool:
        offers = self._get_offers(product)
        availability = str(offers.get("availability") or "").strip().lower()
        return "outofstock" in availability or "outofstock" in parser.product_classes

    @staticmethod
    def _get_offers(product: dict[str, Any]) -> dict[str, Any]:
        offers = product.get("offers")
        if isinstance(offers, list):
            for offer in offers:
                if isinstance(offer, dict):
                    return offer
            return {}
        if isinstance(offers, dict):
            return offers
        return {}

    @staticmethod
    def _parse_price(raw_price: str) -> float:
        normalized = raw_price.strip().replace("\u00a0", "").replace(" ", "").replace("€", "")
        if "," in normalized:
            normalized = normalized.replace(".", "").replace(",", ".")

        match = re.search(r"(\d+(?:\.\d+)?)", normalized)
        if not match:
            raise ValueError(f"Prix Strategy Games impossible a lire: {raw_price}")
        return float(match.group(1))
