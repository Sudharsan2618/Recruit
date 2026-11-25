"""
Bulk-import the Data Structures coding assignments (Module 4) into the
"Advanced Python Programming" course (course_id=12).

Source: instructor's "Module 3 - Assignment Questions.docx" (6 debug-and-fix
Python exercises). They are grouped 2 per assignment into the three existing
"Data Structure Assignment 1/2/3" lesson slots, which are converted from empty
`video` placeholders into `assignment` lessons.

Each question's expected_output is computed here by executing the reference
solution, so the in-browser auto-check matches real CPython output exactly.

Usage (reads DB creds from the environment — nothing is hard-coded):
    POSTGRES_HOST=... POSTGRES_PORT=5432 POSTGRES_USER=... \
    POSTGRES_PASSWORD=... POSTGRES_DB=... \
    python -I scripts/import_ds_assignments.py            # dry run (no writes)
    python -I scripts/import_ds_assignments.py --commit   # apply to the DB

Safe to re-run: each lesson's assignment is replaced (cascade), not duplicated.
"""

import argparse
import io
import contextlib
import os
import sys

import psycopg2

COURSE_ID = 12
DS_MODULE_TITLE_HINT = "Data Structures"  # sanity guard

# ── Reference solution runner (compute expected stdout) ─────────────────────

def run_code(src: str) -> str:
    buf = io.StringIO()
    g = {"__name__": "__main__"}
    with contextlib.redirect_stdout(buf), contextlib.redirect_stderr(buf):
        try:
            exec(src, g)
        except BaseException:
            import traceback
            traceback.print_exc(file=buf)
    return buf.getvalue().rstrip("\n")


# ── Question bank (verbatim from the instructor's doc) ──────────────────────

Q_LIST = {
    "title": "Fix the list printing bug",
    "problem_statement": "You are trying to implement a basic example of a list in Python, but your code is raising an error. Fix the issue so it prints the list.",
    "starter_code": '''# Create a list of fruits
fruits = ["Apple", "Banana", "Cherry"]

# Print the list
print(fruit)''',
    "solution_code": '''# Create a list of fruits
fruits = ["Apple", "Banana", "Cherry"]

# Print the list
print(fruits)''',
    "solution_explanation": "The variable name in the `print` statement is incorrect. It should be `fruits` instead of `fruit`.",
}

Q_STACK = {
    "title": "Fix the stack pop on an empty stack",
    "problem_statement": "You have implemented a stack using a list in Python, but popping from an empty stack raises an error instead of reporting that the stack is empty. Identify and fix the issue.",
    "starter_code": '''class Stack:
    def __init__(self):
        self.stack = []

    def push(self, item):
        self.stack.append(item)

    def pop(self):
        return self.stack.pop()

    def is_empty(self):
        return len(self.stack) == 0

# Create a stack and perform operations
s = Stack()
s.push(1)
s.push(2)
print(s.pop())  # Expected output: 2
print(s.pop())  # Expected output: 1
print(s.pop())  # Expected output: "Stack is empty"''',
    "solution_code": '''class Stack:
    def __init__(self):
        self.stack = []

    def push(self, item):
        self.stack.append(item)

    def pop(self):
        if not self.is_empty():
            return self.stack.pop()
        return "Stack is empty"

    def is_empty(self):
        return len(self.stack) == 0

# Create a stack and perform operations
s = Stack()
s.push(1)
s.push(2)
print(s.pop())  # Expected output: 2
print(s.pop())  # Expected output: 1
print(s.pop())  # Expected output: "Stack is empty"''',
    "solution_explanation": "Guard `pop` with `is_empty`: when the stack is empty, return \"Stack is empty\" instead of calling `list.pop()` on an empty list (which raises IndexError).",
}

Q_QUEUE = {
    "title": "Fix the queue dequeue order",
    "problem_statement": "You are trying to implement a queue using a list in Python, but the dequeue operation is not working as expected (it removes from the wrong end). Identify and fix the issue.",
    "starter_code": '''class Queue:
    def __init__(self):
        self.queue = []

    def enqueue(self, item):
        self.queue.append(item)

    def dequeue(self):
        return self.queue.pop()

    def is_empty(self):
        return len(self.queue) == 0

# Create a queue and perform operations
q = Queue()
q.enqueue(1)
q.enqueue(2)
print(q.dequeue())  # Expected output: 1
print(q.dequeue())  # Expected output: 2
print(q.dequeue())  # Expected output: "Queue is empty"''',
    "solution_code": '''class Queue:
    def __init__(self):
        self.queue = []

    def enqueue(self, item):
        self.queue.append(item)

    def dequeue(self):
        if not self.is_empty():
            return self.queue.pop(0)
        return "Queue is empty"

    def is_empty(self):
        return len(self.queue) == 0

# Create a queue and perform operations
q = Queue()
q.enqueue(1)
q.enqueue(2)
print(q.dequeue())  # Expected output: 1
print(q.dequeue())  # Expected output: 2
print(q.dequeue())  # Expected output: "Queue is empty"''',
    "solution_explanation": "`pop()` removes the last element (LIFO). A queue is FIFO, so remove the first element with `pop(0)`, and guard the empty case so it returns \"Queue is empty\".",
}

