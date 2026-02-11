/**
 * API Client — connects the frontend to the FastAPI backend.
 * Replaces mock-data imports for all course-related pages.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// ── Types matching the backend schemas ──

export interface Category {
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
}

export interface InstructorBrief {
  instructor_id: number;
  first_name: string;
  last_name: string;
  headline: string | null;
  profile_picture_url: string | null;
}

export interface CourseListItem {
  course_id: number;
  title: string;
  slug: string;
  short_description: string | null;
  difficulty_level: string;
  pricing_model: string;
  price: string; // Decimal comes as string from API
  currency: string;
  discount_price: string | null;
  duration_hours: string | null;
  total_modules: number;
  total_lessons: number;
  thumbnail_url: string | null;
  is_published: boolean;
  total_enrollments: number;
  average_rating: string;
  total_reviews: number;
  created_at: string;
  category: Category | null;
  instructor: InstructorBrief | null;
  skills: string[];
}

export interface CourseListResponse {
  courses: CourseListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface LessonBrief {
  lesson_id: number;
  title: string;
  content_type: string;
  order_index: number;
  duration_minutes: number | null;
  is_preview: boolean;
  is_mandatory: boolean;
}

export interface LessonFull {
  lesson_id: number;
  title: string;
  description: string | null;
  content_type: string;
  order_index: number;
  duration_minutes: number | null;
  is_preview: boolean;
  is_mandatory: boolean;
  content_url: string | null;
  video_external_id: string | null;
  video_external_platform: string | null;
  text_content: string | null;
  quiz_id: number | null;
}

export interface ModuleOut {
  module_id: number;
  title: string;
  description: string | null;
  order_index: number;
  duration_minutes: number | null;
  is_preview: boolean;
  lessons: LessonBrief[];
}

export interface CourseDetail {
  course_id: number;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  difficulty_level: string;
  pricing_model: string;
  price: string;
  currency: string;
  discount_price: string | null;
  duration_hours: string | null;
  total_modules: number;
  total_lessons: number;
  thumbnail_url: string | null;
  preview_video_url: string | null;
  is_published: boolean;
  total_enrollments: number;
  average_rating: string;
  total_reviews: number;
  created_at: string;
  category: Category | null;
  instructor: InstructorBrief | null;
  skills: string[];
  modules: ModuleOut[];
}

export interface MaterialOut {
  material_id: number;
  title: string;
  description: string | null;
  file_type: string;
  file_url: string;
  file_size_bytes: number | null;
  pricing_model: string;
  price: string;
  currency: string;
  download_count: number;
  course_id: number | null;
}

export interface QuizQuestionOut {
  question_id: number;
  question_text: string;
  question_type: string;
  options: { text: string }[] | null;
  points: number;
  order_index: number;
}

export interface QuizOut {
  quiz_id: number;
  title: string;
  description: string | null;
  instructions: string | null;
  pass_percentage: string;
  time_limit_minutes: number | null;
  max_attempts: number | null;
  total_questions: number;
  questions: QuizQuestionOut[];
}

export interface FlashcardOut {
  flashcard_id: number;
  front_content: string;
  back_content: string;
  order_index: number | null;
}

export interface FlashcardDeckOut {
  deck_id: number;
  title: string;
  description: string | null;
  total_cards: number;
  flashcards: FlashcardOut[];
}

// ── API Functions ──

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

async function fetchApiWithAuth<T>(
  path: string,
  options?: { method?: string; body?: unknown; token?: string }
): Promise<T> {
  const token = options?.token || (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: options?.method || "GET",
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

/** List courses with optional filters */
export async function getCourses(params?: {
  page?: number;
  page_size?: number;
  category?: string;
  difficulty?: string;
  pricing?: string;
  search?: string;
}): Promise<CourseListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.page_size) query.set("page_size", String(params.page_size));
  if (params?.category) query.set("category", params.category);
  if (params?.difficulty) query.set("difficulty", params.difficulty);
  if (params?.pricing) query.set("pricing", params.pricing);
  if (params?.search) query.set("search", params.search);

  const qs = query.toString();
  return fetchApi<CourseListResponse>(`/courses${qs ? `?${qs}` : ""}`);
}

