"""
Extract the per-module "Assignment Questions" .docx files and import each
module's coding problems into a single "Coding Assignments" lesson of the
Advanced Python Programming course (course_id=12).

These assignments are problem + reference-solution pairs (prompt -> Ans / Fixed
Code). Most are not deterministically auto-checkable (input(), external libs,
networking, open-ended), so they import as "write your code, then reveal the
solution" questions: problem_statement + optional starter_code + solution_code,
and NO expected_output (the player skips auto-grading when that's empty).

One assignment lesson per module (following the docs' own per-module split).
Modules that already have an empty "Assignment N" video placeholder reuse it;
modules with none get a new lesson created.

Usage (DB creds + docx base folder from the environment):
    POSTGRES_HOST=... MCQ_BASE="/path/to/.../Assignments and MCQs" \
    python -I scripts/import_module_assignments.py            # dry run
    python -I scripts/import_module_assignments.py --commit   # apply

Re-runnable: the chosen lesson's assignment is replaced (cascade), not dupated.
"""

import argparse
import os
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

import psycopg2

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
COURSE_ID = 12

# folder -> (docx filename, course module_id, module label)
FILES = [
    ("M2",  "Module 2 - Assignment Questions.docx",        28, "Basics of Programming"),
    ("M4",  "Assignment Question.docx",                     30, "Python OOP"),
    ("M5",  "Module 5 - Assignment Ques.docx",              31, "Python Programs"),
    ("M6",  "Module 6 - Assignment Ques.docx",              32, "Advanced Problem Solving"),
    ("M7",  "Assignment Questions.docx",                    33, "Regular Expressions"),
    ("M8",  "Assignment Questions.docx",                    34, "File Handling"),
    ("M9",  "Assignment Questions.docx",                    35, "Exception Handling"),
    ("M10", "Module 10 - Assignment Questions.docx",        36, "Using Database"),
    ("M11", "Assignment Questions.docx",                    37, "Web Scraping and API"),
    ("M12", "Assignment Questions.docx",                    38, "Concurrent Future"),
    ("M13", "Copy of Copy of Assignment Questions.docx",    39, "PySpark"),
    ("M14", "Module 14 - Assignment Questions.docx",        40, "Testing with Python"),
    ("M15", "Module 15 - Assignment Questions.docx",        41, "Numpy and Pandas"),
]

SOL = re.compile(r'^\s*(ans|answer|fixed\s*code)\b[:.\s-]*', re.I)
NEWQ = re.compile(
    r'^\s*(\d+[.)]\s|'
    r'(debug|fix|write|create|implement|develop|design|find|what|predict|complete|'
    r'consider|given|identify|rectify|correct|explain|how|the following)\b)',
    re.I,
)


def _p_text(p):
    return ''.join(
        ('\n' if el.tag in (W + 'br', W + 'cr') else
         '\t' if el.tag == W + 'tab' else
         (el.text or '') if el.tag == W + 't' else '')
        for el in p.iter()
    )


def _lines(path):
    """Flatten the doc to text lines in order; table cells become code blocks."""
    body = ET.fromstring(zipfile.ZipFile(path).read('word/document.xml')).find(W + 'body')
    out = []
    for ch in body:
        if ch.tag == W + 'p':
            out.append(_p_text(ch))
        elif ch.tag == W + 'tbl':
            for row in ch.findall(W + 'tr'):
                for c in row.findall(W + 'tc'):
                    out.append('\n'.join(_p_text(p) for p in c.findall(W + 'p')))
    return out


def parse_assignments(path):
    """Return list of (problem_statement, starter_code, solution_code)."""
    lines = _lines(path)
    problems = []
    prob, sol, mode = [], [], 'problem'

    def flush():
        pblock = '\n'.join(prob).strip('\n')
        sblock = '\n'.join(sol).strip('\n')
        p_lines = [l for l in pblock.split('\n')]
        # First non-empty line = prompt; remaining = given/starter code.
        statement, starter = pblock, ""
        for i, l in enumerate(p_lines):
            if l.strip():
                statement = l.strip()
                starter = '\n'.join(p_lines[i + 1:]).strip('\n')
                break
        if statement.strip() or sblock.strip():
            problems.append((statement.strip(), starter.strip(), sblock.strip()))

    for raw in lines:
        s = raw.strip()
        if not s:
            (sol if mode == 'solution' else prob).append(raw)
            continue
        if raw.strip().upper().startswith("TATTI") or re.match(r'^\d+\.\s*[A-Z][A-Z ]+$', s):
            continue  # skip title headers
        if mode == 'solution' and NEWQ.match(s):
            flush(); prob, sol, mode = [raw], [], 'problem'; continue
        if SOL.match(s):
            mode = 'solution'
            rest = SOL.sub('', raw, count=1)
            if rest.strip():
                sol.append(rest)
            continue
        (sol if mode == 'solution' else prob).append(raw)
    flush()
    # Drop empties / stray fragments (need at least a statement).
    return [p for p in problems if p[0]]


