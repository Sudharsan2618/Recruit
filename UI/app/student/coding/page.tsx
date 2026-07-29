"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Check, ScanSearch, Loader2, Code2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  listCodingQuestions, getCodingProgress,
  type CodingQuestionBrief, type CodingFacets,
} from "@/lib/api"

const ENGINES = [
  { key: "", label: "All" },
  { key: "sql", label: "SQL" },
  { key: "pandas", label: "Pandas" },
  { key: "pyspark", label: "PySpark" },
  { key: "python", label: "Python" },
  { key: "systemdesign", label: "System Design" },
]
const DIFFS = [
  { key: "", label: "All" },
  { key: "easy", label: "Easy" },
  { key: "medium", label: "Medium" },
  { key: "hard", label: "Hard" },
]

function diffClasses(d: string) {
  if (d === "easy") return "text-success bg-success/10"
  if (d === "medium") return "text-accent bg-accent/15"
  return "text-destructive bg-destructive/10"
}

export default function CodingBrowsePage() {
  const router = useRouter()
  const { user } = useAuth()
  const studentId = user?.student_id ?? undefined

  const [questions, setQuestions] = useState<CodingQuestionBrief[]>([])
  const [facets, setFacets] = useState<CodingFacets | null>(null)
  const [progress, setProgress] = useState<{ solved_count: number; points: number } | null>(null)
  const [loading, setLoading] = useState(true)

  const [engine, setEngine] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [company, setCompany] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    setLoading(true)
    listCodingQuestions({ engine, difficulty, company, search, studentId })
      .then((data) => { setQuestions(data.questions); setFacets(data.facets) })
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false))
  }, [engine, difficulty, company, search, studentId])

  useEffect(() => {
    if (studentId == null) return
    getCodingProgress(studentId).then((p) => setProgress({ solved_count: p.solved_count, points: p.points })).catch(() => {})
  }, [studentId])

  const total = useMemo(() => questions.length, [questions])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <Code2 className="h-6 w-6 text-primary" /> Coding Practice
          </h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Interview questions solved live against real datasets — get graded and climb the leaderboard.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl border border-border bg-card px-4 py-2.5">
            <p className="text-lg font-bold tracking-tight text-primary tabular-nums">{progress?.solved_count ?? 0}</p>
            <p className="text-xs text-muted-foreground">Solved</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-2.5">
            <p className="text-lg font-bold tracking-tight tabular-nums">{progress?.points ?? 0}</p>
            <p className="text-xs text-muted-foreground">Points</p>
          </div>
        </div>
      </div>

      {/* Track tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {ENGINES.map((e) => (
          <button
            key={e.key || "all"}
            onClick={() => setEngine(e.key)}
            className={`relative px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${engine === e.key ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {e.label}
            {engine === e.key && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-primary" />}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-4 w-4" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"
          />
        </label>
        <div className="flex gap-1.5">
          {DIFFS.map((d) => (
            <button
              key={d.key || "all"}
              onClick={() => setDifficulty(d.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${difficulty === d.key ? "border-primary/35 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40"}`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <select
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
        >
          <option value="">All companies</option>
          {facets?.companies.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-[28px_1fr_100px_110px_64px] items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-semibold text-muted-foreground">
          <span></span><span>Problem</span><span>Difficulty</span><span>Companies</span><span className="text-right">Points</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading questions…
          </div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ScanSearch className="mb-3 h-9 w-9 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No questions match these filters</p>
            <p className="mt-1 text-xs text-muted-foreground">Try a different track or difficulty.</p>
          </div>
        ) : (
          questions.map((q) => (
            <button
              key={q.slug}
              onClick={() => router.push(`/student/coding/${q.slug}`)}
              className="grid w-full grid-cols-[28px_1fr_100px_110px_64px] items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${q.solved ? "border-success bg-success/10 text-success" : "border-border"}`}>
                {q.solved && <Check className="h-3 w-3" />}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-6 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-[10px] font-bold uppercase text-primary">{q.engine.slice(0, 3)}</span>
                  <span className="truncate text-sm font-semibold text-foreground">{q.title}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {q.topic_tags.slice(0, 3).map((t) => (
                    <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10.5px] text-muted-foreground">{t}</span>
                  ))}
                </div>
              </div>
              <span>
                <span className={`rounded-md px-2 py-0.5 text-xs font-bold capitalize ${diffClasses(q.difficulty)}`}>{q.difficulty}</span>
              </span>
              <span className="truncate text-xs text-muted-foreground">{q.company_tags.join(" · ")}</span>
              <span className="text-right text-sm font-bold tabular-nums">{q.points}</span>
            </button>
          ))
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">{total} question{total === 1 ? "" : "s"}</p>
    </div>
  )
}
