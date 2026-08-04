# =============================================================================
#  LumiLivre Web — multi-stage Docker build (EX-01)
# -----------------------------------------------------------------------------
#  Build:  docker build --build-arg VITE_API_BASE_URL=https://api.exemplo.com \
#            -t lumilivre-web:dev .
#  Run:    docker run -p 5173:80 lumilivre-web:dev
#
#  VITE_API_BASE_URL é resolvido EM BUILD (Vite embute no bundle) — uma imagem
#  por ambiente de API. Nenhum segredo é necessário (e nenhum deve ser baked).
# =============================================================================

# ---- Stage 1: build (Node 20 + Vite) -----------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

# Camada de dependências separada para cache.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:8080
# Env real tem precedência sobre qualquer .env (que o .dockerignore já exclui).
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# ---- Stage 2: serve (nginx estático) ------------------------------------------
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:80/ >/dev/null || exit 1
