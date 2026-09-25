"""Unit tests for JWT and password hashing logic (services/auth_service.py)."""
from datetime import timedelta

from services.auth_service import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


class TestPasswordHashing:
    def test_hash_password_no_guarda_el_password_en_texto_plano(self):
        hashed = hash_password("miPassword123")

        assert hashed != "miPassword123"

    def test_verify_password_con_password_correcta_es_true(self):
        hashed = hash_password("miPassword123")

        assert verify_password("miPassword123", hashed) is True

    def test_verify_password_con_password_incorrecta_es_false(self):
        hashed = hash_password("miPassword123")

        assert verify_password("otraPassword", hashed) is False


class TestAccessToken:
    def test_create_and_decode_token_roundtrip(self):
        token = create_access_token({"sub": "admin"})

        payload = decode_access_token(token)

        assert payload["sub"] == "admin"

    def test_decode_access_token_invalido_retorna_none(self):
        payload = decode_access_token("esto-no-es-un-jwt-valido")

        assert payload is None

    def test_decode_access_token_expirado_retorna_none(self):
        token = create_access_token({"sub": "admin"}, expires_delta=timedelta(seconds=-1))

        payload = decode_access_token(token)

        assert payload is None
