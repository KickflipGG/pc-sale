"""Маршрутизаторы REST API интернет-магазина «PC Sale»."""

from . import auth, catalog, orders, reviews, trade_in

__all__ = ["auth", "catalog", "orders", "reviews", "trade_in"]
