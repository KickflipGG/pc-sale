# Сборка интерфейса и его отдача через nginx.
# Контекст сборки — корень репозитория (см. deploy/docker-compose.yml).

FROM node:22-alpine AS build

WORKDIR /build

# Сначала только файлы зависимостей: слой кэшируется, пока не изменился
# package-lock.json, и при правке кода npm ci не выполняется заново
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY frontend/ ./

# Адрес API передаётся аргументом на этапе сборки.
# По умолчанию пусто: интерфейс и API живут на одном домене за nginx,
# поэтому клиент обращается к относительному /api
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build


# Итоговый образ: только nginx и результат сборки.
# Исходный код, node_modules и .env в него не попадают
FROM nginx:1.27-alpine

COPY --from=build /build/dist /usr/share/nginx/html

EXPOSE 80 443
