"""Unit tests for the admin-route JWT guard (dependencies/auth.py)."""
import pytest
from fastapi import HTTPException

from dependencies.auth import get_current_admin
from services.auth_service import create_access_token


class TestGetCurrentAdmin:
    def test_token_valido_devuelve_el_username(self):
        token = create_access_token({"sub": "admin"})

        username = get_current_admin(token)

        assert username == "admin"

    def test_token_invalido_lanza_401(self):
        with pytest.raises(HTTPException) as exc_info:
            get_current_admin("token-que-no-existe")

        assert exc_info.value.status_code == 401

    def test_token_sin_sub_lanza_401(self):
        token = create_access_token({"otro_campo": "admin"})

        with pytest.raises(HTTPException) as exc_info:
            get_current_admin(token)

        assert exc_info.value.status_code == 401
