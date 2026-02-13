"""Notification API endpoints — list, mark read, unread count, create helper."""

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from datetime import datetime

from app.db.postgres import get_db
from app.services.auth_service import decode_access_token

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ── Auth helper ──────────────────────────────────────────────────────────

async def _get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return int(payload.get("sub", 0))


# ── Helper: create a notification (used by other endpoints) ──────────────

async def create_notification(
    db: AsyncSession,
    user_id: int,
    notification_type: str,
    title: str,
    message: str,
    action_url: str | None = None,
    action_text: str | None = None,
    reference_type: str | None = None,
    reference_id: int | None = None,
):
    """Insert a notification row. Call this from any endpoint that needs to notify a user."""
    await db.execute(
        text("""
            INSERT INTO notifications (user_id, type, title, message, action_url, action_text, reference_type, reference_id)
            VALUES (:user_id, :type, :title, :message, :action_url, :action_text, :reference_type, :reference_id)
        """),
        {
            "user_id": user_id,
            "type": notification_type,
            "title": title,
            "message": message,
            "action_url": action_url,
            "action_text": action_text,
            "reference_type": reference_type,
            "reference_id": reference_id,
        },
    )


# ── GET /notifications/unread-count ──────────────────────────────────────

@router.get("/unread-count")
async def get_unread_count(
    user_id: int = Depends(_get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Return the count of unread notifications for the current user."""
    result = await db.execute(
        text("SELECT COUNT(*) FROM notifications WHERE user_id = :uid AND is_read = false"),
        {"uid": user_id},
    )
    count = result.scalar() or 0
    return {"unread_count": count}


# ── GET /notifications ───────────────────────────────────────────────────

@router.get("")
async def list_notifications(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    unread_only: bool = Query(False),
    user_id: int = Depends(_get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """List notifications for the current user, newest first."""
    where = "user_id = :uid"
    params: dict = {"uid": user_id, "limit": limit, "offset": offset}

    if unread_only:
        where += " AND is_read = false"

    count_q = await db.execute(text(f"SELECT COUNT(*) FROM notifications WHERE {where}"), params)
    total = count_q.scalar() or 0

    data_q = await db.execute(
        text(f"""
            SELECT notification_id, type, title, message,
                   action_url, action_text, reference_type, reference_id,
                   is_read, read_at, created_at
            FROM notifications
            WHERE {where}
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        """),
        params,
    )
    rows = [dict(r) for r in data_q.mappings().all()]

    return {"notifications": rows, "total": total}


# ── PUT /notifications/{id}/read ─────────────────────────────────────────

@router.put("/{notification_id}/read")
async def mark_as_read(
    notification_id: int,
    user_id: int = Depends(_get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Mark a single notification as read."""
    result = await db.execute(
        text("""
            UPDATE notifications SET is_read = true, read_at = :now
            WHERE notification_id = :nid AND user_id = :uid
            RETURNING notification_id
        """),
        {"nid": notification_id, "uid": user_id, "now": datetime.utcnow()},
    )
    if not result.scalar():
        raise HTTPException(status_code=404, detail="Notification not found")
    await db.commit()
    return {"success": True}


# ── PUT /notifications/read-all ──────────────────────────────────────────

@router.put("/read-all")
async def mark_all_as_read(
    user_id: int = Depends(_get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Mark all unread notifications as read for the current user."""
    now = datetime.utcnow()
    result = await db.execute(
        text("""
            UPDATE notifications SET is_read = true, read_at = :now
            WHERE user_id = :uid AND is_read = false
        """),
        {"uid": user_id, "now": now},
    )
    await db.commit()
    return {"success": True, "updated": result.rowcount}


# ── DELETE /notifications/{id} ───────────────────────────────────────────

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    user_id: int = Depends(_get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single notification."""
    result = await db.execute(
        text("DELETE FROM notifications WHERE notification_id = :nid AND user_id = :uid RETURNING notification_id"),
        {"nid": notification_id, "uid": user_id},
    )
    if not result.scalar():
        raise HTTPException(status_code=404, detail="Notification not found")
    await db.commit()
    return {"success": True}
