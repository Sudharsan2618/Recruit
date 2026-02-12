"""Embedding service — generates text embeddings via Gemini REST API and stores in PostgreSQL pgvector."""

import hashlib
import logging
import requests
from datetime import datetime
from typing import Optional

from app.config import settings
from app.db.mongodb import get_mongodb

logger = logging.getLogger(__name__)

# ── Config ─────────────────────────────────────────────────────────────────

EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIM = 1536
GEMINI_EMBED_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{EMBEDDING_MODEL}:embedContent"


# ── Core embedding function ───────────────────────────────────────────────

def generate_embedding(text: str, task_type: str = "RETRIEVAL_DOCUMENT") -> list[float]:
    """
    Generate a 1536-dimension embedding for the given text using Gemini REST API.

    Args:
        text: Input text to embed (will be truncated to 8000 chars)
        task_type: Gemini task type (RETRIEVAL_DOCUMENT, RETRIEVAL_QUERY, etc.)

    Returns:
        List of 1536 floats representing the text embedding
    """
    text = text[:8000]

    payload = {
        "model": f"models/{EMBEDDING_MODEL}",
        "content": {"parts": [{"text": text}]},
        "taskType": task_type,
        "output_dimensionality": EMBEDDING_DIM,
    }

    resp = requests.post(
        GEMINI_EMBED_URL,
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": settings.GEMINI_API_KEY,
        },
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    return data["embedding"]["values"]


def text_hash(text: str) -> str:
    """Compute SHA-256 hash of text for change detection."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


# ── Student embedding ─────────────────────────────────────────────────────

def build_student_text(
    *,
    skills: list[str],
    experience_years: int = 0,
    education: list[str] | None = None,
    certifications: list[str] | None = None,
    job_titles: list[str] | None = None,
    summary: str = "",
    bio: str = "",
) -> str:
    """Build a single text block from student data for embedding."""
    parts = []
    if summary:
        parts.append(f"Professional Summary: {summary}")
    if bio:
        parts.append(f"Bio: {bio}")
    if skills:
        parts.append(f"Skills: {', '.join(skills)}")
    if experience_years:
        parts.append(f"Experience: {experience_years} years")
    if education:
        parts.append(f"Education: {'; '.join(education)}")
    if certifications:
        parts.append(f"Certifications: {'; '.join(certifications)}")
    if job_titles:
        parts.append(f"Previous Roles: {', '.join(job_titles)}")
    return "\n".join(parts)


async def generate_student_embedding(student_id: int) -> Optional[dict]:
    """
    Generate and store an embedding for a student based on their resume analysis.

    Fetches the latest resume_analysis from MongoDB, builds the embedding text,
    generates an embedding via Gemini, and upserts into PostgreSQL student_embeddings.

    Returns:
        dict with embedding metadata, or None if no resume analysis found
    """
    from app.db.postgres import async_session_factory
    from app.models.embedding import StudentEmbedding
    from sqlalchemy import select

    # 1. Fetch resume analysis from MongoDB
    db = get_mongodb()
    analysis = await db["resume_analysis"].find_one(
        {"student_id": student_id},
        {"_id": 0},
    )
    if not analysis or "extracted_data" not in analysis:
        return None

    extracted = analysis["extracted_data"]

    # 2. Fetch student bio from PostgreSQL
    bio = ""
    async with async_session_factory() as session:
        from app.models.user import Student
        student = await session.get(Student, student_id)
        if student:
            bio = student.bio or ""

    # 3. Build text and check hash
    embed_text = build_student_text(
        skills=extracted.get("skills", []),
        experience_years=extracted.get("experience_years", 0),
        education=extracted.get("education", []),
        certifications=extracted.get("certifications", []),
        job_titles=extracted.get("job_titles", []),
        summary=extracted.get("summary", ""),
        bio=bio,
    )

    if not embed_text.strip():
        return None

    current_hash = text_hash(embed_text)

    # 4. Check if embedding already exists with same hash
    async with async_session_factory() as session:
        existing = await session.execute(
            select(StudentEmbedding).where(StudentEmbedding.student_id == student_id)
        )
        existing_row = existing.scalar_one_or_none()

        if existing_row and existing_row.source_text_hash == current_hash:
            return {
                "student_id": student_id,
                "status": "unchanged",
                "source_text_hash": current_hash,
            }

    # 5. Generate embedding
    vector = generate_embedding(embed_text)

    # 6. Upsert into PostgreSQL
    async with async_session_factory() as session:
        existing = await session.execute(
            select(StudentEmbedding).where(StudentEmbedding.student_id == student_id)
        )
        row = existing.scalar_one_or_none()

        now = datetime.utcnow()
        if row:
            row.embedding = vector
            row.source_text_hash = current_hash
            row.embedding_model = "gemini-embedding-001"
            row.updated_at = now
        else:
            row = StudentEmbedding(
                student_id=student_id,
                embedding=vector,
                embedding_model="gemini-embedding-001",
                source_text_hash=current_hash,
                created_at=now,
                updated_at=now,
            )
            session.add(row)

        await session.commit()

    return {
        "student_id": student_id,
        "status": "generated",
        "source_text_hash": current_hash,
        "dimensions": len(vector),
    }


# ── Job embedding (for future use) ────────────────────────────────────────

def build_job_text(
    *,
    title: str = "",
    description: str = "",
    requirements: str = "",
    skills: list[str] | None = None,
    employment_type: str = "",
    location: str = "",
) -> str:
    """Build a single text block from job data for embedding."""
    parts = []
    if title:
        parts.append(f"Job Title: {title}")
    if description:
        parts.append(f"Description: {description}")
    if requirements:
        parts.append(f"Requirements: {requirements}")
    if skills:
        parts.append(f"Required Skills: {', '.join(skills)}")
    if employment_type:
        parts.append(f"Employment Type: {employment_type}")
    if location:
        parts.append(f"Location: {location}")
    return "\n".join(parts)
