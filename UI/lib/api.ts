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

// ── Tracking & Analytics Types ──

export interface DeviceInfo {
  device_type?: "desktop" | "mobile" | "tablet";
  browser?: string;
  os?: string;
  screen_resolution?: string;
}

export interface VideoProgress {
  current_time_seconds: number;
  total_duration_seconds: number;
  percentage_watched: number;
  playback_rate?: number;
  is_completed?: boolean;
}

export interface QuizResult {
  quiz_id: number;
  attempt_id?: number;
  score: number;
  percentage: number;
  passed: boolean;
  time_taken_seconds: number;
  answers?: any[];
}

export interface FlashcardSession {
  deck_id: number;
  card_id?: number;
  mastery_level: number;
  is_correct?: boolean;
  response_time_ms?: number;
}

export interface ActivityDetails {
  video_progress?: VideoProgress;
  quiz_result?: QuizResult;
  flashcard_session?: FlashcardSession;
  time_spent_seconds?: number;
  scroll_depth_percentage?: number;
}

export type ActivityType =
  | "lesson_started"
  | "lesson_completed"
  | "video_watched"
  | "video_paused"
  | "video_seeked"
  | "document_viewed"
  | "audio_played"
  | "quiz_started"
  | "quiz_submitted"
  | "flashcard_interaction"
  | "note_taken"
  | "resource_downloaded"
  | "page_viewed"
  | "course_enrolled"
  | "course_completed";

export interface TrackActivityRequest {
  student_id: number;
  course_id: number;
  module_id?: number;
  lesson_id?: number;
  activity_type: ActivityType;
  session_id?: string;
  details?: ActivityDetails;
  device_info?: DeviceInfo;
}

export interface StartSessionRequest {
  user_id: number;
  device_info?: DeviceInfo;
}

export interface SessionResponse {
  session_id: string;
  started_at: string;
  message: string;
}

export interface HeartbeatRequest {
  session_id: string;
  current_page?: string;
}

export interface StudentActivitySummary {
  student_id: number;
  course_id: number;
  total_time_spent_seconds: number;
  lessons_started: number;
  lessons_completed: number;
  videos_watched: number;
  quizzes_taken: number;
  flashcards_reviewed: number;
  resources_downloaded: number;
  last_activity_at: string | null;
}

