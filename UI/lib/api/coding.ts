import { API_BASE_URL } from "./client"

export type CodingEngine = "sql" | "pandas" | "pyspark" | "python" | "systemdesign"
export type CodingDifficulty = "easy" | "medium" | "hard"
export type CodingVerdict = "passed" | "wrong_answer" | "runtime_error"

export interface CodingQuestionBrief {
  slug: string
  engine: CodingEngine
  dataset: string
  difficulty: CodingDifficulty
  title: string
  topic_tags: string[]
  role_tags: string[]
  company_tags: string[]
  points: number
  solved?: boolean
}

export interface CodingQuestion extends CodingQuestionBrief {
  prompt_md: string
  starter_code: string
  hints: string[]
  explanation_md: string
  ordering_matters: boolean
  expected_columns: string[]
}

export interface CodingFacets {
  engines: string[]
  difficulties: string[]
  companies: string[]
  roles: string[]
}

export interface CodingSubmitDiff {
  expectedColumns: string[]
  gotColumns: string[]
  columnsMatch: boolean
  expectedRowCount: number
  gotRowCount: number
  missingRows: (string | number | null)[][]
  extraRows: (string | number | null)[][]
  orderingMatters: boolean
}

export interface CodingSubmitResult {
  verdict: CodingVerdict
  first_solve: boolean
  points_awarded: number
  base_points?: number
  penalized?: boolean
  diff: CodingSubmitDiff | null
  columns: string[]
  rows: (string | number | null)[][]
  row_count: number
  error?: string
}

export interface CodingProgress {
  solved_slugs: string[]
  solved_count: number
  points: number
}

export interface LeaderboardRow {
  student_id: number
  points: number
  solved: number
}

export async function listCodingQuestions(params: {
  engine?: string; difficulty?: string; company?: string; role?: string; search?: string; studentId?: number
} = {}): Promise<{ questions: CodingQuestionBrief[]; total: number; facets: CodingFacets }> {
  const qs = new URLSearchParams()
  if (params.engine) qs.set("engine", params.engine)
  if (params.difficulty) qs.set("difficulty", params.difficulty)
  if (params.company) qs.set("company", params.company)
  if (params.role) qs.set("role", params.role)
  if (params.search) qs.set("search", params.search)
  if (params.studentId != null) qs.set("student_id", String(params.studentId))
  const res = await fetch(`${API_BASE_URL}/coding/questions?${qs.toString()}`)
  if (!res.ok) throw new Error("Failed to load questions")
  return res.json()
}

export async function getCodingQuestion(slug: string, studentId?: number): Promise<CodingQuestion> {
  const qs = studentId != null ? `?student_id=${studentId}` : ""
  const res = await fetch(`${API_BASE_URL}/coding/questions/${slug}${qs}`)
  if (res.status === 404) throw new Error("Question not found")
  if (!res.ok) throw new Error("Failed to load question")
  return res.json()
}

export async function submitCoding(
  slug: string, studentId: number, body: { code: string; language: string }
): Promise<CodingSubmitResult> {
  const res = await fetch(`${API_BASE_URL}/coding/questions/${slug}/submit?student_id=${studentId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Submission failed" }))
    throw new Error(err.detail || "Submission failed")
  }
  return res.json()
}

export async function getCodingProgress(studentId: number): Promise<CodingProgress> {
  const res = await fetch(`${API_BASE_URL}/coding/progress/${studentId}`)
  if (!res.ok) throw new Error("Failed to load progress")
  return res.json()
}

export async function getCodingLeaderboard(limit = 20): Promise<LeaderboardRow[]> {
  const res = await fetch(`${API_BASE_URL}/coding/leaderboard?limit=${limit}`)
  if (!res.ok) throw new Error("Failed to load leaderboard")
  const data = await res.json()
  return data.leaderboard || []
}
