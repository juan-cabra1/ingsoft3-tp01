"""
Bako Lifestyle Store — FastAPI Application.
Uses lifespan for DB initialization and admin user seeding.
"""

from contextlib import asynccontextmanager
import os
import time as _time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config import get_settings
from database import Base, engine, SessionLocal
from models.product import ProductModel
from models.admin_user import AdminUserModel
from models.drop import DropModel, SubcategoriaModel  # noqa: F401 — register with Base metadata
from services.auth_service import hash_password
from repositories.admin_user_repository import AdminUserRepository
from routers import product_router, checkout_router, admin_router, auth_router, debug_router
from routers.drop_router import router as drop_router
from logging_config import setup_logging, get_logger
from middleware.request_tracing import RequestTracingMiddleware
from middleware.security_headers import SecurityHeadersMiddleware
from middleware.metrics import log_error_event
from sqlalchemy import text

settings = get_settings()

if settings.SENTRY_DSN:
    import sentry_sdk  # noqa: PLC0415
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=0.1,
        profiles_sample_rate=0.1,
    )

# Initialize structured logging
setup_logging()
logger = get_logger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup: create tables and seed admin user if needed.
    Shutdown: cleanup.
    """
    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Auto-migrate
    from utils.db_setup import run_migrations
    run_migrations(engine)

    # Sync admin user from .env — creates or updates credentials on every startup
    db = SessionLocal()
    try:
        existing_admin = AdminUserRepository.get_by_username(db, settings.ADMIN_DEFAULT_USERNAME)
        if existing_admin is None:
            # Create admin user (first run or username changed)
            hashed = hash_password(settings.ADMIN_DEFAULT_PASSWORD)
            AdminUserRepository.create(db, settings.ADMIN_DEFAULT_USERNAME, hashed)
            logger.info(f"Admin user '{settings.ADMIN_DEFAULT_USERNAME}' created.")
        else:
            # Update password from .env if it changed
            from services.auth_service import verify_password as _verify
            if not _verify(settings.ADMIN_DEFAULT_PASSWORD, existing_admin.hashed_password):
                existing_admin.hashed_password = hash_password(settings.ADMIN_DEFAULT_PASSWORD)
                db.commit()
                logger.info("Admin password updated from .env.")
            else:
                logger.info("Admin user up to date.")

        # Seed products if empty
        from services.seed_service import seed_products
        seed_products(db)

    finally:
        db.close()

    yield  # App runs here

    # Shutdown cleanup (if needed)


# Ensure uploads directory exists
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads", "products")
os.makedirs(UPLOADS_DIR, exist_ok=True)


# Rate limiter — prevents brute force on login and spam on checkout
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Bako Lifestyle Store API",
    description="API para tienda de gorras con checkout por WhatsApp",
    version="2.1.0",
    lifespan=lifespan,
)

_start_time = _time.time()

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Middlewares (order matters: last added = outermost = runs first)
# 1. CORS — must be outermost
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)
# 2. Security headers
app.add_middleware(SecurityHeadersMiddleware)
# 3. Request tracing (logs + correlation IDs)
app.add_middleware(RequestTracingMiddleware)


_DYNAMIC_PREFIXES = ("/products", "/drops")

@app.middleware("http")
async def cache_control_middleware(request: Request, call_next):
    response = await call_next(request)
    if (
        request.method == "GET"
        and not request.url.path.startswith("/admin")
        and response.status_code == 200
    ):
        if any(request.url.path.startswith(p) for p in _DYNAMIC_PREFIXES):
            # Products and drops change via admin CRUD — never let the browser
            # serve a stale version; the frontend Map handles short-term dedup.
            response.headers["Cache-Control"] = "no-store"
        else:
            response.headers["Cache-Control"] = "public, max-age=120, stale-while-revalidate=300"
    return response


# Global exception handler — catches unhandled errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = request.headers.get("X-Request-ID", "unknown")
    log_error_event(
        error_type=type(exc).__name__,
        message=str(exc),
        path=str(request.url.path),
        request_id=request_id,
    )
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor"},
        headers={"X-Request-ID": request_id},
    )


# Include routers
app.include_router(product_router)
app.include_router(drop_router)
app.include_router(checkout_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(debug_router)

# Serve uploaded images as static files
app.mount("/uploads", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "uploads")), name="uploads")

logger.info("Bako Lifestyle Store API started.")


@app.get("/")
def root():
    return {"message": "Bako Lifestyle Store API", "version": "2.1.0", "docs": "/docs"}


@app.get("/health")
def health_check():
    """Health check with DB connectivity and uptime."""
    db_ok = False
    db = None
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass
    finally:
        if db:
            db.close()

    uptime_seconds = round(_time.time() - _start_time)
    status = "healthy" if db_ok else "degraded"

    return {
        "status": status,
        "version": "2.1.0",
        "uptime_seconds": uptime_seconds,
        "database": "connected" if db_ok else "unreachable",
    }
