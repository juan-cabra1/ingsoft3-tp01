"""
Checkout Pydantic schemas — no database persistence.
Used for cart validation and WhatsApp link generation.
"""

from pydantic import BaseModel, field_validator
from typing import Optional, List
from enum import Enum


class MetodoEntrega(str, Enum):
    ENVIO = "Envío"
    PUNTO_VENTA = "Punto de venta"


class CartItem(BaseModel):
    id: int
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("La cantidad debe ser mayor a 0")
        return v


class CustomerInfo(BaseModel):
    nombre: str
    telefono: str
    email: str
    metodo_entrega: MetodoEntrega
    direccion: Optional[str] = None
    provincia: Optional[str] = None
    ciudad: Optional[str] = None
    codigo_postal: Optional[str] = None

    @field_validator("nombre")
    @classmethod
    def nombre_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("El nombre es requerido")
        if len(v.strip()) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")
        return v.strip()

    @field_validator("telefono")
    @classmethod
    def telefono_valid(cls, v):
        if not v or not v.strip():
            raise ValueError("El teléfono es requerido")
        digits = v.strip().replace(" ", "").replace("-", "").replace("+", "")
        if not digits.isdigit():
            raise ValueError("El teléfono solo debe contener números")
        if len(digits) < 8 or len(digits) > 15:
            raise ValueError("El teléfono debe tener entre 8 y 15 dígitos")
        return v.strip()

    @field_validator("email")
    @classmethod
    def email_valid(cls, v):
        import re
        if not v or not v.strip():
            raise ValueError("El email es requerido")
        v = v.strip()
        pattern = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError("Ingresa un email válido")
        return v


class CheckoutRequest(BaseModel):
    cart: List[CartItem]
    customer: CustomerInfo

    @field_validator("cart")
    @classmethod
    def cart_not_empty(cls, v):
        if not v:
            raise ValueError("El carrito no puede estar vacío")
        return v


class CheckoutResponse(BaseModel):
    success: bool
    whatsapp_url: str
    order_id: str
    total: float
