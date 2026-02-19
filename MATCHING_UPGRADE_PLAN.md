# RecruitLMS — Matching System Upgrade Plan

*Created: February 18, 2026*

---

## Problem Statement

The current matching system uses a **single-signal Bi-Encoder** (cosine similarity on Gemini embeddings). This has three core limitations:

1. **Semantic dilution** — Complex multi-skill profiles are compressed into a single vector, losing granular skill-level information
2. **No explainability** — A score of `0.78` tells the student nothing about why they matched or what's missing
3. **No structured signal** — Existing structured data (skills with proficiency levels, experience years, location preferences) is unused in the match score

## Solution: 3-Stage Hybrid Matching Pipeline

Replace the single cosine similarity score with a **weighted composite score** that blends 4 independent signals. Return **ALL candidates** whose composite score ≥ **65%** (not top-N).

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    STAGE 1: VECTOR RETRIEVAL (Existing)                  │
│                                                                          │
│  pgvector cosine similarity via HNSW index                               │
│  Lower threshold to 0.45 to capture broad candidate pool                 │
│  Returns: all jobs/students with vector_similarity >= 0.45               │
│  Purpose: Fast pre-filter — eliminates completely irrelevant matches     │
│  Cost: O(log N) sub-millisecond                                          │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │ broad candidate pool
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│              STAGE 2: MULTI-SIGNAL COMPOSITE SCORING (New)               │
│                                                                          │
│  For each candidate from Stage 1, compute 4 independent scores:          │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Signal A — Semantic Similarity (Weight: 35%)                      │  │
│  │  Source: pgvector cosine score (already computed in Stage 1)        │  │
│  │  Range: 0.0 → 1.0                                                 │  │
│  │  Why: Captures semantic nuance that structured data misses         │  │
│  │       (e.g., "ML engineering" ≈ "data science pipelines")          │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Signal B — Skill Overlap Score (Weight: 35%)                      │  │
│  │  Source: SQL JOIN student_skills ↔ job_skills ON skill_id          │  │
│  │  Range: 0.0 → 1.0                                                 │  │
│  │                                                                    │  │
│  │  Formula:                                                          │  │
│  │    mandatory_matched = COUNT(student ∩ job WHERE is_mandatory)     │  │
│  │    mandatory_total   = COUNT(job WHERE is_mandatory)               │  │
│  │    optional_matched  = COUNT(student ∩ job WHERE NOT is_mandatory) │  │
│  │    optional_total    = COUNT(job WHERE NOT is_mandatory)           │  │
│  │                                                                    │  │
│  │    If mandatory_total > 0:                                         │  │
│  │      skill_score = 0.7 × (mandatory_matched / mandatory_total)    │  │
│  │                  + 0.3 × (optional_matched / MAX(optional_total,1))│  │
│  │    Else:                                                           │  │
│  │      skill_score = matched / total                                 │  │
│  │                                                                    │  │
│  │    Proficiency bonus: +0.05 for each skill where                   │  │
│  │      student.proficiency_level >= 4 (advanced/expert)              │  │
│  │      AND job.min_experience_years <= student.years_of_experience   │  │
│  │    Capped at 1.0                                                   │  │
│  │                                                                    │  │
│  │  Edge case: If job has 0 skills defined → skill_score = NULL       │  │
│  │    (excluded from composite, remaining weights redistributed)      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Signal C — Experience Fit Score (Weight: 20%)                     │  │
│  │  Source: student.experience_years vs job.experience_min/max_years  │  │
│  │  Range: 0.0 → 1.0                                                 │  │
│  │                                                                    │  │
│  │  Logic:                                                            │  │
│  │    If student_exp within [min, max] → 1.0 (perfect fit)           │  │
│  │    If student_exp < min:                                           │  │
│  │      score = max(0, 1 - (min - student_exp) / max(min, 1))        │  │
│  │      (e.g., 2 yrs for a 3-5 yr job → 0.67)                       │  │
│  │    If student_exp > max:                                           │  │
│  │      score = max(0.5, 1 - (student_exp - max) / 10)               │  │
│  │      (overqualified gets min 0.5 — still a valid match)           │  │
│  │                                                                    │  │
│  │  Edge case: If job has no experience range → score = 0.8 default  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Signal D — Preference Fit Score (Weight: 10%)                     │  │
│  │  Source: student preferences vs job attributes                     │  │
│  │  Range: 0.0 → 1.0                                                 │  │
│  │                                                                    │  │
│  │  Sub-signals (averaged):                                           │  │
│  │    D1. Remote type match:                                          │  │
│  │        student.preferred_remote_types ∩ job.remote_type            │  │
│  │        Match → 1.0, No match → 0.3, No preference → 0.7          │  │
│  │    D2. Employment type match:                                      │  │
│  │        student.preferred_job_types ∩ job.employment_type           │  │
│  │        Match → 1.0, No match → 0.3, No preference → 0.7          │  │
│  │    D3. Location match:                                             │  │
│  │        student.preferred_locations contains job.location           │  │
│  │        Match → 1.0, No match → 0.5, No preference → 0.7          │  │
│  │                                                                    │  │
│  │  preference_score = AVG(D1, D2, D3)                               │  │
│  │                                                                    │  │
│  │  Edge case: If student has no preferences → score = 0.7 default   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  COMPOSITE SCORE CALCULATION                                       │  │
│  │                                                                    │  │
│  │  Normal case (all signals available):                              │  │
│  │    composite = 0.35 × vector_score                                 │  │
│  │             + 0.35 × skill_score                                   │  │
│  │             + 0.20 × experience_score                              │  │
│  │             + 0.10 × preference_score                              │  │
│  │                                                                    │  │
│  │  Fallback (job has no skills in job_skills table):                 │  │
│  │    composite = 0.55 × vector_score    (absorb skill weight)        │  │
│  │             + 0.30 × experience_score                              │  │
│  │             + 0.15 × preference_score                              │  │
│  │                                                                    │  │
│  │  THRESHOLD: composite >= 0.65 → considered a MATCH                │  │
│  │  Return ALL matches sorted by composite DESC                       │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │ all candidates with composite >= 0.65
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│          STAGE 3: SKILL GAP ANALYSIS + COURSE RECOMMENDATIONS            │
│                                                                          │
│  For each matched candidate, return:                                     │
│                                                                          │
│    matched_skills: [{skill_name, proficiency, is_mandatory}]             │
│    missing_skills: [{skill_name, is_mandatory}]                          │
│    skill_gap_courses: [{course_id, title, slug, price,                   │
│                         teaches_skills: [skill_names]}]                  │
│      → Query: course_skills WHERE skill_id IN (missing_skill_ids)        │
│               AND course.is_published = true                             │
│                                                                          │
│  This enables the frontend to show:                                      │
│    "You match 7/10 skills. Complete 'Kubernetes 101' to fill the gap"    │
│                                                                          │
│  Optional (Phase E): For top results, call Gemini to generate            │
│  a natural-language match explanation.                                    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Weight Distribution Summary

