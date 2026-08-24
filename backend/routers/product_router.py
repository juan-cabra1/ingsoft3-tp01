"""
Public product endpoints — unchanged contract for frontend compatibility.
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from models.product import Product
from services.product_service import ProductService
from database import get_db
from middleware.metrics import log_product_view

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=List[Product])
def get_all_products(db: Session = Depends(get_db)):
    """Get all products."""
    return ProductService.get_all_products(db)


@router.get("/{product_id}", response_model=Product)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a specific product by ID."""
    product = ProductService.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    log_product_view(product.id, product.nombre)
    return product
