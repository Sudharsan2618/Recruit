"""Coding Practice API — question bank, client 'Run' preview, and server-graded submit.

Submit sends only { code, language }; the server re-executes and grades. The
reference solution never leaves the server.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.services import coding_service as coding

router = APIRouter(prefix="/coding", tags=["Coding Practice"])


class RunRequest(BaseModel):
    code: str
    language: str = "sql"


class SubmitRequest(BaseModel):
    code: str
    language: str = "sql"


@router.get("/questions", summary="List coding questions (browse)")
async def list_questions(
    engine: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    student_id: Optional[int] = Query(None, description="Include this student's solved status"),
):
    questions = coding.list_questions(
        engine=engine, difficulty=difficulty, company=company, role=role, search=search
    )
    solved: set[str] = set()
    if student_id is not None:
        progress = await coding.get_progress(student_id)
        solved = set(progress["solved_slugs"])
    for q in questions:
        q["solved"] = q["slug"] in solved
    return {"questions": questions, "total": len(questions), "facets": coding.filter_facets()}


@router.get("/questions/{slug}", summary="Get one question's full detail (no solution)")
async def get_question(slug: str, student_id: Optional[int] = Query(None)):
    q = coding.get_public_question(slug)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    if student_id is not None:
        progress = await coding.get_progress(student_id)
        q["solved"] = slug in set(progress["solved_slugs"])
    return q


@router.post("/questions/{slug}/run", summary="Run code and preview the result (no grading)")
async def run_question(slug: str, body: RunRequest):
    if not coding.get_public_question(slug):
        raise HTTPException(status_code=404, detail="Question not found")
    return coding.run_preview(slug, body.code)


@router.post("/questions/{slug}/submit", summary="Grade a submission (server re-executes)")
async def submit_question(slug: str, body: SubmitRequest, student_id: int = Query(...)):
    if not coding.get_public_question(slug):
        raise HTTPException(status_code=404, detail="Question not found")
    try:
        return await coding.submit(student_id, slug, body.code, body.language)
    except coding.QueryError as e:
        # Bad user SQL is a normal outcome, not a server error — report as a runtime error verdict.
        return {"verdict": "runtime_error", "error": str(e), "first_solve": False,
                "points_awarded": 0, "diff": None, "columns": [], "rows": [], "row_count": 0}


@router.get("/progress/{student_id}", summary="A student's coding progress")
async def progress(student_id: int):
    return await coding.get_progress(student_id)


@router.get("/leaderboard", summary="Top students by coding points")
async def leaderboard(limit: int = Query(20, ge=1, le=100)):
    return {"leaderboard": await coding.get_leaderboard(limit=limit)}
