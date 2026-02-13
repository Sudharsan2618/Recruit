"""
Job-Student matching service using pgvector cosine similarity.
Computes match scores between job embeddings and student embeddings.
"""

import logging
from typing import Optional
from datetime import datetime

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# Cosine similarity threshold for "recommended" jobs.
# pgvector's <=> operator returns cosine *distance* (0 = identical, 2 = opposite).
# similarity = 1 - distance.  We use 0.65 similarity as threshold (distance <= 0.35).
MATCH_SIMILARITY_THRESHOLD = 0.65
MATCH_DISTANCE_THRESHOLD = 1.0 - MATCH_SIMILARITY_THRESHOLD  # 0.35


class MatchingService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_recommended_jobs_for_student(
        self,
        student_id: int,
        limit: int = 20,
        offset: int = 0,
    ) -> list[dict]:
        """
        Find jobs whose embedding is similar to the student's embedding.
        Returns jobs with match_score >= MATCH_SIMILARITY_THRESHOLD, sorted by score desc.
        Uses pgvector cosine distance operator (<=>).
        """
        # Check if student has an embedding first
        has_emb = await self.db.execute(
            text("SELECT 1 FROM student_embeddings WHERE student_id = :sid LIMIT 1"),
            {"sid": student_id},
        )
        if has_emb.scalar() is None:
            logger.info(f"Student {student_id} has no embedding — skipping recommendations")
            return []

        query = text("""
            SELECT
                j.job_id,
                j.title,
                j.slug,
                j.description,
                j.employment_type,
                j.remote_type,
                j.location,
                j.salary_min,
                j.salary_max,
                j.salary_currency,
                j.salary_is_visible,
                j.experience_min_years,
                j.experience_max_years,
                j.benefits,
                j.posted_at,
                j.deadline,
                j.department,
                j.responsibilities,
                j.requirements,
                j.nice_to_have,
                j.applications_count,
                c.company_id,
                c.company_name,
                c.logo_url,
                c.industry,
                c.headquarters_location AS company_location,
                ROUND((1.0 - (je.embedding <=> se.embedding))::numeric, 4) AS match_score
            FROM job_embeddings je
            JOIN student_embeddings se ON se.student_id = :student_id
            JOIN jobs j ON j.job_id = je.job_id
            JOIN companies c ON c.company_id = j.company_id
            WHERE j.status = 'active'
              AND (1.0 - (je.embedding <=> se.embedding)) >= :threshold
            ORDER BY match_score DESC
            LIMIT :limit OFFSET :offset
        """)

        result = await self.db.execute(query, {
            "student_id": student_id,
            "threshold": MATCH_SIMILARITY_THRESHOLD,
            "limit": limit,
            "offset": offset,
        })
        rows = result.mappings().all()

        jobs = []
        for row in rows:
            job = dict(row)
            # Convert Decimal to float for JSON serialization
            job["match_score"] = float(job["match_score"]) if job["match_score"] else 0.0
            job["salary_min"] = float(job["salary_min"]) if job["salary_min"] else None
            job["salary_max"] = float(job["salary_max"]) if job["salary_max"] else None
            # Fetch skills for this job
            job["skills"] = await self._get_job_skills(job["job_id"])
            jobs.append(job)

        return jobs

    async def get_all_active_jobs(
        self,
        student_id: Optional[int] = None,
        search: str = "",
        employment_type: str = "",
        remote_type: str = "",
        location: str = "",
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict]:
        """
        Fetch all active jobs with optional filters.
        If student_id has an embedding, include match_score; otherwise match_score = null.
        """
        # Build dynamic WHERE clauses
        where_clauses = ["j.status = 'active'"]
        params: dict = {"limit": limit, "offset": offset}

        if search:
            where_clauses.append(
                "(LOWER(j.title) LIKE :search OR LOWER(j.description) LIKE :search OR LOWER(c.company_name) LIKE :search)"
            )
            params["search"] = f"%{search.lower()}%"

        if employment_type:
            where_clauses.append("j.employment_type = :emp_type")
            params["emp_type"] = employment_type

        if remote_type:
            where_clauses.append("j.remote_type = :remote_type")
            params["remote_type"] = remote_type

        if location:
            where_clauses.append("LOWER(j.location) LIKE :location")
            params["location"] = f"%{location.lower()}%"

        where_sql = " AND ".join(where_clauses)

        # If student has embedding, compute match_score
        if student_id:
            score_select = """
                ROUND((1.0 - (je.embedding <=> se.embedding))::numeric, 4) AS match_score
            """
            join_embeddings = """
                LEFT JOIN job_embeddings je ON je.job_id = j.job_id
                LEFT JOIN student_embeddings se ON se.student_id = :student_id
            """
            params["student_id"] = student_id
        else:
            score_select = "NULL AS match_score"
            join_embeddings = ""

        query = text(f"""
            SELECT
                j.job_id,
                j.title,
                j.slug,
                j.description,
                j.employment_type,
                j.remote_type,
                j.location,
                j.salary_min,
                j.salary_max,
                j.salary_currency,
                j.salary_is_visible,
                j.experience_min_years,
                j.experience_max_years,
                j.benefits,
                j.posted_at,
                j.deadline,
                j.department,
                j.applications_count,
                c.company_id,
                c.company_name,
                c.logo_url,
                c.industry,
                c.headquarters_location AS company_location,
                {score_select}
            FROM jobs j
            JOIN companies c ON c.company_id = j.company_id
            {join_embeddings}
            WHERE {where_sql}
            ORDER BY j.posted_at DESC NULLS LAST
            LIMIT :limit OFFSET :offset
        """)

        result = await self.db.execute(query, params)
        rows = result.mappings().all()

        jobs = []
        for row in rows:
            job = dict(row)
            job["match_score"] = float(job["match_score"]) if job["match_score"] else None
            job["salary_min"] = float(job["salary_min"]) if job["salary_min"] else None
            job["salary_max"] = float(job["salary_max"]) if job["salary_max"] else None
            job["skills"] = await self._get_job_skills(job["job_id"])
            jobs.append(job)

        return jobs

    async def get_job_detail(self, job_id: int, student_id: Optional[int] = None) -> Optional[dict]:
        """Fetch a single job with full detail + optional match score."""
        if student_id:
            score_select = """
                ROUND((1.0 - (je.embedding <=> se.embedding))::numeric, 4) AS match_score
            """
            join_embeddings = """
                LEFT JOIN job_embeddings je ON je.job_id = j.job_id
                LEFT JOIN student_embeddings se ON se.student_id = :student_id
            """
            params = {"job_id": job_id, "student_id": student_id}
        else:
            score_select = "NULL AS match_score"
            join_embeddings = ""
            params = {"job_id": job_id}

        query = text(f"""
            SELECT
                j.*,
                c.company_id,
                c.company_name,
                c.logo_url,
                c.industry,
                c.website_url AS company_website,
                c.headquarters_location AS company_location,
                c.company_size,
                c.description AS company_description,
                {score_select}
            FROM jobs j
            JOIN companies c ON c.company_id = j.company_id
            {join_embeddings}
            WHERE j.job_id = :job_id
        """)

        result = await self.db.execute(query, params)
        row = result.mappings().first()
        if not row:
            return None

        job = dict(row)
        job["match_score"] = float(job["match_score"]) if job["match_score"] else None
        job["salary_min"] = float(job["salary_min"]) if job["salary_min"] else None
        job["salary_max"] = float(job["salary_max"]) if job["salary_max"] else None
        job["price_per_candidate"] = float(job["price_per_candidate"]) if job.get("price_per_candidate") else None
        job["skills"] = await self._get_job_skills(job["job_id"])
        return job

    async def check_student_applied(self, student_id: int, job_id: int) -> bool:
        """Check if student already applied to a job."""
        result = await self.db.execute(
            text("SELECT 1 FROM applications WHERE student_id = :sid AND job_id = :jid"),
            {"sid": student_id, "jid": job_id},
        )
        return result.scalar() is not None

    async def _get_job_skills(self, job_id: int) -> list[dict]:
        """Get skills for a job."""
        result = await self.db.execute(
            text("""
                SELECT s.skill_id, s.name, js.is_mandatory, js.min_experience_years
                FROM job_skills js
                JOIN skills s ON js.skill_id = s.skill_id
                WHERE js.job_id = :job_id
            """),
            {"job_id": job_id},
        )
        return [dict(r) for r in result.mappings().all()]
