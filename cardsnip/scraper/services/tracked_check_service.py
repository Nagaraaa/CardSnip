import sqlite3
from typing import Any

from scrapers.registry import create_scraper
from services.alert_service import AlertService
from services.logger import log_product_check
from storage import repositories
from storage.database import connect, init_db


def run_tracked_products() -> dict[str, Any]:
    init_db()

    summary = {
        "tracked_products": 0,
        "observations": 0,
        "alerts": 0,
        "errors": 0,
        "messages": [],
    }

    connection = connect()
    try:
        tracked_products = repositories.list_tracked_products(connection, active_only=True)
        summary["tracked_products"] = len(tracked_products)

        if not tracked_products:
            message = "Aucun produit suivi actif dans SQLite. Lance d'abord `python scripts/init_db.py` ou cree un suivi depuis le catalogue."
            summary["messages"].append(message)
            print(message)
            return summary

        print(f"{len(tracked_products)} produit(s) suivi(s) actif(s) a checker.")

        for tracked_product in tracked_products:
            try:
                result = scrape_tracked_product(connection, tracked_product)
                summary["observations"] += result["observations"]
                summary["alerts"] += result["alerts"]
            except Exception as error:
                summary["errors"] += 1
                message = f"Erreur check #{tracked_product['id']} ({tracked_product['product_name']}): {error}"
                summary["messages"].append(message)
                print(message)
    finally:
        connection.close()

    return summary


def scrape_tracked_product(connection: sqlite3.Connection, tracked_product: dict[str, Any]) -> dict[str, int]:
    scraper = create_scraper(
        scraper_key=tracked_product["scraper_key"],
        source_url=tracked_product["source_url"],
        target_price=float(tracked_product["target_price"]),
    )
    check = scraper.scrape()
    log_product_check(check)

    observation = repositories.create_observation(
        connection,
        {
            "tracked_product_id": tracked_product["id"],
            "price": check.price,
            "stock_status": "in_stock" if check.in_stock else "out_of_stock",
            "checked_at": check.checked_at.isoformat(),
        },
    )
    print(f"Observation SQLite creee: #{observation['id']}")

    previous = repositories.get_previous_observation(
        connection,
        tracked_product_id=tracked_product["id"],
        before_observation_id=observation["id"],
    )
    alert_messages = build_alert_messages(tracked_product, check, previous)

    for alert_type, message in alert_messages:
        alert = repositories.create_alert(
            connection,
            {
                "tracked_product_id": tracked_product["id"],
                "type": alert_type,
                "message": message,
            },
        )
        print(f"Alerte SQLite creee: #{alert['id']} - {message}")

    AlertService().send_alerts(check)

    return {
        "observations": 1,
        "alerts": len(alert_messages),
    }


def build_alert_messages(tracked_product: dict[str, Any], check: Any, previous: dict[str, Any] | None) -> list[tuple[str, str]]:
    messages: list[tuple[str, str]] = []
    product_name = tracked_product["product_name"]
    target_price = float(tracked_product["target_price"])

    previous_price = float(previous["price"]) if previous else None
    previous_was_same_deal = (
        previous is not None
        and previous["stock_status"] == "in_stock"
        and previous_price is not None
        and previous_price <= target_price
    )

    if check.in_stock and check.price <= target_price and not previous_was_same_deal:
        messages.append(
            (
                "price_below_target",
                f"{product_name} est a {check.price:.2f} EUR, sous la cible {target_price:.2f} EUR.",
            )
        )

    previous_stock = previous["stock_status"] if previous else None
    if check.in_stock and previous_stock == "out_of_stock":
        messages.append(("back_in_stock", f"{product_name} est de retour en stock."))
    elif check.in_stock and previous is None:
        messages.append(("in_stock", f"{product_name} est en stock lors du premier check."))

    return messages
