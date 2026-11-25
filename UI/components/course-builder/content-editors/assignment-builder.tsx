"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { getBuilderAssignment, type AssignmentBuilderData, type AssignmentQuestionData } from "@/lib/api/admin-courses"

interface AssignmentBuilderProps {
  lessonId: number | null
  onChange: (data: Partial<AssignmentBuilderData>) => void
  assignmentData: Partial<AssignmentBuilderData>
}

const LANGUAGES = [
  { value: "python", label: "Python" },
]

function emptyQuestion(language: string): AssignmentQuestionData {
  return {
    title: "",
    problem_statement: "",
    starter_code: "",
    expected_output: "",
    solution_code: "",
    solution_explanation: "",
    language,
    points: 10,
    order_index: 0,
  }
}

export function AssignmentBuilder({ lessonId, onChange, assignmentData }: AssignmentBuilderProps) {
  const [title, setTitle] = useState(assignmentData.title || "")
  const [instructions, setInstructions] = useState(assignmentData.instructions || "")
  const [language, setLanguage] = useState(assignmentData.language || "python")
  const [questions, setQuestions] = useState<AssignmentQuestionData[]>(
    assignmentData.questions?.length ? assignmentData.questions : [emptyQuestion("python")],
  )

  // Load existing assignment if editing
  useEffect(() => {
    if (lessonId && !assignmentData.questions?.length) {
      getBuilderAssignment(lessonId).then(data => {
        if (data && data.questions?.length) {
          setTitle(data.title)
          setInstructions(data.instructions || "")
          setLanguage(data.language || "python")
          setQuestions(data.questions)
        }
      }).catch(() => {})
    }
  }, [lessonId])

  // Sync upward
  useEffect(() => {
    onChange({
      title: title || "Coding Assignment",
      instructions,
      language,
      questions,
      total_questions: questions.length,
    })
  }, [title, instructions, language, questions])

  function updateQuestion(idx: number, patch: Partial<AssignmentQuestionData>) {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...patch } : q))
  }

  function removeQuestion(idx: number) {
    setQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-4">
      {/* Assignment settings */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Assignment Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Coding Assignment" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Instructions (optional)</Label>
        <Textarea rows={2} value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Overall instructions for the assignment..." />
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {questions.map((q, qIdx) => (
          <Card key={qIdx}>
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Problem {qIdx + 1}</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-muted-foreground">Points</Label>
                    <Input
                      type="number" min={1} className="h-7 w-16 text-xs"
                      value={q.points} onChange={e => updateQuestion(qIdx, { points: Number(e.target.value) })}
                    />
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => removeQuestion(qIdx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Title</Label>
                <Input
                  className="h-8 text-sm"
                  placeholder="e.g. Fix the stack pop operation"
                  value={q.title || ""}
                  onChange={e => updateQuestion(qIdx, { title: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Problem Statement</Label>
                <Textarea
                  rows={2}
                  placeholder="Describe what the student must do..."
                  value={q.problem_statement}
                  onChange={e => updateQuestion(qIdx, { problem_statement: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Starter Code (shown to student)</Label>
                  <Textarea
                    rows={6}
                    placeholder="# starter / buggy code"
                    value={q.starter_code || ""}
                    onChange={e => updateQuestion(qIdx, { starter_code: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Expected Output</Label>
                  <Textarea
                    rows={6}
                    placeholder="exact stdout the solution should print"
                    value={q.expected_output || ""}
                    onChange={e => updateQuestion(qIdx, { expected_output: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Reference Solution (hidden until student reveals)</Label>
                  <Textarea
                    rows={5}
                    placeholder="# correct solution"
                    value={q.solution_code || ""}
                    onChange={e => updateQuestion(qIdx, { solution_code: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Solution Explanation</Label>
                  <Textarea
                    rows={5}
                    placeholder="Why the fix works..."
                    value={q.solution_explanation || ""}
                    onChange={e => updateQuestion(qIdx, { solution_explanation: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" className="gap-1" onClick={() => setQuestions(prev => [...prev, emptyQuestion(language)])}>
        <Plus className="h-4 w-4" /> Add Problem
      </Button>
    </div>
  )
}
