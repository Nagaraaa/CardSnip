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


class TcgPokalexProductParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.capture_script = False
        self.capture_h1 = False
        self.capture_price = False
        self.capture_ribbon = False
        self.script_buffer: list[str] = []
        self.json_ld_scripts: list[str] = []
        self.h1: str | None = None
        self.price_parts: list[str] = []
        self.ribbon_texts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {name: value or "" for name, value in attrs}
        classes = set(attributes.get("class", "").split())

        if tag == "script" and attributes.get("type") == "application/ld+json":
            self.capture_script = True
            self.script_buffer = []
            return

        if tag == "h1" and self.h1 is None:
            self.capture_h1 = True
            return

        if tag == "span" and "oe_currency_value" in classes:
            self.capture_price = True
            return

        if "o_wsale_ribbon" in classes:
            self.capture_ribbon = True

    def handle_data(self, data: str) -> None:
        cleaned = " ".join(data.split())

        if self.capture_script:
            self.script_buffer.append(data)

        if self.capture_h1 and cleaned and self.h1 is None:
            self.h1 = cleaned

        if self.capture_price and cleaned:
            self.price_parts.append(cleaned)

        if self.capture_ribbon and cleaned:
            self.ribbon_texts.append(cleaned)

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self.capture_script:
            self.json_ld_scripts.append("".join(self.script_buffer).strip())
            self.capture_script = False
            self.script_buffer = []

        if tag == "h1" and self.capture_h1:
            self.capture_h1 = False

        if tag == "span":
            self.capture_price = False
            self.capture_ribbon = False


class TcgPokalexScraper(BaseScraper):
    scraper_key = "tcg_pokalex"
    shop_name = "TCG PokAlex"

    def scrape(self) -> ProductCheck:
        html = self._load_html()
        parser = TcgPokalexProductParser()
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
                raise ConnectionError("TCG PokAlex inaccessible : delai depasse.") from error
            except URLError as error:
                raise ConnectionError("TCG PokAlex inaccessible : verifie l'URL source.") from error

        path = Path(self.source_url).expanduser().resolve()
        if not path.exists():
            raise FileNotFoundError(f"Snapshot TCG PokAlex introuvable: {path}")
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

        raise ValueError("Page TCG PokAlex invalide : JSON-LD Product introuvable ou invalide.")

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

    def _extract_name(self, product: dict[str, Any], parser: TcgPokalexProductParser) -> str:
        name = str(product.get("name") or "").strip()
        if not name:
            name = (parser.h1 or "").strip()

        if not name:
            raise ValueError("Page TCG PokAlex invalide : titre produit introuvable.")
        return name

    def _extract_price(self, product: dict[str, Any], parser: TcgPokalexProductParser) -> float:
        offers = self._get_offers(product)
        raw_price = str(offers.get("price") or "").strip()

        if not raw_price and parser.price_parts:
            raw_price = parser.price_parts[0]

        if not raw_price:
            raise ValueError("Page TCG PokAlex invalide : prix produit introuvable.")
        return self._parse_price(raw_price)

    def _extract_stock(self, product: dict[str, Any], parser: TcgPokalexProductParser) -> bool:
        offers = self._get_offers(product)
        availability = str(offers.get("availability") or "").strip().lower()

        if availability:
            if "instock" in availability or "preorder" in availability:
                return True
            if "outofstock" in availability or "soldout" in availability:
                return False
            raise ValueError(f"Disponibilite TCG PokAlex non reconnue: {availability}")

        ribbon_text = " ".join(parser.ribbon_texts).lower()
        if "rupture de stock" in ribbon_text:
            return False

        raise ValueError("Page TCG PokAlex invalide : disponibilite produit introuvable.")

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
            raise ValueError(f"Prix TCG PokAlex impossible a lire: {raw_price}")
        return float(match.group(1))
