"""Unit tests for the Cache-Control decision (utils/cache_control.py)."""
import pytest

from utils.cache_control import calcular_cache_control


class TestCalcularCacheControl:
    @pytest.mark.parametrize("method", ["POST", "PUT", "DELETE", "PATCH"])
    def test_metodo_distinto_de_get_no_se_cachea(self, method):
        assert calcular_cache_control(method, "/products", 200) is None

    def test_respuesta_con_error_no_se_cachea(self):
        assert calcular_cache_control("GET", "/products", 404) is None

    def test_ruta_de_admin_no_se_cachea(self):
        assert calcular_cache_control("GET", "/admin/products", 200) is None

    @pytest.mark.parametrize("path", ["/products", "/products/5", "/drops", "/drops/verano"])
    def test_rutas_dinamicas_no_guardan_version_vieja(self, path):
        assert calcular_cache_control("GET", path, 200) == "no-store"

    def test_ruta_estatica_se_cachea_con_ttl_corto(self):
        resultado = calcular_cache_control("GET", "/health", 200)

        assert resultado == "public, max-age=120, stale-while-revalidate=300"
