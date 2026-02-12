"""Notification service — creates in-app notification queue entries in MongoDB."""

import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from app.db.mongodb import get_mongodb, to_bson_datetime


async def create_notification(
    user_id: int,
    notification_type: str,
    title: str,
    body: str,
    *,
    channel: str = "in_app",
    metadata: Optional[dict[str, Any]] = None,
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

    doc = {
        "notification_id": nid,
        "user_id": user_id,
        "type": notification_type,
        "channel": channel,
        "title": title,
        "body": body,
        "status": "pending",
        "read": False,
        "created_at": now,
        "updated_at": now,
        "metadata": metadata or {},
    }

    await db["notification_queue"].insert_one(doc)
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
