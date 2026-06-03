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


class ShopifyProductParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.capture_script = False
        self.capture_h1 = False
        self.script_buffer: list[str] = []
        self.json_ld_scripts: list[str] = []
        self.meta: dict[str, str] = {}
        self.h1: str | None = None
        self.pickup_available: bool | None = None
        self.add_button_disabled: bool | None = None
        self.capture_add_button = False
        self.add_button_text_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {name: value or "" for name, value in attrs}

        if tag == "script" and attributes.get("type") == "application/ld+json":
            self.capture_script = True
            self.script_buffer = []
            return

        if tag == "meta":
            key = attributes.get("property") or attributes.get("name")
            content = attributes.get("content", "").strip()
            if key and content:
                self.meta[key] = content
            return

        if tag == "h1" and self.h1 is None:
            self.capture_h1 = True
            return

        if tag == "pickup-availability":
            self.pickup_available = "available" in attributes
            return

        if tag == "button" and attributes.get("name") == "add":
            self.capture_add_button = True
            self.add_button_disabled = "disabled" in attributes
            self.add_button_text_parts = []

    def handle_data(self, data: str) -> None:
        if self.capture_script:
            self.script_buffer.append(data)

        if self.capture_h1:
            cleaned = " ".join(data.split())
            if cleaned:
                self.h1 = cleaned

        if self.capture_add_button:
            cleaned = " ".join(data.split())
            if cleaned:
                self.add_button_text_parts.append(cleaned)

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self.capture_script:
            self.json_ld_scripts.append("".join(self.script_buffer).strip())
            self.capture_script = False
            self.script_buffer = []

        if tag == "h1" and self.capture_h1:
            self.capture_h1 = False

        if tag == "button" and self.capture_add_button:
            self.capture_add_button = False

    @property
    def add_button_text(self) -> str:
        return " ".join(self.add_button_text_parts).strip()


class ShopifyProductScraper(BaseScraper):
    shop_name = "Shopify"

    def scrape(self) -> ProductCheck:
        html = self._load_html()
        parser = ShopifyProductParser()
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
                raise ConnectionError(f"{self.shop_name} inaccessible : delai depasse.") from error
            except URLError as error:
                raise ConnectionError(f"{self.shop_name} inaccessible : verifie l'URL source.") from error

        path = Path(self.source_url).expanduser().resolve()
        if not path.exists():
            raise FileNotFoundError(f"Snapshot {self.shop_name} introuvable: {path}")
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

        raise ValueError(f"Page {self.shop_name} invalide : JSON-LD Product introuvable ou invalide.")

    def _find_product_object(self, payload: Any) -> dict[str, Any] | None:
        if isinstance(payload, dict):
            if payload.get("@type") == "Product":
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

    def _extract_name(self, product: dict[str, Any], parser: ShopifyProductParser) -> str:
        name = str(product.get("name") or "").strip()
        if not name:
            name = (parser.h1 or "").strip()

        if not name:
            raise ValueError(f"Page {self.shop_name} invalide : titre produit introuvable.")
        return name

    def _extract_price(self, product: dict[str, Any], parser: ShopifyProductParser) -> float:
        offers = self._get_offers(product)
        raw_price = str(offers.get("price") or "").strip()
        if not raw_price:
            raw_price = parser.meta.get("og:price:amount", "").strip()

        if not raw_price:
            raise ValueError(f"Page {self.shop_name} invalide : prix produit introuvable.")
        return self._parse_price(raw_price)

    def _extract_stock(self, product: dict[str, Any], parser: ShopifyProductParser) -> bool:
        offers = self._get_offers(product)
        availability = str(offers.get("availability") or "").strip().lower()

        if availability:
            if "instock" in availability or "preorder" in availability:
                return True
            if "outofstock" in availability or "soldout" in availability:
                return False
            raise ValueError(f"Disponibilite {self.shop_name} non reconnue: {availability}")

        if parser.pickup_available is not None:
            return parser.pickup_available

        if parser.add_button_disabled is not None:
            button_text = parser.add_button_text.lower()
            if parser.add_button_disabled and ("epuise" in button_text or "épuisé" in button_text):
                return False
            if not parser.add_button_disabled:
                return True

        raise ValueError(f"Page {self.shop_name} invalide : disponibilite produit introuvable.")

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
        normalized = raw_price.strip().replace("\u00a0", "").replace(" ", "")

        if "," in normalized:
            normalized = normalized.replace(".", "").replace(",", ".")

        match = re.search(r"(\d+(?:\.\d+)?)", normalized)
        if not match:
            raise ValueError(f"Prix Shopify impossible a lire: {raw_price}")
        return float(match.group(1))
