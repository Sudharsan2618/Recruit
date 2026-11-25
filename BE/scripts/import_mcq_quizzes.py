"""
Import the instructor's clean multiple-choice question sets into the
"Advanced Python Programming" course (course_id=12), one quiz per module's
Assessment lesson.

Only the 8 cleanly-formatted lettered MCQ files are imported here (M2, M3, M5,
M6, M10, M11, M12, M13). The mixed / non-MCQ files (M4, M7, M8, M9, M14, M15)
are intentionally skipped. The correct answer is the option rendered bold in
the .docx; a question without exactly one bold option is skipped and reported.

Usage (DB creds + the docx base folder come from the environment/args — nothing
is hard-coded):

    POSTGRES_HOST=... POSTGRES_PORT=5432 POSTGRES_USER=... POSTGRES_PASSWORD=... \
    POSTGRES_DB=... MCQ_BASE="/path/to/Assignments and MCQs/Assignments and MCQs" \
    python -I scripts/import_mcq_quizzes.py            # dry run (no writes)
    python -I scripts/import_mcq_quizzes.py --commit   # apply to the DB

Re-runnable: each target lesson's quiz is replaced (cascade), never duplicated.
"""

import argparse
import json
import os
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

import psycopg2

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
OPT_RE = re.compile(r'^\s*\(?([A-Da-d])[\)\.]\s+')
COURSE_ID = 12

# folder -> (docx filename, target Assessment lesson_id, quiz title, convert video->quiz?)
CLEAN = [
    ("M2",  "Module 2-QAs_.docx",                   152, "Basics of Python Programming", True),
    ("M3",  "Module 3 -QAs.docx",                    169, "Data Structures",             False),
    ("M5",  "Module 5 -QAs.docx",                    201, "Sample Python Programs",      False),
    ("M6",  "Module 6 - QAs.docx",                   213, "Advanced Problem Solving",    False),
    ("M10", "Module 10 - QAs.docx",                  258, "Using Databases in Python",   False),
    ("M11", "Module Questions.docx",                 271, "Web Scraping and API",        False),
    ("M12", "Module Questions.docx",                 278, "Concurrent Futures",          False),
    ("M13", "Copy of Copy of Module Questions.docx", 285, "PySpark",                     False),
]


# ── docx MCQ parser (lettered options; bold option = correct answer) ─────────

def _para_text(p):
    return ''.join(
        ('\n' if el.tag in (W + 'br', W + 'cr') else
         '\t' if el.tag == W + 'tab' else
         (el.text or '') if el.tag == W + 't' else '')
        for el in p.iter()
    )


def _para_bold(p):
    for r in p.findall(W + 'r'):
        rpr = r.find(W + 'rPr')
        if rpr is not None and rpr.find(W + 'b') is not None:
            if ''.join(t.text or '' for t in r.iter(W + 't')).strip():
                return True
    return False


def _looks_like_topic_header(t):
    """A leading 'N. TOPIC' module header — numbered, no '?', short.

    Distinguished from a numbered question (which is usually longer or ends
    with '?') so we only strip the one module title, never a question.
    """
    t = t.strip()
    return bool(re.match(r'^\d+[\.\)]', t)) and not t.endswith('?') and len(t) <= 70


def parse_mcqs(path):
    body = ET.fromstring(zipfile.ZipFile(path).read('word/document.xml')).find(W + 'body')
    questions, stem, opts, in_opts = [], [], [], False
    skipped_header = seen_option = False

    def flush():
        if stem and opts:
            questions.append({
                "stem": "\n".join(s for s in stem if s.strip()).strip(),
                "options": opts[:],
            })

    for p in body.iter(W + 'p'):
        text = _para_text(p)
        if not text.strip():
            continue
        if text.strip().upper().startswith("TATTI"):
            continue
        m = OPT_RE.match(text)
        if m:
            opts.append({"text": OPT_RE.sub('', text).strip(), "is_correct": _para_bold(p)})
            in_opts = True
            seen_option = True
        else:
            if in_opts:
                flush()
                stem, opts, in_opts = [], [], False
            # Strip exactly one module topic header (before any option), once.
            if not seen_option and not skipped_header and not stem and _looks_like_topic_header(text):
                skipped_header = True
                continue
            stem.append(text.rstrip())
    flush()
    return questions


def clean_questions(raw):
    """Keep only well-formed single-answer MCQs; return (kept, skipped)."""
    kept, skipped = [], 0
    for q in raw:
        n_correct = sum(1 for o in q["options"] if o["is_correct"])
        if len(q["options"]) < 2 or n_correct != 1 or not q["stem"]:
            skipped += 1
            continue
        kept.append(q)
    return kept, skipped


