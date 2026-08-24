"""
Auth router — JWT login endpoint for admin panel.
"""

from fastapi import APIRouter, HTTPException, Depends, Request, status
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from models.admin_user import AdminLogin, TokenResponse
from repositories.admin_user_repository import AdminUserRepository
from services.auth_service import verify_password, create_access_token
from database import get_db

router = APIRouter(prefix="/admin", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def admin_login(request: Request, login_data: AdminLogin, db: Session = Depends(get_db)):
    """
    Authenticate admin and return a JWT access token.
    Frontend sends { username, password } → receives { access_token, token_type }.
    Rate limited: 5 attempts per minute per IP.
    """
    # Find user
    user = AdminUserRepository.get_by_username(db, login_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    # Verify password
    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    # Create JWT
    access_token = create_access_token(data={"sub": user.username})

    return TokenResponse(access_token=access_token)
