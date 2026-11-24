"""Admin user provisioning — create accounts with a temporary password."""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, Student, Company
from app.services.auth_service import hash_password
from app.utils.password import generate_temp_password

logger = logging.getLogger(__name__)


class AdminUserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user_with_temp_password(
        self,
        email: str,
        user_type: str,
        first_name: str | None = None,
        last_name: str | None = None,
        company_name: str | None = None,
    ) -> dict:
        """Create an active student/company account with a one-time temp password.

        The account is flagged ``must_reset_password`` so the user is forced to
        set their own password on first login. Returns the created user's basic
        info plus the plaintext temp password (shown once to the admin).

        Raises ValueError on validation / uniqueness failures.
        """
        email = email.strip().lower()

        existing = await self.db.execute(select(User).where(User.email == email))
        if existing.scalar_one_or_none():
            raise ValueError("Email already registered")

        if user_type == "company":
            dup = await self.db.execute(
                select(Company).where(Company.company_name == company_name)
            )
            if dup.scalar_one_or_none():
                raise ValueError("Company name already taken")

        temp_password = generate_temp_password()

        user = User(
            email=email,
            password_hash=hash_password(temp_password),
            user_type=user_type,
            status="active",
            email_verified=False,
            onboarding_completed=False,
            must_reset_password=True,
        )
        self.db.add(user)
        await self.db.flush()

        if user_type == "student":
            self.db.add(Student(
                user_id=user.user_id,
                first_name=first_name.strip(),
                last_name=last_name.strip(),
            ))
            name = f"{first_name.strip()} {last_name.strip()}".strip()
        else:
            self.db.add(Company(
                user_id=user.user_id,
                company_name=company_name.strip(),
            ))
            name = company_name.strip()

        await self.db.flush()
        logger.info("[ADMIN] Provisioned %s account user_id=%s", user_type, user.user_id)

        return {
            "user_id": user.user_id,
            "email": user.email,
            "user_type": user.user_type,
            "name": name,
            "temp_password": temp_password,
        }
