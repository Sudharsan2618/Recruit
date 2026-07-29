"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ArrowLeft, Loader2, Lightbulb, Table2, Lock, Check, ListChecks, Clock3 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getCodingQuestion, type CodingQuestion } from "@/lib/api"
import CodeRunner from "@/components/coding/CodeRunner"

const SCHEMAS: Record<string, { table: string; columns: string[] }[]> = {
  chinook: [
    { table: "Artist", columns: ["ArtistId", "Name"] },
    { table: "Album", columns: ["AlbumId", "Title", "ArtistId"] },
    { table: "Genre", columns: ["GenreId", "Name"] },
    { table: "MediaType", columns: ["MediaTypeId", "Name"] },
    { table: "Track", columns: ["TrackId", "Name", "AlbumId", "MediaTypeId", "GenreId", "Composer", "Milliseconds", "Bytes", "UnitPrice"] },
    { table: "Playlist", columns: ["PlaylistId", "Name"] },
    { table: "PlaylistTrack", columns: ["PlaylistId", "TrackId"] },
    { table: "Customer", columns: ["CustomerId", "FirstName", "LastName", "Company", "Address", "City", "State", "Country", "PostalCode", "Phone", "Fax", "Email", "SupportRepId"] },
    { table: "Employee", columns: ["EmployeeId", "LastName", "FirstName", "Title", "ReportsTo", "BirthDate", "HireDate", "Country", "Email"] },
    { table: "Invoice", columns: ["InvoiceId", "CustomerId", "InvoiceDate", "BillingCountry", "BillingCity", "Total"] },
    { table: "InvoiceLine", columns: ["InvoiceLineId", "InvoiceId", "TrackId", "UnitPrice", "Quantity"] },
  ],
  northwind: [
    { table: "Categories", columns: ["CategoryID", "CategoryName", "Description"] },
    { table: "Customers", columns: ["CustomerID", "CompanyName", "ContactName", "City", "Country", "Phone"] },
    { table: "Employees", columns: ["EmployeeID", "LastName", "FirstName", "Title", "BirthDate", "HireDate", "Country", "ReportsTo"] },
    { table: "Orders", columns: ["OrderID", "CustomerID", "EmployeeID", "OrderDate", "ShippedDate", "ShipVia", "Freight", "ShipCountry"] },
    { table: "Order Details", columns: ["OrderID", "ProductID", "UnitPrice", "Quantity", "Discount"] },
    { table: "Products", columns: ["ProductID", "ProductName", "SupplierID", "CategoryID", "UnitPrice", "UnitsInStock", "Discontinued"] },
    { table: "Suppliers", columns: ["SupplierID", "CompanyName", "ContactName", "Country"] },
    { table: "Shippers", columns: ["ShipperID", "CompanyName", "Phone"] },
    { table: "Territories", columns: ["TerritoryID", "TerritoryDescription", "RegionID"] },
    { table: "Regions", columns: ["RegionID", "RegionDescription"] },
  ],
}

function diffClasses(d: string) {
  if (d === "easy") return "text-success bg-success/10"
  if (d === "medium") return "text-accent bg-accent/15"
  return "text-destructive bg-destructive/10"
}

type Tab = "description" | "tables" | "hints" | "solution"

