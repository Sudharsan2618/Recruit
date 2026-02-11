# Database Schema Summary

## Quick Stats

| Category | Count |
|----------|-------|
| **PostgreSQL Tables** | 47 |
| **MongoDB Collections** | 10 |
| **Enum Types** | 22 |
| **S3 Asset Types** | 11 |

---

## PostgreSQL Tables (47 Total)

### User Management (8)
1. `users` - Master authentication
2. `students` - Student profiles
3. `companies` - Company profiles
4. `admins` - Admin users
5. `instructors` - Course creators
6. `mentors` - 1:1 session providers
7. `notifications` - User notifications
8. `notification_preferences` - Notification settings

### Skills & Categories (4)
9. `skills` - Master skills
10. `skill_synonyms` - Skill aliases
11. `student_skills` - Student-skill mapping
12. `categories` - Hierarchical categories

### Course Management (12)
13. `courses` - Course metadata
14. `course_skills` - Course-skill mapping
15. `course_prerequisites` - Course dependencies
16. `modules` - Course sections
17. `lessons` - Individual lessons
18. `quizzes` - Quiz metadata
19. `quiz_questions` - Quiz questions
20. `flashcard_decks` - Flashcard collections
21. `flashcards` - Individual cards
22. `course_reviews` - Student reviews
23. `enrollments` - Course enrollments
24. `lesson_progress` - Lesson progress

### Assessments (1)
25. `quiz_attempts` - Quiz attempts

### Materials (2)
26. `materials` - Downloadable resources
27. `material_downloads` - Download tracking

### Webinars (2)
28. `webinars` - Live events
29. `webinar_registrations` - Registrations

### Mentorship (2)
30. `mentor_sessions` - Booked sessions
31. `mentor_reviews` - Session reviews

### Jobs & Applications (5)
32. `jobs` - Job postings
33. `job_skills` - Required skills
34. `applications` - Student applications
35. `application_status_history` - Status audit
36. `interview_slots` - Scheduled interviews

### Referrals & Placements (3)
37. `referral_contacts` - Company referrals
38. `placement_packages` - Placement services
39. `student_placements` - Student enrollments

### Badges & Portfolios (4)
40. `badges` - Achievement badges
41. `student_badges` - Earned badges
42. `student_portfolios` - Portfolio projects
43. `portfolio_skills` - Project skills

### Payments (2)
44. `payments` - All transactions
45. `company_candidate_billing` - Per-candidate billing

### Vector Search (3)
46. `student_embeddings` - Student vectors
47. `job_embeddings` - Job vectors
48. `admin_match_recommendations` - AI matches

### System (2)
49. `system_settings` - Configuration
50. `audit_logs` - Security audit

---

## MongoDB Collections (10)

1. `learning_progress` - Granular activity tracking
2. `xapi_statements` - xAPI/LRS statements
3. `flashcard_progress` - Spaced repetition data
4. `analytics_aggregates` - Pre-computed analytics
5. `user_sessions` - Session tracking (90-day TTL)
6. `resume_analysis` - Parsed resume data
7. `search_logs` - Search queries (180-day TTL)
8. `notification_queue` - Real-time notifications (7-day TTL)
9. `event_log` - Event-driven events (30-day TTL)
10. `course_engagement` - Content engagement heatmaps

---

## S3 Asset Types (11)

1. Profile Pictures (`users/profiles/`)
2. Student Resumes (`users/resumes/`)
3. Company Logos (`companies/logos/`)
4. Course Thumbnails (`courses/thumbnails/`)
5. Lesson PDFs (`courses/content/`)
6. Lesson Audio (`courses/content/`)
7. Lesson Images (`courses/content/`)
8. SCORM Packages (`courses/scorm/`)
9. Materials (`materials/`)
10. Portfolio Images (`portfolios/`)
11. Certificates (`certificates/`)

---

## Enum Types (22)

| Enum | Values |
|------|--------|
| `user_type` | student, company, admin, instructor, mentor |
| `user_status` | active, inactive, suspended, pending_verification |
| `difficulty_level` | beginner, intermediate, advanced |
| `content_type` | video, text, pdf, audio, image, quiz, flashcard, scorm_package, external_link |
| `question_type` | multiple_choice, true_false, short_answer, multiple_select |
| `enrollment_status` | in_progress, completed, dropped, expired |
| `payment_status` | pending, completed, failed, refunded, cancelled |
| `payment_type` | course_purchase, webinar_purchase, material_purchase, mentor_session, referral_package, placement_package, subscription, company_candidate_fee |
| `pricing_model` | free, one_time, subscription |
| `employment_type` | full_time, part_time, contract, internship, freelance |
| `remote_type` | remote, on_site, hybrid |
| `application_status` | pending_admin_review, admin_shortlisted, rejected_by_admin, forwarded_to_company, under_company_review, interview_scheduled, interview_completed, offer_extended, offer_accepted, offer_rejected, hired, rejected_by_company, withdrawn |
| `candidate_stage` | new_candidates, under_review, interviewing, offer_extended, hired, rejected |
| `job_status` | draft, active, paused, closed, filled |
| `webinar_status` | scheduled, live, completed, cancelled |
| `registration_status` | registered, attended, cancelled, no_show |
| `session_status` | scheduled, completed, cancelled, no_show, rescheduled |
| `referral_status` | pending, contacted, interested, not_interested, converted |
| `placement_status` | active, completed, expired, cancelled |
| `notification_type` | course_update, job_match, application_update, webinar_reminder, payment_confirmation, mentor_session, referral_update, system_announcement |
| `admin_role` | super_admin, content_manager, recruitment_manager, finance_manager, support_admin |

