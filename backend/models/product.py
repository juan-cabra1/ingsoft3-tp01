"""
Product SQLAlchemy model and Pydantic schemas.
"""

from sqlalchemy import Column, Integer, String, Numeric, JSON, Text, ForeignKey
from typing import Optional
from pydantic import BaseModel, field_validator
from decimal import Decimal

from database import Base


# ──────────────────── SQLAlchemy ORM Model ────────────────────

class ProductModel(Base):
    """Products table."""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(255), nullable=False)
    precio = Column(Numeric(10, 2), nullable=False)
    stock = Column(Integer, nullable=False, default=0)
    imagen_url = Column(String(500), nullable=True)
    imagenes = Column(JSON, default=list)
    descripcion = Column(Text, nullable=True)
    detalle = Column(Text, nullable=True)
    drop_id = Column(Integer, ForeignKey("drops.id", ondelete="SET NULL"), nullable=True)
    subcategoria_id = Column(Integer, ForeignKey("subcategorias.id", ondelete="SET NULL"), nullable=True)
    orden = Column(Integer, nullable=False, default=0)


# ──────────────────── Pydantic Schemas (API) ────────────────────

class ProductBase(BaseModel):
    nombre: str
    precio: float
    stock: int
    imagen_url: Optional[str] = None
    imagenes: list[str] = []
    descripcion: Optional[str] = None
    detalle: Optional[str] = None
    drop_id: Optional[int] = None
    subcategoria_id: Optional[int] = None
    orden: int = 0

    @field_validator('imagenes', mode='before')
    @classmethod
    def filter_null_images(cls, v: object) -> list[str]:
        if not v:
            return []
        return [item for item in v if item is not None]


class Product(ProductBase):
    """Response schema — includes ID."""
    id: int

    model_config = {"from_attributes": True}


class ProductCreate(ProductBase):
    """Request schema for creating a product."""
    pass


class ProductUpdate(BaseModel):
    """Request schema for partial update — all fields optional."""
    nombre: Optional[str] = None
    precio: Optional[float] = None
    stock: Optional[int] = None
    imagen_url: Optional[str] = None
    imagenes: Optional[list[str]] = None
    descripcion: Optional[str] = None
    detalle: Optional[str] = None
    drop_id: Optional[int] = None
    subcategoria_id: Optional[int] = None
    orden: Optional[int] = None

