"use client"

import { useState, useRef, useCallback } from "react"
import { Play, Loader2, Check, X, RotateCcw, ChevronRight } from "lucide-react"
import { runSql, type RunResult } from "@/lib/coding/sql-engine"
import { submitCoding, type CodingQuestion, type CodingSubmitResult } from "@/lib/api"

interface CodeRunnerProps {
  question: CodingQuestion
  studentId?: number
  onSolved?: () => void
}

function ResultTable({ columns, rows }: { columns: string[]; rows: (string | number | null)[][] }) {
  if (columns.length === 0) return <p className="text-xs text-sidebar-foreground/60">Query ran — no columns returned.</p>
  return (
    <div className="overflow-x-auto rounded-md border border-sidebar-border">
      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr>{columns.map((c) => (
            <th key={c} className="border-b border-sidebar-border bg-sidebar-accent/50 px-3 py-1.5 text-left font-semibold text-sidebar-foreground">{c}</th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j} className="border-b border-sidebar-border/60 px-3 py-1 tabular-nums text-sidebar-foreground/85">{cell === null ? "NULL" : String(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function CodeRunner({ question, studentId, onSolved }: CodeRunnerProps) {
  const [code, setCode] = useState(question.starter_code || "")
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<RunResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<CodingSubmitResult | null>(null)
  const [tab, setTab] = useState<"result" | "verdict">("result")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const lineCount = Math.max(code.split("\n").length, 1)

  const handleRun = useCallback(async () => {
    if (!code.trim()) return
    setRunning(true)
    setTab("result")
    const res = await runSql(question.dataset, code)
    setRunResult(res)
    setRunning(false)
  }, [code, question.dataset])

  const handleSubmit = useCallback(async () => {
    if (!code.trim() || studentId == null) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await submitCoding(question.slug, studentId, { code, language: question.engine })
      setSubmitResult(res)
      setTab("verdict")
      if (res.verdict === "passed" && res.first_solve) onSolved?.()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }, [code, studentId, question.slug, question.engine, onSolved])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault()
      const el = e.currentTarget
      const s = el.selectionStart, en = el.selectionEnd
      const next = code.slice(0, s) + "  " + code.slice(en)
      setCode(next)
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + 2 })
    }
  }

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* toolbar */}
      <div className="flex items-center gap-2 border-b border-sidebar-border px-3 py-2">
        <span className="rounded-md border border-sidebar-border bg-sidebar-accent px-2.5 py-1 text-xs font-semibold text-sidebar-foreground">
          {question.engine.toUpperCase()} · SQLite (sql.js)
        </span>
        <span className="rounded-md border border-sidebar-border bg-sidebar-accent px-2.5 py-1 text-xs font-medium text-sidebar-foreground/70">
          Dataset: <b className="text-white">{question.dataset}</b>
        </span>
        <div className="flex-1" />
        <button
          onClick={() => { setCode(question.starter_code || ""); setRunResult(null) }}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-sidebar-border px-3 text-xs font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
        <button
          onClick={handleRun}
          disabled={running}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-sidebar-border bg-sidebar-accent px-3.5 text-xs font-semibold text-white hover:bg-sidebar-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring disabled:opacity-60"
        >
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Run
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || studentId == null}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Submit
        </button>
      </div>

      {/* editor */}
      <div className="flex min-h-[180px] flex-1 overflow-hidden">
        <div className="select-none border-r border-sidebar-border py-3 text-right font-mono text-xs leading-6 text-sidebar-foreground/30">
          {Array.from({ length: lineCount }, (_, i) => <div key={i} className="px-3">{i + 1}</div>)}
        </div>
        <textarea
          ref={taRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 resize-none bg-sidebar px-4 py-3 font-mono text-[13px] leading-6 text-[hsl(210_30%_90%)] outline-none"
          aria-label="Code editor"
        />
      </div>

      {/* console */}
      <div className="flex max-h-[42%] flex-col border-t border-sidebar-border bg-[hsl(220_24%_10%)]">
        <div className="flex gap-1 px-2 pt-1.5">
          {(["result", "verdict"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-selected={tab === t}
              className={`rounded-t-md px-3 py-1.5 text-[11.5px] font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${tab === t ? "bg-sidebar-accent text-white" : "text-sidebar-foreground/60 hover:text-sidebar-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="overflow-auto p-3">
          {tab === "result" ? (
            !runResult ? (
              <p className="flex h-16 items-center justify-center gap-2 text-xs text-sidebar-foreground/50">
                <Play className="h-4 w-4" /> Press <b className="text-white">Run</b> to execute against {question.dataset} — runs locally, instantly.
              </p>
            ) : runResult.ok ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-sidebar-foreground/80">
                  <span className="inline-flex items-center gap-1 font-semibold text-success"><Check className="h-3.5 w-3.5" /> {runResult.rowCount} row{runResult.rowCount === 1 ? "" : "s"}</span>
                  <span>· {runResult.timeMs} ms · local</span>
                  {runResult.truncated && <span className="text-sidebar-foreground/50">· showing first {runResult.rows.length}</span>}
                </div>
                <ResultTable columns={runResult.columns} rows={runResult.rows} />
              </div>
            ) : (
              <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-xs text-danger">{runResult.error}</div>
            )
          ) : (
            <VerdictPanel result={submitResult} error={submitError} expected={question.expected_columns} />
          )}
        </div>
      </div>
    </div>
  )
}

function VerdictPanel({ result, error, expected }: { result: CodingSubmitResult | null; error: string | null; expected: string[] }) {
  if (error) return <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</div>
  if (!result) return <p className="flex h-16 items-center justify-center text-xs text-sidebar-foreground/50">Submit your answer to see the graded verdict.</p>

  if (result.verdict === "passed") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-success/40 bg-success/10 px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-success/20 text-success"><Check className="h-5 w-5" /></span>
        <div>
          <h4 className="text-sm font-semibold text-white">Accepted — all rows match</h4>
          <p className="text-xs text-sidebar-foreground/70">Verified server-side against the stored expected result{result.first_solve ? " · first solve" : ""}.</p>
        </div>
        {result.first_solve && result.points_awarded > 0 && (
          <div className="ml-auto text-right"><b className="text-lg text-accent">+{result.points_awarded}</b><div className="text-[11px] text-sidebar-foreground/60">points</div></div>
        )}
      </div>
    )
  }

  if (result.verdict === "runtime_error") {
    return <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 font-mono text-xs text-danger">{result.error || "Your code failed to run."}</div>
  }

  const d = result.diff
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-danger/20 text-danger"><X className="h-5 w-5" /></span>
        <div>
          <h4 className="text-sm font-semibold text-white">Wrong answer</h4>
          <p className="text-xs text-sidebar-foreground/70">Your result didn&rsquo;t match the expected output.</p>
        </div>
      </div>
      {d && (
        <div className="grid gap-1.5 rounded-md border border-sidebar-border bg-sidebar-accent/30 px-3 py-2 text-xs text-sidebar-foreground/80">
          {!d.columnsMatch && (
            <div className="flex items-center gap-2">
              <ChevronRight className="h-3 w-3 text-danger" /> Columns differ — expected <code className="text-white">[{d.expectedColumns.join(", ")}]</code>, got <code className="text-white">[{d.gotColumns.join(", ")}]</code>
            </div>
          )}
          <div className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-danger" /> Row count — expected <b className="text-white">{d.expectedRowCount}</b>, got <b className="text-white">{d.gotRowCount}</b>{d.orderingMatters ? " · order matters" : ""}</div>
          {d.missingRows.length > 0 && <div className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-danger" /> Missing {d.missingRows.length} expected row(s), e.g. <code className="text-white">[{(d.missingRows[0] ?? []).join(", ")}]</code></div>}
          {d.extraRows.length > 0 && <div className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-danger" /> {d.extraRows.length} unexpected row(s), e.g. <code className="text-white">[{(d.extraRows[0] ?? []).join(", ")}]</code></div>}
        </div>
      )}
    </div>
  )
}
