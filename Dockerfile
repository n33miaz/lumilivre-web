# =============================================================================
#  LumiLivre Web — multi-stage Docker build
# -----------------------------------------------------------------------------
#  Build:  docker build --build-arg VITE_API_BASE_URL=https://api.exemplo.com \
#            -t lumilivre-web:dev .
#  Run:    docker run -p 5173:80 lumilivre-web:dev
#
#  VITE_API_BASE_URL é resolvido EM BUILD (Vite embute no bundle) — uma imagem
#  por ambiente de API. Nenhum segredo é necessário (e nenhum deve ser baked).
#  VITE_APK_URL (opcional) aponta a tela /download para o APK publicado como
#  GitHub Release do lumilivre-app; sem ela a tela mostra o aviso.
# =============================================================================

# ---- Stage 1: build (Node 20 + Vite) -----------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

# Camada de dependências separada para cache.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:8080
# Sem default: quem publica a release passa o endereço; vazio cai no aviso da
# tela /download em vez de servir um link quebrado.
ARG VITE_APK_URL=
# Env real tem precedência sobre qualquer .env (que o .dockerignore já exclui).
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_APK_URL=${VITE_APK_URL}
RUN npm run build

# ---- Stage 2: serve (nginx estático) ------------------------------------------
FROM nginx:1.27-alpine

# A CSP precisa liberar exatamente a origem que o bundle chama, senão o browser
# bloqueia todo XHR. Mesmo build arg dos dois lados = impossível divergir.
# Produção hoje: --build-arg VITE_API_BASE_URL=https://lumilivre-api.onrender.com
ARG VITE_API_BASE_URL=http://localhost:8080
ENV CSP_CONNECT_SRC=${VITE_API_BASE_URL}
# O entrypoint da imagem oficial roda envsubst nos templates. Sem o filtro ele
# substituiria QUALQUER $var do arquivo — inclusive as do próprio nginx.
ENV NGINX_ENVSUBST_FILTER=^CSP_CONNECT_SRC$
COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# 127.0.0.1 explícito: no Alpine, localhost resolve para ::1 (IPv6) e o
# nginx só escuta IPv4 — o healthcheck ficaria eternamente "connection refused".
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:80/ >/dev/null || exit 1
