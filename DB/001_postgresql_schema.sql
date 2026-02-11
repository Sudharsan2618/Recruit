-- ============================================================================
-- LMS + RECRUITMENT PLATFORM - POSTGRESQL SCHEMA
-- ============================================================================
-- Author: Database Architecture Team
-- Date: February 09, 2026
-- Description: Complete PostgreSQL schema for the integrated LMS and 
--              Recruitment Platform with support for SCORM/xAPI compliance,
--              job matching, mentorship, referrals, and placements.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- For UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "vector";     -- For pgvector (job matching embeddings)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- For fuzzy text search

-- ============================================================================
-- SECTION 1: ENUM TYPES
-- ============================================================================

-- User Types
CREATE TYPE user_type AS ENUM ('student', 'company', 'admin', 'instructor', 'mentor');

-- User Status
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification');

-- Course Difficulty Levels
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- Content Types for Lessons
CREATE TYPE content_type AS ENUM (
    'video', 
    'text', 
    'pdf', 
    'audio', 
    'image', 
    'quiz', 
    'flashcard', 
    'scorm_package',
    'external_link'
);

-- Quiz Question Types
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer', 'multiple_select');

-- Enrollment Status
CREATE TYPE enrollment_status AS ENUM ('in_progress', 'completed', 'dropped', 'expired');

-- Payment Status
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');

-- Payment Type
CREATE TYPE payment_type AS ENUM (
    'course_purchase',
    'webinar_purchase',
    'material_purchase',
    'mentor_session',
    'referral_package',
    'placement_package',
    'subscription',
    'company_candidate_fee'
);

-- Product Pricing Model
CREATE TYPE pricing_model AS ENUM ('free', 'one_time', 'subscription');

-- Employment Types
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'freelance');

-- Remote Work Types
CREATE TYPE remote_type AS ENUM ('remote', 'on_site', 'hybrid');

-- Application Status (Student → Admin → Company flow)
CREATE TYPE application_status AS ENUM (
    'pending_admin_review',      -- Student applied, waiting for admin
    'admin_shortlisted',          -- Admin marked as potential match
    'rejected_by_admin',          -- Admin rejected (not qualified)
    'forwarded_to_company',       -- Admin forwarded to company
    'under_company_review',       -- Company is reviewing
    'interview_scheduled',        -- Interview is scheduled
    'interview_completed',        -- Interview done, pending decision
    'offer_extended',             -- Company made an offer
    'offer_accepted',             -- Candidate accepted
    'offer_rejected',             -- Candidate rejected offer
    'hired',                      -- Successfully hired
    'rejected_by_company',        -- Company rejected
    'withdrawn'                   -- Student withdrew application
);

-- Candidate Pipeline Stage (Company view)
CREATE TYPE candidate_stage AS ENUM (
    'new_candidates',
    'under_review',
    'interviewing',
    'offer_extended',
    'hired',
    'rejected'
);

-- Job Status
CREATE TYPE job_status AS ENUM ('draft', 'active', 'paused', 'closed', 'filled');

-- Webinar Status
CREATE TYPE webinar_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');

-- Registration Status
CREATE TYPE registration_status AS ENUM ('registered', 'attended', 'cancelled', 'no_show');

-- Mentor Session Status
CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled');

-- Referral Status
CREATE TYPE referral_status AS ENUM ('pending', 'contacted', 'interested', 'not_interested', 'converted');

-- Placement Package Status
CREATE TYPE placement_status AS ENUM ('active', 'completed', 'expired', 'cancelled');

-- Notification Type
CREATE TYPE notification_type AS ENUM (
    'course_update',
    'job_match',
    'application_update',
    'webinar_reminder',
    'payment_confirmation',
    'mentor_session',
    'referral_update',
    'system_announcement'
);

-- Admin Role Types
CREATE TYPE admin_role AS ENUM (
    'super_admin',
    'content_manager',
    'recruitment_manager',
    'finance_manager',
    'support_admin'
);

-- ============================================================================
-- SECTION 2: CORE USER TABLES
-- ============================================================================

-- Master Users Table (Authentication & Common Fields)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type user_type NOT NULL,
    status user_status DEFAULT 'pending_verification',
    email_verified BOOLEAN DEFAULT FALSE,
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    
    -- Indexes
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_status ON users(status);

