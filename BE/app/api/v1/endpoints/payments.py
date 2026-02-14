"""Payment API endpoints — Razorpay order creation, verification, and history."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.services.auth_service import decode_access_token
from app.services.payment_service import PaymentService
from app.schemas.payment import (
    CreateOrderRequest,
    VerifyPaymentRequest,
    OrderResponse,
    VerifyPaymentResponse,
    PaymentHistoryResponse,
)

import logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])


# ── Auth dependency (same pattern as other endpoints) ──

async def _get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    """Extract user_id from JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return int(payload.get("sub", 0))


def _get_service(db: AsyncSession = Depends(get_db)) -> PaymentService:
    return PaymentService(db)


# ── Endpoints ──

@router.post("/create-order", response_model=OrderResponse)
async def create_payment_order(
    body: CreateOrderRequest,
    user_id: int = Depends(_get_current_user_id),
    service: PaymentService = Depends(_get_service),
):
    """
    Create a Razorpay order for a paid course.
    Returns order_id, amount, key_id for the frontend Checkout popup.
    """
    try:
        result = await service.create_order(user_id, body.course_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return OrderResponse(**result)


@router.post("/verify", response_model=VerifyPaymentResponse)
async def verify_payment(
    body: VerifyPaymentRequest,
    user_id: int = Depends(_get_current_user_id),
    service: PaymentService = Depends(_get_service),
):
    """
    Verify Razorpay payment signature, mark payment completed, create enrollment.
    Called by frontend after Razorpay Checkout success callback.
    """
    try:
        result = await service.verify_payment(
            user_id=user_id,
            razorpay_payment_id=body.razorpay_payment_id,
            razorpay_order_id=body.razorpay_order_id,
            razorpay_signature=body.razorpay_signature,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return VerifyPaymentResponse(**result)


@router.get("/history", response_model=PaymentHistoryResponse)
async def get_payment_history(
    user_id: int = Depends(_get_current_user_id),
    service: PaymentService = Depends(_get_service),
):
    """Get payment history for the current user."""
    result = await service.get_payment_history(user_id)
    return PaymentHistoryResponse(**result)
