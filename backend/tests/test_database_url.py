"""Unit tests for the database URL normalization (utils/database_url.py)."""
import pytest

from utils.database_url import normalize_database_url


class TestNormalizeDatabaseUrl:
    @pytest.mark.parametrize("scheme", ["postgres", "postgresql"])
    def test_esquemas_genericos_usan_el_driver_psycopg(self, scheme):
        url = f"{scheme}://user:pass@host/db"
        assert normalize_database_url(url) == "postgresql+psycopg://user:pass@host/db"

    def test_url_ya_normalizada_queda_igual(self):
        url = "postgresql+psycopg://user:pass@host:5432/db"
        assert normalize_database_url(url) == url

    def test_conserva_los_parametros_de_neon(self):
        url = "postgresql://user:pass@host/db?sslmode=require&channel_binding=require"
        assert normalize_database_url(url) == (
            "postgresql+psycopg://user:pass@host/db?sslmode=require&channel_binding=require"
        )

    def test_solo_reemplaza_el_esquema_del_principio(self):
        url = "postgresql://user:postgresql://@host/db"
        assert normalize_database_url(url).count("postgresql+psycopg://") == 1

    def test_otro_driver_explicito_no_se_toca(self):
        url = "postgresql+asyncpg://user:pass@host/db"
        assert normalize_database_url(url) == url
