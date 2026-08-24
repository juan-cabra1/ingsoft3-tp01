"""
Product service — business logic layer for products.
"""

from typing import Optional
from sqlalchemy.orm import Session

from models.product import Product, ProductCreate, ProductUpdate
from repositories.product_repository import ProductRepository


class ProductService:
    """Business logic for product operations."""

    @staticmethod
    def get_all_products(db: Session) -> list[Product]:
        """Get all available products."""
        return ProductRepository.get_all(db)

    @staticmethod
    def get_product(db: Session, product_id: int) -> Optional[Product]:
        """Get a specific product by ID."""
        return ProductRepository.get_by_id(db, product_id)

    @staticmethod
    def create_product(db: Session, product_data: ProductCreate) -> Product:
        """Create a new product."""
        return ProductRepository.create(db, product_data)

    @staticmethod
    def update_product(db: Session, product_id: int, product_data: ProductUpdate) -> Optional[Product]:
        """Update an existing product."""
        return ProductRepository.update(db, product_id, product_data)

    @staticmethod
    def delete_product(db: Session, product_id: int) -> bool:
        """Delete a product."""
        return ProductRepository.delete(db, product_id)

    @staticmethod
    def get_assigned_products(db: Session) -> list[Product]:
        """Get products assigned to a drop (for public catalog)."""
        return ProductRepository.get_assigned(db)

    @staticmethod
    def get_products_by_drop(db: Session, drop_id: int) -> list[Product]:
        return ProductRepository.get_by_drop(db, drop_id)

    @staticmethod
    def get_products_by_subcategoria(db: Session, subcategoria_id: int) -> list[Product]:
        return ProductRepository.get_by_subcategoria(db, subcategoria_id)

    @staticmethod
    def reorder_products(db: Session, ordered_ids: list[int]) -> None:
        ProductRepository.reorder(db, ordered_ids)
