"""
Admin user repository — database access layer for admin users.
"""

from typing import Optional
from sqlalchemy.orm import Session

from models.admin_user import AdminUserModel


class AdminUserRepository:
    """Data access layer for the admin_users table."""

    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[AdminUserModel]:
        """Find an admin user by username."""
        return (
            db.query(AdminUserModel)
            .filter(AdminUserModel.username == username)
            .first()
        )

    @staticmethod
    def create(db: Session, username: str, hashed_password: str) -> AdminUserModel:
        """Create a new admin user."""
        user = AdminUserModel(username=username, hashed_password=hashed_password)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def count(db: Session) -> int:
        """Count total admin users."""
        return db.query(AdminUserModel).count()
