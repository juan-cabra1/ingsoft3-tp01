"""
Admin user SQLAlchemy model and Pydantic schemas.
"""

from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from pydantic import BaseModel

from database import Base


# ──────────────────── SQLAlchemy ORM Model ────────────────────

class AdminUserModel(Base):
    """Admin users table."""
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ──────────────────── Pydantic Schemas (API) ────────────────────

class AdminLogin(BaseModel):
    """Login request schema."""
    username: str
    password: str


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
