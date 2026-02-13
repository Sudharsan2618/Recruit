"""Job management endpoints for company portal."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from datetime import datetime

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


@router.get("/company/candidates")
async def get_company_candidates(
    stage: str = Query("all", description="Filter by candidate_stage: all, new_candidates, under_review, interviewing, offer_extended, hired, rejected"),
    search: str = Query(""),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    user_id: int = Depends(_get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Get all candidates forwarded to this company across all jobs."""
    # Resolve company_id
    comp = await db.execute(
        text("SELECT company_id FROM companies WHERE user_id = :uid"),
        {"uid": user_id},
    )
    company_id = comp.scalar()
    if not company_id:
        raise HTTPException(status_code=404, detail="Company profile not found")

    where_clauses = [
        "j.company_id = :company_id",
        "a.status IN ('forwarded_to_company','under_company_review','interview_scheduled','interview_completed','offer_extended','offer_accepted','offer_rejected','hired','rejected_by_company')",
    ]
    params: dict = {"company_id": company_id, "limit": limit, "offset": offset}

    if stage != "all":
        where_clauses.append("a.company_stage = :stage")
        params["stage"] = stage

    if search:
        where_clauses.append("(LOWER(s.first_name) LIKE :search OR LOWER(s.last_name) LIKE :search OR LOWER(u.email) LIKE :search)")
        params["search"] = f"%{search.lower()}%"

    where_sql = " AND ".join(where_clauses)

    # Count
    count_q = await db.execute(
        text(f"""
            SELECT COUNT(*)
            FROM applications a
            JOIN jobs j ON j.job_id = a.job_id
            JOIN students s ON s.student_id = a.student_id
            JOIN users u ON u.user_id = s.user_id
            WHERE {where_sql}
        """),
        params,
    )
    total = count_q.scalar() or 0

    # Data
    data_q = await db.execute(
        text(f"""
            SELECT
                a.application_id, a.student_id, a.job_id,
                a.status AS application_status,
                a.company_stage,
                a.cover_letter, a.resume_url, a.expected_salary,
                a.notice_period_days, a.applied_at, a.forwarded_at,
                a.admin_match_score,
                s.first_name, s.last_name, s.headline,
                s.profile_picture_url, s.current_location,
                s.total_experience_months,
                s.resume_url AS student_resume_url,
                s.linkedin_url, s.github_url, s.portfolio_url,
                u.email,
                j.title AS job_title, j.department,
                ROUND(
                    COALESCE(
                        (1.0 - (je.embedding <=> se.embedding))::numeric * 100,
                        0
                    ), 1
                ) AS match_score
            FROM applications a
            JOIN jobs j ON j.job_id = a.job_id
            JOIN students s ON s.student_id = a.student_id
            JOIN users u ON u.user_id = s.user_id
            LEFT JOIN job_embeddings je ON je.job_id = a.job_id
            LEFT JOIN student_embeddings se ON se.student_id = a.student_id
            WHERE {where_sql}
            ORDER BY a.forwarded_at DESC NULLS LAST
            LIMIT :limit OFFSET :offset
        """),
        params,
    )
    rows = data_q.mappings().all()

    candidates = []
    for r in rows:
        c = dict(r)
        c["match_score"] = float(c["match_score"]) if c["match_score"] else 0
        c["expected_salary"] = float(c["expected_salary"]) if c["expected_salary"] else None
        c["admin_match_score"] = float(c["admin_match_score"]) if c["admin_match_score"] else None
        c["name"] = f"{r['first_name'] or ''} {r['last_name'] or ''}".strip()
        # Get student skills
        skills_q = await db.execute(
            text("SELECT sk.name FROM student_skills ss JOIN skills sk ON sk.skill_id = ss.skill_id WHERE ss.student_id = :sid"),
            {"sid": r["student_id"]},
        )
        c["skills"] = [s["name"] for s in skills_q.mappings().all()]
        # Get enrolled courses count
        courses_q = await db.execute(
            text("SELECT COUNT(*) FROM enrollments WHERE student_id = :sid"),
            {"sid": r["student_id"]},
        )
        c["courses_count"] = courses_q.scalar() or 0
        candidates.append(c)

    return {"candidates": candidates, "total": total}


@router.put("/company/candidates/{application_id}/stage")
async def update_candidate_stage(
    application_id: int,
    new_stage: str = Query(..., description="new_candidates, under_review, interviewing, offer_extended, hired, rejected"),
    user_id: int = Depends(_get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Update a candidate's pipeline stage from the company side."""
    valid_stages = ["new_candidates", "under_review", "interviewing", "offer_extended", "hired", "rejected"]
    if new_stage not in valid_stages:
        raise HTTPException(status_code=400, detail=f"Invalid stage. Use one of: {valid_stages}")

    # Verify this application belongs to the company
    comp = await db.execute(text("SELECT company_id FROM companies WHERE user_id = :uid"), {"uid": user_id})
    company_id = comp.scalar()
    if not company_id:
        raise HTTPException(status_code=404, detail="Company not found")

    check = await db.execute(
        text("""
            SELECT a.application_id FROM applications a
            JOIN jobs j ON j.job_id = a.job_id
            WHERE a.application_id = :aid AND j.company_id = :cid
        """),
        {"aid": application_id, "cid": company_id},
    )
    if not check.scalar():
        raise HTTPException(status_code=404, detail="Application not found or not your company")

    now = datetime.utcnow()
    # Map stage to application status
    stage_to_status = {
        "under_review": "under_company_review",
        "interviewing": "interview_scheduled",
        "offer_extended": "offer_extended",
        "hired": "hired",
        "rejected": "rejected_by_company",
    }
    app_status = stage_to_status.get(new_stage)

    update_fields = {"company_stage": new_stage, "updated_at": now, "company_reviewed_at": now}
    if app_status:
        update_fields["status"] = app_status

    set_parts = ", ".join(f"{k} = :{k}" for k in update_fields)
    update_fields["aid"] = application_id

    await db.execute(text(f"UPDATE applications SET {set_parts} WHERE application_id = :aid"), update_fields)
    await db.commit()

    return {"success": True, "application_id": application_id, "stage": new_stage}
