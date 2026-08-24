"""
Auth dependency for protecting admin routes.
Validates JWT Bearer token and returns the current admin username.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from services.auth_service import decode_access_token

# Tells FastAPI where the login URL is (for OpenAPI docs "Authorize" button)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/admin/login")


def get_current_admin(token: str = Depends(oauth2_scheme)) -> str:
    """
    FastAPI dependency — extracts and validates JWT from Authorization header.
    Returns the admin username if valid, raises 401 if not.

    Usage in routers:
        @router.get("/admin/products")
        def list_products(admin: str = Depends(get_current_admin)):
            ...
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    username: str | None = payload.get("sub")
    if username is None:
        raise credentials_exception

    return username
