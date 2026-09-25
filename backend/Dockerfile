# Etapa 1 build (imagen)
FROM python:3.13-slim AS build
WORKDIR /src

# Solo el archivo de dependencias primero, capa cacheable
# Se rehace si cambia el requirements, no con cada cambio del codigo
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ---- Etapa 2: tests (parte del build, con las deps de test encima) ----
FROM build AS test
COPY requirements-dev.txt .
RUN pip install --no-cache-dir --user -r requirements-dev.txt
COPY . .
ENTRYPOINT ["python", "-m", "pytest", "--cov=.", "--cov-report=term-missing", \
            "--cov-report=xml:/out/coverage.xml", "--cov-report=html:/out/htmlcov", \
            "--cov-report=json:/out/coverage.json"]

# Etapa 3 runtime (imagen minima)
FROM python:3.13-slim AS final
WORKDIR /app
COPY --from=build /root/.local /root/.local
COPY . .

ENV PATH=/root/.local/bin:$PATH
EXPOSE 8000
ENTRYPOINT ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]