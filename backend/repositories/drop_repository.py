"""
Drop and Subcategoria repository — database access layer.
All queries use SQLAlchemy ORM.
"""

from typing import Optional
from sqlalchemy.orm import Session

from models.drop import (
    DropModel,
    SubcategoriaModel,
    Drop,
    DropCreate,
    DropUpdate,
    Subcategoria,
    SubcategoriaCreate,
    SubcategoriaUpdate,
    slugify,
)


class DropRepository:
    """Data access layer for drops and subcategorias tables."""

    # ──────────────────── Drops ────────────────────

    @staticmethod
    def get_all(db: Session) -> list[Drop]:
        """Get all drops ordered by display order."""
        rows = db.query(DropModel).order_by(DropModel.orden).all()
        return [Drop.model_validate(row) for row in rows]

    @staticmethod
    def get_active(db: Session) -> list[Drop]:
        """Get all active drops ordered by display order."""
        rows = (
            db.query(DropModel)
            .filter(DropModel.activo == True)  # noqa: E712
            .order_by(DropModel.orden)
            .all()
        )
        return [Drop.model_validate(row) for row in rows]

    @staticmethod
    def get_by_id(db: Session, drop_id: int) -> Optional[Drop]:
        row = db.query(DropModel).filter(DropModel.id == drop_id).first()
        return Drop.model_validate(row) if row else None

    @staticmethod
    def get_by_slug(db: Session, slug: str) -> Optional[Drop]:
        row = db.query(DropModel).filter(DropModel.slug == slug).first()
        return Drop.model_validate(row) if row else None

    @staticmethod
    def slug_exists(db: Session, slug: str, exclude_id: Optional[int] = None) -> bool:
        q = db.query(DropModel).filter(DropModel.slug == slug)
        if exclude_id is not None:
            q = q.filter(DropModel.id != exclude_id)
        return q.first() is not None

    @staticmethod
    def create(db: Session, drop: DropCreate) -> Drop:
        slug = slugify(drop.nombre)
        # Ensure unique slug by appending a counter if needed
        base_slug = slug
        counter = 2
        while db.query(DropModel).filter(DropModel.slug == slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        max_orden = db.query(DropModel).count()
        db_drop = DropModel(
            nombre=drop.nombre,
            slug=slug,
            imagen_url=drop.imagen_url,
            activo=drop.activo,
            orden=max_orden,
        )
        db.add(db_drop)
        db.commit()
        db.refresh(db_drop)
        return Drop.model_validate(db_drop)

    @staticmethod
    def update(db: Session, drop_id: int, drop: DropUpdate) -> Optional[Drop]:
        db_drop = db.query(DropModel).filter(DropModel.id == drop_id).first()
        if not db_drop:
            return None
        update_data = drop.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_drop, key, value)
        db.commit()
        db.refresh(db_drop)
        return Drop.model_validate(db_drop)

    @staticmethod
    def delete(db: Session, drop_id: int) -> bool:
        db_drop = db.query(DropModel).filter(DropModel.id == drop_id).first()
        if not db_drop:
            return False
        db.delete(db_drop)
        db.commit()
        return True

    @staticmethod
    def reorder(db: Session, ordered_ids: list[int]) -> None:
        """Set orden = index for each drop in the given order."""
        for index, drop_id in enumerate(ordered_ids):
            db.query(DropModel).filter(DropModel.id == drop_id).update({"orden": index})
        db.commit()

    # ──────────────────── Subcategorias ────────────────────

    @staticmethod
    def get_subcategoria_by_slug(
        db: Session, drop_id: int, slug: str
    ) -> Optional[Subcategoria]:
        """Get a single subcategoria by its slug within a drop."""
        row = (
            db.query(SubcategoriaModel)
            .filter(
                SubcategoriaModel.drop_id == drop_id,
                SubcategoriaModel.slug == slug,
            )
            .first()
        )
        return Subcategoria.model_validate(row) if row else None

    @staticmethod
    def get_subcategorias(db: Session, drop_id: int) -> list[Subcategoria]:
        rows = (
            db.query(SubcategoriaModel)
            .filter(SubcategoriaModel.drop_id == drop_id)
            .order_by(SubcategoriaModel.orden)
            .all()
        )
        return [Subcategoria.model_validate(row) for row in rows]

    @staticmethod
    def create_subcategoria(
        db: Session, drop_id: int, sub: SubcategoriaCreate
    ) -> Subcategoria:
        slug = slugify(sub.nombre)
        # Ensure slug uniqueness within drop
        base_slug = slug
        counter = 2
        while (
            db.query(SubcategoriaModel)
            .filter(SubcategoriaModel.drop_id == drop_id, SubcategoriaModel.slug == slug)
            .first()
        ):
            slug = f"{base_slug}-{counter}"
            counter += 1

        max_orden = (
            db.query(SubcategoriaModel)
            .filter(SubcategoriaModel.drop_id == drop_id)
            .count()
        )
        db_sub = SubcategoriaModel(
            drop_id=drop_id,
            nombre=sub.nombre,
            slug=slug,
            imagen_url=sub.imagen_url,
            orden=max_orden,
        )
        db.add(db_sub)
        db.commit()
        db.refresh(db_sub)
        return Subcategoria.model_validate(db_sub)

    @staticmethod
    def update_subcategoria(
        db: Session, sub_id: int, sub: SubcategoriaUpdate
    ) -> Optional[Subcategoria]:
        db_sub = db.query(SubcategoriaModel).filter(SubcategoriaModel.id == sub_id).first()
        if not db_sub:
            return None
        update_data = sub.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_sub, key, value)
        db.commit()
        db.refresh(db_sub)
        return Subcategoria.model_validate(db_sub)

    @staticmethod
    def delete_subcategoria(db: Session, sub_id: int) -> bool:
        db_sub = db.query(SubcategoriaModel).filter(SubcategoriaModel.id == sub_id).first()
        if not db_sub:
            return False
        db.delete(db_sub)
        db.commit()
        return True

    @staticmethod
    def reorder_subcategorias(
        db: Session, drop_id: int, ordered_ids: list[int]
    ) -> None:
        """Set orden = index for each subcategoria in the given order."""
        for index, sub_id in enumerate(ordered_ids):
            db.query(SubcategoriaModel).filter(
                SubcategoriaModel.id == sub_id,
                SubcategoriaModel.drop_id == drop_id,
            ).update({"orden": index})
        db.commit()
