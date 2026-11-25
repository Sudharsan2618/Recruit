"""Course API endpoints — student-facing course content APIs."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db.postgres import get_db
from app.services.course_service import CourseService
from app.api.dependencies import get_current_user_id
from app.utils.time import utc_now
from app.schemas.course import (
    CourseListResponse, CourseDetail,
    LessonOut, EnrollRequest, EnrollmentOut,
    ProgressUpdate, LessonProgressOut,
    QuizOut, QuizSubmission, QuizResultOut,
    MaterialOut, FlashcardDeckOut, CategoryOut,
)

router = APIRouter(prefix="/courses", tags=["Courses"])


def get_service(db: AsyncSession = Depends(get_db)) -> CourseService:
    return CourseService(db)


async def _assert_course_access(db: AsyncSession, student_id: int, course_id: int) -> None:
    """Enforce admin-granted access + the start/end window. Raises 403 otherwise."""
    row = await db.execute(text("""
        SELECT access_starts_at, expires_at
        FROM enrollments WHERE student_id = :sid AND course_id = :cid
    """), {"sid": student_id, "cid": course_id})
    e = row.mappings().first()
    if not e:
        raise HTTPException(
            status_code=403,
            detail="You don't have access to this course. Please contact your administrator.",
        )
    now = utc_now()  # naive UTC, matches the stored timestamps
    if e["access_starts_at"] and now < e["access_starts_at"]:
        raise HTTPException(
            status_code=403,
            detail=f"Your access to this course hasn't started yet (starts {e['access_starts_at'].strftime('%d %b %Y')}).",
        )
    if e["expires_at"] and now > e["expires_at"]:
        raise HTTPException(
            status_code=403,
            detail="Your access to this course has expired. Please contact your administrator to extend it.",
        )


# ── Course Discovery ──

@router.get("", response_model=CourseListResponse)
async def list_courses(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    category: Optional[str] = Query(None, description="Filter by category slug"),
    difficulty: Optional[str] = Query(None, description="beginner|intermediate|advanced"),
    pricing: Optional[str] = Query(None, description="free|one_time|subscription"),
    search: Optional[str] = Query(None, description="Search in title/description"),
    service: CourseService = Depends(get_service),
):
    """List published courses with filters and pagination."""
    return await service.list_courses(
        page=page, page_size=page_size,
        category=category, difficulty=difficulty,
        pricing=pricing, search=search,
    )


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(service: CourseService = Depends(get_service)):
    """List all active course categories."""
    return await service.get_categories()


@router.get("/{slug}", response_model=CourseDetail)
async def get_course(slug: str, service: CourseService = Depends(get_service)):
    """Get full course detail with curriculum (modules + lessons)."""
    course = await service.get_course_detail(slug)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


# ── Lesson Content ──

@router.get("/lessons/{lesson_id}", response_model=LessonOut)
async def get_lesson(lesson_id: int, service: CourseService = Depends(get_service)):
    """Get lesson content (video, text, PDF URL, etc.)."""
    lesson = await service.get_lesson(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


# ── Quiz ──

@router.get("/quizzes/{quiz_id}", response_model=QuizOut)
async def get_quiz(quiz_id: int, service: CourseService = Depends(get_service)):
    """Get quiz with questions (correct answers stripped)."""
    quiz = await service.get_quiz(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return quiz


@router.post("/quizzes/{quiz_id}/submit", response_model=QuizResultOut)
async def submit_quiz(
    quiz_id: int,
    submission: QuizSubmission,
    enrollment_id: int = Query(..., description="Enrollment ID"),
    service: CourseService = Depends(get_service),
):
    """Submit quiz answers and get graded result."""
    try:
        return await service.submit_quiz(quiz_id, enrollment_id, submission)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Assignment (coding exercise) ──

@router.get("/lessons/{lesson_id}/assignment")
async def get_lesson_assignment(lesson_id: int, db: AsyncSession = Depends(get_db)):
    """Get the coding assignment + questions for a lesson (student-facing)."""
    aq = await db.execute(text("""
        SELECT assignment_id, title, description, instructions, language, total_questions
        FROM assignments WHERE lesson_id = :lid
    """), {"lid": lesson_id})
    assignment = aq.mappings().first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    qq = await db.execute(text("""
        SELECT question_id, title, problem_statement, starter_code, expected_output,
               sample_input, solution_code, solution_explanation, language, points, order_index
        FROM assignment_questions WHERE assignment_id = :aid ORDER BY order_index
    """), {"aid": assignment["assignment_id"]})
    questions = [dict(q) for q in qq.mappings().all()]
    return {**dict(assignment), "questions": questions}


# ── Materials ──

@router.get("/{course_id}/materials", response_model=list[MaterialOut])
async def get_materials(course_id: int, service: CourseService = Depends(get_service)):
    """Get downloadable materials for a course."""
    return await service.get_materials(course_id)


# ── Flashcards ──

@router.get("/flashcards/{deck_id}", response_model=FlashcardDeckOut)
async def get_flashcard_deck(
    deck_id: int, service: CourseService = Depends(get_service)
):
    """Get flashcard deck with all cards."""
    deck = await service.get_flashcard_deck(deck_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Flashcard deck not found")
    return deck


# ── Student Endpoints (Enrollment & Progress) ──

student_router = APIRouter(prefix="/students", tags=["Student Learning"])


@student_router.post("/enroll/{course_id}")
async def enroll_in_course(
    course_id: int,
    body: EnrollRequest,
    service: CourseService = Depends(get_service),
):
    """Self-enrollment is disabled: course access is admin-controlled (allowlist)."""
    raise HTTPException(
        status_code=403,
        detail="Course access is managed by your administrator. Please contact them to be enrolled.",
    )



@student_router.get("/materials/all", response_model=list[dict])
async def get_all_materials_for_user(
    user_id: int = Depends(get_current_user_id),
    service: CourseService = Depends(get_service),
):
    """Get all downloadable materials across all enrolled courses."""
    return await service.get_all_materials_by_user(user_id)

@student_router.get("/enrollments", response_model=list[EnrollmentOut])
async def get_enrollments(
    student_id: int = Query(..., description="Student ID"),
    service: CourseService = Depends(get_service),
):
    """Get all enrollments for a student."""
    return await service.get_enrollments(student_id)


@student_router.post(
    "/enrollments/{course_id}/progress",
    response_model=LessonProgressOut,
)
async def update_progress(
    course_id: int,
    body: ProgressUpdate,
    student_id: int = Query(..., description="Student ID"),
    service: CourseService = Depends(get_service),
    db: AsyncSession = Depends(get_db),
):
    """Update lesson progress — gated by the admin-granted access window."""
    await _assert_course_access(db, student_id, course_id)
    try:
        return await service.update_progress(student_id, course_id, body)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@student_router.get(
    "/enrollments/{course_id}/progress",
    response_model=list[LessonProgressOut],
)
async def get_progress(
    course_id: int,
    student_id: int = Query(..., description="Student ID"),
    service: CourseService = Depends(get_service),
):
    """Get all lesson progress for a student's enrollment."""
    return await service.get_course_progress(student_id, course_id)
