"""Resume Score Report service — scores a student's resume against a target
job/role and returns a full hiring-intelligence report (see GitHub issue #2).

Pipeline: stored resume text + target context (Job or manual role) → Gemini
(structured JSON) → validated/clamped `ResumeScoreReport` → persisted to the
`resume_reports` Mongo collection (latest per student+target).
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Optional

from app.config import settings
from app.db.mongodb import get_mongodb, to_bson_datetime
from app.schemas.resume_report import ResumeScoreLLM, ResumeScoreReport, ReportMeta


# ── System prompt (reverse-engineered from the reference report output) ─────

SCORE_SYSTEM_PROMPT = """You are an elite technical recruiter, ATS system, and interview coach combined.
Given a candidate RESUME and a TARGET (a job description with required skills, or a role/seniority/industry),
produce a rigorous, brutally honest Resume Score Report as STRICT JSON matching the provided schema. Output JSON only.

Scoring — integers 0-100, calibrated against THIS target, not in the abstract:
- skills_score: coverage of the target's REQUIRED skills by concrete, evidenced skills in the resume. Penalize claimed-but-unevidenced skills.
- experience_score: fit of years + scope + seniority to the target. A strong individual contributor applying to a Lead/Senior role must score LOW here.
- ats_score: presence of the target's key ATS keywords/phrasing and machine-parseable structure.
- match_score: holistic hire-fit for THIS target. It must be consistent with the other three scores and with the decision.

hiring_intelligence:
- decision is one of: advance, interview, hold, reject.
- confidence is one of: low, medium, high.
- market_position: a short percentile band vs comparable applicants (e.g. "Bottom 25%", "Top 10%").

Content rules:
- verdict_summary: 2-4 sentences; lead with the decisive factor. Name real red flags explicitly (e.g. impossible/future employment dates, seniority mismatch, unexplained gaps).
- core_strengths and critical_gaps: each item is {title, detail}; title = a short claim, detail = specific evidence or the concrete consequence for THIS target.
- skill_intelligence: exact_matches = required skills clearly evidenced; missing = required-but-absent; transferable_summary = how existing skills bridge the gaps.
- ats_keywords: important target keywords the resume is missing or under-weights.
- interview_coaching: likely interview questions for THIS candidate and target, each with guidance on what a strong answer covers. Do not repeat questions.
- improvement_plan: an actionable ramp — weekly[] themes ({label like "Week 1", focus, detail}) plus daily[] tasks ({label like "Day 1", task}) — targeting the top gaps.
- interview_risk: risks that could sink the interview ({title, detail}), concrete mitigations (strings), and closing_advice on how to frame the interview overall.
- rewrite_suggestions: only real, specific resume-bullet rewrites ({before, after, reason}); if none, return an empty list.

Never invent experience the resume does not support. Be specific, evidence-bound, and calibrated to the TARGET."""


# ── LLM setup (lazy) ────────────────────────────────────────────────────────

_score_llm = None


def _get_score_llm():
    global _score_llm
    if _score_llm is not None:
        return _score_llm

    from langchain_google_genai import ChatGoogleGenerativeAI

    llm = ChatGoogleGenerativeAI(
        model=settings.GEMINI_MODEL,
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.2,
        max_retries=2,
    )
    _score_llm = llm.with_structured_output(
        schema=ResumeScoreLLM.model_json_schema(),
        method="json_schema",
    )
    return _score_llm


# ── Target context ──────────────────────────────────────────────────────────

def normalize_job_target(job: dict) -> dict:
    """Normalize a MatchingService.get_job_detail() dict into a target context."""
    skills = job.get("skills") or []
    skill_names = [s.get("name") for s in skills if isinstance(s, dict) and s.get("name")]
    mandatory = [
        s.get("name") for s in skills
        if isinstance(s, dict) and s.get("name") and s.get("is_mandatory")
    ]
    return {
        "role": job.get("title") or "",
        "seniority": None,
        "industry": job.get("industry"),
        "job_id": job.get("job_id"),
        "job_title": job.get("title"),
        "company_name": job.get("company_name"),
        "description": job.get("description") or "",
        "responsibilities": job.get("responsibilities") or "",
        "requirements": job.get("requirements") or "",
        "nice_to_have": job.get("nice_to_have") or "",
        "experience_min_years": job.get("experience_min_years"),
        "experience_max_years": job.get("experience_max_years"),
        "required_skills": skill_names,
        "mandatory_skills": mandatory,
    }


def normalize_manual_target(target: dict) -> dict:
    """Normalize a manual {role, seniority, industry} target context."""
    return {
        "role": target.get("role") or "",
        "seniority": target.get("seniority"),
        "industry": target.get("industry"),
        "job_id": None,
        "job_title": None,
        "company_name": None,
        "description": "",
        "responsibilities": "",
        "requirements": "",
        "nice_to_have": "",
        "experience_min_years": None,
        "experience_max_years": None,
        "required_skills": [],
        "mandatory_skills": [],
    }


def build_target_text(ctx: dict) -> str:
    """Render the target context into a prompt block."""
    lines: list[str] = []
    role = ctx.get("role") or "(unspecified role)"
    seniority = ctx.get("seniority")
    lines.append(f"Target role: {role}" + (f" (seniority: {seniority})" if seniority else ""))
    if ctx.get("industry"):
        lines.append(f"Industry: {ctx['industry']}")
    if ctx.get("company_name"):
        lines.append(f"Company: {ctx['company_name']}")
    exp_min = ctx.get("experience_min_years")
    exp_max = ctx.get("experience_max_years")
    if exp_min is not None:
        rng = f"{exp_min}+" if not exp_max else f"{exp_min}-{exp_max}"
        lines.append(f"Experience expected: {rng} years")
    if ctx.get("required_skills"):
        lines.append("Required skills: " + ", ".join(ctx["required_skills"]))
    if ctx.get("mandatory_skills"):
        lines.append("Mandatory skills: " + ", ".join(ctx["mandatory_skills"]))
    for label, key in (("Description", "description"), ("Responsibilities", "responsibilities"),
                       ("Requirements", "requirements"), ("Nice to have", "nice_to_have")):
        val = (ctx.get(key) or "").strip()
        if val:
            lines.append(f"{label}:\n{val}")
    return "\n".join(lines)


def target_key(ctx: dict) -> str:
    """Stable key for one student's report against a given target."""
    if ctx.get("job_id"):
        return f"job_{ctx['job_id']}"
    slug = "_".join(
        re.sub(r"[^a-z0-9]+", "-", (part or "").lower()).strip("-")
        for part in (ctx.get("role"), ctx.get("seniority"), ctx.get("industry"))
        if part
    )
    return f"role_{slug or 'generic'}"


