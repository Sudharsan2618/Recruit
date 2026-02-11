# Database Architecture Documentation

## LMS + Recruitment Platform - Complete Data Storage Guide

**Author:** Database Architecture Team  
**Date:** February 09, 2026  
**Version:** 1.0

---

## Table of Contents

1. [Overview](#1-overview)
2. [Storage Technologies](#2-storage-technologies)
3. [PostgreSQL Data Model](#3-postgresql-data-model)
4. [MongoDB Data Model](#4-mongodb-data-model)
5. [S3/Object Storage](#5-s3object-storage)
6. [Data Relationships & Connections](#6-data-relationships--connections)
7. [Data Flow Diagrams](#7-data-flow-diagrams)
8. [API to Database Mapping](#8-api-to-database-mapping)
9. [Security Considerations](#9-security-considerations)
10. [Performance Optimization](#10-performance-optimization)
11. [Backup & Recovery](#11-backup--recovery)

---

## 1. Overview

The platform uses a **polyglot persistence** architecture, combining three storage technologies:

| Technology | Purpose | Data Characteristics |
|------------|---------|---------------------|
| **PostgreSQL** | Primary database | Structured, relational, transactional |
| **MongoDB** | Analytics & flexible data | Semi-structured, high-volume, time-series |
| **S3/Object Storage** | Binary assets | Large files, static content |

### Why Polyglot Persistence?

- **PostgreSQL**: ACID compliance for critical business data (users, payments, jobs)
- **MongoDB**: Flexible schema for learning analytics, xAPI statements
- **S3**: Cost-effective, scalable storage for media files

---

## 2. Storage Technologies

### 2.1 PostgreSQL

**Purpose:** Primary transactional database for all structured business data.

**Key Features Used:**
- `pgvector` extension for job matching embeddings
- Array types for skills, benefits, etc.
- JSONB for flexible metadata
- Enums for type safety

**Connection String Format:**
```
postgresql://username:password@host:5432/recruit_lms_db
```

### 2.2 MongoDB

**Purpose:** Learning analytics, event logs, and flexible schema data.

**Key Features Used:**
- Document validation schemas
- TTL indexes for auto-cleanup
- Text indexes for search
- Aggregation pipelines for analytics

**Connection String Format:**
```
mongodb://username:password@host:27017/recruit_lms_db
```

### 2.3 S3/Object Storage

**Purpose:** All binary assets (images, PDFs, videos, resumes).

**Supported Providers:**
- AWS S3
- Google Cloud Storage
- Azure Blob Storage
- MinIO (self-hosted)

**Bucket Structure:**
```
recruit-lms-assets/
├── users/
│   ├── profiles/{user_id}/
│   └── resumes/{student_id}/
├── companies/
│   └── logos/{company_id}/
├── courses/
│   ├── thumbnails/{course_id}/
│   ├── content/{course_id}/{lesson_id}/
│   └── scorm/{course_id}/
├── materials/
│   └── {material_id}/
├── portfolios/
│   └── {student_id}/{portfolio_id}/
└── certificates/
    └── {enrollment_id}/
```

---

## 3. PostgreSQL Data Model

### 3.1 Table Overview by Domain

#### User Management (8 tables)

| Table | Description | Key Fields |
|-------|-------------|------------|
| `users` | Master authentication table | `user_id`, `email`, `user_type`, `status` |
| `students` | Student profiles | `student_id`, `bio`, `skills`, `resume_url` |
| `companies` | Company profiles | `company_id`, `company_name`, `industry` |
| `admins` | Admin users | `admin_id`, `role`, `permissions` |
| `instructors` | Course creators | `instructor_id`, `expertise_areas` |
| `mentors` | 1:1 session providers | `mentor_id`, `session_price`, `availability` |
| `notification_preferences` | User notification settings | Preferences per channel |
| `notifications` | User notifications | `type`, `message`, `is_read` |

#### Skills & Categories (4 tables)

| Table | Description | Key Fields |
|-------|-------------|------------|
| `skills` | Master skills list | `skill_id`, `name`, `category` |
| `skill_synonyms` | Skill aliases (JS→JavaScript) | `synonym`, `skill_id` |
| `student_skills` | Student-skill junction | `proficiency_level`, `is_verified` |
| `categories` | Course/job categories | Hierarchical with `parent_category_id` |

#### Course Management (10 tables)

| Table | Description | Key Fields |
|-------|-------------|------------|
| `courses` | Course metadata | `title`, `price`, `instructor_id`, `is_published` |
| `course_skills` | Skills taught by course | `is_primary` |
| `course_prerequisites` | Course dependencies | `is_mandatory` |
| `modules` | Course sections | `order_index`, `duration_minutes` |
| `lessons` | Individual lessons | `content_type`, `content_url`, `video_external_id` |
| `quizzes` | Quiz metadata | `pass_percentage`, `time_limit_minutes` |
| `quiz_questions` | Quiz questions | `question_type`, `options`, `correct_answer` |
| `flashcard_decks` | Flashcard collections | Can be course or lesson level |
| `flashcards` | Individual flashcards | `front_content`, `back_content` |
| `course_reviews` | Student reviews | `rating`, `review_text` |

#### Enrollment & Progress (3 tables)

| Table | Description | Key Fields |
|-------|-------------|------------|
| `enrollments` | Student course enrollments | `status`, `progress_percentage`, `certificate_url` |
| `lesson_progress` | Lesson-level progress | `is_completed`, `time_spent_seconds` |
| `quiz_attempts` | Quiz attempt records | `score`, `passed`, `time_taken_seconds` |

#### Materials (2 tables)

| Table | Description | Key Fields |
|-------|-------------|------------|
| `materials` | Downloadable resources | `file_url`, `pricing_model`, `price` |
| `material_downloads` | Download tracking | `downloaded_at`, `payment_id` |

#### Webinars (2 tables)

| Table | Description | Key Fields |
|-------|-------------|------------|
| `webinars` | Live webinar events | `scheduled_start`, `join_url`, `pricing_model` |
| `webinar_registrations` | Student registrations | `status`, `payment_id` |

#### Mentor Sessions (2 tables)

| Table | Description | Key Fields |
|-------|-------------|------------|
| `mentor_sessions` | Booked sessions | `scheduled_start`, `status`, `payment_id` |
| `mentor_reviews` | Session reviews | `rating`, `review_text` |

#### Job Management (4 tables)

| Table | Description | Key Fields |
|-------|-------------|------------|
| `jobs` | Job postings | `title`, `salary_min/max`, `status`, `price_per_candidate` |
| `job_skills` | Required skills | `is_mandatory`, `min_experience_years` |
| `applications` | Student applications | `status`, `admin_match_score` |
| `application_status_history` | Status audit trail | `previous_status`, `new_status` |
| `interview_slots` | Scheduled interviews | `interview_type`, `meeting_url` |

#### Referrals & Placements (3 tables)

| Table | Description | Key Fields |
|-------|-------------|------------|
| `referral_contacts` | Company professional referrals | `contact_name`, `status`, `referral_fee` |
| `placement_packages` | Placement service packages | `features`, `price`, `job_guarantee` |
| `student_placements` | Student placement enrollments | `status`, `placed_at` |

#### Badges & Portfolios (4 tables)

| Table | Description | Key Fields |
|-------|-------------|------------|
| `badges` | Achievement badges | `criteria_type`, `criteria_value`, `points` |
| `student_badges` | Earned badges | `earned_at`, `trigger_type` |
| `student_portfolios` | Portfolio projects | `title`, `project_url`, `github_url` |
| `portfolio_skills` | Project skills used | Junction table |

#### Payments (2 tables)

| Table | Description | Key Fields |
|-------|-------------|------------|
| `payments` | All payment transactions | `payment_type`, `status`, `gateway_payment_id` |
| `company_candidate_billing` | Per-candidate company billing | `amount`, `is_paid` |

#### Vector Embeddings (3 tables)

| Table | Description | Key Fields |
|-------|-------------|------------|
| `student_embeddings` | Student profile vectors | `embedding` (vector 1536) |
| `job_embeddings` | Job description vectors | `embedding` (vector 1536) |
| `admin_match_recommendations` | AI-generated matches | `recommendations` (JSONB) |

#### System (2 tables)

| Table | Description | Key Fields |
|-------|-------------|------------|
| `system_settings` | Platform configuration | `setting_key`, `setting_value` |
| `audit_logs` | Security audit trail | `action`, `entity_type`, `old/new_values` |

---

## 4. MongoDB Data Model

### 4.1 Collection Overview

| Collection | Purpose | Data Volume | Retention |
|------------|---------|-------------|-----------|
| `learning_progress` | Granular learning activity tracking | Very High | Permanent |
| `xapi_statements` | xAPI/LRS statements | Very High | Permanent |
| `flashcard_progress` | Spaced repetition data | Medium | Permanent |
| `analytics_aggregates` | Pre-computed analytics | Medium | Permanent |
| `user_sessions` | Session tracking | High | 90 days TTL |
| `resume_analysis` | Parsed resume data | Low | Permanent |
| `search_logs` | Search query logs | High | 180 days TTL |
| `notification_queue` | Real-time notification queue | Medium | 7 days TTL |
| `event_log` | Event-driven architecture events | High | 30 days TTL |
| `course_engagement` | Content engagement heatmaps | Medium | Permanent |

### 4.2 Collection Details

#### `learning_progress`
Tracks every student interaction with course content.

```javascript
{
  student_id: 123,          // Links to PostgreSQL students.student_id
  course_id: 1,             // Links to PostgreSQL courses.course_id
  lesson_id: 5,             // Links to PostgreSQL lessons.lesson_id
  activity_type: "video_watched",
  timestamp: ISODate("2026-02-09T10:30:00Z"),
  session_id: "abc123",
  details: {
    video_progress: {
      current_time_seconds: 120,
      total_duration_seconds: 600,
      percentage_watched: 20.0
    },
    time_spent_seconds: 125
  },
  device_info: {
    device_type: "desktop",
    browser: "Chrome",
    os: "Windows 11"
  }
}
```

#### `xapi_statements`
Full xAPI statement storage for LRS compliance.

```javascript
{
  student_id: 123,
  timestamp: ISODate("2026-02-09T10:30:00Z"),
  verb_id: "http://adlnet.gov/expapi/verbs/completed",
  object_id: "https://recruitlms.com/courses/1/lessons/5",
  course_id: 1,
  statement: {
    // Full xAPI statement object
    actor: { ... },
    verb: { ... },
    object: { ... },
    result: { ... },
    context: { ... }
  }
}
```

#### `flashcard_progress`
Spaced repetition algorithm data.

```javascript
{
  student_id: 123,
  deck_id: 1,             // Links to PostgreSQL flashcard_decks.deck_id
  card_id: 10,            // Links to PostgreSQL flashcards.flashcard_id
  mastery_level: 3,       // 0=New, 5=Mastered
  ease_factor: 2.5,
  interval_days: 7,
  next_review_date: ISODate("2026-02-16"),
  total_reviews: 5,
  correct_reviews: 4,
  streak: 3,
  review_history: [
    { reviewed_at: ISODate("..."), response_quality: 4, was_correct: true }
  ]
}
```

#### `event_log`
Event-driven architecture event storage.

```javascript
{
  event_type: "student.course.completed",
  payload: {
    student_id: 123,
    course_id: 1,
    completed_at: "2026-02-09T10:30:00Z"
  },
  status: "pending",  // pending, processing, completed, failed
  source_service: "course-service",
  correlation_id: "uuid-1234",
  created_at: ISODate("2026-02-09T10:30:00Z")
}
```

---

## 5. S3/Object Storage

### 5.1 What Goes in S3

| Asset Type | Path Pattern | Access Level |
|------------|--------------|--------------|
| Profile Pictures | `users/profiles/{user_id}/avatar.jpg` | Public |
| Company Logos | `companies/logos/{company_id}/logo.png` | Public |
| Resumes | `users/resumes/{student_id}/{filename}.pdf` | Private (Signed URLs) |
| Course Thumbnails | `courses/thumbnails/{course_id}/thumb.jpg` | Public |
| Lesson Content (PDFs) | `courses/content/{course_id}/{lesson_id}/{filename}.pdf` | Private |
| Lesson Content (Audio) | `courses/content/{course_id}/{lesson_id}/{filename}.mp3` | Private |
| Lesson Content (Images) | `courses/content/{course_id}/{lesson_id}/images/` | Private |
| SCORM Packages | `courses/scorm/{course_id}/package.zip` | Private |
| Materials | `materials/{material_id}/{filename}` | Private |
| Portfolio Images | `portfolios/{student_id}/{portfolio_id}/` | Public |
| Certificates | `certificates/{enrollment_id}/certificate.pdf` | Private |

### 5.2 URL Storage Pattern

- **PostgreSQL stores URLs** (not the files themselves)
- URLs are stored in `VARCHAR(500)` columns
- Example: `https://recruit-lms.s3.amazonaws.com/users/resumes/123/resume_v2.pdf`

### 5.3 Access Control

| Access Type | Use Case | Implementation |
|-------------|----------|----------------|
| **Public** | Profile pics, logos, thumbnails | Direct S3 URL |
| **Private** | Resumes, course content, certificates | Pre-signed URLs (15min expiry) |
| **Streaming** | Video content | Use external platforms (YouTube/Vimeo) |

---

## 6. Data Relationships & Connections

### 6.1 PostgreSQL ↔ MongoDB Connections

```
┌─────────────────────────────────────────────────────────────────────┐
│                         POSTGRESQL                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │   students  │ │   courses   │ │   lessons   │ │ flashcards  │   │
│  │ student_id  │ │  course_id  │ │  lesson_id  │ │flashcard_id │   │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘   │
│         │               │               │               │           │
└─────────┼───────────────┼───────────────┼───────────────┼───────────┘
          │               │               │               │
          ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          MONGODB                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    learning_progress                         │   │
│  │  { student_id, course_id, lesson_id, activity_type, ... }   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    flashcard_progress                        │   │
│  │  { student_id, deck_id, card_id, mastery_level, ... }       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    xapi_statements                           │   │
│  │  { student_id, course_id, statement, ... }                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Connection Rules:**
- MongoDB documents store PostgreSQL IDs as plain integers
- IDs are NOT foreign keys (no referential integrity across databases)
- Application layer must handle data consistency
- When deleting from PostgreSQL, application must also clean MongoDB

### 6.2 PostgreSQL ↔ S3 Connections

```
┌─────────────────────────────────────────────────────────────────────┐
│                         POSTGRESQL                                   │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  students.resume_url = 's3://bucket/users/resumes/123/cv.pdf' │ │
│  │  courses.thumbnail_url = 's3://bucket/courses/thumb/1.jpg'    │ │
│  │  lessons.content_url = 's3://bucket/courses/content/1/5.pdf'  │ │
│  │  materials.file_url = 's3://bucket/materials/10/doc.pdf'      │ │
│  └───────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         S3 BUCKET                                    │
│  └── recruit-lms-assets/                                            │
│      ├── users/resumes/123/cv.pdf                                   │
│      ├── courses/thumb/1.jpg                                        │
│      ├── courses/content/1/5.pdf                                    │
│      └── materials/10/doc.pdf                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.3 Entity Relationship Diagram (Key Relationships)

```
                    ┌───────────┐
                    │   users   │
                    └─────┬─────┘
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌───────────┐   ┌──────────┐
    │ students │   │ companies │   │  admins  │
    └────┬─────┘   └─────┬─────┘   └────┬─────┘
         │               │               │
    ┌────┴────┐     ┌────┴────┐    ┌────┴─────────────┐
    │         │     │         │    │                  │
    ▼         ▼     ▼         ▼    ▼                  ▼
┌──────┐  ┌─────┐ ┌─────┐ ┌──────┐ ┌──────────┐ ┌──────────────┐
│enroll│  │apply│ │ jobs│ │refrl │ │app review│ │match recommend│
└──────┘  └─────┘ └─────┘ └──────┘ └──────────┘ └──────────────┘
    │         │       │
    ▼         │       │
┌───────┐     │       │
│courses│     │       │
└───┬───┘     │       │
    │         │       │
    ▼         ▼       ▼
┌─────────────────────────┐
│      applications       │
│  (student ← admin → company) │
└─────────────────────────┘
```

---

## 7. Data Flow Diagrams

### 7.1 Student Course Enrollment Flow

```
Student                Application              PostgreSQL           MongoDB              S3
   │                       │                         │                  │                 │
   │──── Browse Courses ──▶│                         │                  │                 │
   │                       │──── Get Courses ───────▶│                  │                 │
   │                       │◀─── Course List ────────│                  │                 │
   │◀─── Show Courses ─────│                         │                  │                 │
   │                       │                         │                  │                 │
   │──── Enroll (Paid) ───▶│                         │                  │                 │
   │                       │──── Create Payment ────▶│                  │                 │
   │                       │◀─── Payment ID ─────────│                  │                 │
   │◀─── Redirect to Gateway│                        │                  │                 │
   │                       │                         │                  │                 │
   │──── Payment Success ──▶│                         │                  │                 │
   │                       │──── Update Payment ────▶│                  │                 │
   │                       │──── Create Enrollment ─▶│                  │                 │
   │                       │──── Log Event ─────────────────────────────▶│                 │
   │                       │                         │                  │                 │
   │──── Start Learning ───▶│                         │                  │                 │
   │                       │──── Get Lesson ────────▶│                  │                 │
   │                       │──── Get Content URL ────────────────────────────────────────▶│
   │                       │◀─── Signed URL ─────────────────────────────────────────────│
   │◀─── Show Content ─────│                         │                  │                 │
   │                       │                         │                  │                 │
   │──── Watch Video ──────▶│                         │                  │                 │
   │                       │──── Log Progress ──────────────────────────▶│                 │
   │                       │──── Update Enrollment ─▶│                  │                 │
```

### 7.2 Job Application Flow

```
Student          Application         PostgreSQL        MongoDB       Matching Engine
   │                  │                   │                │               │
   │─── Apply for Job▶│                   │                │               │
   │                  │─── Create App ───▶│                │               │
   │                  │─── Get Student ──▶│                │               │
   │                  │─── Get Learning ──────────────────▶│               │
   │                  │─── Log Event ────────────────────▶│               │
   │◀── Confirmation ─│                   │                │               │
   │                  │                   │                │               │
   │                  │                   │                │               │
Admin             Application         PostgreSQL        MongoDB       Matching Engine
   │                  │                   │                │               │
   │─── View Apps ───▶│                   │                │               │
   │                  │─── Get Apps ─────▶│                │               │
   │                  │─── Get Scores ───────────────────────────────────▶│
   │                  │◀── Match Scores ─────────────────────────────────│
   │◀── Show Apps ────│                   │                │               │
   │                  │                   │                │               │
   │─── Forward to Co▶│                   │                │               │
   │                  │─── Update Status ▶│                │               │
   │                  │─── Create Billing▶│                │               │
   │                  │─── Log Event ────────────────────▶│               │
   │                  │─── Send Notification (to Company)  │               │
```

### 7.3 Job Matching Engine Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EVENT-DRIVEN MATCHING FLOW                        │
└─────────────────────────────────────────────────────────────────────┘

1. TRIGGER EVENTS (Published to Event Bus)
   ├── job.created
   ├── student.profile.updated
   ├── student.course.completed
   └── student.skill.added

2. EMBEDDING SERVICE (Consumes Events)
   ├── Extracts text from PostgreSQL (skills, bio, job description)
   ├── Calls OpenAI Embeddings API
   └── Stores vectors in PostgreSQL (student_embeddings / job_embeddings)

3. MATCHING ENGINE (Consumes Events)
   ├── Reads job embedding from PostgreSQL
   ├── Performs vector similarity search against student_embeddings
   ├── Applies business rules (availability, experience, location)
   ├── Stores recommendations in admin_match_recommendations
   └── Publishes admin.recommendation.generated event

4. NOTIFICATION SERVICE (Consumes Events)
   ├── Reads admin.recommendation.generated event
   ├── Creates notification in PostgreSQL notifications table
   ├── Queues real-time notification in MongoDB notification_queue
   └── Sends email/push notification
```

---

## 8. API to Database Mapping

### 8.1 Student APIs

| API Endpoint | PostgreSQL Tables | MongoDB Collections | S3 |
|--------------|-------------------|---------------------|------|
| `GET /api/student/dashboard` | students, enrollments, courses, webinar_registrations | learning_progress | - |
| `GET /api/student/courses` | courses, categories, instructors, course_skills | - | thumbnails |
| `GET /api/student/course/:id` | courses, modules, lessons, quizzes | - | content |
| `GET /api/student/course/:id/progress` | enrollments, lesson_progress, quiz_attempts | learning_progress | - |
| `POST /api/student/course/:id/progress` | lesson_progress | learning_progress, xapi_statements | - |
| `GET /api/student/jobs` | jobs, job_skills, companies (anonymized) | - | - |
| `POST /api/student/apply/:jobId` | applications, application_status_history | event_log | resumes |
| `GET /api/student/profile` | students, student_skills, student_badges, student_portfolios | resume_analysis | profile pic, resume |
| `PUT /api/student/profile` | students, student_skills | event_log | profile pic, resume |

### 8.2 Company APIs

| API Endpoint | PostgreSQL Tables | MongoDB Collections | S3 |
|--------------|-------------------|---------------------|------|
| `GET /api/company/dashboard` | companies, jobs, applications (counts) | analytics_aggregates | - |
| `POST /api/company/jobs` | jobs, job_skills | event_log | - |
| `GET /api/company/candidates` | applications (forwarded only), students (limited) | - | - |
| `PUT /api/company/candidates/:id/status` | applications, application_status_history | event_log | - |

### 8.3 Admin APIs

| API Endpoint | PostgreSQL Tables | MongoDB Collections | S3 |
|--------------|-------------------|---------------------|------|
| `GET /api/admin/dashboard` | all core tables (aggregated) | analytics_aggregates | - |
| `GET /api/admin/applications` | applications, students, jobs, companies | - | resumes |
| `POST /api/admin/match` | applications, admin_match_recommendations, company_candidate_billing | event_log | - |
| `GET /api/admin/analytics` | multiple | analytics_aggregates, course_engagement | - |
| `GET /api/admin/courses` | courses, modules, lessons, enrollments | course_engagement | - |
| `POST /api/admin/courses` | courses, modules, lessons, quizzes, flashcards | - | content |

---

## 9. Security Considerations

### 9.1 Data Classification

| Classification | Examples | Storage |
|----------------|----------|---------|
| **Public** | Course titles, company names, skill names | PostgreSQL |
| **Internal** | User emails, application status | PostgreSQL (encrypted at rest) |
| **Confidential** | Passwords (hashed), payment info | PostgreSQL (encrypted) |
| **Sensitive** | Resumes, salary expectations | PostgreSQL + S3 (encrypted, signed URLs) |

### 9.2 Access Control Rules

| User Type | PostgreSQL Access | MongoDB Access | S3 Access |
|-----------|-------------------|----------------|-----------|
| **Student** | Own data + public courses/jobs | Own learning progress | Own files |
| **Company** | Own data + forwarded candidates (limited) | Aggregate analytics only | Own logos |
| **Admin** | Full access | Full access | Full access |

### 9.3 Data Privacy (Student ↔ Company)

**Critical Rule:** Companies should NOT have direct access to student personal data.

| Data | Student Can See | Company Can See |
|------|-----------------|-----------------|
| Student Name | Yes | Only after admin forwards |
| Student Email | Yes | Only after admin forwards |
| Student Skills | Yes | Anonymized aggregates OR after forward |
| Student Resume | Yes | Only after admin forwards |
| Company Name | No (anonymized job listings) | Yes |
| Salary Range | Yes (if visible) | Yes |

---

## 10. Performance Optimization

### 10.1 PostgreSQL Indexes

Key indexes are already defined in the schema. Additionally:

```sql
-- Composite indexes for common queries
CREATE INDEX idx_enrollments_student_status ON enrollments(student_id, status);
CREATE INDEX idx_applications_job_status ON applications(job_id, status);
CREATE INDEX idx_jobs_status_posted ON jobs(status, posted_at DESC);

-- Full-text search (if needed)
CREATE INDEX idx_jobs_fts ON jobs USING gin(to_tsvector('english', title || ' ' || description));
```

### 10.2 MongoDB Indexes

Already defined in schema. Key considerations:
- TTL indexes for automatic data cleanup
- Compound indexes for common query patterns
- Text indexes for search functionality

### 10.3 Caching Strategy

| Data Type | Cache Location | TTL |
|-----------|----------------|-----|
| Course catalog | Redis | 5 min |
| User session | Redis | 30 min |
| Job listings | Redis | 1 min |
| Skill list | Redis | 1 hour |
| Analytics aggregates | MongoDB | Pre-computed |

---

## 11. Backup & Recovery

### 11.1 Backup Strategy

| Database | Backup Type | Frequency | Retention |
|----------|-------------|-----------|-----------|
| PostgreSQL | Full | Daily | 30 days |
| PostgreSQL | Incremental (WAL) | Continuous | 7 days |
| MongoDB | Full | Daily | 30 days |
| MongoDB | Oplog | Continuous | 7 days |
| S3 | Versioning | Automatic | 90 days |

### 11.2 Recovery Time Objectives

| Scenario | RTO | RPO |
|----------|-----|-----|
| PostgreSQL failure | 1 hour | 5 minutes |
| MongoDB failure | 2 hours | 1 hour |
| S3 failure | 4 hours | 0 (versioned) |
| Complete disaster | 24 hours | 1 hour |

---

## Appendix A: Quick Reference - Where is My Data?

| Data | PostgreSQL Table | MongoDB Collection | S3 Path |
|------|------------------|-------------------|---------|
| User login info | `users` | - | - |
| Student profile | `students` | - | `users/profiles/` |
| Student resume | `students.resume_url` | `resume_analysis` | `users/resumes/` |
| Student skills | `student_skills` | - | - |
| Course info | `courses` | - | `courses/thumbnails/` |
| Lesson content | `lessons` | - | `courses/content/` |
| Video progress | `lesson_progress` | `learning_progress` | - |
| Quiz answers | `quiz_attempts` | `learning_progress.details.quiz_result` | - |
| xAPI data | - | `xapi_statements` | - |
| Job posting | `jobs` | - | - |
| Application | `applications` | - | - |
| Match recommendations | `admin_match_recommendations` | - | - |
| Payment | `payments` | - | - |
| Analytics | - | `analytics_aggregates` | - |

---

## Appendix B: Schema Evolution Guidelines

1. **PostgreSQL Changes**: Use migration files (e.g., Alembic, Flyway)
2. **MongoDB Changes**: Document validators can be updated; ensure backward compatibility
3. **S3 Changes**: Path changes require data migration; maintain backward compatibility

---

*End of Documentation*
