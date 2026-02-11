"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ArrowRight, CheckCircle2, Clock, Eye, GitMerge } from "lucide-react"
import { adminApplications, companyJobs } from "@/lib/mock-data"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const statusColors: Record<string, string> = {
  "Pending Review": "bg-warning/10 text-accent-foreground",
  Forwarded: "bg-success/10 text-success",
  Rejected: "bg-destructive/10 text-destructive",
}

export default function JobMatchingHub() {
  const [selectedApp, setSelectedApp] = useState<(typeof adminApplications)[0] | null>(null)
  const [applications, setApplications] = useState(adminApplications)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredApps = applications.filter((a) => {
    const matchSearch = a.studentName.toLowerCase().includes(search.toLowerCase()) || a.jobTitle.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || a.status === statusFilter
    return matchSearch && matchStatus
  })

  const pendingCount = applications.filter((a) => a.status === "Pending Review").length
  const forwardedCount = applications.filter((a) => a.status === "Forwarded").length

  function forwardApplication(id: number) {
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Forwarded" } : a))
    )
    setSelectedApp(null)
  }

  function getMatchColor(score: number) {
    if (score >= 85) return "bg-success/10 text-success"
    if (score >= 70) return "bg-warning/10 text-accent-foreground"
    return "bg-muted text-muted-foreground"
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Job Matching Hub</h1>
        <p className="text-muted-foreground">Review student applications, match skills with job requirements, and forward qualified candidates.</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{forwardedCount}</p>
              <p className="text-xs text-muted-foreground">Forwarded</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <GitMerge className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{applications.length}</p>
              <p className="text-xs text-muted-foreground">Total Applications</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by student or job title..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending Review">Pending Review</SelectItem>
            <SelectItem value="Forwarded">Forwarded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dual-pane layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Applications list */}
        <div className="flex flex-col gap-3 lg:col-span-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Student Applications</h2>
          <div className="flex flex-col gap-3">
            {filteredApps.map((app) => (
              <Card
                key={app.id}
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => setSelectedApp(app)}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {app.studentName.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{app.studentName}</p>
                            <p className="text-xs text-muted-foreground">Applied {app.appliedDate}</p>
                          </div>
                        </div>
                      </div>
                      <Badge className={statusColors[app.status] || ""}>{app.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Applying for:</span>
                      <span className="font-medium text-foreground">{app.jobTitle}</span>
                      <span className="text-muted-foreground">at</span>
                      <span className="font-medium text-foreground">{app.company}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {app.studentSkills.slice(0, 4).map((s) => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                      <Badge className={getMatchColor(app.matchScore)}>Match: {app.matchScore}%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredApps.length === 0 && (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-12">
                <p className="text-sm text-muted-foreground">No applications match your filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Open positions sidebar */}
        <div className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Open Positions</h2>
          <div className="flex flex-col gap-3">
            {companyJobs.filter((j) => j.status === "Active").map((job) => (
              <Card key={job.id}>
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.location} - {job.type}</p>
                    </div>
                    <Badge className="bg-success/10 text-success text-xs">{job.applications} apps</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {job.skills.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Deadline: {job.deadline}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedApp && (
            <>
              <DialogHeader>
                <DialogTitle>Application Review</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {selectedApp.studentName.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{selectedApp.studentName}</p>
                    <p className="text-sm text-muted-foreground">Applied {selectedApp.appliedDate}</p>
                  </div>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Position</p>
                  <p className="mt-1 font-medium text-foreground">{selectedApp.jobTitle} at {selectedApp.company}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Student Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApp.studentSkills.map((s) => {
                      const isMatch = selectedApp.requiredSkills.includes(s)
                      return (
                        <Badge key={s} className={isMatch ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                          {isMatch && <CheckCircle2 className="mr-1 h-3 w-3" />}
                          {s}
                        </Badge>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Required Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApp.requiredSkills.map((s) => (
                      <Badge key={s} variant="outline">{s}</Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                  <span className="text-sm text-muted-foreground">Match Score</span>
                  <Badge className={`${getMatchColor(selectedApp.matchScore)} text-base px-3 py-1`}>
                    {selectedApp.matchScore}%
                  </Badge>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setSelectedApp(null)}>Close</Button>
                  {selectedApp.status === "Pending Review" && (
                    <Button className="gap-2" onClick={() => forwardApplication(selectedApp.id)}>
                      Forward to Company <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
