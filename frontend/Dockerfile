# 1. 
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
# Mismo origen: el navegador le pide a nginx (/api/...) y nginx lo manda al backend
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- Etapa 2: tests (parte del build: ya tiene Node y las dependencias) ----
FROM build AS test
ENTRYPOINT ["npm", "run", "test:ci"]

# ---- Etapa 3: nginx sirve los estaticos ----
FROM nginx:alpine
# nginx reemplaza ${VARIABLE} de /etc/nginx/templates/ al arrancar (la imagen no lleva la dirección del backend)
COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
ENV BACKEND_URL=http://backend:8000 \
    DNS_RESOLVER=127.0.0.11 \
    RENDER_GIT_COMMIT=unknown
EXPOSE 80