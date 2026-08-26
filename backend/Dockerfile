# Etapa 1 build (imagen)
FROM python:3.13-slim AS build
WORKDIR /src

# Solo el archivo de dependencias primero, capa cacheable
# Se rehace si cambia el requirements, no con cada cambio del codigo
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Etapa 2 runtime (imagen minima)
FROM python:3.13-slim AS final
WORKDIR /app
COPY --from=build /root/.local /root/.local
COPY . .

ENV PATH=/root/.local/bin:$PATH
EXPOSE 8000
ENTRYPOINT ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]