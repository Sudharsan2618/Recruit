"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { companyCandidates } from "@/lib/mock-data"
import { GripVertical, User, ChevronRight } from "lucide-react"

const stages = [
  { id: "new", label: "New Candidates", color: "bg-primary/10 text-primary" },
  { id: "reviewing", label: "Under Review", color: "bg-accent/10 text-accent" },
  { id: "interviewing", label: "Interviewing", color: "bg-warning/10 text-warning" },
  { id: "offer", label: "Offer Extended", color: "bg-success/10 text-success" },
]

export default function CandidatePipeline() {
  const [candidates, setCandidates] = useState(companyCandidates)

  function moveCandidateForward(id: number) {
    setCandidates(prev => prev.map(c => {
      if (c.id !== id) return c
      const currentIdx = stages.findIndex(s => s.id === c.stage)
      if (currentIdx < stages.length - 1) {
        return { ...c, stage: stages[currentIdx + 1].id }
      }
      return c
    }))
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Candidate Pipeline</h1>
        <p className="text-muted-foreground">Manage candidates forwarded by the admin team.</p>
      </div>

      {/* Kanban Board */}
      <div className="grid gap-4 lg:grid-cols-4">
        {stages.map((stage) => {
          const stageCandidates = candidates.filter(c => c.stage === stage.id)
          return (
            <div key={stage.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                <span className="text-sm font-semibold text-foreground">{stage.label}</span>
                <Badge variant="secondary" className="text-xs">{stageCandidates.length}</Badge>
              </div>
              <div className="flex flex-col gap-3">
                {stageCandidates.map((c) => (
                  <Card key={c.id} className="transition-shadow hover:shadow-md">
                    <CardContent className="flex flex-col gap-3 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {c.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{c.job}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {c.skills.slice(0, 3).map(s => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge className={stage.color}>Score: {c.score}</Badge>
                        {stage.id !== "offer" && (
                          <Button size="sm" variant="ghost" className="gap-1 text-xs" onClick={() => moveCandidateForward(c.id)}>
                            Move <ChevronRight className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Applied {c.appliedDate}</p>
                    </CardContent>
                  </Card>
                ))}
                {stageCandidates.length === 0 && (
                  <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-8">
                    <p className="text-xs text-muted-foreground">No candidates</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
