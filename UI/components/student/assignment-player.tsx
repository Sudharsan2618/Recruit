"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Play, CheckCircle2, XCircle, Eye, EyeOff, Lightbulb, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { fetchApiWithAuth } from "@/lib/api/client"

// ── Types ──
interface AQuestion {
  question_id: number
  title?: string | null
  problem_statement: string
  starter_code?: string | null
  expected_output?: string | null
  solution_code?: string | null
  solution_explanation?: string | null
  language: string
  points: number
}
interface AssignmentFull {
  assignment_id: number
  title: string
  description?: string | null
  instructions?: string | null
  language: string
  questions: AQuestion[]
}

// ── Pyodide (in-browser Python), loaded once from CDN ──
const PYODIDE_VERSION = "0.26.4"
let pyodidePromise: Promise<any> | null = null

function loadPyodideOnce(): Promise<any> {
  if (pyodidePromise) return pyodidePromise
  pyodidePromise = (async () => {
    const w = window as any
    if (!w.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script")
        s.src = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`
        s.onload = () => resolve()
        s.onerror = () => reject(new Error("Failed to load the Python runtime."))
        document.head.appendChild(s)
      })
    }
    return w.loadPyodide({ indexURL: `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/` })
  })()
  return pyodidePromise
}

// Run Python, capturing stdout+stderr+traceback into a string (sandboxed in-browser).
async function runPython(code: string): Promise<string> {
  const py = await loadPyodideOnce()
  py.globals.set("__user_code", code)
  const runner = `
import sys, io, traceback
__buf = io.StringIO()
__out, __err = sys.stdout, sys.stderr
sys.stdout = __buf
sys.stderr = __buf
try:
    exec(__user_code, {"__name__": "__main__"})
except SystemExit:
    pass
except BaseException:
    traceback.print_exc()
finally:
    sys.stdout, sys.stderr = __out, __err
__buf.getvalue()
`
  try {
    const result = await py.runPythonAsync(runner)
    return typeof result === "string" ? result : String(result ?? "")
  } finally {
    try { py.globals.delete("__user_code") } catch { /* noop */ }
  }
}

function normalize(s: string): string {
  return (s || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map(l => l.replace(/\s+$/, ""))
    .join("\n")
    .trim()
}

// ── Code editor (textarea with tab support) ──
function CodeArea({ value, onChange, rows = 12 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      spellCheck={false}
      onKeyDown={e => {
        if (e.key === "Tab") {
          e.preventDefault()
          const el = e.currentTarget
          const start = el.selectionStart, end = el.selectionEnd
          const next = value.slice(0, start) + "    " + value.slice(end)
          onChange(next)
          requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 4 })
        }
      }}
      className="w-full rounded-md border border-border bg-[#0d1117] text-[#e6edf3] font-mono text-xs leading-relaxed p-3 resize-y focus:outline-none focus:ring-2 focus:ring-primary/40"
    />
  )
}

function QuestionCard({ q, index }: { q: AQuestion; index: number }) {
  const [code, setCode] = useState(q.starter_code || "")
  const [output, setOutput] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState<"idle" | "pass" | "fail">("idle")
  const [showExpected, setShowExpected] = useState(false)
  const [showSolution, setShowSolution] = useState(false)

  async function handleRun() {
    setRunning(true)
    setStatus("idle")
    try {
      const out = await runPython(code)
      setOutput(out)
      if (q.expected_output != null && q.expected_output !== "") {
        setStatus(normalize(out) === normalize(q.expected_output) ? "pass" : "fail")
      }
    } catch (e: any) {
      setOutput(String(e?.message || e))
      setStatus("fail")
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-primary mb-1">Problem {index + 1} · {q.points} pts</p>
          {q.title && <h4 className="text-base font-bold text-foreground">{q.title}</h4>}
        </div>
        {status === "pass" && (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-success/10 text-success px-2.5 py-1 text-xs font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" /> Passed
          </span>
        )}
        {status === "fail" && (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-2.5 py-1 text-xs font-medium">
            <XCircle className="h-3.5 w-3.5" /> Not yet
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{q.problem_statement}</p>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Your code</span>
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setCode(q.starter_code || "")}>
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        </div>
        <CodeArea value={code} onChange={setCode} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={handleRun} disabled={running} className="gap-1.5">
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          {running ? "Running…" : "Run & Check"}
        </Button>
        {q.expected_output != null && q.expected_output !== "" && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowExpected(v => !v)}>
            {showExpected ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showExpected ? "Hide expected" : "Expected output"}
          </Button>
        )}
        {(q.solution_code || q.solution_explanation) && (
          <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground" onClick={() => setShowSolution(v => !v)}>
            <Lightbulb className="h-3.5 w-3.5" /> {showSolution ? "Hide solution" : "Show solution"}
          </Button>
        )}
      </div>

      {output != null && (
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Output</span>
          <pre className="rounded-md border border-border bg-muted/40 p-3 text-xs font-mono whitespace-pre-wrap overflow-x-auto">{output || "(no output)"}</pre>
        </div>
      )}

      {showExpected && (
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Expected output</span>
          <pre className="rounded-md border border-border bg-muted/40 p-3 text-xs font-mono whitespace-pre-wrap overflow-x-auto">{q.expected_output}</pre>
        </div>
      )}

      {showSolution && (
        <div className="space-y-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
          {q.solution_explanation && (
            <p className="text-xs text-foreground/80 whitespace-pre-wrap">{q.solution_explanation}</p>
          )}
          {q.solution_code && (
            <pre className="rounded-md border border-border bg-[#0d1117] text-[#e6edf3] p-3 text-xs font-mono whitespace-pre-wrap overflow-x-auto">{q.solution_code}</pre>
          )}
        </div>
      )}
    </div>
  )
}

export function AssignmentPlayer({ lessonId }: { lessonId: number }) {
  const [assignment, setAssignment] = useState<AssignmentFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    setLoading(true)
    setError(null)
    fetchApiWithAuth<AssignmentFull>(`/courses/lessons/${lessonId}/assignment`)
      .then(data => { if (mountedRef.current) setAssignment(data) })
      .catch(() => { if (mountedRef.current) setError("This assignment isn't available yet.") })
      .finally(() => { if (mountedRef.current) setLoading(false) })
    return () => { mountedRef.current = false }
  }, [lessonId])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 min-h-[400px]">
        <p className="text-sm text-muted-foreground">{error || "No assignment found."}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 min-h-[400px] bg-background">
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <p className="text-xs font-semibold text-primary mb-1">Coding Assignment</p>
          <h2 className="text-xl font-bold text-foreground">{assignment.title}</h2>
          {assignment.instructions && (
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{assignment.instructions}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Runs Python right in your browser — write your fix and click <span className="font-medium text-foreground">Run &amp; Check</span>.
          </p>
        </div>

        {assignment.questions.map((q, i) => (
          <QuestionCard key={q.question_id} q={q} index={i} />
        ))}
      </div>
    </div>
  )
}
