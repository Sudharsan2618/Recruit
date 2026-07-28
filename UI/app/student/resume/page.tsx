"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Upload, FileText, Sparkles, Loader2, AlertCircle, CheckCircle2, ScanSearch,
  Target, TrendingUp, ShieldCheck, XCircle, Lightbulb, CalendarDays, MessageSquare,
  AlertTriangle, ListChecks, Award,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  uploadResume, getResumeAnalysis, getResumeReport, scoreResume, getRecommendedJobs,
  type ResumeAnalysis, type ResumeScoreReport, type JobListItem, type HiringDecision,
} from "@/lib/api"

// ── Score band helpers (DESIGN.md: teal strong · amber mid · red low) ──────
function band(v: number) {
  if (v >= 70) return { text: "text-primary", bar: "bg-primary", ring: "border-primary/30" }
  if (v >= 45) return { text: "text-accent", bar: "bg-accent", ring: "border-accent/30" }
  return { text: "text-destructive", bar: "bg-destructive", ring: "border-destructive/30" }
}

const DECISION: Record<HiringDecision, { label: string; cls: string }> = {
  advance: { label: "Advance", cls: "bg-primary/10 text-primary border-primary/20" },
  interview: { label: "Interview", cls: "bg-primary/10 text-primary border-primary/20" },
  hold: { label: "Hold", cls: "bg-accent/15 text-accent border-accent/30" },
  reject: { label: "Reject", cls: "bg-destructive/10 text-destructive border-destructive/20" },
}

