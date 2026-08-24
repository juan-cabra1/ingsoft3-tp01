"""
Public drop endpoints — no authentication required.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from models.drop import Drop, Subcategoria
from models.product import Product, ProductModel
from services.drop_service import DropService
from services.product_service import ProductService
from repositories.drop_repository import DropRepository
from database import get_db

router = APIRouter(prefix="/drops", tags=["drops"])


class DropWithCounts(BaseModel):
    """Drop schema enriched with product count per subcategoria."""
    id: int
    nombre: str
    slug: str
    imagen_url: Optional[str] = None
    orden: int
    activo: bool
    subcategorias: list[Subcategoria] = []
    product_count: int = 0

    model_config = {"from_attributes": True}


@router.get("", response_model=list[DropWithCounts])
def get_drops(db: Session = Depends(get_db)):
    """Get all active drops with subcategories and product counts."""
    drops = DropService.get_active_drops(db)
    if not drops:
        return []

    # Single COUNT + GROUP BY instead of one query per drop
    drop_ids = [d.id for d in drops]
    count_rows = (
        db.query(ProductModel.drop_id, func.count(ProductModel.id).label("cnt"))
        .filter(ProductModel.drop_id.in_(drop_ids))
        .group_by(ProductModel.drop_id)
        .all()
    )
    count_map = {row.drop_id: row.cnt for row in count_rows}
    return [
        DropWithCounts(**d.model_dump(), product_count=count_map.get(d.id, 0))
        for d in drops
    ]


@router.get("/{slug}", response_model=DropWithCounts)
def get_drop(slug: str, db: Session = Depends(get_db)):
    """Get a single drop by slug with its subcategories."""
    drop = DropService.get_drop_by_slug(db, slug)
    if not drop:
        raise HTTPException(status_code=404, detail="Drop no encontrado")
    count = (
        db.query(func.count(ProductModel.id))
        .filter(ProductModel.drop_id == drop.id)
        .scalar()
    ) or 0
    return DropWithCounts(**drop.model_dump(), product_count=count)


@router.get("/{slug}/products", response_model=list[Product])
def get_drop_products(
    slug: str,
    subcategoria: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get products in a drop. Optionally filter by subcategoria slug."""
    drop = DropService.get_drop_by_slug(db, slug)
    if not drop:
        raise HTTPException(status_code=404, detail="Drop no encontrado")

    if subcategoria:
        sub = DropRepository.get_subcategoria_by_slug(db, drop.id, subcategoria)
        if not sub:
            raise HTTPException(status_code=404, detail="Subcategoría no encontrada")
        return ProductService.get_products_by_subcategoria(db, sub.id)

    return ProductService.get_products_by_drop(db, drop.id)


@router.get("/{slug}/{sub_slug}/products", response_model=list[Product])
def get_subcategoria_products(
    slug: str,
    sub_slug: str,
    db: Session = Depends(get_db),
):
    """Get products in a specific subcategoria."""
    drop = DropService.get_drop_by_slug(db, slug)
    if not drop:
        raise HTTPException(status_code=404, detail="Drop no encontrado")

    sub = DropRepository.get_subcategoria_by_slug(db, drop.id, sub_slug)
    if not sub:
        raise HTTPException(status_code=404, detail="Subcategoría no encontrada")

    return ProductService.get_products_by_subcategoria(db, sub.id)
