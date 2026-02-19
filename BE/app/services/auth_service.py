"""Authentication service — JWT token creation and password verification."""

from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.models.user import User, Student, Company
from app.models.course import Enrollment, Course, LessonProgress, Lesson

import logging
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _truncate_password(password: str) -> str:
    """
    Bcrypt has a hard limit of 72 bytes.
    Truncate to 72 bytes to avoid ValueError in bcrypt/passlib.
    """
    pw_bytes = password.encode("utf-8")
    if len(pw_bytes) > 72:
        return pw_bytes[:72].decode("utf-8", "ignore")
    return password


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against bcrypt hash.
    Bcrypt has a hard limit of 72 bytes. Passwords longer than this
    must be truncated to avoid ValueError in passlib/bcrypt.
    """
    return pwd_context.verify(_truncate_password(plain_password), hashed_password)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt (truncates to 72 bytes first)."""
    return pwd_context.hash(_truncate_password(password))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def _build_user_data(user: User) -> dict:
    """Build the standard user data dict from a User ORM object."""
    user_data = {
        "user_id": user.user_id,
        "email": user.email,
        "user_type": user.user_type,
        "status": user.status,
        "onboarding_completed": user.onboarding_completed,
        "student_id": None,
        "first_name": None,
        "last_name": None,
        "headline": None,
        "profile_picture_url": None,
        "company_id": None,
        "company_name": None,
        "logo_url": None,
    }

    if user.student:
        user_data["student_id"] = user.student.student_id
        user_data["first_name"] = user.student.first_name
        user_data["last_name"] = user.student.last_name
        user_data["headline"] = user.student.headline
        user_data["profile_picture_url"] = user.student.profile_picture_url

    if user.company:
        user_data["company_id"] = user.company.company_id
        user_data["company_name"] = user.company.company_name
        user_data["logo_url"] = user.company.logo_url

    return user_data


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate_user(self, email: str, password: str) -> Optional[dict]:
        """Authenticate user by email and password. Returns user data or None."""
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.student), selectinload(User.company))
            .where(User.email == email)
        )
        user = result.scalar_one_or_none()

        if not user:
            return None

        if not verify_password(password, user.password_hash):
            return None

        if user.status != "active":
            return None

        # Update last login
        user.last_login_at = datetime.utcnow()
        await self.db.commit()

        return _build_user_data(user)

    async def get_user_by_id(self, user_id: int) -> Optional[dict]:
        """Get user data by user_id (for token validation)."""
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.student), selectinload(User.company))
            .where(User.user_id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            return None

        return _build_user_data(user)

    async def register_student(self, email: str, password: str, first_name: str, last_name: str) -> dict:
        """Register a new student user. Returns user data dict."""
        # Check existing email
        existing = await self.db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            raise ValueError("Email already registered")

        user = User(
            email=email,
            password_hash=hash_password(password),
            user_type="student",
            status="active",
            email_verified=False,
            onboarding_completed=False,
        )
        self.db.add(user)
        await self.db.flush()

        student = Student(
            user_id=user.user_id,
            first_name=first_name,
            last_name=last_name,
        )
        self.db.add(student)
        await self.db.flush()

        # Trigger Welcome Notification (Email + In-App)
        try:
            from app.services.notification_service import create_notification
            await create_notification(
                user_id=user.user_id,
                email=email,
                notification_type="welcome",
                title="Welcome to SkillBridge! 🎉",
                body=f"Hi {first_name}, thank you for joining our platform. We're excited to help you grow your career!",
                workflow_id="onboarding-demo-workflow"
            )
        except Exception as e:
            logger.warning(f"Registration notification failed: {e}")

        # Reload with relationships
        await self.db.refresh(user, ["student", "company"])
        return _build_user_data(user)

    async def register_company(self, email: str, password: str, company_name: str) -> dict:
        """Register a new company user. Returns user data dict."""
        existing = await self.db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            raise ValueError("Email already registered")

        # Check company name uniqueness
        existing_company = await self.db.execute(
            select(Company).where(Company.company_name == company_name)
        )
        if existing_company.scalar_one_or_none():
            raise ValueError("Company name already taken")

        user = User(
            email=email,
            password_hash=hash_password(password),
            user_type="company",
            status="active",
            email_verified=False,
            onboarding_completed=False,
        )
        self.db.add(user)
        await self.db.flush()

        company = Company(
            user_id=user.user_id,
            company_name=company_name,
        )
        self.db.add(company)
        await self.db.flush()

        # Trigger Welcome Notification (Email + In-App)
        try:
            from app.services.notification_service import create_notification
            await create_notification(
                user_id=user.user_id,
                email=email,
                notification_type="welcome",
                title="Welcome to SkillBridge for Business! 🏢",
                body=f"Hi {company_name}, thank you for joining. Start posting jobs and finding top talent today!",
                workflow_id="onboarding-demo-workflow"
            )
        except Exception as e:
            logger.warning(f"Registration notification failed: {e}")

        await self.db.refresh(user, ["student", "company"])
        return _build_user_data(user)

    async def update_student_onboarding(self, user_id: int, data: dict) -> dict:
        """Update student profile from onboarding wizard and mark onboarding complete."""
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.student), selectinload(User.company))
            .where(User.user_id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user or not user.student:
            raise ValueError("Student not found")

        student = user.student

        # Update phone on user if provided
        if data.get("phone"):
            user.phone = data["phone"]

        # Update student fields
        student_fields = [
            "headline", "bio", "location", "education", "experience_years",
            "availability_status", "preferred_job_types", "preferred_locations",
            "preferred_remote_types", "salary_expectation_min", "salary_expectation_max",
            "salary_currency", "notice_period_days",
            "linkedin_url", "github_url", "portfolio_url", "personal_website",
        ]
        for field in student_fields:
            if field in data and data[field] is not None:
                setattr(student, field, data[field])

        user.onboarding_completed = True
        user.updated_at = datetime.utcnow()
        student.updated_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(user, ["student", "company"])
        return _build_user_data(user)

    async def update_company_onboarding(self, user_id: int, data: dict) -> dict:
        """Update company profile from onboarding wizard and mark onboarding complete."""
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.student), selectinload(User.company))
            .where(User.user_id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user or not user.company:
            raise ValueError("Company not found")

        company = user.company
        company_fields = [
            "description", "industry", "company_size", "founded_year",
            "headquarters_location", "website_url", "contact_email", "contact_phone",
            "linkedin_url", "twitter_url", "billing_email", "gst_number", "billing_address",
        ]
        for field in company_fields:
            if field in data and data[field] is not None:
                setattr(company, field, data[field])

        user.onboarding_completed = True
        user.updated_at = datetime.utcnow()
        company.updated_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(user, ["student", "company"])
        return _build_user_data(user)

    async def get_student_profile(self, user_id: int) -> dict:
        """Get full student profile data."""
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.student), selectinload(User.company))
            .where(User.user_id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user or not user.student:
            raise ValueError("Student not found")

        s = user.student
        return {
            "user_id": user.user_id,
            "email": user.email,
            "phone": user.phone,
            "student_id": s.student_id,
            "first_name": s.first_name,
            "last_name": s.last_name,
            "bio": s.bio,
            "headline": s.headline,
            "location": s.location,
            "education": s.education,
            "experience_years": s.experience_years,
            "profile_picture_url": s.profile_picture_url,
            "resume_url": s.resume_url,
            "cover_letter_url": s.cover_letter_url,
            "availability_status": s.availability_status,
            "preferred_job_types": s.preferred_job_types or [],
            "preferred_locations": s.preferred_locations or [],
            "preferred_remote_types": s.preferred_remote_types or [],
            "salary_expectation_min": float(s.salary_expectation_min) if s.salary_expectation_min else None,
            "salary_expectation_max": float(s.salary_expectation_max) if s.salary_expectation_max else None,
            "salary_currency": s.salary_currency,
            "notice_period_days": s.notice_period_days,
            "linkedin_url": s.linkedin_url,
            "github_url": s.github_url,
            "portfolio_url": s.portfolio_url,
            "personal_website": s.personal_website,
            "total_courses_enrolled": s.total_courses_enrolled,
            "total_courses_completed": s.total_courses_completed,
            "total_learning_hours": float(s.total_learning_hours or 0),
            "average_quiz_score": float(s.average_quiz_score or 0),
            "streak_days": s.streak_days or 0,
        }

    async def update_student_profile(self, user_id: int, data: dict) -> dict:
        """Update student profile fields (from profile edit page)."""
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.student), selectinload(User.company))
            .where(User.user_id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user or not user.student:
            raise ValueError("Student not found")

        student = user.student

        # User-level fields
        if "phone" in data and data["phone"] is not None:
            user.phone = data["phone"]

        # Student fields
        student_fields = [
            "first_name", "last_name", "headline", "bio", "location", "education",
            "experience_years", "availability_status",
            "preferred_job_types", "preferred_locations", "preferred_remote_types",
            "salary_expectation_min", "salary_expectation_max", "salary_currency",
            "notice_period_days",
            "linkedin_url", "github_url", "portfolio_url", "personal_website",
        ]
        for field in student_fields:
            if field in data and data[field] is not None:
                setattr(student, field, data[field])

        user.updated_at = datetime.utcnow()
        student.updated_at = datetime.utcnow()
        await self.db.flush()

        return await self.get_student_profile(user_id)

    async def get_company_profile(self, user_id: int) -> dict:
        """Get full company profile data."""
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.student), selectinload(User.company))
            .where(User.user_id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user or not user.company:
            raise ValueError("Company not found")

        c = user.company
        return {
            "user_id": user.user_id,
            "email": user.email,
            "phone": user.phone,
            "company_id": c.company_id,
            "company_name": c.company_name,
            "description": c.description,
            "industry": c.industry,
            "company_size": c.company_size,
            "founded_year": c.founded_year,
            "headquarters_location": c.headquarters_location,
            "logo_url": c.logo_url,
            "banner_url": c.banner_url,
            "website_url": c.website_url,
            "contact_email": c.contact_email,
            "contact_phone": c.contact_phone,
            "linkedin_url": c.linkedin_url,
            "twitter_url": c.twitter_url,
            "is_verified": c.is_verified,
            "billing_email": c.billing_email,
            "gst_number": c.gst_number,
            "billing_address": c.billing_address,
            "total_jobs_posted": c.total_jobs_posted,
            "total_hires": c.total_hires,
        }

    async def update_company_profile(self, user_id: int, data: dict) -> dict:
        """Update company profile fields."""
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.student), selectinload(User.company))
            .where(User.user_id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user or not user.company:
            raise ValueError("Company not found")

        company = user.company

        if "phone" in data and data["phone"] is not None:
            user.phone = data["phone"]

        company_fields = [
            "company_name", "description", "industry", "company_size",
            "founded_year", "headquarters_location",
            "website_url", "contact_email", "contact_phone",
            "linkedin_url", "twitter_url",
            "billing_email", "gst_number", "billing_address",
        ]
        for field in company_fields:
            if field in data and data[field] is not None:
                setattr(company, field, data[field])

        user.updated_at = datetime.utcnow()
        company.updated_at = datetime.utcnow()
        await self.db.flush()

        return await self.get_company_profile(user_id)

    async def get_student_dashboard(self, user_id: int) -> dict:
        """Get aggregated dashboard data for a student from real DB."""
        # Get student
        result = await self.db.execute(
            select(User).options(selectinload(User.student)).where(User.user_id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user or not user.student:
            raise ValueError("Student not found")

        student = user.student

        # Get enrollments with course info
        enrollments_result = await self.db.execute(
            select(Enrollment)
            .options(selectinload(Enrollment.course))
            .where(Enrollment.student_id == student.student_id)
            .order_by(Enrollment.enrolled_at.desc())
        )
        enrollments = enrollments_result.scalars().all()

        enrolled_courses = []
        completed_count = 0
        for enrollment in enrollments:
            course = enrollment.course
            if not course:
                continue

            # Count completed lessons for this enrollment
            completed_lessons_result = await self.db.execute(
                select(func.count()).select_from(LessonProgress).where(
                    LessonProgress.enrollment_id == enrollment.enrollment_id,
                    LessonProgress.is_completed == True,
                )
            )
            completed_lessons = completed_lessons_result.scalar() or 0

            # Count total lessons in course
            total_lessons_result = await self.db.execute(
                select(func.count()).select_from(Lesson).join(
                    Lesson.module
                ).where(
                    Lesson.module.has(course_id=course.course_id)
                )
            )
            total_lessons = total_lessons_result.scalar() or 0

            progress_pct = float(enrollment.progress_percentage) if enrollment.progress_percentage else 0.0

            if enrollment.status == "completed":
                completed_count += 1

            enrolled_courses.append({
                "course_id": course.course_id,
                "title": course.title,
                "slug": course.slug,
                "thumbnail_url": course.thumbnail_url,
                "progress_percentage": progress_pct,
                "total_lessons": total_lessons,
                "completed_lessons": completed_lessons,
                "last_accessed_at": (enrollment.started_at or enrollment.enrolled_at).isoformat() if (enrollment.started_at or enrollment.enrolled_at) else None,
            })

        # Get recent activity from MongoDB
        recent_activity = []
        try:
            from app.db.mongodb import get_mongo_db
            mongo_db = await get_mongo_db()
            activities = await mongo_db.learning_activities.find(
                {"student_id": student.student_id}
            ).sort("timestamp", -1).limit(10).to_list(10)

            for act in activities:
                recent_activity.append({
                    "activity_type": act.get("activity_type", ""),
                    "description": _format_activity(act),
                    "course_name": act.get("course_title", ""),
                    "timestamp": act.get("timestamp", datetime.utcnow()).isoformat() if act.get("timestamp") else "",
                })
        except Exception:
            pass  # MongoDB may not have data yet

        # Get learning hours by month from MongoDB
        learning_hours_by_month = []
        try:
            from app.db.mongodb import get_mongo_db
            mongo_db = await get_mongo_db()
            pipeline = [
                {"$match": {"student_id": student.student_id}},
                {"$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m", "date": "$timestamp"}},
                    "total_seconds": {"$sum": "$details.time_spent_seconds"}
                }},
                {"$sort": {"_id": 1}},
                {"$limit": 6},
            ]
            results = await mongo_db.learning_activities.aggregate(pipeline).to_list(6)
            for r in results:
                month_str = r["_id"] if r["_id"] else ""
                hours = round((r.get("total_seconds") or 0) / 3600, 1)
                learning_hours_by_month.append({"month": month_str, "hours": hours})
        except Exception:
            pass

        return {
            "first_name": student.first_name,
            "last_name": student.last_name,
            "stats": {
                "enrolled_courses": len(enrollments),
                "completed_courses": completed_count,
                "total_learning_hours": float(student.total_learning_hours or 0),
                "average_quiz_score": float(student.average_quiz_score or 0),
                "streak_days": student.streak_days or 0,
            },
            "enrolled_courses": enrolled_courses,
            "recent_activity": recent_activity,
            "learning_hours_by_month": learning_hours_by_month,
        }


def _format_activity(act: dict) -> str:
    """Format a MongoDB learning activity into a human-readable description."""
    atype = act.get("activity_type", "")
    mapping = {
        "lesson_started": "Started a lesson",
        "lesson_completed": "Completed a lesson",
        "video_watched": "Watched a video",
        "quiz_submitted": "Submitted a quiz",
        "flashcard_interaction": "Reviewed flashcards",
        "resource_downloaded": "Downloaded a resource",
        "course_enrolled": "Enrolled in a course",
        "course_completed": "Completed a course",
        "document_viewed": "Viewed a document",
    }
    return mapping.get(atype, atype.replace("_", " ").title())