| Signal | Weight | Source | What It Captures |
|--------|--------|--------|-----------------|
| **A. Semantic Similarity** | 35% | pgvector cosine (`<=>`) | Conceptual alignment, domain relevance, soft skills, implicit qualifications |
| **B. Skill Overlap** | 35% | SQL `student_skills ↔ job_skills` | Exact skill matches with proficiency awareness, mandatory vs optional |
| **C. Experience Fit** | 20% | `student.experience_years` vs `job.experience_min/max` | Seniority alignment |
| **D. Preference Fit** | 10% | `student.preferred_*` vs `job.remote/employment/location` | Practical compatibility |
| **Total** | **100%** | | **≥ 0.65 = MATCH** |

---

## Database Tables Used (All Existing)

```sql
-- Signal A: Vector similarity
student_embeddings (student_id, embedding vector(1536))
job_embeddings     (job_id, embedding vector(1536))

-- Signal B: Skill overlap
skills          (skill_id, name)
student_skills  (student_id, skill_id, proficiency_level 1-5, years_of_experience)
job_skills      (job_id, skill_id, is_mandatory, min_experience_years)
skill_synonyms  (skill_id, synonym)  -- for normalization

-- Signal C: Experience fit
students (experience_years)
jobs     (experience_min_years, experience_max_years)

-- Signal D: Preference fit
students (preferred_remote_types[], preferred_job_types[], preferred_locations[])
jobs     (remote_type, employment_type, location)

-- Stage 3: Course recommendations
course_skills (course_id, skill_id, is_primary)
courses       (course_id, title, slug, price, is_published)
```

**Key insight: No new tables needed.** Every signal uses existing schema.

---

## Implementation Plan — File-Level

### Phase A: Hybrid Matching Service (Backend Core)

**File: `BE/app/services/matching_service.py`** — Major rewrite

