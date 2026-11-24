import { fetchApi, fetchApiWithAuth, API_BASE_URL } from './client';
import { Category, InstructorBrief, CourseListItem, CourseListResponse, LessonBrief, LessonFull, ModuleOut, CourseDetail, MaterialOut, QuizQuestionOut, QuizOut, FlashcardOut, FlashcardDeckOut, DeviceInfo, VideoProgress, QuizResult, FlashcardSession, ActivityDetails, TrackActivityRequest, StartSessionRequest, SessionResponse, HeartbeatRequest, StudentActivitySummary, CourseEngagementSummary, EnrollmentOut, ProgressUpdate, LessonProgressOut, ResumeAnalysis, StudentProfile, CompanyProfile, JobSkillInput, JobCreatePayload, JobSkillOut, JobOut, SkillBrief, MatchBreakdown, MatchedSkill, MissingSkill, SkillSummary, GapCourse, CompanyBrief, JobListItem, CompanyDetail, JobDetailFull, ApplicationOut, ApplyPayload, DashboardStats, EnrolledCourseSummary, RecentActivityItem, StudentDashboardData, AdminDashboardData, DashboardChartData, AdminUser, AdminCourse, AdminJob, JobApplicant, CompanyCandidate, Notification, CourseReview, ReviewStats, Certificate, PaymentOrderResponse, VerifyPaymentResponse, PaymentRecord, PaymentHistoryResponse, ActivityType } from './types';
import * as T from './types';

export async function getStudentProfile(): Promise<StudentProfile> {
  return fetchApiWithAuth<StudentProfile>("/auth/profile/student");
}

export async function updateStudentProfile(data: Partial<StudentProfile>): Promise<StudentProfile> {
  return fetchApiWithAuth<StudentProfile>("/auth/profile/student", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getCompanyProfile(): Promise<CompanyProfile> {
  return fetchApiWithAuth<CompanyProfile>("/auth/profile/company");
}

export async function updateCompanyProfile(data: Partial<CompanyProfile>): Promise<CompanyProfile> {
  return fetchApiWithAuth<CompanyProfile>("/auth/profile/company", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getStudentDashboard(): Promise<StudentDashboardData> {
  return fetchApiWithAuth<StudentDashboardData>("/auth/dashboard/student");
}

export async function getAdminUsers(params: {
  search?: string;
  role?: string;
  status?: string;
  sort_by?: string;
  sort_order?: string;
  limit?: number;
  offset?: number;
}): Promise<{ users: AdminUser[]; total: number; summary: { student_count: number; company_count: number; active_count: number } }> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.role) query.set("role", params.role);
  if (params.status) query.set("status", params.status);
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_order) query.set("sort_order", params.sort_order);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.offset) query.set("offset", String(params.offset));
  return fetchApiWithAuth(`/admin/users?${query.toString()}`);
}

export interface CreateUserPayload {
  email: string;
  user_type: "student" | "company";
  first_name?: string;
  last_name?: string;
  company_name?: string;
}

export interface CreateUserResult {
  user_id: number;
  email: string;
  user_type: string;
  name: string;
  temp_password: string;
}

export async function createUser(data: CreateUserPayload): Promise<CreateUserResult> {
  return fetchApiWithAuth<CreateUserResult>("/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUserStatus(userId: number, newStatus: string): Promise<{ success: boolean }> {
  return fetchApiWithAuth(`/admin/users/${userId}/status?new_status=${newStatus}`, { method: "PUT" });
}

export async function deleteUser(userId: number): Promise<{ success: boolean }> {
  return fetchApiWithAuth(`/admin/users/${userId}`, { method: "DELETE" });
}
