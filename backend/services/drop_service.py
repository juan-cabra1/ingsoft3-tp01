"""
Drop service — business logic layer (thin wrapper over DropRepository).
"""

from typing import Optional
from sqlalchemy.orm import Session

from models.drop import Drop, DropCreate, DropUpdate, Subcategoria, SubcategoriaCreate, SubcategoriaUpdate
from repositories.drop_repository import DropRepository


class DropService:

    @staticmethod
    def get_all_drops(db: Session) -> list[Drop]:
        return DropRepository.get_all(db)

    @staticmethod
    def get_active_drops(db: Session) -> list[Drop]:
        return DropRepository.get_active(db)

    @staticmethod
    def get_drop_by_id(db: Session, drop_id: int) -> Optional[Drop]:
        return DropRepository.get_by_id(db, drop_id)

    @staticmethod
    def get_drop_by_slug(db: Session, slug: str) -> Optional[Drop]:
        return DropRepository.get_by_slug(db, slug)

    @staticmethod
    def create_drop(db: Session, drop: DropCreate) -> Drop:
        return DropRepository.create(db, drop)

    @staticmethod
    def update_drop(db: Session, drop_id: int, drop: DropUpdate) -> Optional[Drop]:
        return DropRepository.update(db, drop_id, drop)

    @staticmethod
    def delete_drop(db: Session, drop_id: int) -> bool:
        return DropRepository.delete(db, drop_id)

    @staticmethod
    def reorder_drops(db: Session, ordered_ids: list[int]) -> None:
        DropRepository.reorder(db, ordered_ids)

    @staticmethod
    def get_subcategorias(db: Session, drop_id: int) -> list[Subcategoria]:
        return DropRepository.get_subcategorias(db, drop_id)

    @staticmethod
    def create_subcategoria(
        db: Session, drop_id: int, sub: SubcategoriaCreate
    ) -> Subcategoria:
        return DropRepository.create_subcategoria(db, drop_id, sub)

    @staticmethod
    def update_subcategoria(
        db: Session, sub_id: int, sub: SubcategoriaUpdate
    ) -> Optional[Subcategoria]:
        return DropRepository.update_subcategoria(db, sub_id, sub)

    @staticmethod
    def delete_subcategoria(db: Session, sub_id: int) -> bool:
        return DropRepository.delete_subcategoria(db, sub_id)

    @staticmethod
    def reorder_subcategorias(
        db: Session, drop_id: int, ordered_ids: list[int]
    ) -> None:
        DropRepository.reorder_subcategorias(db, drop_id, ordered_ids)
