"""
Database engine and session configuration using SQLAlchemy.
Provides get_db() dependency for FastAPI route injection.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from typing import Generator

from config import get_settings
from utils.database_url import normalize_database_url

settings = get_settings()

# Providers (Neon, Render...) hand out postgresql:// — name the psycopg 3 driver
db_url = normalize_database_url(settings.DATABASE_URL)

# Create engine — pool_pre_ping keeps connections alive (Neon suspends idle compute)
engine = create_engine(
    db_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=False,
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all ORM models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a database session.
    Usage: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
