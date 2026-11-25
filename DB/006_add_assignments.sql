-- 006_add_assignments.sql
-- Adds a new "assignment" lesson content type for coding exercises, plus the
-- tables that hold an assignment and its questions (one assignment per lesson,
-- mirroring the quizzes / quiz_questions design).
--
-- Each assignment question is a self-contained coding problem: a prompt, the
-- (optionally buggy) starter code the student begins from, the expected stdout,
-- and a reference solution + explanation.
--
-- Safe to run multiple times. These statements are also applied automatically
-- on backend startup (app/db/migrate.py), so a normal deploy needs no manual
-- step. ALTER TYPE ... ADD VALUE must NOT be used in the same transaction that
-- later inserts a row using the new value; run this file on its own.

ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'assignment';

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
);
CREATE INDEX IF NOT EXISTS idx_assignments_lesson ON assignments(lesson_id);

CREATE TABLE IF NOT EXISTS assignment_questions (
    question_id SERIAL PRIMARY KEY,
    assignment_id INTEGER NOT NULL REFERENCES assignments(assignment_id) ON DELETE CASCADE,
    title VARCHAR(255),
    problem_statement TEXT NOT NULL,
    starter_code TEXT,            -- code the student starts from (may be buggy)
    expected_output TEXT,         -- expected stdout used for auto-check
    sample_input TEXT,            -- optional stdin
    solution_code TEXT,           -- reference solution
    solution_explanation TEXT,    -- why the fix / solution works
    language VARCHAR(30) NOT NULL DEFAULT 'python',
    points INTEGER DEFAULT 10,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assignment_questions_assignment ON assignment_questions(assignment_id);
