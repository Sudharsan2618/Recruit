"""Pydantic schemas for student-facing job endpoints."""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


# ── Skill in job listing ─────────────────────────────────────────────────

class SkillBrief(BaseModel):
    skill_id: int
    name: str
    is_mandatory: bool = True
    min_experience_years: Optional[int] = None


# ── Company brief (shown on job cards) ───────────────────────────────────

class CompanyBrief(BaseModel):
    company_id: int
    company_name: str
    logo_url: Optional[str] = None
    industry: Optional[str] = None
    company_location: Optional[str] = None


# ── Job listing (card view) ──────────────────────────────────────────────

class JobListItem(BaseModel):
    job_id: int
    title: str
    slug: str
    description: str
    employment_type: str
    remote_type: str
    location: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: str = "INR"
    salary_is_visible: bool = False
    experience_min_years: int = 0
    experience_max_years: Optional[int] = None
    benefits: Optional[list[str]] = None
    posted_at: Optional[datetime] = None
    deadline: Optional[datetime] = None
    department: Optional[str] = None
    applications_count: int = 0
    match_score: Optional[float] = None
    skills: list[SkillBrief] = []
    company: CompanyBrief

    class Config:
        from_attributes = True


# ── Job detail (full view) ───────────────────────────────────────────────

class CompanyDetail(CompanyBrief):
    company_website: Optional[str] = None
    company_size: Optional[str] = None
    company_description: Optional[str] = None


class JobDetail(BaseModel):
    job_id: int
    title: str
    slug: str
    description: str
    responsibilities: Optional[str] = None
    requirements: Optional[str] = None
    nice_to_have: Optional[str] = None
    employment_type: str
    remote_type: str
    location: Optional[str] = None
    department: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: str = "INR"
    salary_is_visible: bool = False
    experience_min_years: int = 0
    experience_max_years: Optional[int] = None
    benefits: Optional[list[str]] = None
    posted_at: Optional[datetime] = None
    deadline: Optional[datetime] = None
    applications_count: int = 0
    match_score: Optional[float] = None
    has_applied: bool = False
    skills: list[SkillBrief] = []
    company: CompanyDetail

    class Config:
        from_attributes = True


# ── Apply request / response ─────────────────────────────────────────────

class ApplyRequest(BaseModel):
    cover_letter: Optional[str] = None
    expected_salary: Optional[float] = None
    notice_period_days: Optional[int] = None


class ApplicationOut(BaseModel):
    application_id: int
    job_id: int
    status: str
    cover_letter: Optional[str] = None
    expected_salary: Optional[float] = None
    notice_period_days: Optional[int] = None
    applied_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Job info (for student's "My Applications" view)
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    company_logo: Optional[str] = None
    match_score: Optional[float] = None

    class Config:
        from_attributes = True


# ── Response wrappers ────────────────────────────────────────────────────

class JobListResponse(BaseModel):
    jobs: list[JobListItem]
    total: int = 0

class RecommendedJobsResponse(BaseModel):
    jobs: list[JobListItem]
    threshold: float
    total: int = 0

class MyApplicationsResponse(BaseModel):
    applications: list[ApplicationOut]
    total: int = 0
