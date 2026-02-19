"""Notification service — creates in-app notification queue entries in MongoDB."""

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from app.db.mongodb import get_mongodb, to_bson_datetime
from app.services.novu_service import trigger_novu_notification


async def create_notification(
    user_id: int,
    notification_type: str,
    title: str,
    body: str,
    *,
    email: Optional[str] = None,
    channel: str = "in_app",
    metadata: Optional[dict[str, Any]] = None,
    workflow_id: str = "onboarding-demo-workflow",
) -> str:
    """
    Create a notification job in MongoDB notification_queue.

    Args:
        user_id: Target user ID
        notification_type: e.g. "course_completed", "quiz_passed", "new_material"
        title: Notification title
        body: Notification body text
        channel: Delivery channel (in_app only for now)
        metadata: Extra data (course_id, quiz_id, etc.)

    Returns:
        notification_id (UUID string)
    """
    db = get_mongodb()
    now = to_bson_datetime(datetime.now(timezone.utc))
    nid = str(uuid.uuid4())

    # Create payload matching Novu-style and local schema requirements
    payload = metadata or {}
    payload.update({
        "title": title,
        "body": body,
        "type": notification_type
    })

    doc = {
        "notification_id": nid,
        "user_id": user_id,
        "notification_type": notification_type,
        "channel": channel,
        "payload": payload,
        "status": "pending",
        "read": False,
        "created_at": now,
        "updated_at": now,
    }

    await db["notification_queue"].insert_one(doc)

    # ── Trigger Novu ──
    trigger_novu_notification(user_id, workflow_id, payload, email=email)

    return nid


async def get_user_notifications(
    user_id: int,
    *,
    limit: int = 20,
    unread_only: bool = False,
) -> list[dict]:
    """Fetch notifications for a user, newest first."""
    db = get_mongodb()
    query: dict = {"user_id": user_id}
    if unread_only:
        query["read"] = False

    cursor = (
        db["notification_queue"]
        .find(query, {"_id": 0})
        .sort("created_at", -1)
        .limit(limit)
    )
    return await cursor.to_list(length=limit)


async def mark_notification_read(notification_id: str) -> bool:
    """Mark a single notification as read."""
    db = get_mongodb()
    result = await db["notification_queue"].update_one(
        {"notification_id": notification_id},
        {"$set": {
            "read": True,
            "status": "read",
            "updated_at": to_bson_datetime(datetime.now(timezone.utc)),
        }},
    )
    return result.modified_count > 0
