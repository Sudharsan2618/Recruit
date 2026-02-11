"""
SQLAlchemy models for user-related tables.
Maps to DB/001_postgresql_schema.sql SECTION 2.
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Boolean, DateTime, Enum, Integer, Numeric, String, Text, ForeignKey,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.db.postgres import Base


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    user_type: Mapped[str] = mapped_column(
        Enum("student", "company", "admin", "instructor", "mentor",
             name="user_type", create_type=False),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        Enum("active", "inactive", "suspended", "pending_verification",
             name="user_status", create_type=False),
        default="pending_verification",
    )
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    # Relationships
    student: Mapped[Optional["Student"]] = relationship(back_populates="user", uselist=False)


class Student(Base):
    __tablename__ = "students"

    student_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    bio: Mapped[Optional[str]] = mapped_column(Text)
    headline: Mapped[Optional[str]] = mapped_column(String(255))
    location: Mapped[Optional[str]] = mapped_column(String(255))
    education: Mapped[Optional[str]] = mapped_column(Text)
    experience_years: Mapped[int] = mapped_column(Integer, default=0)
    profile_picture_url: Mapped[Optional[str]] = mapped_column(String(500))
    resume_url: Mapped[Optional[str]] = mapped_column(String(500))
    availability_status: Mapped[bool] = mapped_column(Boolean, default=True)
    salary_expectation_min: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
    salary_expectation_max: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
    total_courses_enrolled: Mapped[int] = mapped_column(Integer, default=0)
    total_courses_completed: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="student")
