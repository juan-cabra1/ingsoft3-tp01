"""Unit tests for CheckoutService (services/checkout_service.py).

validate_cart talks to the database through ProductRepository, so it is
isolated here with a mock instead of hitting a real database — the doble
replaces ProductRepository.get_by_id where CheckoutService imports it.
"""
from unittest.mock import patch

from models.checkout import CartItem
from models.product import Product
from services.checkout_service import CheckoutService


def _product(**overrides) -> Product:
    data = {
        "id": 1,
        "nombre": "Remera",
        "precio": 1000.0,
        "stock": 5,
        "orden": 0,
        "drop_id": None,
        "subcategoria_id": None,
        "imagen_url": None,
    }
    data.update(overrides)
    return Product(**data)


class TestValidateCart:
    @patch("services.checkout_service.ProductRepository.get_by_id")
    def test_stock_insuficiente_rechaza_el_carrito(self, mock_get_by_id):
        # Arrange: el doble contesta un producto con menos stock del pedido
        mock_get_by_id.return_value = _product(stock=2)
        cart = [CartItem(id=1, quantity=5)]

        # Act
        is_valid, error, items = CheckoutService.validate_cart(db=None, cart=cart)

        # Assert
        assert is_valid is False
        assert "Stock insuficiente" in error
        assert items == []

    @patch("services.checkout_service.ProductRepository.get_by_id")
    def test_producto_inexistente_rechaza_el_carrito(self, mock_get_by_id):
        mock_get_by_id.return_value = None
        cart = [CartItem(id=999, quantity=1)]

        is_valid, error, items = CheckoutService.validate_cart(db=None, cart=cart)

        assert is_valid is False
        assert "no encontrado" in error

    @patch("services.checkout_service.ProductRepository.get_by_id")
    def test_stock_suficiente_acepta_el_carrito_y_calcula_el_subtotal(self, mock_get_by_id):
        mock_get_by_id.return_value = _product(precio=1000.0, stock=10)
        cart = [CartItem(id=1, quantity=3)]

        is_valid, error, items = CheckoutService.validate_cart(db=None, cart=cart)

        assert is_valid is True
        assert error == ""
        assert items[0]["subtotal"] == 3000.0
        # Verifica la INTERACCIÓN: que se le haya pedido el producto correcto
        mock_get_by_id.assert_called_once_with(None, 1)


class TestCalculateTotal:
    def test_suma_los_subtotales_de_todos_los_items(self):
        items = [{"subtotal": 1000.0}, {"subtotal": 2500.0}]

        total = CheckoutService.calculate_total(items)

        assert total == 3500.0

    def test_carrito_vacio_da_total_cero(self):
        assert CheckoutService.calculate_total([]) == 0
