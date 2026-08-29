# Proyecto IngSoft3

Bako Lifestyle Store — API (FastAPI) + Frontend (React/Vite servido con Nginx) + MySQL, todo orquestado con Docker Compose.

## Requisitos previos

- [Docker](https://docs.docker.com/get-docker/) y Docker Compose (`docker compose version`)
- Git (solo si vas a clonar el repositorio)

## Opción A — Levantando el proyecto con el repositorio clonado

Usá esta opción si tenés (o vas a clonar) el repositorio completo. Permite tanto **buildear las imágenes localmente** como **usar las ya publicadas en el registry**.

### 1. Clonar el repositorio

```bash
git clone https://github.com/juan-cabra1/ingsoft3-tp01.git
cd ingsoft3-tp01
```

### 2. Configurar las variables de entorno

```bash
cp .env.example .env
```

Editá `.env` y completá los valores (como mínimo `MYSQL_ROOT_PASSWORD` y `JWT_SECRET_KEY`):

```env
MYSQL_ROOT_PASSWORD=tu_password
WHATSAPP_NUMBER=549123456789
JWT_SECRET_KEY=change_me_to_a_random_64_char_string
```

### 3.a Levantar el proyecto buildeando las imágenes (`docker-compose.yml`)

```bash
docker compose up --build -d
```

Esto construye `backend` y `frontend` a partir del código fuente local.

### 3.b Levantar el proyecto usando las imágenes del registry (`docker-compose.registry.yml`)

```bash
docker compose -f docker-compose.registry.yml up -d
```

Esto descarga las imágenes ya publicadas (`ghcr.io/juan-cabra1/backend` y `ghcr.io/juan-cabra1/frontend`) en lugar de compilarlas.

### 4. Verificar que todo esté corriendo

```bash
docker compose ps
```

- Frontend: http://localhost:3000
- Backend (API): http://localhost:8001
- Documentación interactiva de la API (Swagger): http://localhost:8001/docs

### 5. Detener el proyecto

```bash
docker compose down
```

Agregá `-v` si además querés borrar el volumen de la base de datos (`docker compose down -v`).

## Opción B — Levantando el proyecto sin clonar el repositorio

Si no tenés el repositorio y solo querés levantar las imágenes ya publicadas en el registry, alcanza con dos archivos: `docker-compose.registry.yml` y `.env.example`.

### 1. Descargar los archivos necesarios

```bash
curl -O https://raw.githubusercontent.com/juan-cabra1/ingsoft3-tp01/main/docker-compose.registry.yml
curl -O https://raw.githubusercontent.com/juan-cabra1/ingsoft3-tp01/main/.env.example
```

### 2. Configurar las variables de entorno

```bash
cp .env.example .env
```

Completá `.env` de la misma forma que en la Opción A (paso 2).

### 3. Levantar el proyecto

```bash
docker compose -f docker-compose.registry.yml up -d
```

### 4. Verificar y detener

Igual que en la Opción A (pasos 4 y 5), reemplazando el comando `down`/`ps` con `-f docker-compose.registry.yml` cuando corresponda:

```bash
docker compose -f docker-compose.registry.yml ps
docker compose -f docker-compose.registry.yml down
```