| Task | Description |
|------|-------------|
| A1 | Add `_compute_skill_overlap()` method — SQL JOIN student_skills ↔ job_skills, handles mandatory vs optional weighting, proficiency bonus |
| A2 | Add `_compute_experience_fit()` method — compares student experience to job range |
| A3 | Add `_compute_preference_fit()` method — matches remote/employment/location preferences |
| A4 | Add `_compute_composite_score()` method — blends all 4 signals with weights, handles fallbacks |
| A5 | Rewrite `get_recommended_jobs_for_student()` — Stage 1: broad vector retrieval (threshold 0.45) → Stage 2: compute composite for each → filter composite ≥ 0.65 → sort DESC |
| A6 | Update `get_all_active_jobs()` — include composite_score alongside existing filters |
| A7 | Update `get_job_detail()` — return per-signal breakdown (vector_score, skill_score, experience_score, preference_score) |

### Phase B: Skill Gap Analysis

**File: `BE/app/services/matching_service.py`** — New methods

| Task | Description |
|------|-------------|
| B1 | Add `get_skill_breakdown()` method — returns matched_skills + missing_skills for a (student, job) pair |
| B2 | Add `get_gap_courses()` method — queries course_skills for courses that teach missing skills |

**File: `BE/app/schemas/student_jobs.py`** — Schema updates

| Task | Description |
|------|-------------|
| B3 | Add `MatchBreakdown` schema — vector_score, skill_score, experience_score, preference_score, composite_score |
| B4 | Add `SkillMatch` schema — skill_name, matched: bool, is_mandatory, proficiency_level, required_experience |
| B5 | Add `GapCourse` schema — course_id, title, slug, price, teaches_skills[] |
| B6 | Update `JobListItem` and `JobDetail` to include match_breakdown, matched_skills, missing_skills, gap_courses |

**File: `BE/app/api/v1/endpoints/student_jobs.py`** — Endpoint updates

| Task | Description |
|------|-------------|
| B7 | Update `/recommended` endpoint to return new composite scores + breakdown |
| B8 | Add `GET /student-jobs/{id}/match-analysis` endpoint — detailed per-job match breakdown with skill gaps and course recommendations |

### Phase C: Frontend — Match Breakdown UI

**File: `UI/lib/api.ts`** — Type + API updates

| Task | Description |
|------|-------------|
| C1 | Add `MatchBreakdown`, `SkillMatch`, `GapCourse` TypeScript interfaces |
| C2 | Add `getMatchAnalysis(jobId)` API function |
| C3 | Update `JobListItem`, `JobDetail` types with new fields |

**File: `UI/app/student/jobs/page.tsx`** — UI updates

| Task | Description |
|------|-------------|
| C4 | Update job cards to show multi-signal score breakdown (small visual bars for each signal) |
| C5 | Update job detail sheet to show matched/missing skills with visual indicators |
| C6 | Add "Boost Your Match" section showing recommended courses from skill gaps |
| C7 | Update match percentage badge to use composite score |

### Phase D: Admin Matching Hub Updates

**File: `BE/app/api/v1/endpoints/admin.py`** — Endpoint updates

| Task | Description |
|------|-------------|
| D1 | Update job matching hub to use composite scores |
| D2 | Add skill breakdown to applicant cards |

**File: `UI/app/admin/matching/page.tsx`** — UI updates

| Task | Description |
|------|-------------|
| D3 | Show composite score breakdown in applicant view |
| D4 | Add filter: "minimum composite score" slider |

### Phase E: LLM Reranking + Explanation (Optional/Future)

| Task | Description |
|------|-------------|
| E1 | Add `_generate_match_explanation()` method using Gemini — takes (student_profile, job_description, skill_breakdown) → returns natural language explanation |
| E2 | Cache explanations in a `match_explanations` table (invalidate when student/job embedding hash changes) |
| E3 | Add "Why this match" expandable section in frontend job detail |

---

## Matching Query — Core SQL (Phase A)

