"""Course service — business logic layer."""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import QuizAttempt
from app.repositories.course_repository import CourseRepository
from app.schemas.course import (
    CourseListItem, CourseListResponse, CourseDetail,
    ModuleOut, LessonBrief, LessonOut, CategoryOut, InstructorBrief,
    EnrollmentOut, ProgressUpdate, LessonProgressOut,
    QuizOut, QuizQuestionOut, QuizSubmission, QuizResultOut,
    MaterialOut, FlashcardDeckOut, FlashcardOut,
)


class CourseService:
    def __init__(self, db: AsyncSession):
        self.repo = CourseRepository(db)

    # ── List Courses ──

    async def list_courses(
        self,
        page: int = 1,
        page_size: int = 12,
        category: Optional[str] = None,
        difficulty: Optional[str] = None,
        pricing: Optional[str] = None,
        search: Optional[str] = None,
    ) -> CourseListResponse:
        courses, total = await self.repo.get_courses(
            page=page,
            page_size=page_size,
            category_slug=category,
            difficulty=difficulty,
            pricing=pricing,
            search=search,
        )

        items = []
        for c in courses:
            skills = [cs.skill.name for cs in c.course_skills] if c.course_skills else []
            items.append(CourseListItem(
                course_id=c.course_id,
                title=c.title,
                slug=c.slug,
                short_description=c.short_description,
                difficulty_level=c.difficulty_level.value if c.difficulty_level else "beginner",
                pricing_model=c.pricing_model.value if c.pricing_model else "free",
                price=c.price,
                currency=c.currency,
                discount_price=c.discount_price,
                duration_hours=c.duration_hours,
                total_modules=c.total_modules,
                total_lessons=c.total_lessons,
                thumbnail_url=c.thumbnail_url,
                is_published=c.is_published,
                total_enrollments=c.total_enrollments,
                average_rating=c.average_rating,
                total_reviews=c.total_reviews,
                created_at=c.created_at,
                category=CategoryOut.model_validate(c.category) if c.category else None,
                instructor=InstructorBrief.model_validate(c.instructor) if c.instructor else None,
                skills=skills,
            ))

        return CourseListResponse(
            courses=items, total=total, page=page, page_size=page_size
        )

    # ── Course Detail ──

    async def get_course_detail(self, slug: str) -> Optional[CourseDetail]:
        c = await self.repo.get_course_by_slug(slug)
        if not c:
            return None

        skills = [cs.skill.name for cs in c.course_skills] if c.course_skills else []

        modules = []
        for m in c.modules:
            lessons = [
                LessonBrief(
                    lesson_id=l.lesson_id,
                    title=l.title,
                    content_type=l.content_type.value,
                    order_index=l.order_index,
                    duration_minutes=l.duration_minutes,
                    is_preview=l.is_preview,
                    is_mandatory=l.is_mandatory,
                )
                for l in m.lessons
            ]
            modules.append(ModuleOut(
                module_id=m.module_id,
                title=m.title,
                description=m.description,
                order_index=m.order_index,
                duration_minutes=m.duration_minutes,
                is_preview=m.is_preview,
                lessons=lessons,
            ))

        return CourseDetail(
            course_id=c.course_id,
            title=c.title,
            slug=c.slug,
            description=c.description,
            short_description=c.short_description,
            difficulty_level=c.difficulty_level.value,
            pricing_model=c.pricing_model.value,
            price=c.price,
            currency=c.currency,
            discount_price=c.discount_price,
            duration_hours=c.duration_hours,
            total_modules=c.total_modules,
            total_lessons=c.total_lessons,
            thumbnail_url=c.thumbnail_url,
            preview_video_url=c.preview_video_url,
            is_published=c.is_published,
            total_enrollments=c.total_enrollments,
            average_rating=c.average_rating,
            total_reviews=c.total_reviews,
            created_at=c.created_at,
            category=CategoryOut.model_validate(c.category) if c.category else None,
            instructor=InstructorBrief.model_validate(c.instructor) if c.instructor else None,
            skills=skills,
            modules=modules,
        )

    # ── Lesson Content ──

    async def get_lesson(
        self, lesson_id: int, student_id: Optional[int] = None
    ) -> Optional[LessonOut]:
        lesson = await self.repo.get_lesson(lesson_id)
        if not lesson:
            return None

        return LessonOut(
            lesson_id=lesson.lesson_id,
            title=lesson.title,
            description=lesson.description,
            content_type=lesson.content_type.value,
            order_index=lesson.order_index,
            duration_minutes=lesson.duration_minutes,
            is_preview=lesson.is_preview,
            is_mandatory=lesson.is_mandatory,
            content_url=lesson.content_url,
            video_external_id=lesson.video_external_id,
            video_external_platform=lesson.video_external_platform,
            text_content=lesson.text_content,
            quiz_id=lesson.quizzes[0].quiz_id if lesson.quizzes else None,
        )

    # ── Quiz ──

    async def get_quiz(self, quiz_id: int) -> Optional[QuizOut]:
        quiz = await self.repo.get_quiz(quiz_id)
        if not quiz:
            return None

        questions = []
        for q in quiz.questions:
            # Strip correct answers from options for student view
            safe_options = None
            if q.options:
                safe_options = [
                    {"text": opt.get("text", ""), "index": i}
                    for i, opt in enumerate(q.options)
                ]
            questions.append(QuizQuestionOut(
                question_id=q.question_id,
                question_text=q.question_text,
                question_type=q.question_type.value,
                options=safe_options,
                points=q.points,
                order_index=q.order_index,
            ))

        return QuizOut(
            quiz_id=quiz.quiz_id,
            title=quiz.title,
            description=quiz.description,
            instructions=quiz.instructions,
            pass_percentage=quiz.pass_percentage,
            time_limit_minutes=quiz.time_limit_minutes,
            max_attempts=quiz.max_attempts,
            total_questions=quiz.total_questions,
            questions=questions,
        )

    async def submit_quiz(
        self,
        quiz_id: int,
        enrollment_id: int,
        submission: QuizSubmission,
    ) -> QuizResultOut:
        quiz = await self.repo.get_quiz(quiz_id)
        if not quiz:
            raise ValueError("Quiz not found")

        correct = 0
        total_points = 0
        for q in quiz.questions:
            total_points += q.points
            answer = submission.answers.get(str(q.question_id))
            if answer is None:
                continue

            if q.question_type.value in ("multiple_choice", "true_false"):
                # answer is the index of selected option
                try:
                    idx = int(answer)
                    if q.options and 0 <= idx < len(q.options):
                        if q.options[idx].get("is_correct"):
                            correct += q.points
                except (ValueError, IndexError):
                    pass
            elif q.question_type.value == "short_answer":
                if q.correct_answer and str(answer).strip().lower() == q.correct_answer.strip().lower():
                    correct += q.points

        percentage = round((correct / total_points) * 100, 2) if total_points > 0 else 0
        passed = percentage >= float(quiz.pass_percentage)
        now = datetime.utcnow()

        attempt = QuizAttempt(
            enrollment_id=enrollment_id,
            quiz_id=quiz_id,
            score=Decimal(str(correct)),
            percentage=Decimal(str(percentage)),
            passed=passed,
            started_at=now,
            completed_at=now,
            total_questions=len(quiz.questions),
            correct_answers=correct,
        )
        await self.repo.create_quiz_attempt(attempt)

        return QuizResultOut(
            score=Decimal(str(correct)),
            percentage=Decimal(str(percentage)),
            passed=passed,
            total_questions=len(quiz.questions),
            correct_answers=correct,
        )

    # ── Enrollment ──

    async def enroll_student(self, student_id: int, course_id: int) -> EnrollmentOut:
        existing = await self.repo.get_enrollment(student_id, course_id)
        if existing:
            raise ValueError("Already enrolled in this course")

        enrollment = await self.repo.create_enrollment(student_id, course_id)
        return EnrollmentOut(
            enrollment_id=enrollment.enrollment_id,
            student_id=enrollment.student_id,
            course_id=enrollment.course_id,
            status=enrollment.status.value,
            progress_percentage=enrollment.progress_percentage,
            enrolled_at=enrollment.enrolled_at,
        )

    async def get_enrollments(self, student_id: int) -> List[EnrollmentOut]:
        enrollments = await self.repo.get_student_enrollments(student_id)
        results = []
        for e in enrollments:
            course_item = None
            if e.course:
                c = e.course
                course_item = CourseListItem(
                    course_id=c.course_id,
                    title=c.title,
                    slug=c.slug,
                    short_description=c.short_description,
                    difficulty_level=c.difficulty_level.value if c.difficulty_level else "beginner",
                    pricing_model=c.pricing_model.value if c.pricing_model else "free",
                    price=c.price,
                    currency=c.currency,
                    duration_hours=c.duration_hours,
                    total_modules=c.total_modules,
                    total_lessons=c.total_lessons,
                    thumbnail_url=c.thumbnail_url,
                    is_published=c.is_published,
                    total_enrollments=c.total_enrollments,
                    average_rating=c.average_rating,
                    total_reviews=c.total_reviews,
                    created_at=c.created_at,
                    category=CategoryOut.model_validate(c.category) if c.category else None,
                    instructor=InstructorBrief.model_validate(c.instructor) if c.instructor else None,
                    skills=[],
                )
            results.append(EnrollmentOut(
                enrollment_id=e.enrollment_id,
                student_id=e.student_id,
                course_id=e.course_id,
                status=e.status.value,
                progress_percentage=e.progress_percentage,
                enrolled_at=e.enrolled_at,
                started_at=e.started_at,
                completed_at=e.completed_at,
                course=course_item,
            ))
        return results

    # ── Progress ──

    async def update_progress(
        self, student_id: int, course_id: int, update: ProgressUpdate
    ) -> LessonProgressOut:
        enrollment = await self.repo.get_enrollment(student_id, course_id)
        if not enrollment:
            raise ValueError("Not enrolled in this course")

        progress = await self.repo.upsert_lesson_progress(
            enrollment_id=enrollment.enrollment_id,
            lesson_id=update.lesson_id,
            progress_percentage=update.progress_percentage,
            time_spent_seconds=update.time_spent_seconds,
            video_position_seconds=update.video_position_seconds,
            is_completed=update.is_completed,
        )

        # Recalculate overall enrollment progress
        await self.repo.update_enrollment_progress(enrollment.enrollment_id)

        return LessonProgressOut.model_validate(progress)

    async def get_course_progress(
        self, student_id: int, course_id: int
    ) -> List[LessonProgressOut]:
        enrollment = await self.repo.get_enrollment(student_id, course_id)
        if not enrollment:
            return []
        progress_list = await self.repo.get_all_progress(enrollment.enrollment_id)
        return [LessonProgressOut.model_validate(p) for p in progress_list]

    # ── Materials ──

    async def get_materials(self, course_id: int) -> List[MaterialOut]:
        materials = await self.repo.get_course_materials(course_id)
        return [MaterialOut.model_validate(m) for m in materials]

    # ── Flashcard Decks ──

    async def get_flashcard_deck(self, deck_id: int) -> Optional[FlashcardDeckOut]:
        deck = await self.repo.get_flashcard_deck(deck_id)
        if not deck:
            return None
        return FlashcardDeckOut(
            deck_id=deck.deck_id,
            title=deck.title,
            description=deck.description,
            total_cards=deck.total_cards,
            flashcards=[FlashcardOut.model_validate(f) for f in deck.flashcards],
        )

    # ── Categories ──

    async def get_categories(self) -> List[CategoryOut]:
        categories = await self.repo.get_categories()
        return [CategoryOut.model_validate(c) for c in categories]
