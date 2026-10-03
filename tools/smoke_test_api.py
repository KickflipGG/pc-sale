"""Дымовой тест REST API интернет-магазина «PC Sale».

Последовательно проверяет служебный маршрут, каталог, аутентификацию,
оформление заказа, оплату, отзывы и заявку Trade-In, печатая результат
каждого шага. Требует запущенного сервера: uvicorn app.main:app --port 8000.

Запуск:
    python tools/smoke_test_api.py
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000"
TOKEN: str | None = None


def call(method: str, path: str, payload: dict | None = None) -> tuple[int, object]:
    """Выполняет HTTP-запрос и возвращает код ответа и разобранное тело."""
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(BASE + path, data=data, method=method)
    request.add_header("Content-Type", "application/json")
    if TOKEN:
        request.add_header("Authorization", f"Bearer {TOKEN}")
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            body = response.read().decode("utf-8")
            return response.status, (json.loads(body) if body else None)
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8")
        try:
            return error.code, json.loads(body)
        except json.JSONDecodeError:
            return error.code, body


def step(title: str, method: str, path: str, payload: dict | None = None) -> object:
    status, body = call(method, path, payload)
    marker = "OK " if 200 <= status < 300 else "ERR"
    print(f"[{marker}] {status} {method:6} {path:52} {title}")
    if status >= 400:
        print(f"        -> {body}")
    return body


def main() -> int:
    global TOKEN

    print("=" * 100)
    print(" Дымовой тест REST API «PC Sale»")
    print("=" * 100)

    health = step("проверка доступности сервиса", "GET", "/api/health")
    print(f"        СУБД: {health['database']}")

    tree = step("дерево категорий каталога", "GET", "/api/categories")
    print(f"        корневых разделов: {len(tree)}, "
          f"подкатегорий: {sum(len(node['children']) for node in tree)}")

    sections = step("подразделы раздела «Готовые компьютеры»", "GET",
                    "/api/categories/ready-pc/sections")
    for section in sections:
        print(f"        · {section['category']['name']}: "
              f"{section['products_count']} модели, от {section['min_price']} руб.")

    page = step("поиск товаров по каталогу", "GET", "/api/products?page_size=5")
    print(f"        найдено товаров: {page['total']}")

    found = step("поиск по строке «RTX»", "GET", "/api/products?q=RTX")
    print(f"        совпадений: {found['total']}")

    gaming = step("фильтр по категории «gaming»", "GET", "/api/products?category=gaming")
    print(f"        игровых сборок: {gaming['total']}")

    detail = step("карточка товара", "GET", "/api/products/office-pc-i7-3770")
    print(f"        «{detail['title'][:60]}…» — {detail['price_retail']} руб., "
          f"склад {detail['stock_quantity']} шт.")

    login = step("вход покупателя", "POST", "/api/auth/login",
                 {"login": "danil", "password": "client123"})
    TOKEN = login["access_token"]
    print(f"        пользователь: {login['user']['first_name']}, "
          f"роль: {login['user']['role']['name']}")

    me = step("профиль текущего пользователя", "GET", "/api/auth/me")
    print(f"        адрес доставки: {me['delivery_address']}")

    bad = step("вход с неверным паролем (ожидается 401)", "POST", "/api/auth/login",
               {"login": "danil", "password": "wrong-password"})

    order = step("оформление заказа из корзины", "POST", "/api/orders",
                 {
                     "items": [{"product_id": 12, "quantity": 2},
                               {"product_id": 16, "quantity": 1}],
                     "delivery_type": "courier",
                     "payment_method": "card",
                     "shipping_notes": "Позвонить за час до доставки",
                     "tradein_discount": 1000,
                 })
    print(f"        заказ №{order['order_id']}: товаров {order['total_amount']} руб., "
          f"скидка Trade-In {order['tradein_discount']} руб., "
          f"к оплате {order['final_payable']} руб.")

    paid = step("оплата заказа", "POST", f"/api/orders/{order['order_id']}/pay")
    print(f"        статус: {paid['order_status']}, оплачен: {paid['is_paid']}")

    history = step("история покупок", "GET", "/api/orders")
    print(f"        заказов в истории: {len(history)}")

    review = step("отправка отзыва о товаре", "POST", "/api/reviews",
                  {"product_id": 12, "rating_score": 5,
                   "comment_text": "Отличные модули памяти, XMP завёлся сразу."})
    print(f"        отзыв №{review['review_id']}, статус: {review['moderation_status']}")

    tradein = step("заявка по программе Trade-In", "POST", "/api/trade-in",
                   {
                       "contact_name": "Данил Маренич",
                       "contact_phone": "+7 999 123-45-67",
                       "device_category": "Видеокарта",
                       "item_description": "GeForce RTX 2060 Super 8 ГБ, 2 года в работе",
                       "known_defects": "Не выявлено",
                   })
    print(f"        заявка №{tradein['tradein_id']}, статус: {tradein['request_status']}")

    stock = step("остаток товара после заказа", "GET",
                 "/api/products/ram-kingston-fury-ddr5-32g")
    print(f"        склад «{stock['title'][:40]}…»: {stock['stock_quantity']} шт.")

    summary = step("сводка по каталогу", "GET", "/api/catalog/summary")
    print(f"        товаров всего: {summary['products_total']}, "
          f"минимальная цена: {summary['min_price']} руб.")

    print("=" * 100)
    print(" Тест завершён. Проверьте, что все шаги отмечены как [OK ].")
    return 0


if __name__ == "__main__":
    sys.exit(main())