-- Students Table
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    bio TEXT,
    headline VARCHAR(255),  -- Professional headline
    location VARCHAR(255),
    education TEXT,  -- Highest education
    experience_years INTEGER DEFAULT 0,
    
    -- Profile Assets (S3 URLs)
    profile_picture_url VARCHAR(500),
    resume_url VARCHAR(500),
    cover_letter_url VARCHAR(500),
    
    -- Job Preferences
    availability_status BOOLEAN DEFAULT TRUE,  -- Actively looking for jobs
    preferred_job_types employment_type[] DEFAULT '{}',
    preferred_locations VARCHAR(255)[] DEFAULT '{}',
    preferred_remote_types remote_type[] DEFAULT '{}',
    salary_expectation_min DECIMAL(12, 2),
    salary_expectation_max DECIMAL(12, 2),
    salary_currency VARCHAR(3) DEFAULT 'INR',
    notice_period_days INTEGER,
    
    -- Social Links
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    personal_website VARCHAR(500),
    
    -- Platform Metrics
    total_courses_enrolled INTEGER DEFAULT 0,
    total_courses_completed INTEGER DEFAULT 0,
    total_learning_hours DECIMAL(10, 2) DEFAULT 0,
    average_quiz_score DECIMAL(5, 2) DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_location ON students(location);
CREATE INDEX idx_students_availability ON students(availability_status);