/** Get active categories */
export async function getCategories(): Promise<Category[]> {
  return fetchApi<Category[]>("/courses/categories");
}

/** Get full course detail by slug */
export async function getCourseDetail(slug: string): Promise<CourseDetail> {
  return fetchApi<CourseDetail>(`/courses/${slug}`);
}

/** Get a specific lesson's full content */
export async function getLesson(lessonId: number): Promise<LessonFull> {
  return fetchApi<LessonFull>(`/courses/lessons/${lessonId}`);
}

/** Get a quiz with questions */
export async function getQuiz(quizId: number): Promise<QuizOut> {
  return fetchApi<QuizOut>(`/courses/quizzes/${quizId}`);
}

/** Get materials for a course */
export async function getCourseMaterials(courseId: number): Promise<MaterialOut[]> {
  return fetchApi<MaterialOut[]>(`/courses/${courseId}/materials`);
}

/** Get all materials (iterates over all course IDs) */
export async function getAllMaterials(): Promise<(MaterialOut & { courseName: string })[]> {
  // First get all courses, then get materials for each
  const { courses } = await getCourses({ page_size: 50 });
  const allMaterials: (MaterialOut & { courseName: string })[] = [];

  await Promise.all(
    courses.map(async (course) => {
      try {
        const mats = await getCourseMaterials(course.course_id);
        mats.forEach((m) => allMaterials.push({ ...m, courseName: course.title }));
      } catch {
        // Course may have no materials endpoint — skip
      }
    })
  );

  return allMaterials;
}

/** Get a flashcard deck */
export async function getFlashcardDeck(deckId: number): Promise<FlashcardDeckOut> {
  return fetchApi<FlashcardDeckOut>(`/courses/flashcards/${deckId}`);
}

// ── Enrollment Types & Functions ──

export interface EnrollmentOut {
  enrollment_id: number;
  student_id: number;
  course_id: number;
  status: string;
  progress_percentage: string;
  enrolled_at: string;
  started_at: string | null;
  completed_at: string | null;
  course: CourseListItem | null;
}

/** Get all enrollments for a student */
export async function getEnrollments(studentId: number): Promise<EnrollmentOut[]> {
  return fetchApi<EnrollmentOut[]>(`/students/enrollments?student_id=${studentId}`);
}

/** Enroll a student in a course */
export async function enrollInCourse(
  courseId: number,
  studentId: number
): Promise<EnrollmentOut> {
  return fetchApiWithAuth<EnrollmentOut>(`/students/enroll/${courseId}`, {
    method: "POST",
    body: { student_id: studentId },
  });
}

// ── Helper functions to map API data to UI shapes ──

/** Convert API course to the shape the UI expects for the course catalog */
export function mapCourseToUI(course: CourseListItem) {
  const price = parseFloat(course.price);
  const isFree = course.pricing_model === "free" || price === 0;
  const instructorName = course.instructor
    ? `${course.instructor.first_name} ${course.instructor.last_name}`
    : "Unknown";

  return {
    id: course.course_id,
    title: course.title,
    slug: course.slug,
    category: course.category?.name || "General",
    level: capitalize(course.difficulty_level),
    price: isFree ? 0 : price,
    rating: parseFloat(course.average_rating) || 0,
    students: course.total_enrollments,
    instructor: instructorName,
    image: course.thumbnail_url || "",
    duration: course.duration_hours ? `${course.duration_hours} hours` : "Self-paced",
    modules: course.total_modules,
    progress: 0, // Would come from enrollment/progress API
    isFree,
    skills: course.skills,
    shortDescription: course.short_description,
  };
}

/** Convert API material to UI shape */
export function mapMaterialToUI(material: MaterialOut & { courseName: string }) {
  const sizeKB = material.file_size_bytes
    ? material.file_size_bytes > 1024 * 1024
      ? `${(material.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${(material.file_size_bytes / 1024).toFixed(0)} KB`
    : "—";

  return {
    id: material.material_id,
    title: material.title,
    type: material.file_type,
    course: material.courseName,
    size: sizeKB,
    downloads: material.download_count,
    fileUrl: material.file_url,
    description: material.description,
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
