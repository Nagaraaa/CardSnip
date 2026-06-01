from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class ProductCheck:
    name: str
    price: float
    in_stock: bool
    source_url: str
    checked_at: datetime
    target_price: float

    @property
    def is_good_deal(self) -> bool:
        return self.price <= self.target_price

    @property
    def stock_label(self) -> str:
        return "En stock" if self.in_stock else "Rupture"
