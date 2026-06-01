from models.product_check import ProductCheck


def log_product_check(check: ProductCheck) -> None:
    print("\n=== CardSnip product check ===")
    print(f"Produit      : {check.name}")
    print(f"Prix detecte : {check.price:.2f} EUR")
    print(f"Stock        : {check.stock_label}")
    print(f"Target price : {check.target_price:.2f} EUR")
    print(f"Source       : {check.source_url}")
    print(f"Timestamp    : {check.checked_at.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Bon deal     : {'Oui' if check.is_good_deal else 'Non'}")
    print("==============================\n")