Q_LINKED = {
    "title": "Fix delete_node in the singly linked list",
    "problem_statement": "You are trying to implement a singly linked list in Python, but the `delete_node` method raises an error. Identify and fix the issue.",
    "starter_code": '''class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None

    def append(self, data):
        new_node = Node(data)
        if self.head is None:
            self.head = new_node
            return
        last = self.head
        while last.next:
            last = last.next
        last.next = new_node

    def delete_node(self, key):
        temp = self.head
        if temp is not None:
            if temp.data == key:
                self.head = temp.next
                temp = None
                return
        while temp is not None:
            if temp.data == key:
                break
            prev = temp
            temp = temp.next
        if temp == None:
            return
        prev.next = temp.next
        temp = None

    def print_list(self):
        temp = self.head
        while temp:
            print(temp.data, end=" -> ")
            temp = temp.next
        print("None")

# Create a linked list and perform operations
llist = LinkedList()
llist.append(1)
llist.append(2)
llist.append(3)
llist.print_list()  # Expected output: 1 -> 2 -> 3 -> None
llist.delete_node(2)
llist.print_list()  # Expected output: 1 -> 3 -> None''',
    "solution_code": '''class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None

    def append(self, data):
        new_node = Node(data)
        if self.head is None:
            self.head = new_node
            return
        last = self.head
        while last.next:
            last = last.next
        last.next = new_node

    def delete_node(self, key):
        temp = self.head
        if temp is not None:
            if temp.data == key:
                self.head = temp.next
                temp = None
                return
        prev = None
        while temp is not None:
            if temp.data == key:
                break
            prev = temp
            temp = temp.next
        if temp == None:
            return
        prev.next = temp.next
        temp = None

    def print_list(self):
        temp = self.head
        while temp:
            print(temp.data, end=" -> ")
            temp = temp.next
        print("None")

# Create a linked list and perform operations
llist = LinkedList()
llist.append(1)
llist.append(2)
llist.append(3)
llist.print_list()  # Expected output: 1 -> 2 -> 3 -> None
llist.delete_node(2)
llist.print_list()  # Expected output: 1 -> 3 -> None''',
    "solution_explanation": "`prev` is only assigned inside the loop, so when the node is found immediately it is undefined. Initialise `prev = None` before the loop.",
}

Q_SET = {
    "title": "Fix the set union and intersection",
    "problem_statement": "You are trying to perform set operations in Python, but you are getting an unexpected result. Identify and fix the issue.",
    "starter_code": '''# Create two sets
set1 = {1, 2, 3}
set2 = {3, 4, 5}

# Perform union operation
union_set = set1 + set2
print("Union:", union_set)  # Expected output: {1, 2, 3, 4, 5}

# Perform intersection operation
intersection_set = set1 * set2
print("Intersection:", intersection_set)  # Expected output: {3}''',
    "solution_code": '''# Create two sets
set1 = {1, 2, 3}
set2 = {3, 4, 5}

# Perform union operation
union_set = set1 | set2
print("Union:", union_set)  # Expected output: {1, 2, 3, 4, 5}

# Perform intersection operation
intersection_set = set1 & set2
print("Intersection:", intersection_set)  # Expected output: {3}''',
    "solution_explanation": "`+` and `*` are not defined for sets. Use `|` for union and `&` for intersection.",
}

Q_ARRAY = {
    "title": "Fix the typed array append",
    "problem_statement": "You are trying to initialise and manipulate an array using the `array` module in Python, but your code is raising an error. Identify and fix the issue.",
    "starter_code": '''import array

# Create an array of integers
arr = array.array('i', [1, 2, 3, 4])

# Append an element to the array
arr.append(5.5)

# Print the array
print(arr)''',
    "solution_code": '''import array

# Create an array of integers
arr = array.array('i', [1, 2, 3, 4])

# Append an element to the array
arr.append(5)

# Print the array
print(arr)''',
    "solution_explanation": "The array is typed as integers ('i'), so appending a float raises TypeError. Append an integer instead.",
}

# Group 2 questions per existing assignment slot (lesson IDs in the course).
ASSIGNMENTS = [
    {"lesson_id": 170, "title": "Data Structures — Assignment 1",
     "questions": [Q_LIST, Q_STACK]},
    {"lesson_id": 171, "title": "Data Structures — Assignment 2",
     "questions": [Q_QUEUE, Q_LINKED]},
    {"lesson_id": 172, "title": "Data Structures — Assignment 3",
     "questions": [Q_SET, Q_ARRAY]},
]

INSTRUCTIONS = "Each program below has a bug. Fix the code so it produces the expected output, then click Run & Check."


