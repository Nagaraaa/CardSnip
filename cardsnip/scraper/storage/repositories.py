from __future__ import annotations

from datetime import datetime, timedelta, timezone
import sqlite3
from typing import Any


def row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {key: row[key] for key in row.keys()}


def list_products(connection: sqlite3.Connection, limit: int = 100, offset: int = 0) -> list[dict[str, Any]]:
    rows = connection.execute(
        """
        select id, name, category, language, extension, image_url, created_at
        from products
        order by id desc
        limit ? offset ?
        """,
        (limit, offset),
    ).fetchall()
    return [row_to_dict(row) for row in rows]


def count_products(connection: sqlite3.Connection) -> int:
    row = connection.execute("select count(*) as total from products").fetchone()
    return int(row["total"]) if row else 0


def create_product(connection: sqlite3.Connection, payload: dict[str, Any]) -> dict[str, Any]:
    cursor = connection.execute(
        """
        insert into products (name, category, language, extension, image_url)
        values (:name, :category, :language, :extension, :image_url)
        """,
        {
            "name": payload["name"],
            "category": payload.get("category") or "other",
            "language": payload.get("language") or "FR",
            "extension": payload.get("extension"),
            "image_url": payload.get("image_url"),
        },
    )
    connection.commit()
    return get_product(connection, cursor.lastrowid)


def get_product(connection: sqlite3.Connection, product_id: int) -> dict[str, Any]:
    row = connection.execute(
        """
        select id, name, category, language, extension, image_url, created_at
        from products
        where id = ?
        """,
        (product_id,),
    ).fetchone()
    if row is None:
        raise ValueError(f"Product not found: {product_id}")
    return row_to_dict(row)


def list_shops(connection: sqlite3.Connection, limit: int = 100, offset: int = 0) -> list[dict[str, Any]]:
    rows = connection.execute(
        """
        select id, name, url, scraper_key, country, type, priority, difficulty, integration_status, notes, active, trusted, created_at
        from shops
        order by name asc
        limit ? offset ?
        """,
        (limit, offset),
    ).fetchall()
    return [row_to_dict(row) for row in rows]


def parse_sqlite_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    normalized = value.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        try:
            parsed = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def get_shop_health_status(shop: dict[str, Any]) -> str:
    scraper_key = shop.get("scraper_key") or "not_configured"
    if scraper_key == "not_configured":
        return "not_configured"
    if shop.get("last_error"):
        return "broken"
    if shop.get("last_checked_at") is None:
        return "unknown"
    if shop.get("last_price") is None or shop.get("last_stock_status") is None:
        return "degraded"

    last_checked_at = parse_sqlite_datetime(shop.get("last_checked_at"))
    if last_checked_at is None:
        return "degraded"

    if datetime.now(timezone.utc) - last_checked_at > timedelta(days=7):
        return "degraded"
    return "healthy"


def list_shop_statuses(connection: sqlite3.Connection, limit: int = 100, offset: int = 0) -> list[dict[str, Any]]:
    rows = connection.execute(
        """
        select
          s.id as shop_id,
          s.name,
          s.url,
          s.scraper_key,
          s.country,
          s.type,
          s.priority,
          s.difficulty,
          s.integration_status,
          s.notes,
          s.active,
          s.trusted,
          s.created_at,
          latest.checked_at as last_checked_at,
          latest.checked_at as last_success_at,
          latest.price as last_price,
          latest.stock_status as last_stock_status,
          coalesce(obs_counts.recent_observations_count, 0) as recent_observations_count,
          coalesce(alert_counts.recent_alerts_count, 0) as recent_alerts_count,
          null as last_error
        from shops s
        left join (
          select
            tp.shop_id,
            po.checked_at,
            po.price,
            po.stock_status
          from price_observations po
          join tracked_products tp on tp.id = po.tracked_product_id
          join (
            select tp_inner.shop_id, max(po_inner.id) as latest_observation_id
            from price_observations po_inner
            join tracked_products tp_inner on tp_inner.id = po_inner.tracked_product_id
            group by tp_inner.shop_id
          ) latest_ids
            on latest_ids.latest_observation_id = po.id
        ) latest
          on latest.shop_id = s.id
        left join (
          select tp.shop_id, count(*) as recent_observations_count
          from price_observations po
          join tracked_products tp on tp.id = po.tracked_product_id
          where po.checked_at >= datetime('now', '-7 days')
          group by tp.shop_id
        ) obs_counts
          on obs_counts.shop_id = s.id
        left join (
          select tp.shop_id, count(*) as recent_alerts_count
          from alerts a
          join tracked_products tp on tp.id = a.tracked_product_id
          where a.created_at >= datetime('now', '-7 days')
          group by tp.shop_id
        ) alert_counts
          on alert_counts.shop_id = s.id
        order by
          case s.integration_status
            when 'functional' then 0
            when 'in_progress' then 1
            when 'to_analyze' then 2
            else 3
          end,
          s.name asc
        limit ? offset ?
        """,
        (limit, offset),
    ).fetchall()

    statuses = [row_to_dict(row) for row in rows]
    for shop in statuses:
        shop["health_status"] = get_shop_health_status(shop)
    return statuses