export interface CourseEngagementSummary {
  course_id: number;
  active_students: number;
  total_activities: number;
  avg_time_spent_minutes: number;
  completion_rate: number;
  activity_breakdown: Record<string, number>;
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

// ── Tracking & Analytics Functions ──

/** Start a tracking session */
export async function startTrackingSession(req: StartSessionRequest): Promise<SessionResponse> {
  return fetchApiWithAuth<SessionResponse>("/tracking/sessions/start", {
    method: "POST",
    body: req,
  });
}

/** Send heartbeat */
export async function sendHeartbeat(req: HeartbeatRequest): Promise<{ success: boolean }> {
  return fetchApiWithAuth<{ success: boolean }>("/tracking/sessions/heartbeat", {
    method: "POST",
    body: req,
  });
}

/** End session */
export async function endTrackingSession(sessionId: string): Promise<SessionResponse> {
  return fetchApiWithAuth<SessionResponse>("/tracking/sessions/end", {
    method: "POST",
    body: { session_id: sessionId, logout_type: "manual" },
  });
}

/** Track a learning activity */
export async function trackActivity(req: TrackActivityRequest): Promise<{ success: boolean }> {
  return fetchApiWithAuth<{ success: boolean }>("/tracking/activities", {
    method: "POST",
    body: req,
  });
}

/** Get student analytics for a course */
export async function getStudentAnalytics(studentId: number, courseId: number): Promise<StudentActivitySummary> {
  return fetchApiWithAuth<StudentActivitySummary>(`/tracking/analytics/student/${studentId}/course/${courseId}`);
}

/** Get course engagement (Admin/Instructor) */
export async function getCourseAnalytics(courseId: number, periodDays = 30): Promise<CourseEngagementSummary> {
  return fetchApiWithAuth<CourseEngagementSummary>(`/tracking/analytics/course/${courseId}/engagement?period_days=${periodDays}`);
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

// ── Lesson Progress Functions ──

export interface ProgressUpdate {
  lesson_id: number;
  progress_percentage?: number;
  time_spent_seconds?: number;
  video_position_seconds?: number;
  is_completed?: boolean;
}

export interface LessonProgressOut {
  progress_id: number;
  lesson_id: number;
  is_completed: boolean;
  progress_percentage: string;
  time_spent_seconds: number;
  video_position_seconds: number;
  last_accessed_at: string;
}

/** Get all lesson progress for a student in a course */
export async function getCourseProgress(studentId: number, courseId: number): Promise<LessonProgressOut[]> {
  return fetchApiWithAuth<LessonProgressOut[]>(`/students/enrollments/${courseId}/progress?student_id=${studentId}`);
}

/** Update lesson progress */
export async function updateLessonProgress(
  studentId: number, 
  courseId: number, 
  progress: ProgressUpdate
): Promise<LessonProgressOut> {
  return fetchApiWithAuth<LessonProgressOut>(`/students/enrollments/${courseId}/progress?student_id=${studentId}`, {
    method: "POST",
    body: progress,
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


// ── Search Logging ──

export async function logSearch(studentId: number, query: string, searchType: string = "course", resultsCount: number = 0) {
  const res = await fetch(`${API_BASE}/tracking/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: studentId,
      query,
      search_type: searchType,
      results_count: resultsCount,
    }),
  });
  if (!res.ok) throw new Error("Search log failed");
  return res.json();
}


// ── Resume Analysis ──

export interface ResumeAnalysis {
  student_id: number;
  file_url: string;
  analyzed_at: string;
  extracted_data: {
    skills: string[];
    experience_years: number;
    education: string[];
    certifications: string[];
    job_titles: string[];
    summary: string;
    languages: string[];
  };
  match_score_ready: boolean;
}

export async function uploadResume(studentId: number, file: File): Promise<{ success: boolean; analysis: ResumeAnalysis }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/tracking/resume/upload?student_id=${studentId}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function getResumeAnalysis(studentId: number): Promise<ResumeAnalysis | null> {
  const res = await fetch(`${API_BASE}/tracking/resume/${studentId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch resume analysis");
  return res.json();
}


// ── Student Profile ──

export interface StudentProfile {
  user_id: number;
  email: string;
  phone: string | null;
  student_id: number;
  first_name: string;
  last_name: string;
  bio: string | null;
  headline: string | null;
  location: string | null;
  education: string | null;
  experience_years: number;
  profile_picture_url: string | null;
  resume_url: string | null;
  cover_letter_url: string | null;
  availability_status: boolean;
  preferred_job_types: string[];
  preferred_locations: string[];
  preferred_remote_types: string[];
  salary_expectation_min: number | null;
  salary_expectation_max: number | null;
  salary_currency: string;
  notice_period_days: number | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  personal_website: string | null;
  total_courses_enrolled: number;
  total_courses_completed: number;
  total_learning_hours: number;
  average_quiz_score: number;
  streak_days: number;
}

/** Get full student profile (requires auth) */
export async function getStudentProfile(): Promise<StudentProfile> {
  return fetchApiWithAuth<StudentProfile>("/auth/profile/student");
}

/** Update student profile (requires auth) */
export async function updateStudentProfile(data: Partial<StudentProfile>): Promise<StudentProfile> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const res = await fetch(`${API_BASE}/auth/profile/student`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to update profile" }));
    throw new Error(err.detail || "Failed to update profile");
  }
  return res.json();
}


// ── Company Profile ──

export interface CompanyProfile {
  user_id: number;
  email: string;
  phone: string | null;
  company_id: number;
  company_name: string;
  description: string | null;
  industry: string | null;
  company_size: string | null;
  founded_year: number | null;
  headquarters_location: string | null;
  logo_url: string | null;
  banner_url: string | null;
  website_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  is_verified: boolean;
  billing_email: string | null;
  gst_number: string | null;
  billing_address: string | null;
  total_jobs_posted: number;
  total_hires: number;
}

/** Get full company profile (requires auth) */
export async function getCompanyProfile(): Promise<CompanyProfile> {
  return fetchApiWithAuth<CompanyProfile>("/auth/profile/company");
}

/** Update company profile (requires auth) */
export async function updateCompanyProfile(data: Partial<CompanyProfile>): Promise<CompanyProfile> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const res = await fetch(`${API_BASE}/auth/profile/company`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to update profile" }));
    throw new Error(err.detail || "Failed to update profile");
  }
  return res.json();
}


// ── Company Jobs ──

export interface JobSkillInput {
  name: string;
  is_mandatory: boolean;
  min_experience_years?: number | null;
}

export interface JobCreatePayload {
  title: string;
  description: string;
  responsibilities?: string;
  requirements?: string;
  nice_to_have?: string;
  department?: string;
  employment_type: string;
  remote_type: string;
  location?: string;
  experience_min_years: number;
  experience_max_years?: number | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency: string;
  salary_is_visible: boolean;
  benefits: string[];
  skills: JobSkillInput[];
  status: string;
  deadline?: string | null;
}

export interface JobSkillOut {
  skill_id: number;
  name: string;
  is_mandatory: boolean;
  min_experience_years?: number | null;
}

export interface JobOut {
  job_id: number;
  company_id: number;
  title: string;
  slug: string;
  description: string;
  responsibilities?: string | null;
  requirements?: string | null;
  nice_to_have?: string | null;
  department?: string | null;
  employment_type: string;
  remote_type: string;
  location?: string | null;
  experience_min_years: number;
  experience_max_years?: number | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency: string;
  salary_is_visible: boolean;
  benefits: string[];
  status: string;
  posted_at?: string | null;
  deadline?: string | null;
  views_count: number;
  applications_count: number;
  skills: JobSkillOut[];
  embedding_status?: string | null;
  created_at?: string | null;
}

/** Create a new job posting (company, requires auth) */
export async function createCompanyJob(data: JobCreatePayload): Promise<JobOut> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const res = await fetch(`${API_BASE}/jobs/company`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to create job" }));
    throw new Error(err.detail || "Failed to create job");
  }
  return res.json();
}

/** List all jobs for the authenticated company */
export async function getCompanyJobs(): Promise<JobOut[]> {
  return fetchApiWithAuth<JobOut[]>("/jobs/company");
}


// ── Student Dashboard ──

export interface DashboardStats {
  enrolled_courses: number;
  completed_courses: number;
  total_learning_hours: number;
  average_quiz_score: number;
  streak_days: number;
}

export interface EnrolledCourseSummary {
  course_id: number;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  progress_percentage: number;
  total_lessons: number;
  completed_lessons: number;
  last_accessed_at: string | null;
}

export interface RecentActivityItem {
  activity_type: string;
  description: string;
  course_name: string | null;
  timestamp: string;
}

export interface StudentDashboardData {
  first_name: string;
  last_name: string;
  stats: DashboardStats;
  enrolled_courses: EnrolledCourseSummary[];
  recent_activity: RecentActivityItem[];
  learning_hours_by_month: { month: string; hours: number }[];
}

/** Get student dashboard data (requires auth) */
export async function getStudentDashboard(): Promise<StudentDashboardData> {
  return fetchApiWithAuth<StudentDashboardData>("/auth/dashboard/student");
}


// ── Notifications ──

export interface Notification {
  notification_id: string;
  user_id: number;
  type: string;
  title: string;
  body: string;
  status: string;
  read: boolean;
  created_at: string;
  metadata: Record<string, unknown>;
}

export async function getNotifications(userId: number, unreadOnly: boolean = false): Promise<{ notifications: Notification[]; count: number }> {
  const params = new URLSearchParams({ unread_only: String(unreadOnly) });
  const res = await fetch(`${API_BASE}/tracking/notifications/${userId}?${params}`);
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/tracking/notifications/${notificationId}/read`, { method: "PUT" });
  if (!res.ok) throw new Error("Failed to mark notification read");
}
