"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, UserPlus, Trash2, CalendarClock, Check, X, Pencil } from "lucide-react"
import {
  getCourseAccess, grantCourseAccess, updateCourseAccess, revokeCourseAccess,
  type CourseAccessRow,
} from "@/lib/api/admin-courses"
import { getAdminUsers, type AdminUser } from "@/lib/api"

interface CourseAccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: number
  courseTitle: string
  onChanged?: () => void
}

// Date (yyyy-mm-dd) <-> stored ISO (naive UTC). Start = 00:00, End = 23:59:59.
const toStartIso = (d: string) => (d ? `${d}T00:00:00` : null)
const toEndIso = (d: string) => (d ? `${d}T23:59:59` : null)
const isoToDate = (iso: string | null) => (iso ? iso.slice(0, 10) : "")

function windowState(row: CourseAccessRow): { label: string; cls: string } {
  const now = Date.now()
  const start = row.access_starts_at ? Date.parse(row.access_starts_at + "Z") : null
  const end = row.expires_at ? Date.parse(row.expires_at + "Z") : null
  if (start && now < start) return { label: "Scheduled", cls: "bg-amber-500/10 text-amber-600" }
  if (end && now > end) return { label: "Expired", cls: "bg-destructive/10 text-destructive" }
  return { label: "Active", cls: "bg-success/10 text-success" }
}

export function CourseAccessDialog({ open, onOpenChange, courseId, courseTitle, onChanged }: CourseAccessDialogProps) {
  const [roster, setRoster] = useState<CourseAccessRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Grant form
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<AdminUser[]>([])
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [granting, setGranting] = useState(false)

  // Inline edit
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editStart, setEditStart] = useState("")
  const [editEnd, setEditEnd] = useState("")
  const [savingId, setSavingId] = useState<number | null>(null)

  const loadRoster = useCallback(() => {
    setLoading(true)
    getCourseAccess(courseId)
      .then((res) => setRoster(res.access))
      .catch(() => setError("Failed to load access list"))
      .finally(() => setLoading(false))
  }, [courseId])

  useEffect(() => { if (open) { loadRoster(); setError(null) } }, [open, loadRoster])

  // Debounced student search (active students only)
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      getAdminUsers({ role: "student", status: "active", search: query, limit: 8 })
        .then((res) => setResults(res.users))
        .catch(() => setResults([]))
    }, 300)
    return () => clearTimeout(t)
  }, [query, open])

  const grantedUserIds = new Set(roster.map((r) => r.user_id))

  async function handleGrant() {
    if (!selected) return
    if (startDate && endDate && endDate < startDate) {
      setError("End date must be after the start date")
      return
    }
    setError(null)
    setGranting(true)
    try {
      await grantCourseAccess(courseId, {
        user_id: selected.user_id,
        access_starts_at: toStartIso(startDate),
        expires_at: toEndIso(endDate),
      })
      setSelected(null); setQuery(""); setStartDate(""); setEndDate("")
      loadRoster(); onChanged?.()
    } catch (e: any) {
      setError(e.message || "Failed to grant access")
    } finally {
      setGranting(false)
    }
  }

  function startEdit(row: CourseAccessRow) {
    setEditingId(row.enrollment_id)
    setEditStart(isoToDate(row.access_starts_at))
    setEditEnd(isoToDate(row.expires_at))
  }

  async function saveEdit(enrollmentId: number) {
    if (editStart && editEnd && editEnd < editStart) {
      setError("End date must be after the start date")
      return
    }
    setSavingId(enrollmentId)
    try {
      await updateCourseAccess(courseId, enrollmentId, {
        access_starts_at: toStartIso(editStart),
        expires_at: toEndIso(editEnd),
      })
      setEditingId(null)
      loadRoster(); onChanged?.()
    } catch (e: any) {
      setError(e.message || "Failed to update access")
    } finally {
      setSavingId(null)
    }
  }

  async function handleRevoke(row: CourseAccessRow) {
    if (!confirm(`Revoke access for ${row.name}? Their progress will be removed.`)) return
    setSavingId(row.enrollment_id)
    try {
      await revokeCourseAccess(courseId, row.enrollment_id)
      loadRoster(); onChanged?.()
    } catch (e: any) {
      setError(e.message || "Failed to revoke access")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Access — {courseTitle}</DialogTitle>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Grant new access */}
        <div className="rounded-lg border border-border p-3 space-y-3">
          <p className="text-sm font-medium flex items-center gap-1.5"><UserPlus className="h-4 w-4" /> Grant access</p>
          <div className="space-y-1.5">
            <Label className="text-xs">Student</Label>
            {selected ? (
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
                <span className="text-sm">{selected.name} <span className="text-muted-foreground">· {selected.email}</span></span>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setSelected(null)}><X className="h-3.5 w-3.5" /></Button>
              </div>
            ) : (
              <>
                <Input placeholder="Search active students by name or email…" value={query} onChange={(e) => setQuery(e.target.value)} />
                {results.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-md border border-border divide-y divide-border">
                    {results.map((u) => {
                      const already = grantedUserIds.has(u.user_id)
                      return (
                        <button
                          key={u.user_id}
                          type="button"
                          disabled={already}
                          onClick={() => setSelected(u)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {u.name || "—"} <span className="text-muted-foreground">· {u.email}</span>
                          {already && <span className="ml-2 text-xs text-muted-foreground">(already has access)</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Start date (optional)</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End date (optional)</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Leave dates empty for immediate, open-ended access.</p>
          <Button size="sm" onClick={handleGrant} disabled={!selected || granting} className="gap-1.5">
            {granting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
            Grant Access
          </Button>
        </div>

        {/* Roster */}
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-1.5"><CalendarClock className="h-4 w-4" /> Who has access ({roster.length})</p>
          {loading ? (
            <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : roster.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No students have access yet.</p>
          ) : (
            <div className="rounded-lg border border-border divide-y divide-border max-h-72 overflow-y-auto">
              {roster.map((row) => {
                const st = windowState(row)
                const editing = editingId === row.enrollment_id
                return (
                  <div key={row.enrollment_id} className="p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{row.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{row.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge className={st.cls}>{st.label}</Badge>
                        <span className="text-xs text-muted-foreground">{Math.round(row.progress_percentage)}%</span>
                      </div>
                    </div>
                    {editing ? (
                      <div className="mt-2 flex flex-wrap items-end gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Start</Label>
                          <Input type="date" className="h-8 w-36 text-xs" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">End</Label>
                          <Input type="date" className="h-8 w-36 text-xs" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
                        </div>
                        <Button size="sm" className="h-8 gap-1" onClick={() => saveEdit(row.enrollment_id)} disabled={savingId === row.enrollment_id}>
                          {savingId === row.enrollment_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          {row.access_starts_at ? `From ${isoToDate(row.access_starts_at)}` : "From now"}
                          {" · "}
                          {row.expires_at ? `until ${isoToDate(row.expires_at)}` : "no end date"}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => startEdit(row)}>
                            <Pencil className="h-3 w-3" /> Edit dates
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleRevoke(row)} disabled={savingId === row.enrollment_id}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