def count_shops(connection: sqlite3.Connection) -> int:
    row = connection.execute("select count(*) as total from shops").fetchone()
    return int(row["total"]) if row else 0


def create_shop(connection: sqlite3.Connection, payload: dict[str, Any]) -> dict[str, Any]:
    cursor = connection.execute(
        """
        insert into shops (name, url, scraper_key, country, type, priority, difficulty, integration_status, notes, active, trusted)
        values (:name, :url, :scraper_key, :country, :type, :priority, :difficulty, :integration_status, :notes, :active, :trusted)
        """,
        {
            "name": payload["name"],
            "url": payload.get("url"),
            "scraper_key": payload.get("scraper_key") or "not_configured",
            "country": payload.get("country") or "unknown",
            "type": payload.get("type") or "tcg_specialist",
            "priority": payload.get("priority") or "medium",
            "difficulty": payload.get("difficulty") or "unknown",
            "integration_status": payload.get("integration_status") or "to_analyze",
            "notes": payload.get("notes"),
            "active": int(bool(payload.get("active", True))),
            "trusted": int(bool(payload.get("trusted", True))),
        },
    )
    connection.commit()
    return get_shop(connection, cursor.lastrowid)


def get_shop(connection: sqlite3.Connection, shop_id: int) -> dict[str, Any]:
    row = connection.execute(
        """
        select id, name, url, scraper_key, country, type, priority, difficulty, integration_status, notes, active, trusted, created_at
        from shops
        where id = ?
        """,
        (shop_id,),
    ).fetchone()
    if row is None:
        raise ValueError(f"Shop not found: {shop_id}")
    return row_to_dict(row)


def list_tracked_products(
    connection: sqlite3.Connection,
    active_only: bool = False,
    limit: int = 100,
    offset: int = 0,
) -> list[dict[str, Any]]:
    where_clause = "where tp.active = 1" if active_only else ""
    rows = connection.execute(
        f"""
        select
          tp.id,
          tp.product_id,
          p.name as product_name,
          p.category,
          p.language,
          p.extension,
          p.image_url,
          tp.shop_id,
          s.name as shop_name,
          s.url as shop_url,
          s.scraper_key,
          tp.source_url,
          tp.target_price,
          tp.active,
          tp.created_at
        from tracked_products tp
        join products p on p.id = tp.product_id
        join shops s on s.id = tp.shop_id
        {where_clause}
        order by tp.id desc
        limit ? offset ?
        """,
        (limit, offset),
    ).fetchall()
    return [row_to_dict(row) for row in rows]


def count_tracked_products(connection: sqlite3.Connection, active_only: bool = False) -> int:
    where_clause = "where active = 1" if active_only else ""
    row = connection.execute(
        f"""
        select count(*) as total
        from tracked_products
        {where_clause}
        """
    ).fetchone()
    return int(row["total"]) if row else 0


def create_tracked_product(connection: sqlite3.Connection, payload: dict[str, Any]) -> dict[str, Any]:
    cursor = connection.execute(
        """
        insert into tracked_products (product_id, shop_id, source_url, target_price, active)
        values (:product_id, :shop_id, :source_url, :target_price, :active)
        """,
        {
            "product_id": int(payload["product_id"]),
            "shop_id": int(payload["shop_id"]),
            "source_url": payload["source_url"],
            "target_price": float(payload["target_price"]),
            "active": int(bool(payload.get("active", True))),
        },
    )
    connection.commit()
    return get_tracked_product(connection, cursor.lastrowid)


def get_tracked_product(connection: sqlite3.Connection, tracked_product_id: int) -> dict[str, Any]:
    row = connection.execute(
        """
        select
          tp.id,
          tp.product_id,
          p.name as product_name,
          p.category,
          p.language,
          p.extension,
          p.image_url,
          tp.shop_id,
          s.name as shop_name,
          s.url as shop_url,
          s.scraper_key,
          tp.source_url,
          tp.target_price,
          tp.active,
          tp.created_at
        from tracked_products tp
        join products p on p.id = tp.product_id
        join shops s on s.id = tp.shop_id
        where tp.id = ?
        """,
        (tracked_product_id,),
    ).fetchone()
    if row:
        return row_to_dict(row)
    raise ValueError(f"Tracked product not found: {tracked_product_id}")


