"""Job management endpoints for company portal."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.postgres import get_db
from app.services.job_service import JobService
from app.services.auth_service import decode_access_token
from app.schemas.job import JobCreateRequest, JobOut

router = APIRouter(prefix="/jobs", tags=["Jobs"])


async def _get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    """Extract user_id from Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return int(payload.get("sub", 0))


def get_service(db: AsyncSession = Depends(get_db)) -> JobService:
    return JobService(db)


@router.post("/company", response_model=JobOut)
async def create_job(
    body: JobCreateRequest,
    user_id: int = Depends(_get_current_user_id),
    service: JobService = Depends(get_service),
):
    """Create a new job posting for the authenticated company."""
    try:
        data = await service.create_job(user_id, body.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return JobOut(**data)


@router.get("/company", response_model=List[JobOut])
async def list_company_jobs(
    user_id: int = Depends(_get_current_user_id),
    service: JobService = Depends(get_service),
):
    """List all jobs for the authenticated company."""
    try:
        jobs = await service.get_company_jobs(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return [JobOut(**j) for j in jobs]
