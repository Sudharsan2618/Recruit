"""Auth API endpoints — login, token validation, current user."""

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.postgres import get_db
from app.services.auth_service import AuthService, create_access_token, decode_access_token
from app.schemas.auth import (
    LoginRequest, TokenResponse, UserOut,
    StudentRegisterRequest, CompanyRegisterRequest,
    StudentOnboardingRequest, CompanyOnboardingRequest,
    StudentDashboardResponse,
    StudentProfileFullOut, StudentProfileUpdateRequest,
    CompanyProfileFullOut, CompanyProfileUpdateRequest,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(db)


async def _get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    """Extract user_id from JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return int(payload.get("sub", 0))


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


@router.post("/register/student", response_model=TokenResponse)
async def register_student(body: StudentRegisterRequest, service: AuthService = Depends(get_service)):
    """Register a new student and return JWT token."""
    try:
        user_data = await service.register_student(
            email=body.email,
            password=body.password,
            first_name=body.first_name,
            last_name=body.last_name,
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    token = create_access_token(
        data={
            "sub": str(user_data["user_id"]),
            "email": user_data["email"],
            "user_type": user_data["user_type"],
        }
    )

    try:
        from app.services.event_logger import log_event
        await log_event("user.registered", user_id=user_data["user_id"])
    except Exception:
        pass

    return TokenResponse(access_token=token, user=UserOut(**user_data))


@router.post("/register/company", response_model=TokenResponse)
async def register_company(body: CompanyRegisterRequest, service: AuthService = Depends(get_service)):
    """Register a new company and return JWT token."""
    try:
        user_data = await service.register_company(
            email=body.email,
            password=body.password,
            company_name=body.company_name,
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    token = create_access_token(
        data={
            "sub": str(user_data["user_id"]),
            "email": user_data["email"],
            "user_type": user_data["user_type"],
        }
    )

    try:
        from app.services.event_logger import log_event
        await log_event("user.registered", user_id=user_data["user_id"])
    except Exception:
        pass

    return TokenResponse(access_token=token, user=UserOut(**user_data))


@router.put("/onboarding/student", response_model=UserOut)
async def complete_student_onboarding(
    body: StudentOnboardingRequest,
    user_id: int = Depends(_get_current_user_id),
    service: AuthService = Depends(get_service),
):
    """Complete student onboarding — saves profile data and marks onboarding done."""
    try:
        user_data = await service.update_student_onboarding(user_id, body.model_dump(exclude_none=True))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return UserOut(**user_data)


@router.put("/onboarding/company", response_model=UserOut)
async def complete_company_onboarding(
    body: CompanyOnboardingRequest,
    user_id: int = Depends(_get_current_user_id),
    service: AuthService = Depends(get_service),
):
    """Complete company onboarding — saves company data and marks onboarding done."""
    try:
        user_data = await service.update_company_onboarding(user_id, body.model_dump(exclude_none=True))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return UserOut(**user_data)


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


@router.get("/dashboard/student", response_model=StudentDashboardResponse)
async def get_student_dashboard(
    user_id: int = Depends(_get_current_user_id),
    service: AuthService = Depends(get_service),
):
    """Get aggregated student dashboard data."""
    try:
        data = await service.get_student_dashboard(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return StudentDashboardResponse(**data)


@router.get("/profile/student", response_model=StudentProfileFullOut)
async def get_student_profile(
    user_id: int = Depends(_get_current_user_id),
    service: AuthService = Depends(get_service),
):
    """Get full student profile."""
    try:
        data = await service.get_student_profile(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return StudentProfileFullOut(**data)


@router.put("/profile/student", response_model=StudentProfileFullOut)
async def update_student_profile(
    body: StudentProfileUpdateRequest,
    user_id: int = Depends(_get_current_user_id),
    service: AuthService = Depends(get_service),
):
    """Update student profile fields."""
    try:
        data = await service.update_student_profile(user_id, body.model_dump(exclude_none=True))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return StudentProfileFullOut(**data)


@router.get("/profile/company", response_model=CompanyProfileFullOut)
async def get_company_profile(
    user_id: int = Depends(_get_current_user_id),
    service: AuthService = Depends(get_service),
):
    """Get full company profile."""
    try:
        data = await service.get_company_profile(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return CompanyProfileFullOut(**data)


@router.put("/profile/company", response_model=CompanyProfileFullOut)
async def update_company_profile(
    body: CompanyProfileUpdateRequest,
    user_id: int = Depends(_get_current_user_id),
    service: AuthService = Depends(get_service),
):
    """Update company profile fields."""
    try:
        data = await service.update_company_profile(user_id, body.model_dump(exclude_none=True))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return CompanyProfileFullOut(**data)