```sql
-- Stage 1: Broad vector retrieval
WITH vector_candidates AS (
    SELECT
        j.job_id,
        ROUND((1.0 - (je.embedding <=> se.embedding))::numeric, 4) AS vector_score
    FROM job_embeddings je
    JOIN student_embeddings se ON se.student_id = :student_id
    JOIN jobs j ON j.job_id = je.job_id
    WHERE j.status = 'active'
      AND (1.0 - (je.embedding <=> se.embedding)) >= 0.45  -- broad net
),

-- Stage 2a: Skill overlap per job
skill_overlap AS (
    SELECT
        js.job_id,
        -- Total required skills
        COUNT(*) AS total_skills,
        COUNT(*) FILTER (WHERE js.is_mandatory) AS mandatory_total,
        COUNT(*) FILTER (WHERE NOT js.is_mandatory) AS optional_total,
        -- Matched skills
        COUNT(ss.skill_id) FILTER (WHERE js.is_mandatory) AS mandatory_matched,
        COUNT(ss.skill_id) FILTER (WHERE NOT js.is_mandatory) AS optional_matched,
        -- Proficiency bonus count
        COUNT(ss.skill_id) FILTER (
            WHERE ss.proficiency_level >= 4
              AND (js.min_experience_years IS NULL
                   OR ss.years_of_experience >= js.min_experience_years)
        ) AS proficiency_bonus_count
    FROM job_skills js
    LEFT JOIN student_skills ss
        ON ss.skill_id = js.skill_id AND ss.student_id = :student_id
    WHERE js.job_id IN (SELECT job_id FROM vector_candidates)
    GROUP BY js.job_id
)

SELECT
    vc.job_id,
    vc.vector_score,
    -- Skill score
    CASE
        WHEN so.total_skills IS NULL OR so.total_skills = 0 THEN NULL
        WHEN so.mandatory_total > 0 THEN
            LEAST(1.0,
                0.7 * (so.mandatory_matched::numeric / so.mandatory_total)
              + 0.3 * (so.optional_matched::numeric / GREATEST(so.optional_total, 1))
              + 0.05 * so.proficiency_bonus_count
            )
        ELSE
            LEAST(1.0,
                (so.mandatory_matched + so.optional_matched)::numeric / so.total_skills
              + 0.05 * so.proficiency_bonus_count
            )
    END AS skill_score,
    so.mandatory_matched,
    so.mandatory_total,
    so.optional_matched,
    so.optional_total,
    so.total_skills
FROM vector_candidates vc
LEFT JOIN skill_overlap so ON so.job_id = vc.job_id;
```

The experience and preference scores will be computed in Python (they require array comparisons that are cleaner in app code).

---

## API Response Shape (After Upgrade)

### Recommended Jobs Response
```json
{
  "jobs": [
    {
      "job_id": 42,
      "title": "Senior ML Engineer",
      "company_name": "TechCorp",
      "match": {
        "composite_score": 0.82,
        "breakdown": {
          "vector_score": 0.88,
          "skill_score": 0.79,
          "experience_score": 0.90,
          "preference_score": 0.65
        },
        "matched_skills": [
          {"name": "Python", "proficiency": 5, "is_mandatory": true},
          {"name": "TensorFlow", "proficiency": 4, "is_mandatory": true},
          {"name": "AWS", "proficiency": 3, "is_mandatory": false}
        ],
        "missing_skills": [
          {"name": "Kubernetes", "is_mandatory": true},
          {"name": "Spark", "is_mandatory": false}
        ],
        "gap_courses": [
          {"course_id": 7, "title": "Kubernetes for ML Engineers", "slug": "k8s-ml", "price": 799}
        ]
      }
    }
  ],
  "total": 14,
  "threshold": 0.65
}
```

---

## Implementation Order

| Order | Phase | Tasks | Status | Completed |
|-------|-------|-------|--------|-----------|
| 1 | **Phase A** | A1–A7 (Hybrid scoring engine) | ✅ Done | Feb 18 |
| 2 | **Phase B** | B1–B8 (Skill gaps + schemas + endpoints) | ✅ Done | Feb 18 |
| 3 | **Phase C** | C1–C7 (Frontend match UI) | ✅ Done | Feb 18 |
| 4 | **Phase D** | D1–D4 (Admin hub update) | ✅ Done | Feb 18 |
| 5 | **Phase E** | E1–E3 (Gemini explanations) | ⬜ Optional/Future | — |

---

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Match signal sources | 1 (vector only) | 4 (vector + skills + experience + preferences) |
| Explainability | None (opaque score) | Full breakdown with skill gaps |
| Accuracy for technical roles | Low (semantic dilution) | High (exact skill matching + semantic) |
| Revenue link | None | Direct (course recommendations from skill gaps) |
| Threshold behavior | Fixed 0.65 on single signal | Dynamic 0.65 on composite of 4 weighted signals |
