"""
Business metrics middleware — logs structured business events for analytics.
No external services needed: all data goes to stdout as JSON (captured by Railway).
"""

from logging_config import get_logger

logger = get_logger("metrics")


def log_checkout(order_id: str, customer_name: str, method: str, total: float, items: list):
    """Log a checkout event with business-relevant fields."""
    product_names = [f"{item['nombre']} x{item['quantity']}" for item in items]
    logger.info(
        f"CHECKOUT order={order_id} total=${total:.2f} method={method}",
        extra={
            "extra_data": {
                "event": "checkout",
                "order_id": order_id,
                "customer": customer_name,
                "delivery_method": method,
                "total": total,
                "item_count": len(items),
                "products": product_names,
            }
        },
    )


def log_product_view(product_id: int, product_name: str):
    """Log when a user views a product detail page."""
    logger.info(
        f"PRODUCT_VIEW id={product_id} name={product_name}",
        extra={
            "extra_data": {
                "event": "product_view",
                "product_id": product_id,
                "product_name": product_name,
            }
        },
    )


def log_admin_action(action: str, admin_user: str, product_id: int = None, details: str = ""):
    """Log admin panel actions (create, update, delete)."""
    logger.info(
        f"ADMIN action={action} user={admin_user} product_id={product_id} {details}",
        extra={
            "extra_data": {
                "event": "admin_action",
                "action": action,
                "admin_user": admin_user,
                "product_id": product_id,
                "details": details,
            }
        },
    )


def log_error_event(error_type: str, message: str, path: str = "", request_id: str = ""):
    """Log application errors as structured events."""
    logger.error(
        f"APP_ERROR type={error_type} path={path}: {message}",
        extra={
            "extra_data": {
                "event": "app_error",
                "error_type": error_type,
                "error_message": message,
                "path": path,
            },
            "request_id": request_id,
        },
    )
