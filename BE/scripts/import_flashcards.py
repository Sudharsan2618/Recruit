"""
Import the per-module "Key terms" flashcards (front = term, back = definition)
into the existing keyterms flashcard lessons of the Advanced Python Programming
course (course_id=12).

Source: an .xlsx with columns  Module Name | Lesson Name | Term | Definition
(one row per term; the header row is skipped). Terms are grouped by
(module, lesson name) and written into the matching existing lesson of
content_type='flashcard'.

The course already ships one flashcard lesson per keyterms topic (17 of them);
this script only POPULATES them — it does not create lessons. Each target
lesson's deck is REPLACED (delete deck by lesson_id -> cascade cards -> insert),
exactly like the admin course-builder endpoint POST /lessons/{id}/flashcards,
so the script is idempotent / re-runnable.

Usage (DB creds from the environment, like import_module_assignments.py):
    POSTGRES_HOST=... POSTGRES_USER=... POSTGRES_PASSWORD=... POSTGRES_DB=... \
    FLASHCARD_XLSX="/path/to/Key terms_python2.0.xlsx" \
    python -I scripts/import_flashcards.py            # dry run (no writes)
    python -I scripts/import_flashcards.py --commit    # apply

Flags:
    --excel PATH   Excel file (overrides FLASHCARD_XLSX).
    --course-id N  Target course (default 12).
    --commit       Apply changes (otherwise dry run).
"""

import argparse
import os
import re
import sys
from collections import OrderedDict

import psycopg2
import openpyxl

DEFAULT_COURSE_ID = 12


# ──────────────────────────────────────────────────────────────────────────
# Text helpers
# ──────────────────────────────────────────────────────────────────────────
def clean(s):
    """Normalise a cell to clean text: fix the stray U+FFFD apostrophes that the
    source file carries (e.g. 'Spark�s'), drop surrounding whitespace."""
    if s is None:
        return ""
    s = str(s).replace("�", "'")        # replacement char -> apostrophe
    return s.strip()


def module_num(title):
    """Extract the MODULE number from a title like 'MODULE 10- Exception ...'."""
    m = re.search(r"module\s*(\d+)", (title or "").strip(), re.I)
    return int(m.group(1)) if m else None


def norm_lesson(title):
    """Normalise a lesson title for matching: drop a leading 'N. ', drop a
    trailing 'know the (key)terms' suffix, lowercase, collapse spaces/punct."""
    t = (title or "").replace("\n", " ").strip()
    t = re.sub(r"^\s*\d+\.\s*", "", t)
    t = re.sub(r"(?i)\s*(know\s+the\s*)?(key\s*terms|keyterms|ketyterms)\s*$", "", t)
    t = re.sub(r"[^a-z0-9]+", " ", t.lower()).strip()
    return t


def deck_title(lesson_title):
    """A clean human deck title derived from the lesson title."""
    base = re.sub(r"^\s*\d+\.\s*", "", (lesson_title or "").replace("\n", " ").strip())
    base = re.sub(r"(?i)\s*(know\s+the\s*)?(key\s*terms|keyterms|ketyterms)\s*$", "", base).strip()
    base = re.sub(r"\s{2,}", " ", base)
    return (base + " — Key Terms") if base else "Key Terms"


# ──────────────────────────────────────────────────────────────────────────
# Excel
# ──────────────────────────────────────────────────────────────────────────
def read_excel(path):
    """Return OrderedDict[(mod_num, lesson_name)] -> list[(term, definition)]."""
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb[wb.sheetnames[0]]
    groups = OrderedDict()
    skipped = []
    for r in range(1, ws.max_row + 1):
        a = clean(ws.cell(r, 1).value)   # Module Name
        b = clean(ws.cell(r, 2).value)   # Lesson Name
        c = clean(ws.cell(r, 3).value)   # Term
        d = clean(ws.cell(r, 4).value)   # Definition
        if not a and not b and not c and not d:
            continue
        if a.lower() == "module name" or (c.lower() == "term" and d.lower() == "definition"):
            continue  # header
        mn = module_num(a)
        if mn is None:
            skipped.append((r, "no module number", a, c))
            continue
        if not c or not d:
            skipped.append((r, "missing term/definition", a, c))
            continue
        groups.setdefault((mn, b), []).append((c, d))
    return groups, skipped


# ──────────────────────────────────────────────────────────────────────────
# DB
# ──────────────────────────────────────────────────────────────────────────
def connect():
    for k in ("POSTGRES_HOST", "POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB"):
        if not os.environ.get(k):
            sys.exit(f"Missing env var: {k}")
    return psycopg2.connect(
        host=os.environ["POSTGRES_HOST"], port=os.environ.get("POSTGRES_PORT", "5432"),
        user=os.environ["POSTGRES_USER"], password=os.environ["POSTGRES_PASSWORD"],
        dbname=os.environ["POSTGRES_DB"], sslmode=os.environ.get("DB_SSLMODE", "require"),
        connect_timeout=25,
    )


def load_course(cur, course_id):
    """Return (modnum->module_id, module_id->[(lesson_id,title,order)])."""
    cur.execute("SELECT module_id, title FROM modules WHERE course_id=%s", (course_id,))
    mod_by_num = {}
    for mid, title in cur.fetchall():
        n = module_num(title)
        if n is not None:
            mod_by_num[n] = mid
    cur.execute("""
        SELECT l.module_id, l.lesson_id, l.title, l.order_index
        FROM lessons l JOIN modules m ON m.module_id=l.module_id
        WHERE m.course_id=%s AND l.content_type='flashcard'
        ORDER BY l.module_id, l.order_index
    """, (course_id,))
    fc = {}
    for mid, lid, title, order in cur.fetchall():
        fc.setdefault(mid, []).append((lid, title, order))
    return mod_by_num, fc