# ── Normalization helpers ───────────────────────────────────────────────────

def _clamp_scores(data: dict) -> None:
    scores = data.get("scores")
    if isinstance(scores, dict):
        for k in ("match_score", "ats_score", "skills_score", "experience_score"):
            v = scores.get(k)
            try:
                scores[k] = max(0, min(100, int(round(float(v)))))
            except (TypeError, ValueError):
                scores[k] = 0


def _dedupe_coaching(data: dict) -> None:
    items = data.get("interview_coaching")
    if not isinstance(items, list):
        return
    seen: set[str] = set()
    unique = []
    for item in items:
        if not isinstance(item, dict):
            continue
        q = (item.get("question") or "").strip().lower()
        if not q or q in seen:
            continue
        seen.add(q)
        unique.append(item)
    data["interview_coaching"] = unique


# ── Core scoring ─────────────────────────────────────────────────────────────

async def score_resume(
    student_id: int,
    resume_text: str,
    ctx: dict,
    resume_ref: Optional[dict] = None,
) -> dict[str, Any]:
    """Run the LLM scoring, validate/clamp, persist, and return the report dict."""
    target_block = build_target_text(ctx)
    prompt = (
        f"{SCORE_SYSTEM_PROMPT}\n\n"
        f"=== TARGET ===\n{target_block}\n\n"
        f"=== RESUME ===\n{resume_text[:16000]}"
    )

    llm = _get_score_llm()
    raw = await llm.ainvoke(prompt)
    data = raw if isinstance(raw, dict) else (raw.dict() if hasattr(raw, "dict") else dict(raw))

    # Defensive normalization before validation
    _clamp_scores(data)
    _dedupe_coaching(data)

    llm_report = ResumeScoreLLM.model_validate(data)

    now = datetime.now(timezone.utc)
    meta = ReportMeta(
        target_role=ctx.get("role") or "",
        seniority=ctx.get("seniority"),
        industry=ctx.get("industry"),
        job_id=ctx.get("job_id"),
        job_title=ctx.get("job_title"),
        company_name=ctx.get("company_name"),
        generated_at=now.isoformat(),
    )
    report = ResumeScoreReport(meta=meta, **llm_report.model_dump())
    report_dict = report.model_dump()

    # Persist — every run is kept as its own version (history).
    db = get_mongodb()
    key = target_key(ctx)
    result = await db["resume_reports"].insert_one({
        "student_id": student_id,
        "target_key": key,
        "generated_at": to_bson_datetime(now),
        "resume_ref": resume_ref or {},
        "report": report_dict,
    })

    return {"report_id": str(result.inserted_id), "report": report_dict}


async def get_latest_report(student_id: int, job_id: Optional[int] = None) -> Optional[dict]:
    """Fetch the most recent report for a student, optionally for a specific job."""
    db = get_mongodb()
    query: dict[str, Any] = {"student_id": student_id}
    if job_id is not None:
        query["target_key"] = f"job_{job_id}"
    doc = await db["resume_reports"].find_one(query, sort=[("generated_at", -1)])
    if doc:
        doc["report_id"] = str(doc.pop("_id"))
    return doc


async def list_reports(student_id: int, limit: int = 25) -> list[dict]:
    """Return a student's score-report history, newest first."""
    db = get_mongodb()
    cursor = db["resume_reports"].find({"student_id": student_id}).sort("generated_at", -1).limit(limit)
    docs: list[dict] = []
    async for d in cursor:
        d["report_id"] = str(d.pop("_id"))
        docs.append(d)
    return docs
