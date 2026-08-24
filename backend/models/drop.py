"""
Drop and Subcategoria SQLAlchemy models and Pydantic schemas.
"""

import re
from typing import Optional
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from pydantic import BaseModel

from database import Base


# ──────────────────── SQLAlchemy ORM Models ────────────────────

class SubcategoriaModel(Base):
    """Subcategorias table — optional grouping within a drop."""
    __tablename__ = "subcategorias"

    id = Column(Integer, primary_key=True, autoincrement=True)
    drop_id = Column(Integer, ForeignKey("drops.id", ondelete="CASCADE"), nullable=False)
    nombre = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False)
    imagen_url = Column(String(500), nullable=True)
    orden = Column(Integer, nullable=False, default=0)

    drop = relationship("DropModel", back_populates="subcategorias")


class DropModel(Base):
    """Drops table — a named product launch/collection."""
    __tablename__ = "drops"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True)
    imagen_url = Column(String(500), nullable=True)
    orden = Column(Integer, nullable=False, default=0)
    activo = Column(Boolean, nullable=False, default=True)

    subcategorias = relationship(
        "SubcategoriaModel",
        back_populates="drop",
        cascade="all, delete-orphan",
        order_by=SubcategoriaModel.orden,
    )


# ──────────────────── Helpers ────────────────────

def slugify(text: str) -> str:
    """Convert a name to a URL-safe slug."""
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


# ──────────────────── Pydantic Schemas ────────────────────

class SubcategoriaBase(BaseModel):
    nombre: str
    imagen_url: Optional[str] = None


class Subcategoria(SubcategoriaBase):
    id: int
    drop_id: int
    slug: str
    orden: int

    model_config = {"from_attributes": True}


class SubcategoriaCreate(SubcategoriaBase):
    pass


class SubcategoriaUpdate(BaseModel):
    nombre: Optional[str] = None
    imagen_url: Optional[str] = None


class DropBase(BaseModel):
    nombre: str
    imagen_url: Optional[str] = None
    activo: bool = True


class Drop(DropBase):
    id: int
    slug: str
    orden: int
    subcategorias: list[Subcategoria] = []

    model_config = {"from_attributes": True}


class DropCreate(DropBase):
    pass


class DropUpdate(BaseModel):
    nombre: Optional[str] = None
    imagen_url: Optional[str] = None
    activo: Optional[bool] = None


class ReorderRequest(BaseModel):
    ordered_ids: list[int]
