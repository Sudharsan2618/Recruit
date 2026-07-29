"""Coding Practice service — question bank + server-side grading.

Grading NEVER trusts the client: on submit the server re-executes the user's
SQL against the real dataset (an in-memory SQLite built from the shared
`.sql` seed) and diffs the *server-computed* result against the reference
solution's result. A hand-crafted result payload cannot pass.
"""

from __future__ import annotations

import json
import sqlite3
import threading
from collections import Counter
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

from app.db.mongodb import get_mongodb, to_bson_datetime

_CODING_DIR = Path(__file__).resolve().parent.parent / "coding"
_POINTS = {"easy": 25, "medium": 45, "hard": 80}
_QUERY_TIMEOUT_S = 5.0
_MAX_PREVIEW_ROWS = 200

# SQLite authorizer action codes that mutate state — denied for user queries.
_WRITE_ACTIONS = {
    sqlite3.SQLITE_CREATE_INDEX, sqlite3.SQLITE_CREATE_TABLE, sqlite3.SQLITE_CREATE_TEMP_INDEX,
    sqlite3.SQLITE_CREATE_TEMP_TABLE, sqlite3.SQLITE_CREATE_TEMP_TRIGGER, sqlite3.SQLITE_CREATE_TEMP_VIEW,
    sqlite3.SQLITE_CREATE_TRIGGER, sqlite3.SQLITE_CREATE_VIEW, sqlite3.SQLITE_DELETE,
    sqlite3.SQLITE_DROP_INDEX, sqlite3.SQLITE_DROP_TABLE, sqlite3.SQLITE_DROP_TEMP_INDEX,
    sqlite3.SQLITE_DROP_TEMP_TABLE, sqlite3.SQLITE_DROP_TEMP_TRIGGER, sqlite3.SQLITE_DROP_TEMP_VIEW,
    sqlite3.SQLITE_DROP_TRIGGER, sqlite3.SQLITE_DROP_VIEW, sqlite3.SQLITE_INSERT,
    sqlite3.SQLITE_UPDATE, sqlite3.SQLITE_ALTER_TABLE, sqlite3.SQLITE_ATTACH,
    sqlite3.SQLITE_DETACH,
}


class QueryError(Exception):
    """Raised when a user query fails to execute (syntax, denied write, timeout)."""