def resolve_lesson(mod_num, lesson_name, mod_by_num, fc):
    """Map an Excel group to an existing flashcard lesson_id. Returns
    (lesson_id, lesson_title) or raises ValueError describing the problem."""
    mid = mod_by_num.get(mod_num)
    if mid is None:
        raise ValueError(f"MODULE {mod_num}: no matching module in course")
    cands = fc.get(mid, [])
    if not cands:
        raise ValueError(f"MODULE {mod_num}: module has no flashcard lesson")
    if len(cands) == 1:
        return cands[0][0], cands[0][1]
    # multiple flashcard lessons in this module -> match by normalised title
    want = norm_lesson(lesson_name)
    exact = [(lid, t) for lid, t, _ in cands if norm_lesson(t) == want]
    if len(exact) == 1:
        return exact[0]
    partial = [(lid, t) for lid, t, _ in cands
               if want and (want in norm_lesson(t) or norm_lesson(t) in want)]
    if len(partial) == 1:
        return partial[0]
    opts = "; ".join(f"{lid}:'{t}'" for lid, t, _ in cands)
    raise ValueError(
        f"MODULE {mod_num} lesson '{lesson_name}' -> ambiguous among [{opts}]"
    )


# ──────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--excel", default=os.environ.get("FLASHCARD_XLSX", ""))
    ap.add_argument("--course-id", type=int, default=DEFAULT_COURSE_ID)
    ap.add_argument("--commit", action="store_true")
    args = ap.parse_args()
    if not args.excel:
        sys.exit("Set FLASHCARD_XLSX or pass --excel")
    if not os.path.exists(args.excel):
        sys.exit(f"Excel not found: {args.excel}")

    groups, skipped = read_excel(args.excel)
    total_terms = sum(len(v) for v in groups.values())
    print(f"Excel: {len(groups)} (module, lesson) groups, {total_terms} terms")
    if skipped:
        print(f"  ! skipped {len(skipped)} rows:")
        for r, why, a, c in skipped[:20]:
            print(f"      row {r}: {why}  [{a!r} / {c!r}]")

    conn = connect()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT title FROM courses WHERE course_id=%s", (args.course_id,))
            row = cur.fetchone()
            if not row:
                sys.exit(f"Course {args.course_id} not found")
            print(f"Course {args.course_id}: {row[0]}\n")
            mod_by_num, fc = load_course(cur, args.course_id)

            plan, errors, used = [], [], set()
            print(f"{'Mod':>3} {'Lesson_id':>9} {'cards':>5}  deck title  <-  excel lesson")
            for (mn, lesson_name), cards in groups.items():
                try:
                    lid, ltitle = resolve_lesson(mn, lesson_name, mod_by_num, fc)
                except ValueError as e:
                    errors.append(str(e)); print(f"  ERR  {e}"); continue
                if lid in used:
                    errors.append(f"lesson {lid} targeted twice (module {mn} '{lesson_name}')")
                    print(f"  ERR  lesson {lid} targeted by two Excel groups"); continue
                used.add(lid)
                dt = deck_title(ltitle)
                plan.append((mn, lid, ltitle, dt, cards))
                print(f"{mn:>3} {lid:>9} {len(cards):>5}  {dt!r}  <-  {lesson_name!r}")

        # flashcard lessons that will NOT get content (for visibility)
        all_fc_lids = {lid for lst in fc.values() for lid, _, _ in lst}
        untouched = all_fc_lids - used
        if untouched:
            print(f"\n  flashcard lessons with NO excel data ({len(untouched)}): {sorted(untouched)}")

        print(f"\nPlanned: {len(plan)} lessons, {sum(len(p[4]) for p in plan)} cards")
        if errors:
            print(f"\n{len(errors)} ERROR(S) — fix before committing:")
            for e in errors:
                print("   -", e)
            sys.exit(1)

        if not args.commit:
            print("\nDRY RUN — no changes written. Re-run with --commit to apply.")
            return

        with conn.cursor() as cur:
            for mn, lid, ltitle, dt, cards in plan:
                cur.execute(
                    "SELECT m.course_id FROM lessons l JOIN modules m ON m.module_id=l.module_id "
                    "WHERE l.lesson_id=%s", (lid,))
                cid = cur.fetchone()[0]
                cur.execute("DELETE FROM flashcard_decks WHERE lesson_id=%s", (lid,))
                cur.execute("""
                    INSERT INTO flashcard_decks (lesson_id, course_id, title, description,
                        total_cards, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, NOW(), NOW()) RETURNING deck_id
                """, (lid, cid, dt, "Key terms and definitions for quick revision.", len(cards)))
                did = cur.fetchone()[0]
                for idx, (term, definition) in enumerate(cards):
                    cur.execute("""
                        INSERT INTO flashcards (deck_id, front_content, back_content,
                            front_image_url, back_image_url, order_index, created_at)
                        VALUES (%s, %s, %s, NULL, NULL, %s, NOW())
                    """, (did, term, definition, idx))
                print(f"  wrote deck {did} -> lesson {lid} ({len(cards)} cards)")
        conn.commit()
        print(f"\nDONE — committed {len(plan)} decks, {sum(len(p[4]) for p in plan)} cards.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
