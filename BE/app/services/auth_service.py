"""Authentication service — JWT token creation and password verification."""

from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.models.user import User, Student

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


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


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate_user(self, email: str, password: str) -> Optional[dict]:
        """Authenticate user by email and password. Returns user data or None."""
        # Fetch user with student relationship
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.student))
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

        # Build response
        user_data = {
            "user_id": user.user_id,
            "email": user.email,
            "user_type": user.user_type,
            "status": user.status,
            "student_id": None,
            "first_name": None,
            "last_name": None,
            "headline": None,
            "profile_picture_url": None,
        }

        if user.student:
            user_data["student_id"] = user.student.student_id
            user_data["first_name"] = user.student.first_name
            user_data["last_name"] = user.student.last_name
            user_data["headline"] = user.student.headline
            user_data["profile_picture_url"] = user.student.profile_picture_url

        return user_data

    async def get_user_by_id(self, user_id: int) -> Optional[dict]:
        """Get user data by user_id (for token validation)."""
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.student))
            .where(User.user_id == user_id)
        )
        user = result.scalar_one_or_none()
        if not user:
            return None

        user_data = {
            "user_id": user.user_id,
            "email": user.email,
            "user_type": user.user_type,
            "status": user.status,
            "student_id": None,
            "first_name": None,
            "last_name": None,
            "headline": None,
            "profile_picture_url": None,
        }

        if user.student:
            user_data["student_id"] = user.student.student_id
            user_data["first_name"] = user.student.first_name
            user_data["last_name"] = user.student.last_name
            user_data["headline"] = user.student.headline
            user_data["profile_picture_url"] = user.student.profile_picture_url

        return user_data