export default function CodingSolvePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const studentId = user?.student_id ?? undefined
  const slug = String(params.slug || "")

  const [question, setQuestion] = useState<CodingQuestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>("description")
  const [solved, setSolved] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    getCodingQuestion(slug, studentId)
      .then((q) => { setQuestion(q); setSolved(!!q.solved) })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false))
  }, [slug, studentId])

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  }
  if (error || !question) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-sm font-medium text-destructive">{error || "Question not found"}</p>
        <Link href="/student/coding" className="text-sm text-primary hover:underline">Back to Coding Practice</Link>
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "description", label: "Description" },
    { key: "tables", label: "Tables" },
    { key: "hints", label: "Hints" },
    { key: "solution", label: "Solution" },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/student/coding")} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className={`rounded-md px-2 py-0.5 text-xs font-bold capitalize ${diffClasses(question.difficulty)}`}>{question.difficulty}</span>
        <h1 className="truncate text-base font-bold tracking-tight text-foreground">{question.title}</h1>
        {solved && <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success"><Check className="h-3 w-3" /> Solved</span>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Description */}
        <div className="flex h-[72vh] flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex gap-1 border-b border-border px-3 pt-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative rounded-t-md px-3 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tab === t.key ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t.label}
                {tab === t.key && <span className="absolute inset-x-2.5 -bottom-px h-0.5 rounded bg-primary" />}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto p-5">
            {tab === "description" && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{question.engine.toUpperCase()} · {question.dataset}</span>
                  {question.topic_tags.map((t) => <span key={t} className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{t}</span>)}
                  {question.company_tags.length > 0 && <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">Asked at {question.company_tags.join(" · ")}</span>}
                </div>
                <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-li:text-muted-foreground prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-primary prose-code:text-[13px] prose-code:before:content-[''] prose-code:after:content-['']">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{question.prompt_md}</ReactMarkdown>
                </div>
                {question.expected_columns.length > 0 && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">Expected output columns{question.ordering_matters ? " · order matters" : ""}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {question.expected_columns.map((c) => <span key={c} className="rounded-md border border-border bg-card px-2 py-0.5 font-mono text-xs">{c}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "tables" && (
              <div className="flex flex-col gap-2.5">
                {(SCHEMAS[question.dataset] || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Schema reference isn&rsquo;t available for this question&rsquo;s dataset.</p>
                ) : null}
                <p className="flex items-center gap-2 text-sm text-muted-foreground"><Table2 className="h-4 w-4 text-primary" /> Dataset <b className="text-foreground">{question.dataset}</b> · {(SCHEMAS[question.dataset] || []).length} tables.</p>
                {(SCHEMAS[question.dataset] || []).map((t) => (
                  <div key={t.table} className="overflow-hidden rounded-lg border border-border">
                    <div className="bg-muted/40 px-3 py-2 text-sm font-bold text-foreground">{t.table}</div>
                    <div className="flex flex-wrap gap-1.5 px-3 py-2">
                      {t.columns.map((c, i) => <span key={c} className={`font-mono text-[11.5px] ${i === 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{c}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "hints" && (
              <div className="flex flex-col gap-2">
                <p className="mb-1 text-sm text-muted-foreground">Reveal hints if you&rsquo;re stuck.</p>
                {question.hints.map((h, i) => (
                  <details key={i} className="rounded-lg border border-border">
                    <summary className="flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden"><Lightbulb className="h-4 w-4 text-accent" /> Hint {i + 1}</summary>
                    <p className="border-t border-border px-4 py-3 text-sm leading-relaxed text-muted-foreground">{h}</p>
                  </details>
                ))}
                {question.hints.length === 0 && <p className="text-sm text-muted-foreground">No hints for this one — you&rsquo;ve got it.</p>}
              </div>
            )}

            {tab === "solution" && (
              solved ? (
                <div className="prose prose-sm max-w-none prose-p:text-muted-foreground prose-strong:text-foreground">
                  <p className="flex items-center gap-2 text-sm font-semibold text-success"><ListChecks className="h-4 w-4" /> Reference explanation</p>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{question.explanation_md}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
                  <Lock className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-foreground">Solution locked</p>
                  <p className="max-w-xs text-xs text-muted-foreground">Solve the question to unlock the reference explanation.</p>
                </div>
              )
            )}
          </div>
        </div>

        {/* Editor (SQL is live; other tracks/datasets are browsable now, solvable soon) */}
        <div className="h-[72vh] overflow-hidden rounded-xl border border-border">
          {question.solvable ? (
            <CodeRunner question={question} studentId={studentId} onSolved={() => setSolved(true)} />
          ) : (
            <div className="flex h-full flex-col bg-sidebar">
              <div className="flex items-center gap-2 border-b border-sidebar-border px-3 py-2">
                <span className="rounded-md border border-sidebar-border bg-sidebar-accent px-2.5 py-1 text-xs font-semibold text-sidebar-foreground">{question.engine.toUpperCase()}{question.dataset ? ` · ${question.dataset}` : ""}</span>
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent"><Clock3 className="h-3.5 w-3.5" /> Runner coming soon</span>
              </div>
              <pre className="flex-1 overflow-auto whitespace-pre-wrap px-4 py-3 font-mono text-[13px] leading-6 text-[hsl(210_30%_82%)]">{question.starter_code || "// Starter code"}</pre>
              <div className="border-t border-sidebar-border px-4 py-3 text-xs text-sidebar-foreground/70">
                Live today: <b className="text-white">SQL · Chinook</b>. This question&rsquo;s runner ({question.engine}{question.dataset ? ` · ${question.dataset}` : ""}) is being finalized — read the prompt, tables, and hints now; solving arrives in the next phase.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
