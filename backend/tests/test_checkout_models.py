"""Unit tests for the checkout Pydantic validators (models/checkout.py)."""
import pytest
from pydantic import ValidationError

from models.checkout import CartItem, CheckoutRequest, CustomerInfo, MetodoEntrega


def _customer(**overrides) -> CustomerInfo:
    data = {
        "nombre": "Juan Perez",
        "telefono": "1122334455",
        "email": "juan@example.com",
        "metodo_entrega": MetodoEntrega.PUNTO_VENTA,
    }
    data.update(overrides)
    return CustomerInfo(**data)


class TestCartItemQuantity:
    @pytest.mark.parametrize("cantidad", [0, -1, -100])
    def test_cantidad_no_positiva_es_rechazada(self, cantidad):
        with pytest.raises(ValidationError) as exc_info:
            CartItem(id=1, quantity=cantidad)

        assert "mayor a 0" in str(exc_info.value)

    def test_cantidad_positiva_es_aceptada(self):
        item = CartItem(id=1, quantity=3)

        assert item.quantity == 3


class TestCustomerInfoEmail:
    @pytest.mark.parametrize(
        "email_invalido",
        ["", "sin-arroba.com", "usuario@sin-dominio", "usuario@dominio."],
    )
    def test_email_invalido_es_rechazado(self, email_invalido):
        with pytest.raises(ValidationError) as exc_info:
            _customer(email=email_invalido)

        assert "email" in str(exc_info.value).lower()

    def test_email_valido_es_aceptado(self):
        customer = _customer(email="juan@example.com")

        assert customer.email == "juan@example.com"


class TestCustomerInfoNombre:
    def test_nombre_vacio_es_rechazado(self):
        with pytest.raises(ValidationError) as exc_info:
            _customer(nombre="   ")

        assert "nombre" in str(exc_info.value).lower()


class TestCustomerInfoTelefono:
    def test_telefono_con_letras_es_rechazado(self):
        with pytest.raises(ValidationError) as exc_info:
            _customer(telefono="abc123")

        assert "número" in str(exc_info.value).lower()

    def test_telefono_vacio_es_rechazado(self):
        with pytest.raises(ValidationError) as exc_info:
            _customer(telefono="")

        assert "requerido" in str(exc_info.value).lower()


class TestCheckoutRequestCart:
    def test_carrito_vacio_es_rechazado(self):
        with pytest.raises(ValidationError) as exc_info:
            CheckoutRequest(cart=[], customer=_customer())

        assert "vac" in str(exc_info.value).lower()
