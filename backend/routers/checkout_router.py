"""
Public checkout endpoint — unchanged contract for frontend compatibility.
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from models.checkout import CheckoutRequest, CheckoutResponse
from services.checkout_service import CheckoutService
from database import get_db

router = APIRouter(prefix="/checkout", tags=["checkout"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/generate-link", response_model=CheckoutResponse)
@limiter.limit("10/minute")
def generate_whatsapp_link(request: Request, checkout_data: CheckoutRequest, db: Session = Depends(get_db)):
    """Validate cart and generate WhatsApp checkout link. Rate limited: 10/minute per IP."""
    success, error_msg, result = CheckoutService.process_checkout(
        db, checkout_data.cart, checkout_data.customer
    )

    if not success:
        raise HTTPException(status_code=400, detail=error_msg)

    return CheckoutResponse(
        success=True,
        whatsapp_url=result["whatsapp_url"],
        order_id=result["order_id"],
        total=result["total"],
    )