def connect():
    for k in ("POSTGRES_HOST", "POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB"):
        if not os.environ.get(k):
            sys.exit(f"Missing env var: {k}")
    return psycopg2.connect(
        host=os.environ["POSTGRES_HOST"], port=os.environ.get("POSTGRES_PORT", "5432"),
        user=os.environ["POSTGRES_USER"], password=os.environ["POSTGRES_PASSWORD"],
        dbname=os.environ["POSTGRES_DB"], sslmode="require", connect_timeout=20,
    )


def target_lesson(cur, module_id):
    """Pick/convert a placeholder, or signal a new lesson is needed. Returns
    (lesson_id or None, action, next_order_index)."""
    cur.execute("""
        SELECT lesson_id, title, content_type, order_index
        FROM lessons WHERE module_id=%s ORDER BY order_index
    """, (module_id,))
    rows = cur.fetchall()
    max_order = max([r[3] for r in rows], default=-1)
    placeholders = [r for r in rows if r[2] == 'video' and 'assignment' in (r[1] or '').lower()]
    if placeholders:
        return placeholders[0][0], "convert", max_order + 1
    return None, "create", max_order + 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--commit", action="store_true")
    ap.add_argument("--base", default=os.environ.get("MCQ_BASE", ""))
    ap.add_argument("--skip", default="", help="comma-separated folders to skip, e.g. M10")
    args = ap.parse_args()
    if not args.base:
        sys.exit("Set MCQ_BASE or pass --base")
    skip = {s.strip() for s in args.skip.split(",") if s.strip()}

    parsed = []
    print(f"{'F':4} {'Mod':>4} {'probs':>5}  label")
    for folder, fn, mod, label in FILES:
        if folder in skip:
            continue
        probs = parse_assignments(f"{args.base.rstrip('/')}/{folder}/{fn}")
        parsed.append((folder, fn, mod, label, probs))
        print(f"{folder:4} {mod:>4} {len(probs):>5}  {label}")
    total = sum(len(p[4]) for p in parsed)
    print(f"\nTotal problems: {total}")

    # sample
    for folder, fn, mod, label, probs in parsed:
        if folder == "M4" and probs:
            print(f"\n--- sample (M4 / OOP, problem 1) ---")
            print("STATEMENT:", probs[0][0][:140])
            print("STARTER:", (probs[0][1][:120] or "(none)"))
            print("SOLUTION:", (probs[0][2][:160] or "(none)"))
            break

    conn = connect()
    try:
        with conn.cursor() as cur:
            plan = []
            for folder, fn, mod, label, probs in parsed:
                cur.execute("SELECT title, course_id FROM modules WHERE module_id=%s", (mod,))
                row = cur.fetchone()
                if not row or row[1] != COURSE_ID:
                    sys.exit(f"Module {mod} not in course {COURSE_ID}")
                lid, action, next_order = target_lesson(cur, mod)
                plan.append((mod, label, probs, lid, action, next_order, row[0]))
                tgt = f"reuse lesson {lid}" if action == "convert" else f"CREATE new lesson (order {next_order})"
                print(f"OK  module {mod} '{row[0]}' <- {len(probs)} problems  [{tgt}]")

        if not args.commit:
            print("\nDRY RUN — no changes written. Re-run with --commit to apply.")
            return

        conn.rollback()
        with conn.cursor() as cur:
            for mod, label, probs, lid, action, next_order, mtitle in plan:
                if action == "create":
                    cur.execute("""
                        INSERT INTO lessons (module_id, title, content_type, order_index,
                            is_preview, is_mandatory, created_at, updated_at)
                        VALUES (%s, %s, 'assignment', %s, FALSE, TRUE, NOW(), NOW())
                        RETURNING lesson_id
                    """, (mod, "Coding Assignments", next_order))
                    lid = cur.fetchone()[0]
                else:
                    cur.execute("""
                        UPDATE lessons SET content_type='assignment', title='Coding Assignments',
                            content_url=NULL, video_external_id=NULL, video_external_platform=NULL,
                            updated_at=NOW()
                        WHERE lesson_id=%s
                    """, (lid,))
                cur.execute("DELETE FROM assignments WHERE lesson_id=%s", (lid,))
                cur.execute("""
                    INSERT INTO assignments (lesson_id, title, instructions, language, total_questions)
                    VALUES (%s, %s, %s, 'python', %s) RETURNING assignment_id
                """, (lid, f"{label} — Coding Assignments",
                      "Attempt each problem in the editor, run your code, then reveal the reference solution.",
                      len(probs)))
                aid = cur.fetchone()[0]
                for idx, (stmt, starter, solution) in enumerate(probs):
                    cur.execute("""
                        INSERT INTO assignment_questions (assignment_id, title, problem_statement,
                            starter_code, solution_code, language, points, order_index)
                        VALUES (%s, %s, %s, %s, %s, 'python', 10, %s)
                    """, (aid, f"Problem {idx+1}", stmt, starter or None, solution or None, idx))
                print(f"Imported {len(probs)} problems -> module {mod} lesson {lid}")
        conn.commit()
        print("\nDONE — committed.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