# ── DB ───────────────────────────────────────────────────────────────────────

def connect():
    for k in ("POSTGRES_HOST", "POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB"):
        if not os.environ.get(k):
            sys.exit(f"Missing env var: {k}")
    return psycopg2.connect(
        host=os.environ["POSTGRES_HOST"], port=os.environ.get("POSTGRES_PORT", "5432"),
        user=os.environ["POSTGRES_USER"], password=os.environ["POSTGRES_PASSWORD"],
        dbname=os.environ["POSTGRES_DB"], sslmode="require", connect_timeout=20,
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--commit", action="store_true", help="apply changes (default: dry run)")
    ap.add_argument("--base", default=os.environ.get("MCQ_BASE", ""), help="docx base folder")
    args = ap.parse_args()
    if not args.base:
        sys.exit("Set MCQ_BASE env var or pass --base '<folder>'")

    # Parse all clean files first.
    plan = []
    print(f"{'F':5} {'lesson':>6} {'kept':>5} {'skip':>5}  title")
    for folder, fname, lesson_id, title, convert in CLEAN:
        path = f"{args.base.rstrip('/')}/{folder}/{fname}"
        kept, skipped = clean_questions(parse_mcqs(path))
        plan.append((folder, lesson_id, title, convert, kept))
        print(f"{folder:5} {lesson_id:>6} {len(kept):>5} {skipped:>5}  {title}")
    total = sum(len(k) for *_, k in plan)
    print(f"\nTotal MCQs to import: {total}")

    # Show a couple of parsed questions as a sanity check.
    print("\n--- sample (first question of M3 / Data Structures) ---")
    for folder, lesson_id, title, convert, kept in plan:
        if folder == "M3" and kept:
            q = kept[0]
            print("Q:", q["stem"][:120])
            for o in q["options"]:
                print(("  * " if o["is_correct"] else "    ") + o["text"][:80])
            break

    conn = connect()
    try:
        with conn.cursor() as cur:
            for folder, lesson_id, title, convert, kept in plan:
                cur.execute("""
                    SELECT l.title, l.content_type, m.title, m.course_id,
                           (SELECT COUNT(*) FROM quiz_questions qq
                            JOIN quizzes qz ON qz.quiz_id = qq.quiz_id WHERE qz.lesson_id = l.lesson_id)
                    FROM lessons l JOIN modules m ON m.module_id = l.module_id
                    WHERE l.lesson_id = %s
                """, (lesson_id,))
                row = cur.fetchone()
                if not row:
                    sys.exit(f"Lesson {lesson_id} not found")
                l_title, l_type, m_title, c_id, existing_q = row
                if c_id != COURSE_ID or "Assessment" not in l_title:
                    sys.exit(f"Safety check failed L{lesson_id}: course={c_id} '{l_title}'")
                warn = f"  (REPLACES {existing_q} existing Qs)" if existing_q else ""
                print(f"OK  L{lesson_id} '{l_title}' [{l_type}] in '{m_title}'{warn}")

        if not args.commit:
            print("\nDRY RUN — no changes written. Re-run with --commit to apply.")
            return

        conn.rollback()
        with conn.cursor() as cur:
            for folder, lesson_id, title, convert, kept in plan:
                if convert:
                    cur.execute("""
                        UPDATE lessons SET content_type='quiz', content_url=NULL,
                            video_external_id=NULL, video_external_platform=NULL, updated_at=NOW()
                        WHERE lesson_id=%s
                    """, (lesson_id,))
                cur.execute("DELETE FROM quizzes WHERE lesson_id=%s", (lesson_id,))
                cur.execute("""
                    INSERT INTO quizzes (lesson_id, title, pass_percentage, show_correct_answers,
                        total_questions, created_at, updated_at)
                    VALUES (%s, %s, 70, TRUE, %s, NOW(), NOW()) RETURNING quiz_id
                """, (lesson_id, f"{title} Assessment", len(kept)))
                quiz_id = cur.fetchone()[0]
                for idx, q in enumerate(kept):
                    correct = next(o["text"] for o in q["options"] if o["is_correct"])
                    cur.execute("""
                        INSERT INTO quiz_questions (quiz_id, question_text, question_type, options,
                            correct_answer, points, order_index, created_at)
                        VALUES (%s, %s, 'multiple_choice', %s, %s, 1, %s, NOW())
                    """, (quiz_id, q["stem"], json.dumps(q["options"]), correct, idx))
                print(f"Imported quiz {quiz_id} -> lesson {lesson_id} ({len(kept)} questions)")
        conn.commit()
        print("\nDONE — committed.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
