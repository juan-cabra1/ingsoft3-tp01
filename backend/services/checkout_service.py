"""
Checkout service — cart validation and WhatsApp link generation.
No database persistence for orders.
"""

from typing import List, Tuple
from urllib.parse import quote
from datetime import datetime
import uuid

from sqlalchemy.orm import Session

from repositories.product_repository import ProductRepository
from models.checkout import CartItem, CustomerInfo, MetodoEntrega
from config import get_settings

settings = get_settings()


class CheckoutService:
    """Business logic for checkout and WhatsApp link generation."""

    @staticmethod
    def validate_cart(db: Session, cart: List[CartItem]) -> Tuple[bool, str, List[dict]]:
        """
        Validate cart items against current stock and prices.
        Returns: (is_valid, error_message, validated_items_with_details)
        """
        validated_items = []

        for item in cart:
            product = ProductRepository.get_by_id(db, item.id)
            if not product:
                return False, f"Producto con ID {item.id} no encontrado", []

            if product.stock < item.quantity:
                return False, f"Stock insuficiente para {product.nombre}. Disponible: {product.stock}", []

            validated_items.append({
                "id": product.id,
                "nombre": product.nombre,
                "precio": product.precio,
                "quantity": item.quantity,
                "subtotal": product.precio * item.quantity,
            })

        return True, "", validated_items

    @staticmethod
    def calculate_total(validated_items: List[dict]) -> float:
        """Calculate total from validated items."""
        return sum(item["subtotal"] for item in validated_items)

    @staticmethod
    def generate_order_id() -> str:
        """Generate a short unique order ID."""
        return str(uuid.uuid4())[:8].upper()

    @staticmethod
    def build_whatsapp_message(
        order_id: str,
        customer: CustomerInfo,
        validated_items: List[dict],
        total: float,
    ) -> str:
        """Build the WhatsApp message string."""
        date_str = datetime.now().strftime("%d/%m/%Y")

        products_lines = []
        for item in validated_items:
            products_lines.append(f"- {item['nombre']} x{item['quantity']}: ${item['subtotal']:.2f}")
        products_str = "\n".join(products_lines)

        direccion_line = ""
        if customer.metodo_entrega == MetodoEntrega.ENVIO and customer.direccion:
            direccion_line = f"direccion: {customer.direccion}\n"
            if customer.ciudad:
                direccion_line += f"ciudad: {customer.ciudad}\n"
            if customer.provincia:
                direccion_line += f"provincia: {customer.provincia}\n"
            if customer.codigo_postal:
                direccion_line += f"codigo postal: {customer.codigo_postal}\n"

        message = f"""Hola te paso el resumen de mi lista:
pedido: {order_id}
fecha: {date_str}
nombre: {customer.nombre}
telefono: {customer.telefono}
mail: {customer.email}
entrega: {customer.metodo_entrega.value}
{direccion_line}
productos:
{products_str}

total: ${total:.2f}"""

        return message

    @staticmethod
    def generate_whatsapp_url(message: str) -> str:
        """Generate the WhatsApp URL with the encoded message."""
        encoded_message = quote(message)
        return f"https://wa.me/{settings.WHATSAPP_NUMBER}?text={encoded_message}"

    @classmethod
    def process_checkout(
        cls, db: Session, cart: List[CartItem], customer: CustomerInfo
    ) -> Tuple[bool, str, dict]:
        """
        Process the complete checkout flow.
        Returns: (success, error_message, result_data)
        """
        from middleware.metrics import log_checkout, log_error_event

        # Validate cart
        is_valid, error_msg, validated_items = cls.validate_cart(db, cart)
        if not is_valid:
            log_error_event("checkout_validation", error_msg, "/checkout")
            return False, error_msg, {}

        # Validate address for delivery
        if customer.metodo_entrega == MetodoEntrega.ENVIO and not customer.direccion:
            log_error_event("checkout_validation", "Dirección requerida para envíos", "/checkout")
            return False, "La dirección es requerida para envíos", {}

        # Calculate total
        total = cls.calculate_total(validated_items)

        # Generate order ID
        order_id = cls.generate_order_id()

        # Build message and URL
        message = cls.build_whatsapp_message(order_id, customer, validated_items, total)
        whatsapp_url = cls.generate_whatsapp_url(message)

        # Log business metric
        log_checkout(
            order_id=order_id,
            customer_name=customer.nombre,
            method=customer.metodo_entrega.value,
            total=total,
            items=[{"nombre": item["nombre"], "quantity": item["quantity"]} for item in validated_items],
        )

        return True, "", {
            "order_id": order_id,
            "total": total,
            "whatsapp_url": whatsapp_url,
        }

    @staticmethod
    def calcular_tiempo_estimado_entrega(
        provincia: str, metodo_entrega: str, stock_disponible: int
    ) -> int:
        """
        Estima dias habiles de entrega segun destino, metodo y stock.
        Devuelve 0 para retiro en punto de venta, -1 si no hay stock.
        (Tiene varios caminos adentro y -a proposito- ni un solo test.)
        """
        if metodo_entrega == "Punto de venta":
            return 0

        if stock_disponible <= 0:
            return -1

        if provincia in ("CABA", "Buenos Aires"):
            base = 2
        elif provincia in ("Córdoba", "Santa Fe", "Mendoza"):
            base = 4
        else:
            base = 7

        if stock_disponible < 3:
            base += 2
        elif stock_disponible < 10:
            base += 1

        return base

    @staticmethod
    def calcular_costo_envio_estimado(
        provincia: str, metodo_entrega: str, total: float
    ) -> float:
        """
        Calcula el costo de envio estimado segun destino y monto de compra.
        Retiro en punto de venta y compras que superan el minimo son gratis.
        (Idem el metodo de arriba: ni un solo test.)
        """
        if metodo_entrega == "Punto de venta":
            return 0.0

        if total >= 50000:
            return 0.0

        if provincia in ("CABA", "Buenos Aires"):
            costo_base = 1500.0
        elif provincia in ("Córdoba", "Santa Fe", "Mendoza"):
            costo_base = 2500.0
        else:
            costo_base = 4000.0

        if total < 5000:
            return costo_base * 1.5
        if total < 15000:
            return costo_base * 1.2

        return costo_base

    @staticmethod
    def clasificar_urgencia_pedido(dias_estimados: int, cantidad_items: int) -> str:
        """
        Clasifica un pedido segun cuanto va a tardar y cuantos items tiene,
        para priorizar la cola de preparacion. (Tampoco tiene tests.)
        """
        if dias_estimados < 0:
            return "sin-stock"
        if dias_estimados == 0:
            return "retiro-inmediato"
        if cantidad_items >= 10 and dias_estimados <= 2:
            return "critico"
        if dias_estimados <= 2:
            return "prioritario"
        if dias_estimados <= 5:
            return "moderado"
        if dias_estimados <= 10:
            return "normal"
        return "sin-apuro"

    @staticmethod
    def sugerir_metodo_pago(total: float, es_cliente_frecuente: bool, metodo_entrega: str) -> list[str]:
        """
        Sugiere los metodos de pago disponibles segun el monto, si el
        cliente es frecuente y como retira. (Tampoco tiene tests.)
        """
        metodos: list[str] = []

        if total <= 0:
            return metodos

        metodos.append("efectivo")

        if total >= 5000:
            metodos.append("transferencia")

        if metodo_entrega == "Punto de venta":
            metodos.append("tarjeta_debito")
            if total >= 10000:
                metodos.append("tarjeta_credito")

        if es_cliente_frecuente:
            if total >= 20000:
                metodos.append("cuenta_corriente")
            else:
                metodos.append("descuento_fidelidad")

        if total >= 100000:
            metodos.append("financiacion_bancaria")

        return metodos