def connect():
    missing = [k for k in ("POSTGRES_HOST", "POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB") if not os.environ.get(k)]
    if missing:
        sys.exit(f"Missing env vars: {', '.join(missing)}")
    return psycopg2.connect(
        host=os.environ["POSTGRES_HOST"],
        port=os.environ.get("POSTGRES_PORT", "5432"),
        user=os.environ["POSTGRES_USER"],
        password=os.environ["POSTGRES_PASSWORD"],
        dbname=os.environ["POSTGRES_DB"],
        sslmode="require",
        connect_timeout=20,
    )


def ensure_schema(conn):
    """Idempotent: add the enum value + assignment tables if missing (autocommit)."""
    conn.rollback()  # end any open (read-only) transaction so autocommit can be set
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute("ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'assignment'")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS assignments (
                assignment_id SERIAL PRIMARY KEY,
                lesson_id INTEGER NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                instructions TEXT,
                language VARCHAR(30) NOT NULL DEFAULT 'python',
                total_questions INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_assignments_lesson ON assignments(lesson_id)")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS assignment_questions (
                question_id SERIAL PRIMARY KEY,
                assignment_id INTEGER NOT NULL REFERENCES assignments(assignment_id) ON DELETE CASCADE,
                title VARCHAR(255),
                problem_statement TEXT NOT NULL,
                starter_code TEXT,
                expected_output TEXT,
                sample_input TEXT,
                solution_code TEXT,
                solution_explanation TEXT,
                language VARCHAR(30) NOT NULL DEFAULT 'python',
                points INTEGER DEFAULT 10,
                order_index INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cur.execute("CREATE INDEX IF NOT EXISTS idx_assignment_questions_assignment ON assignment_questions(assignment_id)")
    conn.autocommit = False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--commit", action="store_true", help="apply changes (default: dry run)")
    args = ap.parse_args()

    # Compute expected outputs from the reference solutions.
    for a in ASSIGNMENTS:
        for q in a["questions"]:
            q["expected_output"] = run_code(q["solution_code"])

    print("=== Computed expected outputs (from reference solutions) ===")
    for a in ASSIGNMENTS:
        for q in a["questions"]:
            print(f"- [{a['lesson_id']}] {q['title']}: {q['expected_output']!r}")
    print()

    conn = connect()
    try:
        # Verify the target lessons exist and are the Data Structures assignment slots.
        with conn.cursor() as cur:
            for a in ASSIGNMENTS:
                cur.execute("""
                    SELECT l.title, l.content_type, m.title, m.course_id
                    FROM lessons l JOIN modules m ON m.module_id = l.module_id
                    WHERE l.lesson_id = %s
                """, (a["lesson_id"],))
                row = cur.fetchone()
                if not row:
                    sys.exit(f"Lesson {a['lesson_id']} not found")
                l_title, l_type, m_title, c_id = row
                if c_id != COURSE_ID or DS_MODULE_TITLE_HINT not in m_title or "Assignment" not in l_title:
                    sys.exit(f"Safety check failed for lesson {a['lesson_id']}: "
                             f"course={c_id} module='{m_title}' lesson='{l_title}'")
                print(f"OK  L{a['lesson_id']}: '{l_title}' (now '{l_type}') in '{m_title}'  -> assignment ({len(a['questions'])} q)")

        if not args.commit:
            print("\nDRY RUN — no changes written. Re-run with --commit to apply.")
            return

        ensure_schema(conn)  # idempotent: enum value + assignment tables

        with conn.cursor() as cur:
            for a in ASSIGNMENTS:
                lid = a["lesson_id"]
                # Convert the lesson to an assignment and clear the old video pointer.
                cur.execute("""
                    UPDATE lessons SET content_type = 'assignment', content_url = NULL,
                        video_external_id = NULL, video_external_platform = NULL,
                        updated_at = NOW()
                    WHERE lesson_id = %s
                """, (lid,))
                # Replace any existing assignment for this lesson.
                cur.execute("DELETE FROM assignments WHERE lesson_id = %s", (lid,))
                cur.execute("""
                    INSERT INTO assignments (lesson_id, title, instructions, language, total_questions)
                    VALUES (%s, %s, %s, 'python', %s) RETURNING assignment_id
                """, (lid, a["title"], INSTRUCTIONS, len(a["questions"])))
                assignment_id = cur.fetchone()[0]
                for idx, q in enumerate(a["questions"]):
                    cur.execute("""
                        INSERT INTO assignment_questions (
                            assignment_id, title, problem_statement, starter_code,
                            expected_output, solution_code, solution_explanation,
                            language, points, order_index
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, 'python', 10, %s)
                    """, (assignment_id, q["title"], q["problem_statement"], q["starter_code"],
                          q["expected_output"], q["solution_code"], q["solution_explanation"], idx))
                print(f"Imported assignment {assignment_id} -> lesson {lid} ({len(a['questions'])} questions)")
        conn.commit()
        print("\nDONE — committed.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
