"""Auth API endpoints — login, token validation, current user."""

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.postgres import get_db
from app.services.auth_service import AuthService, create_access_token, decode_access_token
from app.schemas.auth import LoginRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, service: AuthService = Depends(get_service)):
    """Authenticate user and return JWT token."""
    user_data = await service.authenticate_user(body.email, body.password)
    if not user_data:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    # Create JWT token
    token = create_access_token(
        data={
            "sub": str(user_data["user_id"]),
            "email": user_data["email"],
            "user_type": user_data["user_type"],
        }
    )

    # Fire-and-forget event log
    try:
        from app.services.event_logger import log_event
        await log_event("user.login", user_id=user_data["user_id"])
    except Exception:
        pass  # Non-critical

    return TokenResponse(
        access_token=token,
        user=UserOut(**user_data),
    )


@router.get("/me", response_model=UserOut)
async def get_current_user(
    authorization: Optional[str] = Header(None),
    service: AuthService = Depends(get_service),
):
    """Get current user from JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = int(payload.get("sub", 0))
    user_data = await service.get_user_by_id(user_id)
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    return UserOut(**user_data)
