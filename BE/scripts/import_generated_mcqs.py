"""
Author + import 5 MCQs each for the 6 modules whose source files were not clean
MCQs (OOP, Regular Expressions, File Handling, Exception Handling, Testing,
Numpy & Pandas), into each module's Assessment quiz lesson of the Advanced
Python Programming course (course_id=12).

These questions are authored (standard, verifiable Python facts) rather than
extracted, since those source docs were fill-in-the-blank / descriptive /
inconsistent. "Enough for now" = 5 per module.

Usage (DB creds from the environment — nothing hard-coded):
    POSTGRES_HOST=... ... python -I scripts/import_generated_mcqs.py            # dry run
    POSTGRES_HOST=... ... python -I scripts/import_generated_mcqs.py --commit   # apply

Re-runnable: each target lesson's quiz is replaced (cascade), never duplicated.
"""

import argparse
import json
import os
import sys

import psycopg2

COURSE_ID = 12

# Each question: (text, [options...], index_of_correct_option)
QUIZZES = [
    (182, "Python OOP", [
        ("Which keyword is used to define a class in Python?",
         ["def", "class", "object", "struct"], 1),
        ("What is the conventional name of the first parameter of an instance method?",
         ["this", "self", "cls", "me"], 1),
        ("Which special method is Python's constructor, run when an object is created?",
         ["__new__", "__init__", "__create__", "__start__"], 1),
        ("Which OOP principle restricts direct access to an object's internal state?",
         ["Inheritance", "Polymorphism", "Encapsulation", "Abstraction"], 2),
        ("How do you declare a class Dog that inherits from Animal?",
         ["class Dog extends Animal:", "class Dog(Animal):", "class Dog: Animal", "class Dog inherits Animal:"], 1),
    ]),
    (225, "Regular Expressions", [
        ("Which standard module provides regular-expression support in Python?",
         ["regex", "re", "regexp", "pyre"], 1),
        ("Which function matches a pattern only at the beginning of a string?",
         ["re.search()", "re.match()", "re.findall()", "re.split()"], 1),
        ("What does the metacharacter \\d match?",
         ["Any whitespace", "Any digit (0-9)", "Any word character", "Any non-digit"], 1),
        ("Which quantifier means 'one or more occurrences'?",
         ["*", "?", "+", "{0,1}"], 2),
        ("Which function replaces all occurrences of a pattern with a replacement string?",
         ["re.replace()", "re.sub()", "re.swap()", "re.change()"], 1),
    ]),
    (239, "File Handling", [
        ("Which built-in function is used to open a file in Python?",
         ["file()", "open()", "read()", "load()"], 1),
        ("Which mode opens a file for writing and truncates any existing content?",
         ["'r'", "'a'", "'w'", "'x'"], 2),
        ("What is the main advantage of using 'with open(...) as f:'?",
         ["It is faster", "It automatically closes the file", "It reads in binary", "It locks the file"], 1),
        ("Which method reads the entire contents of a file as one string?",
         ["readline()", "readlines()", "read()", "readall()"], 2),
        ("Which mode appends to the end of a file without truncating it?",
         ["'w'", "'a'", "'r+'", "'t'"], 1),
    ]),
    (246, "Exception Handling", [
        ("Which block is used to handle exceptions in Python?",
         ["catch", "except", "handle", "rescue"], 1),
        ("Which keyword manually raises an exception?",
         ["throw", "raise", "except", "error"], 1),
        ("Which block always runs whether or not an exception occurred?",
         ["else", "except", "finally", "ensure"], 2),
        ("Which exception is raised when dividing a number by zero?",
         ["ValueError", "ArithmeticError", "ZeroDivisionError", "TypeError"], 2),
        ("Which class is the common base class for most built-in exceptions?",
         ["BaseError", "Exception", "Error", "Throwable"], 1),
    ]),
    (294, "Testing with Python", [
        ("Which built-in module provides a unit-testing framework in Python?",
         ["pytest", "unittest", "nose", "testlib"], 1),
        ("Which popular third-party framework lets you write tests with plain assert statements?",
         ["unittest", "pytest", "doctest", "mock"], 1),
        ("In unittest, which assertion checks that two values are equal?",
         ["assertSame()", "assertEqual()", "assertTrue()", "assertIs()"], 1),
        ("What is a test 'fixture'?",
         ["A failing test", "Setup/teardown that provides a known state for tests",
          "A mock object", "A test report"], 1),
        ("By pytest's default convention, test files are typically named like?",
         ["spec_*.py", "test_*.py", "*.test.py", "check_*.py"], 1),
    ]),
    (304, "Numpy and Pandas", [
        ("Which function creates a NumPy array from a Python list?",
         ["np.list()", "np.array()", "np.aslist()", "np.make()"], 1),
        ("Which attribute returns the number of dimensions of a NumPy array?",
         [".shape", ".size", ".ndim", ".dtype"], 2),
        ("Which pandas structure is a 2-dimensional labeled table?",
         ["Series", "DataFrame", "Panel", "Index"], 1),
        ("Which function reads a CSV file into a pandas DataFrame?",
         ["pd.read_table()", "pd.read_csv()", "pd.load_csv()", "pd.from_csv()"], 1),
        ("Which NumPy function creates an array filled with zeros?",
         ["np.empty()", "np.zeros()", "np.null()", "np.blank()"], 1),
    ]),
]


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
    args = ap.parse_args()

    print(f"{'lesson':>6} {'q':>3}  title")
    for lesson_id, title, qs in QUIZZES:
        print(f"{lesson_id:>6} {len(qs):>3}  {title}")
        for i, (qt, opts, ci) in enumerate(qs):
            assert 0 <= ci < len(opts), f"bad correct index in {title} Q{i+1}"
    total = sum(len(qs) for *_, qs in QUIZZES)
    print(f"\nTotal authored MCQs to import: {total}")

    conn = connect()
    try:
        with conn.cursor() as cur:
            for lesson_id, title, qs in QUIZZES:
                cur.execute("""
                    SELECT l.title, l.content_type, m.title, m.course_id,
                           (SELECT COUNT(*) FROM quiz_questions qq
                            JOIN quizzes qz ON qz.quiz_id=qq.quiz_id WHERE qz.lesson_id=l.lesson_id)
                    FROM lessons l JOIN modules m ON m.module_id=l.module_id
                    WHERE l.lesson_id=%s
                """, (lesson_id,))
                row = cur.fetchone()
                if not row:
                    sys.exit(f"Lesson {lesson_id} not found")
                l_title, l_type, m_title, c_id, existing = row
                if c_id != COURSE_ID or "Assessment" not in l_title:
                    sys.exit(f"Safety check failed L{lesson_id}: course={c_id} '{l_title}'")
                warn = f"  (REPLACES {existing} existing Qs)" if existing else ""
                print(f"OK  L{lesson_id} '{l_title}' [{l_type}] in '{m_title}'{warn}")

        if not args.commit:
            print("\nDRY RUN — no changes written. Re-run with --commit to apply.")
            return

        conn.rollback()
        with conn.cursor() as cur:
            for lesson_id, title, qs in QUIZZES:
                cur.execute("DELETE FROM quizzes WHERE lesson_id=%s", (lesson_id,))
                cur.execute("""
                    INSERT INTO quizzes (lesson_id, title, pass_percentage, show_correct_answers,
                        total_questions, created_at, updated_at)
                    VALUES (%s, %s, 70, TRUE, %s, NOW(), NOW()) RETURNING quiz_id
                """, (lesson_id, f"{title} Assessment", len(qs)))
                quiz_id = cur.fetchone()[0]
                for idx, (qt, opts, ci) in enumerate(qs):
                    options = [{"text": o, "is_correct": (j == ci)} for j, o in enumerate(opts)]
                    cur.execute("""
                        INSERT INTO quiz_questions (quiz_id, question_text, question_type, options,
                            correct_answer, points, order_index, created_at)
                        VALUES (%s, %s, 'multiple_choice', %s, %s, 1, %s, NOW())
                    """, (quiz_id, qt, json.dumps(options), opts[ci], idx))
                print(f"Imported quiz {quiz_id} -> lesson {lesson_id} ({len(qs)} questions)")
        conn.commit()
        print("\nDONE — committed.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