# ── Question bank ───────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _all_questions() -> list[dict]:
    with open(_CODING_DIR / "questions.json", encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def _index() -> dict[str, dict]:
    return {q["slug"]: q for q in _all_questions()}


@lru_cache(maxsize=8)
def _dataset_sql(name: str) -> str:
    path = _CODING_DIR / "datasets" / f"{name}.sql"
    if not path.is_file():
        raise QueryError(f"Dataset '{name}' is not available")
    return path.read_text(encoding="utf-8")


def _public(q: dict) -> dict:
    """Question shape sent to the client — never leaks the reference solution."""
    return {
        "slug": q["slug"], "engine": q["engine"], "dataset": q["dataset"],
        "difficulty": q["difficulty"], "title": q["title"],
        "prompt_md": q.get("prompt_md", ""), "starter_code": q.get("starter_code", ""),
        "topic_tags": q.get("topic_tags", []), "role_tags": q.get("role_tags", []),
        "company_tags": q.get("company_tags", []), "hints": q.get("hints", []),
        "explanation_md": q.get("explanation_md", ""),
        "ordering_matters": q.get("ordering_matters", False),
        "expected_columns": q.get("expected_columns", []),
        "points": _POINTS.get(q["difficulty"], 25),
    }


def _brief(q: dict) -> dict:
    return {
        "slug": q["slug"], "engine": q["engine"], "dataset": q["dataset"],
        "difficulty": q["difficulty"], "title": q["title"],
        "topic_tags": q.get("topic_tags", []), "role_tags": q.get("role_tags", []),
        "company_tags": q.get("company_tags", []),
        "points": _POINTS.get(q["difficulty"], 25),
    }


def list_questions(
    *, engine: Optional[str] = None, difficulty: Optional[str] = None,
    company: Optional[str] = None, role: Optional[str] = None, search: Optional[str] = None,
) -> list[dict]:
    out = []
    for q in _all_questions():
        if engine and q["engine"] != engine:
            continue
        if difficulty and q["difficulty"] != difficulty:
            continue
        if company and company not in q.get("company_tags", []):
            continue
        if role and role not in q.get("role_tags", []):
            continue
        if search and search.lower() not in q["title"].lower():
            continue
        out.append(_brief(q))
    return out


def get_public_question(slug: str) -> Optional[dict]:
    q = _index().get(slug)
    return _public(q) if q else None


def filter_facets() -> dict:
    engines, difficulties, companies, roles = set(), set(), set(), set()
    for q in _all_questions():
        engines.add(q["engine"]); difficulties.add(q["difficulty"])
        companies.update(q.get("company_tags", [])); roles.update(q.get("role_tags", []))
    return {
        "engines": sorted(engines), "difficulties": ["easy", "medium", "hard"],
        "companies": sorted(companies), "roles": sorted(roles),
    }


# ── SQLite execution ────────────────────────────────────────────────────────

def _run_query(dataset: str, sql: str, *, read_only: bool) -> tuple[list[str], list[tuple]]:
    """Execute one SQL statement against a fresh in-memory copy of the dataset."""
    con = sqlite3.connect(":memory:")
    try:
        con.executescript(_dataset_sql(dataset))  # build tables (privileged)
        if read_only:
            con.set_authorizer(
                lambda action, *_: sqlite3.SQLITE_DENY if action in _WRITE_ACTIONS else sqlite3.SQLITE_OK
            )
        # Interrupt runaway queries.
        timer = threading.Timer(_QUERY_TIMEOUT_S, con.interrupt)
        timer.start()
        try:
            cur = con.execute(sql)
            columns = [d[0] for d in cur.description] if cur.description else []
            rows = cur.fetchall()
        finally:
            timer.cancel()
        return columns, rows
    except sqlite3.Warning:
        raise QueryError("Only a single SELECT statement is allowed.")
    except sqlite3.OperationalError as e:
        msg = str(e)
        if "interrupted" in msg.lower():
            raise QueryError("Query timed out — it took too long to run.")
        if "not authorized" in msg.lower():
            raise QueryError("Only read-only SELECT queries are allowed here.")
        raise QueryError(f"SQL error: {msg}")
    except sqlite3.Error as e:
        raise QueryError(f"SQL error: {e}")
    finally:
        con.close()


def run_preview(slug: str, code: str) -> dict:
    """Server-side 'Run' — execute and return a capped preview (no grading)."""
    q = _index().get(slug)
    if not q:
        return {"ok": False, "error": "Unknown question"}
    try:
        columns, rows = _run_query(q["dataset"], code, read_only=True)
    except QueryError as e:
        return {"ok": False, "error": str(e)}
    return {
        "ok": True, "columns": columns,
        "rows": [list(r) for r in rows[:_MAX_PREVIEW_ROWS]],
        "row_count": len(rows), "truncated": len(rows) > _MAX_PREVIEW_ROWS,
    }


# ── Grading ─────────────────────────────────────────────────────────────────

def _norm_cell(v: Any) -> Any:
    return round(v, 6) if isinstance(v, float) else v


def _norm_row(row: tuple) -> tuple:
    return tuple(_norm_cell(v) for v in row)


def grade(slug: str, code: str) -> dict:
    """Grade a submission by re-executing server-side and diffing vs the reference."""
    q = _index().get(slug)
    if not q:
        raise QueryError("Unknown question")

    exp_cols, exp_rows = _run_query(q["dataset"], q["solution_sql"], read_only=True)
    got_cols, got_rows = _run_query(q["dataset"], code, read_only=True)

    ordering = q.get("ordering_matters", False)
    exp_n = [_norm_row(r) for r in exp_rows]
    got_n = [_norm_row(r) for r in got_rows]

    cols_match = got_cols == exp_cols
    if ordering:
        rows_match = got_n == exp_n
    else:
        rows_match = Counter(got_n) == Counter(exp_n)

    passed = cols_match and rows_match
    diff = None
    if not passed:
        exp_counter, got_counter = Counter(exp_n), Counter(got_n)
        missing = list((exp_counter - got_counter).elements())
        extra = list((got_counter - exp_counter).elements())
        diff = {
            "expectedColumns": exp_cols, "gotColumns": got_cols,
            "columnsMatch": cols_match,
            "expectedRowCount": len(exp_rows), "gotRowCount": len(got_rows),
            "missingRows": [list(r) for r in missing[:20]],
            "extraRows": [list(r) for r in extra[:20]],
            "orderingMatters": ordering,
        }
    return {
        "verdict": "passed" if passed else "wrong_answer",
        "diff": diff,
        "base_points": _POINTS.get(q["difficulty"], 25),
        "got_columns": got_cols,
        "got_rows": [list(r) for r in got_rows[:_MAX_PREVIEW_ROWS]],
        "got_row_count": len(got_rows),
    }


# ── Submissions / progress (MongoDB) ────────────────────────────────────────

async def submit(student_id: int, slug: str, code: str, language: str) -> dict:
    """Run the grader, persist the submission, award first-solve points."""
    result = grade(slug, code)  # may raise QueryError (bad user SQL)
    db = get_mongodb()
    now = datetime.now(timezone.utc)

    already = await db["coding_submissions"].find_one(
        {"student_id": student_id, "slug": slug, "verdict": "passed"}, {"_id": 1}
    )
    first_solve = result["verdict"] == "passed" and not already
    points_awarded = result["base_points"] if first_solve else 0

    await db["coding_submissions"].insert_one({
        "student_id": student_id, "slug": slug, "language": language, "code": code,
        "verdict": result["verdict"], "points_awarded": points_awarded,
        "first_solve": first_solve, "created_at": to_bson_datetime(now),
    })

    return {
        "verdict": result["verdict"], "first_solve": first_solve,
        "points_awarded": points_awarded, "base_points": result["base_points"],
        "penalized": False, "diff": result["diff"],
        "columns": result["got_columns"], "rows": result["got_rows"],
        "row_count": result["got_row_count"],
    }


async def get_progress(student_id: int) -> dict:
    db = get_mongodb()
    solved: set[str] = set()
    points = 0
    async for doc in db["coding_submissions"].find(
        {"student_id": student_id, "first_solve": True}, {"slug": 1, "points_awarded": 1}
    ):
        solved.add(doc["slug"])
        points += doc.get("points_awarded", 0)
    return {"solved_slugs": sorted(solved), "solved_count": len(solved), "points": points}


async def get_leaderboard(limit: int = 20) -> list[dict]:
    db = get_mongodb()
    cursor = db["coding_submissions"].aggregate([
        {"$match": {"first_solve": True}},
        {"$group": {"_id": "$student_id", "points": {"$sum": "$points_awarded"},
                    "solved": {"$sum": 1}}},
        {"$sort": {"points": -1}},
        {"$limit": limit},
    ])
    out = []
    async for row in cursor:
        out.append({"student_id": row["_id"], "points": row["points"], "solved": row["solved"]})
    return out