---

## Entity Relationships (Simplified)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              USERS (Base Table)                               │
│                    user_id, email, password_hash, user_type                   │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│   STUDENTS    │           │   COMPANIES   │           │    ADMINS     │
│  student_id   │           │  company_id   │           │   admin_id    │
└───────┬───────┘           └───────┬───────┘           └───────┬───────┘
        │                           │                           │
        │                           │                           │
   ┌────┴────┐                 ┌────┴────┐                 ┌────┴────┐
   ▼         ▼                 ▼         ▼                 ▼         ▼
┌──────┐  ┌─────────┐     ┌─────────┐ ┌─────────┐    ┌─────────┐ ┌─────────┐
│SKILLS│  │PORTFOLIOS│    │  JOBS   │ │REFERRALS│    │ MATCH   │ │ REVIEW  │
└──────┘  └─────────┘     └────┬────┘ └─────────┘    │RECOMMEND│ │  APPS   │
                                │                    └─────────┘ └─────────┘
        │                       │
        │                       │
        ▼                       ▼
   ┌─────────────────────────────────┐
   │          APPLICATIONS           │
   │ student_id ←──→ job_id ←──→ admin_id │
   │     (Status tracked by Admin)   │
   └─────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│    COMPANY CANDIDATE BILLING          │
│  (Companies pay per forwarded candidate) │
└───────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                              COURSES                                          │
│              course_id, title, instructor_id, category_id                     │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│    MODULES    │           │ COURSE_SKILLS │           │  ENROLLMENTS  │
│   module_id   │           │ (Junction)    │           │enrollment_id  │
└───────┬───────┘           └───────────────┘           └───────┬───────┘
        │                                                        │
        ▼                                                        ▼
┌───────────────┐                                       ┌───────────────┐
│    LESSONS    │                                       │LESSON_PROGRESS│
│   lesson_id   │                                       │ (PostgreSQL)  │
└───────┬───────┘                                       └───────────────┘
        │                                                        │
   ┌────┴────┬──────────┐                                        ▼
   ▼         ▼          ▼                               ┌───────────────┐
┌──────┐  ┌──────┐  ┌──────────┐                        │LEARNING_PROGRESS│
│QUIZZES│ │FLASH-│  │MATERIALS │                        │   (MongoDB)   │
│       │ │CARDS │  │          │                        └───────────────┘
└───┬───┘ └───┬──┘  └──────────┘
    │         │
    ▼         ▼
┌──────┐  ┌──────────┐
│QUIZ_ │  │FLASHCARD_│
│ATTEMPS│ │PROGRESS  │
│(PG)  │  │(MongoDB) │
└──────┘  └──────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                              PAYMENTS                                         │
│     payment_id, user_id, payment_type, amount, status, gateway_*             │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
                            Links to:
                            - enrollments
                            - webinar_registrations
                            - material_downloads
                            - mentor_sessions
                            - student_placements
                            - company_candidate_billing
```

---

## File Locations

| File | Purpose |
|------|---------|
| `001_postgresql_schema.sql` | PostgreSQL table creation |
| `002_mongodb_schema.js` | MongoDB collection creation |
| `003_seed_data.sql` | Sample data for development |
| `DATABASE_DOCUMENTATION.md` | Complete documentation |
| `SCHEMA_SUMMARY.md` | This quick reference |

---

## Execution Order

1. **PostgreSQL**: Run `001_postgresql_schema.sql`
2. **PostgreSQL**: Run `003_seed_data.sql`
3. **MongoDB**: Run `002_mongodb_schema.js`
4. **S3**: Create bucket structure (manual or Terraform)

### PostgreSQL Commands

```bash
# Connect and run schema
psql -h localhost -U postgres -d recruit_lms_db -f 001_postgresql_schema.sql

# Run seed data
psql -h localhost -U postgres -d recruit_lms_db -f 003_seed_data.sql
```

### MongoDB Commands

```bash
# Run MongoDB schema
mongosh recruit_lms_db < 002_mongodb_schema.js
```

---

*Generated: February 09, 2026*