function ScoreTile({ label, value }: { label: string; value: number }) {
  const b = band(value)
  return (
    <div className={`rounded-lg border ${b.ring} bg-card p-4`}>
      <p className={`text-3xl font-bold tracking-tight ${b.text}`}>{value}<span className="text-lg">%</span></p>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${b.bar} transition-all`} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /> {title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function PointList({ points, tone }: { points: { title: string; detail: string }[]; tone: "good" | "bad" }) {
  const dot = tone === "good" ? "bg-primary" : "bg-destructive"
  return (
    <ul className="flex flex-col gap-3">
      {points.map((p, i) => (
        <li key={i} className="flex gap-3">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
          <div>
            {p.title && <p className="text-sm font-semibold text-foreground">{p.title}</p>}
            {p.detail && <p className="text-sm leading-relaxed text-muted-foreground">{p.detail}</p>}
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function ResumeScorePage() {
  const { user } = useAuth()
  const studentId = user?.student_id

  // Resume-on-file + report state
  const [resume, setResume] = useState<ResumeAnalysis | null>(null)
  const [report, setReport] = useState<ResumeScoreReport | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Upload state
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Target + scoring state
  const [jobs, setJobs] = useState<JobListItem[]>([])
  const [mode, setMode] = useState<"job" | "custom">("job")
  const [jobId, setJobId] = useState<string>("")
  const [role, setRole] = useState("")
  const [seniority, setSeniority] = useState("")
  const [industry, setIndustry] = useState("")
  const [scoring, setScoring] = useState(false)
  const [scoreError, setScoreError] = useState<string | null>(null)

  useEffect(() => {
    if (!studentId) return
    setLoading(true)
    Promise.all([
      getResumeAnalysis(studentId).catch(() => null),
      getResumeReport(studentId).catch(() => null),
      getRecommendedJobs(50).catch(() => ({ jobs: [] as JobListItem[] })),
    ])
      .then(([a, r, j]) => {
        if (a) setResume(a)
        if (r) { setReport(r.report); setGeneratedAt(r.generated_at) }
        setJobs(j.jobs || [])
      })
      .finally(() => setLoading(false))
  }, [studentId])

  const handleFileSelect = useCallback((file: File) => {
    if (file.type !== "application/pdf") { setUploadError("Only PDF files are accepted"); return }
    if (file.size > 5 * 1024 * 1024) { setUploadError("File must be under 5 MB"); return }
    setResumeFile(file); setUploadError(null)
  }, [])

  async function handleUpload() {
    if (!resumeFile || !studentId) return
    setUploading(true); setUploadError(null)
    try {
      const result = await uploadResume(studentId, resumeFile)
      setResume(result.analysis)
      setResumeFile(null)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function handleScore() {
    if (!studentId) return
    setScoreError(null)
    if (mode === "job" && !jobId) { setScoreError("Pick a job to score against."); return }
    if (mode === "custom" && role.trim().length < 2) { setScoreError("Enter a target role."); return }
    setScoring(true)
    try {
      const body = mode === "job"
        ? { job_id: Number(jobId) }
        : { target: { role: role.trim(), seniority: seniority.trim() || null, industry: industry.trim() || null } }
      const res = await scoreResume(studentId, body)
      setReport(res.report)
      setGeneratedAt(res.report.meta.generated_at)
    } catch (err) {
      setScoreError(err instanceof Error ? err.message : "Scoring failed")
    } finally {
      setScoring(false)
    }
  }

  const hasResume = !!resume?.file_url || !!report

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Resume Score Report</h1>
        <p className="text-muted-foreground">See how your resume scores against a role — with strengths, gaps, and a plan to close them.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading your resume…</p>
        </div>
      ) : (
        <>
          {/* ── Setup: upload (if needed) + target selector ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            {!hasResume ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4 text-primary" /> Upload your resume</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div
                    className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f) }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
                    <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">{resumeFile ? resumeFile.name : "Drop your PDF resume here"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{resumeFile ? `${(resumeFile.size / 1024).toFixed(0)} KB — ready` : "PDF only, max 5 MB"}</p>
                  </div>
                  {uploadError && <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{uploadError}</div>}
                  <Button onClick={handleUpload} disabled={!resumeFile || uploading} className="w-full">
                    {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing…</> : <><Sparkles className="mr-2 h-4 w-4" /> Upload & analyze</>}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Your resume</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
                    <div className="rounded-md bg-primary/10 p-2"><FileText className="h-6 w-6 text-primary" /></div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{resume?.file_url?.split("/").pop()?.split("_").slice(2).join("_") || "Resume.pdf"}</p>
                      {resume?.file_url && <a href={resume.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View</a>}
                    </div>
                  </div>
                  <button onClick={() => { setResume((r) => r ? { ...r, file_url: "" } : r); setReport(null) }} className="self-start text-xs text-muted-foreground hover:text-foreground">
                    Replace resume
                  </button>
                </CardContent>
              </Card>
            )}

            {/* Target selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Score against a target</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Tabs value={mode} onValueChange={(v) => setMode(v as "job" | "custom")}>
                  <TabsList className="w-full">
                    <TabsTrigger value="job" className="flex-1">A job on the board</TabsTrigger>
                    <TabsTrigger value="custom" className="flex-1">A custom role</TabsTrigger>
                  </TabsList>
                  <TabsContent value="job" className="mt-4">
                    {jobs.length ? (
                      <Select value={jobId} onValueChange={setJobId}>
                        <SelectTrigger><SelectValue placeholder="Select a job…" /></SelectTrigger>
                        <SelectContent>
                          {jobs.map((j) => (
                            <SelectItem key={j.job_id} value={String(j.job_id)}>{j.title} — {j.company.company_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground">No jobs available yet. Try a custom role instead.</p>
                    )}
                  </TabsContent>
                  <TabsContent value="custom" className="mt-4 flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs">Target role</Label>
                      <Input placeholder="e.g. AI Engineer" value={role} onChange={(e) => setRole(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Seniority</Label>
                        <Input placeholder="e.g. Lead" value={seniority} onChange={(e) => setSeniority(e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Industry</Label>
                        <Input placeholder="e.g. Fintech" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                {scoreError && <div className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{scoreError}</div>}
                <Button onClick={handleScore} disabled={scoring || !hasResume} className="w-full">
                  {scoring ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scoring your resume…</> : <><ScanSearch className="mr-2 h-4 w-4" /> Score my resume</>}
                </Button>
                {!hasResume && <p className="text-center text-xs text-muted-foreground">Upload a resume first to enable scoring.</p>}
              </CardContent>
            </Card>
          </div>

          {/* ── Report ── */}
          {scoring && !report ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Analyzing your resume against the target…</p>
            </div>
          ) : report ? (
            <div className="flex flex-col gap-6">
              {/* Verdict + scores */}
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Verdict</CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {report.meta.job_title || report.meta.target_role}
                      {report.meta.seniority ? ` · ${report.meta.seniority}` : ""}
                      {generatedAt ? ` · ${new Date(generatedAt).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <p className="text-sm leading-relaxed text-muted-foreground">{report.verdict_summary}</p>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <ScoreTile label="Match Score" value={report.scores.match_score} />
                    <ScoreTile label="ATS Score" value={report.scores.ats_score} />
                    <ScoreTile label="Skills" value={report.scores.skills_score} />
                    <ScoreTile label="Experience" value={report.scores.experience_score} />
                  </div>
                </CardContent>
              </Card>

              {/* Hiring intelligence */}
              <Section icon={TrendingUp} title="Hiring intelligence">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Decision</p>
                    <Badge variant="outline" className={`mt-1 ${DECISION[report.hiring_intelligence.decision]?.cls || ""}`}>
                      {DECISION[report.hiring_intelligence.decision]?.label || report.hiring_intelligence.decision}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <p className="mt-1 text-sm font-semibold capitalize text-foreground">{report.hiring_intelligence.confidence}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Market position</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{report.hiring_intelligence.market_position || "—"}</p>
                  </div>
                </div>
              </Section>

              {/* Strengths + Gaps */}
              <div className="grid gap-6 lg:grid-cols-2">
                {report.core_strengths.length > 0 && (
                  <Section icon={ShieldCheck} title="Core strengths"><PointList points={report.core_strengths} tone="good" /></Section>
                )}
                {report.critical_gaps.length > 0 && (
                  <Section icon={XCircle} title="Critical gaps"><PointList points={report.critical_gaps} tone="bad" /></Section>
                )}
              </div>

              {/* Skill intelligence */}
              <Section icon={ListChecks} title="Skill intelligence">
                <div className="flex flex-col gap-4">
                  {report.skill_intelligence.exact_matches.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">Matched skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {report.skill_intelligence.exact_matches.map((s) => (
                          <Badge key={s} className="bg-primary/10 text-primary hover:bg-primary/15 border-transparent">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {report.skill_intelligence.missing.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">Missing skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {report.skill_intelligence.missing.map((s) => (
                          <Badge key={s} variant="outline" className="border-accent/40 text-accent">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {report.skill_intelligence.transferable_summary && (
                    <p className="text-sm leading-relaxed text-muted-foreground">{report.skill_intelligence.transferable_summary}</p>
                  )}
                </div>
              </Section>

              {/* ATS keywords */}
              {report.ats_keywords.length > 0 && (
                <Section icon={Target} title="ATS keywords to add">
                  <div className="flex flex-wrap gap-1.5">
                    {report.ats_keywords.map((k) => (
                      <Badge key={k} variant="secondary">{k}</Badge>
                    ))}
                  </div>
                </Section>
              )}

              {/* Rewrite suggestions */}
              <Section icon={Lightbulb} title="Rewrite suggestions">
                {report.rewrite_suggestions.length > 0 ? (
                  <ul className="flex flex-col gap-4">
                    {report.rewrite_suggestions.map((r, i) => (
                      <li key={i} className="rounded-lg border border-border p-3">
                        <p className="text-xs text-muted-foreground line-through">{r.before}</p>
                        <p className="mt-1 text-sm font-medium text-foreground">{r.after}</p>
                        {r.reason && <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No data generated for this section.</p>
                )}
              </Section>

              {/* Interview coaching */}
              {report.interview_coaching.length > 0 && (
                <Section icon={MessageSquare} title="Interview coaching">
                  <Accordion type="single" collapsible className="w-full">
                    {report.interview_coaching.map((c, i) => (
                      <AccordionItem key={i} value={`q-${i}`}>
                        <AccordionTrigger className="text-left text-sm">{c.question}</AccordionTrigger>
                        <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{c.guidance}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Section>
              )}

              {/* Improvement plan */}
              {(report.improvement_plan.weekly.length > 0 || report.improvement_plan.daily.length > 0) && (
                <Section icon={CalendarDays} title="Improvement plan">
                  <div className="grid gap-5 lg:grid-cols-2">
                    {report.improvement_plan.weekly.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">By week</p>
                        <ol className="flex flex-col gap-3">
                          {report.improvement_plan.weekly.map((w, i) => (
                            <li key={i} className="flex gap-3">
                              <span className="flex h-6 shrink-0 items-center rounded-md bg-primary/10 px-2 text-xs font-semibold text-primary">{w.label}</span>
                              <div>
                                {w.focus && <p className="text-sm font-medium text-foreground">{w.focus}</p>}
                                {w.detail && <p className="text-sm leading-relaxed text-muted-foreground">{w.detail}</p>}
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {report.improvement_plan.daily.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Day by day</p>
                        <ol className="flex flex-col gap-2">
                          {report.improvement_plan.daily.map((d, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
                              <span><span className="font-medium text-foreground">{d.label}:</span> {d.task}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {/* Interview risk */}
              {(report.interview_risk.risks.length > 0 || report.interview_risk.mitigations.length > 0 || report.interview_risk.closing_advice) && (
                <Section icon={AlertTriangle} title="Interview risk">
                  <div className="flex flex-col gap-4">
                    {report.interview_risk.risks.length > 0 && <PointList points={report.interview_risk.risks} tone="bad" />}
                    {report.interview_risk.mitigations.length > 0 && (
                      <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
                        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground"><Award className="h-3.5 w-3.5 text-accent" /> How to get ahead of it</p>
                        <ul className="flex flex-col gap-1.5">
                          {report.interview_risk.mitigations.map((m, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {report.interview_risk.closing_advice && (
                      <p className="text-sm leading-relaxed text-muted-foreground">{report.interview_risk.closing_advice}</p>
                    )}
                  </div>
                </Section>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
              <ScanSearch className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">No score report yet</p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                {hasResume ? "Choose a target above and score your resume to see the full report." : "Upload your resume, choose a target, and score it to see match, ATS, skills and experience insights."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
