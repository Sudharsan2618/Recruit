"""Pydantic schemas for admin-only operations."""

from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, EmailStr, Field, model_validator


class CourseAccessGrantRequest(BaseModel):
    """Admin grants a user (student) access to a course with a start/end window."""
    user_id: int
    access_starts_at: Optional[datetime] = None  # null = available immediately
    expires_at: Optional[datetime] = None         # null = no end date


class CourseAccessUpdateRequest(BaseModel):
    """Admin updates/extends an existing grant's window."""
    access_starts_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class AdminCreateUserRequest(BaseModel):
    """Admin creates a student or company account with a temporary password."""
    email: EmailStr
    user_type: Literal["student", "company"]
    # Student fields
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    # Company field
    company_name: Optional[str] = Field(None, max_length=255)

    @model_validator(mode="after")
    def _check_role_fields(self):
        if self.user_type == "student":
            if not (self.first_name and self.first_name.strip()) or not (
                self.last_name and self.last_name.strip()
            ):
                raise ValueError("first_name and last_name are required for students")
        elif self.user_type == "company":
            if not (self.company_name and self.company_name.strip()):
                raise ValueError("company_name is required for companies")
        return self


class AdminCreateUserResponse(BaseModel):
    user_id: int
    email: str
    user_type: str
    name: str
    temp_password: str
