# Продакшен-образ серверной части: только API.
# Собранный интерфейс отдаёт nginx — см. deploy/nginx/Dockerfile.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app/backend

# Сначала только зависимости: слой закэшируется и не будет
# пересобираться при каждом изменении исходного кода
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY database ./database

# Запуск от непривилегированного пользователя, а не от root
RUN useradd --create-home --shell /usr/sbin/nologin appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Продакшен-режим: без --reload.
# --proxy-headers и --forwarded-allow-ips — аналог ProxyFix: uvicorn
# читает X-Forwarded-For, X-Forwarded-Proto и X-Forwarded-Host от nginx
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--proxy-headers", \
     "--forwarded-allow-ips=*"]
