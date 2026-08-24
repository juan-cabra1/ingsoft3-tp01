"""
Product repository — database access layer for products.
All queries use SQLAlchemy ORM.
"""

from typing import Optional
from sqlalchemy.orm import Session

from models.product import ProductModel, ProductCreate, ProductUpdate, Product


class ProductRepository:
    """Data access layer for the products table."""

    @staticmethod
    def get_all(db: Session) -> list[Product]:
        """Get all products ordered by display order."""
        rows = db.query(ProductModel).order_by(ProductModel.orden).all()
        return [Product.model_validate(row) for row in rows]

    @staticmethod
    def get_assigned(db: Session) -> list[Product]:
        """Get products that are assigned to a drop (for public catalog)."""
        rows = (
            db.query(ProductModel)
            .filter(ProductModel.drop_id.isnot(None))
            .order_by(ProductModel.orden)
            .all()
        )
        return [Product.model_validate(row) for row in rows]

    @staticmethod
    def get_unassigned(db: Session) -> list[Product]:
        """Get products not assigned to any drop (admin only)."""
        rows = (
            db.query(ProductModel)
            .filter(ProductModel.drop_id.is_(None))
            .order_by(ProductModel.orden)
            .all()
        )
        return [Product.model_validate(row) for row in rows]

    @staticmethod
    def get_by_drop(db: Session, drop_id: int) -> list[Product]:
        """Get all products belonging to a drop, ordered by display order."""
        rows = (
            db.query(ProductModel)
            .filter(ProductModel.drop_id == drop_id)
            .order_by(ProductModel.orden)
            .all()
        )
        return [Product.model_validate(row) for row in rows]

    @staticmethod
    def get_by_subcategoria(db: Session, subcategoria_id: int) -> list[Product]:
        """Get all products belonging to a subcategoria, ordered by display order."""
        rows = (
            db.query(ProductModel)
            .filter(ProductModel.subcategoria_id == subcategoria_id)
            .order_by(ProductModel.orden)
            .all()
        )
        return [Product.model_validate(row) for row in rows]

    @staticmethod
    def get_by_id(db: Session, product_id: int) -> Optional[Product]:
        """Get a single product by ID."""
        row = db.query(ProductModel).filter(ProductModel.id == product_id).first()
        if row:
            return Product.model_validate(row)
        return None

    @staticmethod
    def create(db: Session, product: ProductCreate) -> Product:
        """Create a new product."""
        db_product = ProductModel(**product.model_dump())
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return Product.model_validate(db_product)

    @staticmethod
    def update(db: Session, product_id: int, product: ProductUpdate) -> Optional[Product]:
        """Update an existing product with partial data."""
        db_product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
        if not db_product:
            return None

        update_data = product.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_product, key, value)

        db.commit()
        db.refresh(db_product)
        return Product.model_validate(db_product)

    @staticmethod
    def delete(db: Session, product_id: int) -> bool:
        """Delete a product by ID. Returns True if deleted."""
        db_product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
        if not db_product:
            return False
        db.delete(db_product)
        db.commit()
        return True

    @staticmethod
    def reorder(db: Session, ordered_ids: list[int]) -> None:
        """Set orden = index for each product in the given order."""
        for index, product_id in enumerate(ordered_ids):
            db.query(ProductModel).filter(ProductModel.id == product_id).update(
                {"orden": index}
            )
        db.commit()
