"""Schemas for the Resume Score Report — a hiring-intelligence analysis of a
student's resume against a target job or role.

Mirrors the reference report format (see GitHub issue #2). The LLM produces
everything in `ResumeScoreLLM`; the server sets `meta` and wraps it into
`ResumeScoreReport`.
"""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


Decision = Literal["advance", "interview", "hold", "reject"]
Confidence = Literal["low", "medium", "high"]


# ── Building blocks ────────────────────────────────────────────────────────

class ScoreBreakdown(BaseModel):
    """The four headline scores, each 0–100."""
    match_score: int = Field(default=0, ge=0, le=100, description="Overall resume↔target fit")
    ats_score: int = Field(default=0, ge=0, le=100, description="ATS keyword / structure coverage")
    skills_score: int = Field(default=0, ge=0, le=100, description="Required-skill coverage")
    experience_score: int = Field(default=0, ge=0, le=100, description="Seniority / years / scope fit")


class HiringIntelligence(BaseModel):
    decision: Decision = Field(default="hold")
    confidence: Confidence = Field(default="low")
    market_position: str = Field(default="", description="Short percentile band vs comparable applicants, e.g. 'Bottom 25%'")


class TitledPoint(BaseModel):
    """A short claim plus supporting evidence / consequence."""
    title: str = ""
    detail: str = ""


class SkillIntelligence(BaseModel):
    exact_matches: list[str] = Field(default_factory=list, description="Required skills clearly evidenced")
    missing: list[str] = Field(default_factory=list, description="Required-but-absent skills")
    transferable_summary: str = Field(default="", description="How existing skills bridge the gaps")


class RewriteSuggestion(BaseModel):
    before: str = ""
    after: str = ""
    reason: str = ""


class CoachingItem(BaseModel):
    question: str = ""
    guidance: str = ""


class WeeklyPlanItem(BaseModel):
    label: str = Field(default="", description="e.g. 'Week 1'")
    focus: str = ""
    detail: str = ""


class DailyPlanItem(BaseModel):
    label: str = Field(default="", description="e.g. 'Day 1'")
    task: str = ""


class ImprovementPlan(BaseModel):
    weekly: list[WeeklyPlanItem] = Field(default_factory=list)
    daily: list[DailyPlanItem] = Field(default_factory=list)


class InterviewRisk(BaseModel):
    risks: list[TitledPoint] = Field(default_factory=list)
    mitigations: list[str] = Field(default_factory=list)
    closing_advice: str = ""


# ── LLM output + full report ───────────────────────────────────────────────

class ResumeScoreLLM(BaseModel):
    """Everything the LLM generates. Server-managed `meta` is added separately."""
    verdict_summary: str = Field(default="", description="2–4 sentence overall verdict")
    scores: ScoreBreakdown = Field(default_factory=ScoreBreakdown)
    hiring_intelligence: HiringIntelligence = Field(default_factory=HiringIntelligence)
    core_strengths: list[TitledPoint] = Field(default_factory=list)
    critical_gaps: list[TitledPoint] = Field(default_factory=list)
    skill_intelligence: SkillIntelligence = Field(default_factory=SkillIntelligence)
    ats_keywords: list[str] = Field(default_factory=list)
    rewrite_suggestions: list[RewriteSuggestion] = Field(default_factory=list)
    interview_coaching: list[CoachingItem] = Field(default_factory=list)
    improvement_plan: ImprovementPlan = Field(default_factory=ImprovementPlan)
    interview_risk: InterviewRisk = Field(default_factory=InterviewRisk)


class ReportMeta(BaseModel):
    target_role: str = ""
    seniority: Optional[str] = None
    industry: Optional[str] = None
    job_id: Optional[int] = None
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    generated_at: Optional[str] = None


class ResumeScoreReport(ResumeScoreLLM):
    meta: ReportMeta = Field(default_factory=ReportMeta)


# ── Request models ─────────────────────────────────────────────────────────

class TargetContext(BaseModel):
    """Manual target when scoring without a specific Job posting."""
    role: str = Field(..., min_length=2, description="Target role, e.g. 'AI Engineer'")
    seniority: Optional[str] = Field(default=None, description="e.g. 'Lead', 'Senior', 'Entry'")
    industry: Optional[str] = Field(default=None, description="e.g. 'Fintech'")


class ScoreRequest(BaseModel):
    """Score against a Job on the board (job_id) OR a manual target."""
    job_id: Optional[int] = None
    target: Optional[TargetContext] = None