def list_tracked_products_for_shop(
    connection: sqlite3.Connection,
    shop_id: int,
    active_only: bool = True,
) -> list[dict[str, Any]]:
    where_active = "and tp.active = 1" if active_only else ""
    rows = connection.execute(
        f"""
        select
          tp.id,
          tp.product_id,
          p.name as product_name,
          p.category,
          p.language,
          p.extension,
          p.image_url,
          tp.shop_id,
          s.name as shop_name,
          s.url as shop_url,
          s.scraper_key,
          tp.source_url,
          tp.target_price,
          tp.active,
          tp.created_at
        from tracked_products tp
        join products p on p.id = tp.product_id
        join shops s on s.id = tp.shop_id
        where tp.shop_id = ?
        {where_active}
        order by tp.id desc
        """,
        (shop_id,),
    ).fetchall()
    return [row_to_dict(row) for row in rows]


def list_observations(connection: sqlite3.Connection, limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
    rows = connection.execute(
        """
        select
          po.id,
          po.tracked_product_id,
          p.name as product_name,
          s.name as shop_name,
          po.price,
          po.stock_status,
          po.checked_at
        from price_observations po
        join tracked_products tp on tp.id = po.tracked_product_id
        join products p on p.id = tp.product_id
        join shops s on s.id = tp.shop_id
        order by po.checked_at desc, po.id desc
        limit ? offset ?
        """,
        (limit, offset),
    ).fetchall()
    return [row_to_dict(row) for row in rows]


def list_latest_observations(connection: sqlite3.Connection) -> list[dict[str, Any]]:
    rows = connection.execute(
        """
        select
          po.id,
          po.tracked_product_id,
          p.name as product_name,
          s.name as shop_name,
          po.price,
          po.stock_status,
          po.checked_at
        from price_observations po
        join (
          select tracked_product_id, max(id) as latest_id
          from price_observations
          group by tracked_product_id
        ) latest
          on latest.latest_id = po.id
        join tracked_products tp on tp.id = po.tracked_product_id
        join products p on p.id = tp.product_id
        join shops s on s.id = tp.shop_id
        order by po.checked_at desc, po.id desc
        """
    ).fetchall()
    return [row_to_dict(row) for row in rows]


def list_alerts(connection: sqlite3.Connection, limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
    rows = connection.execute(
        """
        select
          a.id,
          a.tracked_product_id,
          p.name as product_name,
          s.name as shop_name,
          a.type,
          a.message,
          a.created_at
        from alerts a
        join tracked_products tp on tp.id = a.tracked_product_id
        join products p on p.id = tp.product_id
        join shops s on s.id = tp.shop_id
        order by a.created_at desc, a.id desc
        limit ? offset ?
        """,
        (limit, offset),
    ).fetchall()
    return [row_to_dict(row) for row in rows]


def create_observation(connection: sqlite3.Connection, payload: dict[str, Any]) -> dict[str, Any]:
    cursor = connection.execute(
        """
        insert into price_observations (tracked_product_id, price, stock_status, checked_at)
        values (:tracked_product_id, :price, :stock_status, :checked_at)
        """,
        {
            "tracked_product_id": int(payload["tracked_product_id"]),
            "price": float(payload["price"]),
            "stock_status": payload["stock_status"],
            "checked_at": payload["checked_at"],
        },
    )
    connection.commit()
    row = connection.execute(
        """
        select id, tracked_product_id, price, stock_status, checked_at
        from price_observations
        where id = ?
        """,
        (cursor.lastrowid,),
    ).fetchone()
    if row is None:
        raise ValueError("Observation insert failed")
    return row_to_dict(row)


def get_previous_observation(
    connection: sqlite3.Connection,
    tracked_product_id: int,
    before_observation_id: int | None = None,
) -> dict[str, Any] | None:
    if before_observation_id is None:
        row = connection.execute(
            """
            select id, tracked_product_id, price, stock_status, checked_at
            from price_observations
            where tracked_product_id = ?
            order by checked_at desc, id desc
            limit 1
            """,
            (tracked_product_id,),
        ).fetchone()
    else:
        row = connection.execute(
            """
            select id, tracked_product_id, price, stock_status, checked_at
            from price_observations
            where tracked_product_id = ? and id < ?
            order by checked_at desc, id desc
            limit 1
            """,
            (tracked_product_id, before_observation_id),
        ).fetchone()

    return row_to_dict(row) if row else None


def create_alert(connection: sqlite3.Connection, payload: dict[str, Any]) -> dict[str, Any]:
    cursor = connection.execute(
        """
        insert into alerts (tracked_product_id, type, message)
        values (:tracked_product_id, :type, :message)
        """,
        {
            "tracked_product_id": int(payload["tracked_product_id"]),
            "type": payload["type"],
            "message": payload["message"],
        },
    )
    connection.commit()
    row = connection.execute(
        """
        select id, tracked_product_id, type, message, created_at
        from alerts
        where id = ?
        """,
        (cursor.lastrowid,),
    ).fetchone()
    if row is None:
        raise ValueError("Alert insert failed")
    return row_to_dict(row)