-- Companies Table
CREATE TABLE companies (
    company_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    company_name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    company_size VARCHAR(50),  -- e.g., "50-200 employees"
    founded_year INTEGER,
    headquarters_location VARCHAR(255),
    
    -- Assets (S3 URLs)
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    
    -- Contact Info
    website_url VARCHAR(500),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    
    -- Social Links
    linkedin_url VARCHAR(500),
    twitter_url VARCHAR(500),
    
    -- Verification & Trust
    is_verified BOOLEAN DEFAULT FALSE,
    verification_documents_url VARCHAR(500),
    
    -- Billing (for candidate fees)
    billing_email VARCHAR(255),
    gst_number VARCHAR(50),
    billing_address TEXT,
    
    -- Stats
    total_jobs_posted INTEGER DEFAULT 0,
    total_hires INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_verified ON companies(is_verified);

-- Admins Table
CREATE TABLE admins (
    admin_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role admin_role NOT NULL DEFAULT 'support_admin',
    department VARCHAR(100),
    profile_picture_url VARCHAR(500),
    
    -- Permissions (JSON for flexibility)
    permissions JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admins_user_id ON admins(user_id);
CREATE INDEX idx_admins_role ON admins(role);

-- Instructors Table (Course Creators)
CREATE TABLE instructors (
    instructor_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,  -- Can be NULL for external instructors
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    bio TEXT,
    headline VARCHAR(255),
    expertise_areas VARCHAR(100)[] DEFAULT '{}',
    
    -- Assets
    profile_picture_url VARCHAR(500),
    
    -- Social Links
    linkedin_url VARCHAR(500),
    twitter_url VARCHAR(500),
    website_url VARCHAR(500),
    
    -- Type
    is_internal BOOLEAN DEFAULT FALSE,  -- Platform employee vs external
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Stats
    total_courses INTEGER DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_instructors_active ON instructors(is_active);

-- Mentors Table (1:1 Session Providers)
CREATE TABLE mentors (
    mentor_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    bio TEXT,
    headline VARCHAR(255),
    expertise_areas VARCHAR(100)[] DEFAULT '{}',
    years_of_experience INTEGER,
    current_company VARCHAR(255),
    role_title VARCHAR(255),
    
    -- Assets
    profile_picture_url VARCHAR(500),
    
    -- Session Details
    session_duration_minutes INTEGER DEFAULT 60,
    session_price DECIMAL(10, 2) DEFAULT 0,  -- 0 for free mentors
    currency VARCHAR(3) DEFAULT 'INR',
    is_free BOOLEAN DEFAULT FALSE,
    
    -- Availability (JSON: { "monday": ["09:00-12:00", "14:00-17:00"], ... })
    availability_schedule JSONB DEFAULT '{}',
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    
    -- Social Links
    linkedin_url VARCHAR(500),
    calendar_link VARCHAR(500),  -- Calendly or similar
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Stats
    total_sessions INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mentors_active ON mentors(is_active);
CREATE INDEX idx_mentors_free ON mentors(is_free);

-- ============================================================================
-- SECTION 3: SKILLS & CATEGORIES (NORMALIZED)
-- ============================================================================

-- Skills Master Table
CREATE TABLE skills (
    skill_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,  -- URL-friendly version
    category VARCHAR(100),  -- e.g., "Programming", "Design", "Marketing"
    description TEXT,
    icon_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_skills_name ON skills(name);
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_slug ON skills(slug);

-- Skill Synonyms (e.g., "JS" = "JavaScript")
CREATE TABLE skill_synonyms (
    synonym_id SERIAL PRIMARY KEY,
    skill_id INTEGER NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    synonym VARCHAR(100) NOT NULL,
    
    UNIQUE(skill_id, synonym)
);

-- Student Skills (Junction Table)
CREATE TABLE student_skills (
    student_skill_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5),  -- 1=Beginner, 5=Expert
    years_of_experience DECIMAL(3, 1),
    is_verified BOOLEAN DEFAULT FALSE,  -- Verified through course completion or assessment
    verified_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(student_id, skill_id)
);

CREATE INDEX idx_student_skills_student ON student_skills(student_id);
CREATE INDEX idx_student_skills_skill ON student_skills(skill_id);

-- Categories Master Table (for Courses, Jobs, etc.)
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_category_id INTEGER REFERENCES categories(category_id),  -- For subcategories
    icon_url VARCHAR(500),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_parent ON categories(parent_category_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- ============================================================================
-- SECTION 4: COURSE MANAGEMENT
-- ============================================================================

-- Courses Table
CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    
    -- Categorization
    category_id INTEGER REFERENCES categories(category_id),
    difficulty_level difficulty_level NOT NULL DEFAULT 'beginner',
    
    -- Instructor
    instructor_id INTEGER REFERENCES instructors(instructor_id),
    
    -- Pricing
    pricing_model pricing_model DEFAULT 'free',
    price DECIMAL(10, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    discount_price DECIMAL(10, 2),
    discount_valid_until TIMESTAMP,
    
    -- Content Info
    duration_hours DECIMAL(5, 2),  -- Total course duration
    total_modules INTEGER DEFAULT 0,
    total_lessons INTEGER DEFAULT 0,
    
    -- Assets (S3 URLs)
    thumbnail_url VARCHAR(500),
    preview_video_url VARCHAR(500),
    
    -- SCORM/xAPI
    is_scorm_compliant BOOLEAN DEFAULT FALSE,
    scorm_package_url VARCHAR(500),
    xapi_activity_id VARCHAR(500),
    
    -- Publishing
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    
    -- Stats
    total_enrollments INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courses_category ON courses(category_id);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_published ON courses(is_published);
CREATE INDEX idx_courses_pricing ON courses(pricing_model);
CREATE INDEX idx_courses_slug ON courses(slug);

-- Course Skills (What skills this course teaches)
CREATE TABLE course_skills (
    course_skill_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,  -- Main skill taught
    
    UNIQUE(course_id, skill_id)
);

CREATE INDEX idx_course_skills_course ON course_skills(course_id);
CREATE INDEX idx_course_skills_skill ON course_skills(skill_id);

-- Course Prerequisites
CREATE TABLE course_prerequisites (
    prerequisite_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    prerequisite_course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    is_mandatory BOOLEAN DEFAULT FALSE,
    
    UNIQUE(course_id, prerequisite_course_id),
    CHECK (course_id != prerequisite_course_id)
);

-- Modules Table
CREATE TABLE modules (
    module_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    duration_minutes INTEGER,
    is_preview BOOLEAN DEFAULT FALSE,  -- Free preview module
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_modules_course ON modules(course_id);
CREATE INDEX idx_modules_order ON modules(course_id, order_index);

-- Lessons Table
CREATE TABLE lessons (
    lesson_id SERIAL PRIMARY KEY,
    module_id INTEGER NOT NULL REFERENCES modules(module_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type content_type NOT NULL,
    order_index INTEGER NOT NULL,
    duration_minutes INTEGER,
    
    -- Content (based on content_type)
    content_url VARCHAR(500),           -- S3 URL for PDF, audio, image
    video_external_id VARCHAR(255),     -- YouTube/Vimeo video ID
    video_external_platform VARCHAR(50), -- 'youtube', 'vimeo', etc.
    text_content TEXT,                  -- For text-based lessons
    scorm_package_url VARCHAR(500),     -- For SCORM lessons
    
    -- xAPI Tracking
    xapi_activity_id VARCHAR(500),
    
    -- Settings
    is_preview BOOLEAN DEFAULT FALSE,
    is_mandatory BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_lessons_order ON lessons(module_id, order_index);
CREATE INDEX idx_lessons_type ON lessons(content_type);

-- Quizzes Table
CREATE TABLE quizzes (
    quiz_id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    
    -- Settings
    pass_percentage DECIMAL(5, 2) NOT NULL DEFAULT 70.00,
    time_limit_minutes INTEGER,  -- NULL for no time limit
    max_attempts INTEGER,        -- NULL for unlimited
    shuffle_questions BOOLEAN DEFAULT FALSE,
    shuffle_options BOOLEAN DEFAULT FALSE,
    show_correct_answers BOOLEAN DEFAULT TRUE,
    
    -- Stats
    total_questions INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,
    average_score DECIMAL(5, 2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quizzes_lesson ON quizzes(lesson_id);

-- Quiz Questions Table
CREATE TABLE quiz_questions (
    question_id SERIAL PRIMARY KEY,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL,
    options JSONB,  -- Array of options for MCQ: [{"text": "Option A", "is_correct": false}, ...]
    correct_answer TEXT,  -- For short_answer or as backup
    explanation TEXT,  -- Explanation shown after answering
    points INTEGER DEFAULT 1,
    order_index INTEGER NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_questions_order ON quiz_questions(quiz_id, order_index);

-- Flashcard Decks Table
CREATE TABLE flashcard_decks (
    deck_id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(lesson_id) ON DELETE CASCADE,  -- Can be NULL for standalone
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,  -- For course-level decks
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Stats
    total_cards INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flashcard_decks_lesson ON flashcard_decks(lesson_id);
CREATE INDEX idx_flashcard_decks_course ON flashcard_decks(course_id);

-- Flashcards Table
CREATE TABLE flashcards (
    flashcard_id SERIAL PRIMARY KEY,
    deck_id INTEGER NOT NULL REFERENCES flashcard_decks(deck_id) ON DELETE CASCADE,
    front_content TEXT NOT NULL,  -- Question/Term
    back_content TEXT NOT NULL,   -- Answer/Definition
    front_image_url VARCHAR(500),
    back_image_url VARCHAR(500),
    order_index INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flashcards_deck ON flashcards(deck_id);

-- ============================================================================
-- SECTION 5: ENROLLMENTS & PROGRESS
-- ============================================================================

-- Enrollments Table
CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    
    -- Status
    status enrollment_status DEFAULT 'in_progress',
    progress_percentage DECIMAL(5, 2) DEFAULT 0,
    
    -- Dates
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    expires_at TIMESTAMP,  -- For time-limited access
    
    -- Completion
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_url VARCHAR(500),
    certificate_issued_at TIMESTAMP,
    
    -- Payment Reference
    payment_id INTEGER,  -- Will reference payments table
    
    UNIQUE(student_id, course_id)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- Lesson Progress Table
CREATE TABLE lesson_progress (
    progress_id SERIAL PRIMARY KEY,
    enrollment_id INTEGER NOT NULL REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    
    -- Progress
    is_completed BOOLEAN DEFAULT FALSE,
    progress_percentage DECIMAL(5, 2) DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    
    -- Video specific
    video_position_seconds INTEGER DEFAULT 0,  -- Resume position
    
    -- Dates
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(enrollment_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_enrollment ON lesson_progress(enrollment_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);

-- Quiz Attempts Table
CREATE TABLE quiz_attempts (
    attempt_id SERIAL PRIMARY KEY,
    enrollment_id INTEGER NOT NULL REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    
    -- Results
    score DECIMAL(5, 2) NOT NULL,
    percentage DECIMAL(5, 2) NOT NULL,
    passed BOOLEAN NOT NULL,
    
    -- Timing
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NOT NULL,
    time_taken_seconds INTEGER,
    
    -- Answers (stored in MongoDB for detail, summary here)
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quiz_attempts_enrollment ON quiz_attempts(enrollment_id);
CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);

-- ============================================================================
-- SECTION 6: MATERIALS (STANDALONE & COURSE-ATTACHED)
-- ============================================================================

-- Materials Table
CREATE TABLE materials (
    material_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Attachment (Can be standalone or course-attached)
    course_id INTEGER REFERENCES courses(course_id) ON DELETE SET NULL,
    lesson_id INTEGER REFERENCES lessons(lesson_id) ON DELETE SET NULL,
    
    -- File Info
    file_type VARCHAR(50) NOT NULL,  -- PDF, ZIP, DOCX, etc.
    file_url VARCHAR(500) NOT NULL,  -- S3 URL
    file_size_bytes BIGINT,
    
    -- Pricing
    pricing_model pricing_model DEFAULT 'free',
    price DECIMAL(10, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Stats
    download_count INTEGER DEFAULT 0,
    
    -- Publishing
    is_published BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_materials_course ON materials(course_id);
CREATE INDEX idx_materials_lesson ON materials(lesson_id);
CREATE INDEX idx_materials_pricing ON materials(pricing_model);

-- Material Downloads (Track who downloaded what)
CREATE TABLE material_downloads (
    download_id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES materials(material_id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    payment_id INTEGER,  -- If paid material
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_material_downloads_material ON material_downloads(material_id);
CREATE INDEX idx_material_downloads_student ON material_downloads(student_id);

-- ============================================================================
-- SECTION 7: WEBINARS
-- ============================================================================

-- Webinars Table
CREATE TABLE webinars (
    webinar_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Host
    host_name VARCHAR(255),
    host_bio TEXT,
    instructor_id INTEGER REFERENCES instructors(instructor_id),
    
    -- Scheduling
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    
    -- Status
    status webinar_status DEFAULT 'scheduled',
    
    -- Access
    join_url VARCHAR(500),
    meeting_id VARCHAR(100),
    meeting_password VARCHAR(50),
    replay_url VARCHAR(500),  -- Recording URL after completion
    
    -- Pricing
    pricing_model pricing_model DEFAULT 'free',
    price DECIMAL(10, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Capacity
    max_attendees INTEGER,
    
    -- Assets
    thumbnail_url VARCHAR(500),
    
    -- Stats
    total_registrations INTEGER DEFAULT 0,
    total_attendees INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webinars_status ON webinars(status);
CREATE INDEX idx_webinars_scheduled ON webinars(scheduled_start);
CREATE INDEX idx_webinars_pricing ON webinars(pricing_model);

-- Webinar Registrations Table
CREATE TABLE webinar_registrations (
    registration_id SERIAL PRIMARY KEY,
    webinar_id INTEGER NOT NULL REFERENCES webinars(webinar_id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    
    status registration_status DEFAULT 'registered',
    
    -- Dates
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attended_at TIMESTAMP,
    
    -- Payment
    payment_id INTEGER,
    
    -- Reminders
    reminder_sent BOOLEAN DEFAULT FALSE,
    
    UNIQUE(webinar_id, student_id)
);

CREATE INDEX idx_webinar_registrations_webinar ON webinar_registrations(webinar_id);
CREATE INDEX idx_webinar_registrations_student ON webinar_registrations(student_id);

-- ============================================================================
-- SECTION 8: MENTOR SESSIONS
-- ============================================================================

-- Mentor Sessions Table
CREATE TABLE mentor_sessions (
    session_id SERIAL PRIMARY KEY,
    mentor_id INTEGER NOT NULL REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    
    -- Scheduling
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    
    -- Status
    status session_status DEFAULT 'scheduled',
    
    -- Meeting Details
    meeting_url VARCHAR(500),
    meeting_id VARCHAR(100),
    
    -- Topic
    topic VARCHAR(255),
    agenda TEXT,
    
    -- Feedback
    student_rating INTEGER CHECK (student_rating BETWEEN 1 AND 5),
    student_feedback TEXT,
    mentor_notes TEXT,
    
    -- Payment
    payment_id INTEGER,
    session_price DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Rescheduling
    rescheduled_from INTEGER REFERENCES mentor_sessions(session_id),
    reschedule_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mentor_sessions_mentor ON mentor_sessions(mentor_id);
CREATE INDEX idx_mentor_sessions_student ON mentor_sessions(student_id);
CREATE INDEX idx_mentor_sessions_status ON mentor_sessions(status);
CREATE INDEX idx_mentor_sessions_scheduled ON mentor_sessions(scheduled_start);

-- ============================================================================
-- SECTION 9: JOB MANAGEMENT
-- ============================================================================

-- Jobs Table
CREATE TABLE jobs (
    job_id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    
    -- Basic Info
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    responsibilities TEXT,
    requirements TEXT,
    nice_to_have TEXT,
    
    -- Categorization
    category_id INTEGER REFERENCES categories(category_id),
    department VARCHAR(100),
    
    -- Employment Details
    employment_type employment_type NOT NULL,
    remote_type remote_type DEFAULT 'on_site',
    location VARCHAR(255),
    experience_min_years INTEGER DEFAULT 0,
    experience_max_years INTEGER,
    
    -- Salary
    salary_min DECIMAL(12, 2),
    salary_max DECIMAL(12, 2),
    salary_currency VARCHAR(3) DEFAULT 'INR',
    salary_is_visible BOOLEAN DEFAULT FALSE,  -- Show to students or not
    
    -- Benefits
    benefits TEXT[] DEFAULT '{}',
    
    -- Status & Dates
    status job_status DEFAULT 'draft',
    posted_at TIMESTAMP,
    deadline TIMESTAMP,
    closed_at TIMESTAMP,
    
    -- Counts (updated by triggers/app)
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    
    -- Admin Pricing (per qualified candidate forwarded)
    price_per_candidate DECIMAL(10, 2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_category ON jobs(category_id);
CREATE INDEX idx_jobs_posted ON jobs(posted_at);
CREATE INDEX idx_jobs_slug ON jobs(slug);

-- Job Required Skills
CREATE TABLE job_skills (
    job_skill_id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    is_mandatory BOOLEAN DEFAULT TRUE,
    min_experience_years INTEGER,
    
    UNIQUE(job_id, skill_id)
);

CREATE INDEX idx_job_skills_job ON job_skills(job_id);
CREATE INDEX idx_job_skills_skill ON job_skills(skill_id);

-- ============================================================================
-- SECTION 10: JOB APPLICATIONS (Student → Admin → Company)
-- ============================================================================

-- Applications Table
CREATE TABLE applications (
    application_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    job_id INTEGER NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    
    -- Status
    status application_status DEFAULT 'pending_admin_review',
    
    -- Student's Application
    cover_letter TEXT,
    resume_url VARCHAR(500),  -- Snapshot at application time
    expected_salary DECIMAL(12, 2),
    notice_period_days INTEGER,
    
    -- Admin Review
    admin_id INTEGER REFERENCES admins(admin_id),
    admin_notes TEXT,
    admin_reviewed_at TIMESTAMP,
    admin_match_score DECIMAL(5, 2),  -- Manual or AI-generated score
    forwarded_at TIMESTAMP,
    
    -- Company Review
    company_notes TEXT,
    company_reviewed_at TIMESTAMP,
    company_stage candidate_stage,
    
    -- Interview
    interview_scheduled_at TIMESTAMP,
    interview_completed_at TIMESTAMP,
    interview_feedback TEXT,
    interview_rating INTEGER CHECK (interview_rating BETWEEN 1 AND 5),
    
    -- Offer
    offer_extended_at TIMESTAMP,
    offer_salary DECIMAL(12, 2),
    offer_details TEXT,
    offer_response_at TIMESTAMP,
    
    -- Final Outcome
    hired_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    withdrawn_at TIMESTAMP,
    withdrawal_reason TEXT,
    
    -- Dates
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(student_id, job_id)
);

CREATE INDEX idx_applications_student ON applications(student_id);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_admin ON applications(admin_id);
CREATE INDEX idx_applications_applied ON applications(applied_at);

-- Application Status History (Audit Trail)
CREATE TABLE application_status_history (
    history_id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
    previous_status application_status,
    new_status application_status NOT NULL,
    changed_by_user_id INTEGER REFERENCES users(user_id),
    notes TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_app_status_history_application ON application_status_history(application_id);
CREATE INDEX idx_app_status_history_changed ON application_status_history(changed_at);

-- Interview Slots Table
CREATE TABLE interview_slots (
    slot_id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
    
    -- Scheduling
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    
    -- Meeting Info
    interview_type VARCHAR(50),  -- 'phone', 'video', 'in_person', 'technical'
    meeting_url VARCHAR(500),
    meeting_id VARCHAR(100),
    location VARCHAR(255),  -- For in-person
    
    -- Interviewers
    interviewer_names TEXT[] DEFAULT '{}',
    interviewer_emails TEXT[] DEFAULT '{}',
    
    -- Status
    is_confirmed BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancellation_reason TEXT,
    
    -- Feedback (stored after interview)
    feedback_submitted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interview_slots_application ON interview_slots(application_id);
CREATE INDEX idx_interview_slots_scheduled ON interview_slots(scheduled_start);

-- ============================================================================
-- SECTION 11: REFERRALS (Company Professional Referrals)
-- ============================================================================

-- Referral Contacts Table (Company provides professional contacts)
CREATE TABLE referral_contacts (
    referral_id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    
    -- Contact Info
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    contact_linkedin VARCHAR(500),
    
    -- Professional Details
    contact_company VARCHAR(255),
    contact_designation VARCHAR(255),
    relationship_description TEXT,  -- How does the company know this contact?
    
    -- Status
    status referral_status DEFAULT 'pending',
    
    -- Admin Tracking
    admin_id INTEGER REFERENCES admins(admin_id),
    admin_notes TEXT,
    contacted_at TIMESTAMP,
    response_notes TEXT,
    
    -- Pricing
    referral_fee DECIMAL(10, 2) DEFAULT 0,
    is_paid BOOLEAN DEFAULT FALSE,
    payment_id INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_referral_contacts_company ON referral_contacts(company_id);
CREATE INDEX idx_referral_contacts_status ON referral_contacts(status);

-- ============================================================================
-- SECTION 12: PLACEMENT PACKAGES
-- ============================================================================

-- Placement Packages Table (Service packages students can buy)
CREATE TABLE placement_packages (
    package_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- What's Included
    features JSONB NOT NULL,  -- Array of features
    -- Example: ["Resume Review", "Mock Interviews (3)", "Job Matching", "Dedicated Mentor"]
    
    -- Duration
    validity_days INTEGER NOT NULL,  -- How long is the package valid
    
    -- Pricing
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    discount_price DECIMAL(10, 2),
    
    -- Guarantees
    job_guarantee BOOLEAN DEFAULT FALSE,
    refund_policy TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Placement Enrollments
CREATE TABLE student_placements (
    placement_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    package_id INTEGER NOT NULL REFERENCES placement_packages(package_id),
    
    -- Status
    status placement_status DEFAULT 'active',
    
    -- Dates
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    
    -- Progress Tracking
    resume_reviewed BOOLEAN DEFAULT FALSE,
    mock_interviews_used INTEGER DEFAULT 0,
    mock_interviews_total INTEGER,
    mentor_assigned_id INTEGER REFERENCES mentors(mentor_id),
    
    -- Outcome
    placed_at TIMESTAMP,
    placed_company_id INTEGER REFERENCES companies(company_id),
    placed_job_id INTEGER REFERENCES jobs(job_id),
    
    -- Payment
    payment_id INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_placements_student ON student_placements(student_id);
CREATE INDEX idx_student_placements_status ON student_placements(status);

-- ============================================================================
-- SECTION 13: BADGES & ACHIEVEMENTS
-- ============================================================================

-- Badges Table
CREATE TABLE badges (
    badge_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    
    -- Criteria
    criteria_type VARCHAR(50) NOT NULL,  -- 'course_completion', 'quiz_score', 'streak', 'skill_mastery', etc.
    criteria_value JSONB,  -- Flexible criteria config
    -- Example: {"course_id": 5} or {"quiz_score_min": 90} or {"streak_days": 30}
    
    -- Assets
    icon_url VARCHAR(500),
    badge_color VARCHAR(20),  -- Hex color
    
    -- Gamification
    points INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Badges (Earned Badges)
CREATE TABLE student_badges (
    student_badge_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES badges(badge_id) ON DELETE CASCADE,
    
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- What triggered this badge
    trigger_type VARCHAR(50),
    trigger_reference_id INTEGER,  -- course_id, quiz_id, etc.
    
    UNIQUE(student_id, badge_id)
);

CREATE INDEX idx_student_badges_student ON student_badges(student_id);
CREATE INDEX idx_student_badges_badge ON student_badges(badge_id);

-- ============================================================================
-- SECTION 14: PORTFOLIO & PROJECTS
-- ============================================================================

-- Student Portfolio Projects
CREATE TABLE student_portfolios (
    portfolio_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    
    -- Project Info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Links
    project_url VARCHAR(500),
    github_url VARCHAR(500),
    demo_url VARCHAR(500),
    
    -- Media (S3 URLs)
    thumbnail_url VARCHAR(500),
    images TEXT[] DEFAULT '{}',  -- Array of image URLs
    
    -- Dates
    start_date DATE,
    end_date DATE,
    is_ongoing BOOLEAN DEFAULT FALSE,
    
    -- Display
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_portfolios_student ON student_portfolios(student_id);

-- Portfolio Skills (Skills used in the project)
CREATE TABLE portfolio_skills (
    portfolio_skill_id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES student_portfolios(portfolio_id) ON DELETE CASCADE,
    skill_id INTEGER NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    
    UNIQUE(portfolio_id, skill_id)
);

-- ============================================================================
-- SECTION 15: REVIEWS & RATINGS
-- ============================================================================

-- Course Reviews
CREATE TABLE course_reviews (
    review_id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    enrollment_id INTEGER REFERENCES enrollments(enrollment_id),
    
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    
    -- Moderation
    is_approved BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Helpfulness
    helpful_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(course_id, student_id)
);

CREATE INDEX idx_course_reviews_course ON course_reviews(course_id);
CREATE INDEX idx_course_reviews_student ON course_reviews(student_id);
CREATE INDEX idx_course_reviews_rating ON course_reviews(rating);

-- Mentor Reviews
CREATE TABLE mentor_reviews (
    review_id SERIAL PRIMARY KEY,
    mentor_id INTEGER NOT NULL REFERENCES mentors(mentor_id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES mentor_sessions(session_id),
    
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    
    is_approved BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(session_id)  -- One review per session
);

CREATE INDEX idx_mentor_reviews_mentor ON mentor_reviews(mentor_id);

-- ============================================================================
-- SECTION 16: PAYMENTS & TRANSACTIONS
-- ============================================================================

-- Payments Table
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    
    -- Payment Details
    payment_type payment_type NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Tax
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    tax_percentage DECIMAL(5, 2) DEFAULT 18.00,  -- GST
    
    -- Total
    total_amount DECIMAL(12, 2) NOT NULL,
    
    -- Status
    status payment_status DEFAULT 'pending',
    
    -- Gateway Details
    gateway_name VARCHAR(50),  -- 'razorpay', 'stripe', etc.
    gateway_payment_id VARCHAR(255),
    gateway_order_id VARCHAR(255),
    gateway_signature VARCHAR(255),
    gateway_response JSONB,
    
    -- Invoice
    invoice_number VARCHAR(50) UNIQUE,
    invoice_url VARCHAR(500),
    
    -- Reference (what was purchased)
    reference_type VARCHAR(50),  -- 'course', 'webinar', 'material', 'mentor_session', etc.
    reference_id INTEGER,
    
    -- Billing Info Snapshot
    billing_name VARCHAR(255),
    billing_email VARCHAR(255),
    billing_address TEXT,
    billing_gst VARCHAR(50),
    
    -- Dates
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    refunded_at TIMESTAMP,
    refund_reason TEXT
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_type ON payments(payment_type);
CREATE INDEX idx_payments_reference ON payments(reference_type, reference_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_number);

-- Company Candidate Billing (Per qualified candidate forwarded)
CREATE TABLE company_candidate_billing (
    billing_id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    application_id INTEGER NOT NULL REFERENCES applications(application_id),
    
    -- Billing Details
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    -- Status
    is_invoiced BOOLEAN DEFAULT FALSE,
    is_paid BOOLEAN DEFAULT FALSE,
    
    -- Payment Reference
    payment_id INTEGER REFERENCES payments(payment_id),
    invoice_number VARCHAR(50),
    
    -- Dates
    forwarded_at TIMESTAMP NOT NULL,
    invoiced_at TIMESTAMP,
    paid_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_company_billing_company ON company_candidate_billing(company_id);
CREATE INDEX idx_company_billing_paid ON company_candidate_billing(is_paid);

-- ============================================================================
-- SECTION 17: NOTIFICATIONS
-- ============================================================================

-- Notifications Table
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Notification Content
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Action
    action_url VARCHAR(500),
    action_text VARCHAR(100),
    
    -- Reference
    reference_type VARCHAR(50),
    reference_id INTEGER,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    
    -- Delivery
    email_sent BOOLEAN DEFAULT FALSE,
    push_sent BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(type);

-- User Notification Preferences
CREATE TABLE notification_preferences (
    preference_id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Email Preferences
    email_course_updates BOOLEAN DEFAULT TRUE,
    email_job_matches BOOLEAN DEFAULT TRUE,
    email_application_updates BOOLEAN DEFAULT TRUE,
    email_webinar_reminders BOOLEAN DEFAULT TRUE,
    email_marketing BOOLEAN DEFAULT FALSE,
    
    -- Push Preferences
    push_enabled BOOLEAN DEFAULT TRUE,
    push_course_updates BOOLEAN DEFAULT TRUE,
    push_job_matches BOOLEAN DEFAULT TRUE,
    push_application_updates BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SECTION 18: VECTOR EMBEDDINGS (for Job Matching)
-- ============================================================================

-- Student Embeddings (for similarity search)
CREATE TABLE student_embeddings (
    embedding_id SERIAL PRIMARY KEY,
    student_id INTEGER UNIQUE NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    
    -- Vector (1536 dimensions for OpenAI embeddings)
    embedding vector(1536) NOT NULL,
    
    -- Metadata
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-3-small',
    source_text_hash VARCHAR(64),  -- Hash of source text to detect changes
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_embeddings_student ON student_embeddings(student_id);

-- Job Embeddings (for similarity search)
CREATE TABLE job_embeddings (
    embedding_id SERIAL PRIMARY KEY,
    job_id INTEGER UNIQUE NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    
    -- Vector
    embedding vector(1536) NOT NULL,
    
    -- Metadata
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-3-small',
    source_text_hash VARCHAR(64),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_embeddings_job ON job_embeddings(job_id);

-- Create HNSW index for fast similarity search
CREATE INDEX idx_student_embeddings_vector ON student_embeddings USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_job_embeddings_vector ON job_embeddings USING hnsw (embedding vector_cosine_ops);

-- Admin Match Recommendations (AI-generated matches)
CREATE TABLE admin_match_recommendations (
    recommendation_id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    
    -- Recommended Students (array of student_ids with scores)
    recommendations JSONB NOT NULL,
    -- Example: [{"student_id": 123, "score": 0.92}, {"student_id": 456, "score": 0.88}]
    
    -- Metadata
    algorithm_version VARCHAR(50),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,  -- Recommendations become stale
    
    -- Admin Action
    reviewed_by_admin_id INTEGER REFERENCES admins(admin_id),
    reviewed_at TIMESTAMP
);

CREATE INDEX idx_match_recommendations_job ON admin_match_recommendations(job_id);
CREATE INDEX idx_match_recommendations_generated ON admin_match_recommendations(generated_at);

-- ============================================================================
-- SECTION 19: SYSTEM CONFIGURATION
-- ============================================================================

-- System Settings
CREATE TABLE system_settings (
    setting_id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',  -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,  -- Can be exposed to frontend
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES admins(admin_id)
);

-- Audit Log (for security and compliance)
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================================
-- SECTION 20: UPDATE TIMESTAMP TRIGGER
-- ============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at column
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
