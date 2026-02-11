"""Tracking API endpoints — xAPI & learning analytics.

Separate router for all activity-tracking, session-management, and
analytics queries.  Mounted at /api/v1/tracking.

Frontend Integration Doc:
  See artifacts/FRONTEND_TRACKING_INTEGRATION.md
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from app.db.mongodb import get_mongodb
from app.services.tracking_service import TrackingService
from app.schemas.tracking import (
    TrackActivityRequest,
    TrackActivityResponse,
    TrackBatchRequest,
    TrackBatchResponse,
    StartSessionRequest,
    EndSessionRequest,
    SessionResponse,
    HeartbeatRequest,
    HeartbeatResponse,
    StudentActivitySummary,
    CourseEngagementSummary,
    XAPIStatementRequest,
)


router = APIRouter(prefix="/tracking", tags=["Learning Analytics & xAPI"])


# ── Dependency ─────────────────────────────────────────────────────────────

def get_tracking_service() -> TrackingService:
    db = get_mongodb()
    return TrackingService(db)


# ══════════════════════════════════════════════════════════════════════════
# 1.  ACTIVITY RECORDING
# ══════════════════════════════════════════════════════════════════════════

@router.post(
    "/activities",
    response_model=TrackActivityResponse,
    summary="Record a learning activity",
    description="""
Record a single learning activity event. This endpoint:
1. Stores the event in MongoDB `learning_progress` collection
2. Generates an xAPI statement and stores it in `xapi_statements`
3. Updates real-time engagement counters

**Activity types:** `lesson_started`, `lesson_completed`, `video_watched`,
`video_paused`, `video_seeked`, `document_viewed`, `audio_played`,
`quiz_started`, `quiz_submitted`, `flashcard_interaction`, `note_taken`,
`resource_downloaded`, `page_viewed`, `course_enrolled`, `course_completed`
""",
)
async def track_activity(
    body: TrackActivityRequest,
    service: TrackingService = Depends(get_tracking_service),
):
    try:
        return await service.track_activity(body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record activity: {e}")


@router.post(
    "/activities/batch",
    response_model=TrackBatchResponse,
    summary="Record multiple activities at once",
    description="For offline-then-sync scenarios.  Accepts an array of activity events.",
)
async def track_batch(
    body: TrackBatchRequest,
    service: TrackingService = Depends(get_tracking_service),
):
    try:
        return await service.track_batch(body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch recording failed: {e}")


# ══════════════════════════════════════════════════════════════════════════
# 2.  SESSION MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════

@router.post(
    "/sessions/start",
    response_model=SessionResponse,
    summary="Start a learning session",
    description="Call when a student opens the course player.  Returns a session_id to include in subsequent activity events.",
)
async def start_session(
    body: StartSessionRequest,
    service: TrackingService = Depends(get_tracking_service),
):
    try:
        return await service.start_session(body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Session start failed: {e}")


@router.post(
    "/sessions/heartbeat",
    response_model=HeartbeatResponse,
    summary="Send session heartbeat",
    description="Call periodically (every 30–60s) to keep the session alive and track active time.",
)
async def session_heartbeat(
    body: HeartbeatRequest,
    service: TrackingService = Depends(get_tracking_service),
):
    try:
        return await service.heartbeat(body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Heartbeat failed: {e}")


@router.post(
    "/sessions/end",
    response_model=SessionResponse,
    summary="End a learning session",
    description="Call when the student leaves the course player or the browser tab is closed.  Computes total session duration.",
)
async def end_session(
    body: EndSessionRequest,
    service: TrackingService = Depends(get_tracking_service),
):
    try:
        return await service.end_session(body)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Session end failed: {e}")


# ══════════════════════════════════════════════════════════════════════════
# 3.  xAPI STATEMENT ENDPOINT
# ══════════════════════════════════════════════════════════════════════════

@router.post(
    "/xapi/statements",
    summary="Submit a raw xAPI statement",
    description="""
For LRS (Learning Record Store) interoperability.  Accepts a pre-built
xAPI statement and stores it directly.  Use this when integrating with
external xAPI tools (e.g., SCORM-to-xAPI wrappers, Articulate Storyline).

Most frontend events should use `/tracking/activities` instead — the
backend auto-generates xAPI statements from those.
""",
)
async def submit_xapi_statement(
    body: XAPIStatementRequest,
    service: TrackingService = Depends(get_tracking_service),
):
    try:
        stmt_id = await service.store_xapi_statement(body)
        return {"success": True, "statement_id": stmt_id, "message": "xAPI statement stored"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"xAPI submission failed: {e}")


@router.get(
    "/xapi/statements",
    summary="Query xAPI statements",
    description="Retrieve stored xAPI statements with optional filters.  Follows the xAPI Statement API pattern.",
)
async def get_xapi_statements(
    student_id: Optional[int] = Query(None, description="Filter by student"),
    course_id: Optional[int] = Query(None, description="Filter by course"),
    verb_id: Optional[str] = Query(None, description="Filter by xAPI verb IRI"),
    since: Optional[datetime] = Query(None, description="Only statements after this timestamp"),
    until: Optional[datetime] = Query(None, description="Only statements before this timestamp"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    service: TrackingService = Depends(get_tracking_service),
):
    try:
        stmts = await service.get_xapi_statements(
            student_id=student_id,
            course_id=course_id,
            verb_id=verb_id,
            since=since,
            until=until,
            limit=limit,
            offset=offset,
        )
        return {"statements": stmts, "count": len(stmts)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"xAPI query failed: {e}")


# ══════════════════════════════════════════════════════════════════════════
# 4.  ANALYTICS & SUMMARIES
# ══════════════════════════════════════════════════════════════════════════

@router.get(
    "/analytics/student/{student_id}/course/{course_id}",
    response_model=StudentActivitySummary,
    summary="Get student activity summary for a course",
    description="Aggregated view: lessons started/completed, videos watched, quizzes taken, flashcards reviewed, total time spent.",
)
async def get_student_activity_summary(
    student_id: int,
    course_id: int,
    service: TrackingService = Depends(get_tracking_service),
):
    try:
        return await service.get_student_activity_summary(student_id, course_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics query failed: {e}")


@router.get(
    "/analytics/course/{course_id}/engagement",
    response_model=CourseEngagementSummary,
    summary="Get course engagement metrics",
    description="Active students, total activities, average time spent, completion rate, breakdown by activity type.",
)
async def get_course_engagement(
    course_id: int,
    period_days: int = Query(30, ge=1, le=365, description="Look-back period in days"),
    service: TrackingService = Depends(get_tracking_service),
):
    try:
        return await service.get_course_engagement(course_id, period_days)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Engagement query failed: {e}")


@router.get(
    "/analytics/student/{student_id}/recent",
    summary="Get recent activities for a student",
    description="Returns the most recent activity events for a student, optionally filtered by course.",
)
async def get_recent_activities(
    student_id: int,
    course_id: Optional[int] = Query(None, description="Optional course filter"),
    limit: int = Query(20, ge=1, le=100),
    service: TrackingService = Depends(get_tracking_service),
):
    try:
        activities = await service.get_recent_activities(student_id, course_id, limit)
        return {"activities": activities, "count": len(activities)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Activity query failed: {e}")
