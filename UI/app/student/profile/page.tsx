"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  User, Mail, MapPin, GraduationCap, Award, FileText, Clock,
  Upload, Loader2, CheckCircle2, Briefcase, Languages, ShieldCheck,
  Sparkles, AlertCircle
} from "lucide-react"
import { studentProfile, studentApplications } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import { uploadResume, getResumeAnalysis, type ResumeAnalysis } from "@/lib/api"

const statusColors: Record<string, string> = {
  "Submitted to Admin": "bg-muted text-muted-foreground",
  "Forwarded to Company": "bg-primary/10 text-primary",
  "Interview Scheduled": "bg-success/10 text-success",
}

export default function ProfilePage() {
  const p = studentProfile
  const { user } = useAuth()

  // Resume upload state
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing analysis on mount
  useEffect(() => {
    if (!user?.student_id) return
    setLoadingAnalysis(true)
    getResumeAnalysis(user.student_id)
      .then((data) => { if (data) setAnalysis(data) })
      .catch(() => {})
      .finally(() => setLoadingAnalysis(false))
  }, [user?.student_id])

  const handleFileSelect = useCallback((file: File) => {
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are accepted")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File must be under 5 MB")
      return
    }
    setResumeFile(file)
    setUploadError(null)
  }, [])

  const handleUpload = async () => {
    if (!resumeFile || !user?.student_id) return
    setUploading(true)
    setUploadError(null)
    try {
      const result = await uploadResume(user.student_id, resumeFile)
      setAnalysis(result.analysis)
      setResumeFile(null)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground">Manage your profile, resume, and track applications.</p>
      </div>

      <Tabs defaultValue="profile" className="flex flex-col gap-4">
        <TabsList className="self-start">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="resume">Resume & AI Analysis</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label>Full Name</Label>
                    <Input defaultValue={p.name} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Email</Label>
                    <Input defaultValue={p.email} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Location</Label>
                    <Input defaultValue={p.location} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Education</Label>
                    <Input defaultValue={p.education} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Bio</Label>
                  <Textarea defaultValue={p.bio} rows={3} />
                </div>
                <Button className="self-start">Save Changes</Button>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Skills</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {p.skills.map(s => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                  <Button variant="outline" size="sm" className="text-xs bg-transparent">+ Add Skill</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Badges Earned</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {p.badges.map(b => (
                    <div key={b.name} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10">
                        <Award className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{b.name}</p>
                        <p className="text-xs text-muted-foreground">Earned {b.earned}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Portfolio</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {p.portfolio.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="self-start bg-transparent">
                    + Add Project
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Resume & AI Analysis Tab */}
        <TabsContent value="resume">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Upload Resume
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {/* Drag & Drop Zone */}
                <div
                  className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer
                    ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelect(file)
                    }}
                  />
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">
                    {resumeFile ? resumeFile.name : "Drop your PDF resume here"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {resumeFile
                      ? `${(resumeFile.size / 1024).toFixed(0)} KB — Ready to upload`
                      : "PDF only, max 5 MB"}
                  </p>
                </div>

                {uploadError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {uploadError}
                  </div>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={!resumeFile || uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Upload & Analyze
                    </>
                  )}
                </Button>

                {analysis && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Last analyzed: {new Date(analysis.analyzed_at).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Resume Preview/Download */}
            {analysis && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Current Resume
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-primary/10 p-2">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {analysis.file_url.split("/").pop()?.split("_").slice(2).join("_") || "Resume.pdf"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last updated: {new Date(analysis.analyzed_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={analysis.file_url} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </Button>
                      <Button size="sm" asChild>
                        <a href={analysis.file_url} download>
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Updating your resume will replace the current file and trigger a new AI analysis.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {/* Analysis Results Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> AI Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAnalysis ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">Loading analysis...</p>
                  </div>
                ) : analysis ? (
                  <div className="flex flex-col gap-5">
                    {/* Summary */}
                    {analysis.extracted_data.summary && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1.5">
                          <User className="h-3.5 w-3.5" /> Summary
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {analysis.extracted_data.summary}
                        </p>
                      </div>
                    )}

                    {/* Skills */}
                    {analysis.extracted_data.skills.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1.5">
                          <ShieldCheck className="h-3.5 w-3.5" /> Skills
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.extracted_data.skills.map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1.5">
                        <Briefcase className="h-3.5 w-3.5" /> Experience
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {analysis.extracted_data.experience_years} years
                      </p>
                    </div>

                    {/* Job Titles */}
                    {analysis.extracted_data.job_titles.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1.5">
                          <Briefcase className="h-3.5 w-3.5" /> Previous Roles
                        </h4>
                        <ul className="flex flex-col gap-1">
                          {analysis.extracted_data.job_titles.map((t) => (
                            <li key={t} className="text-sm text-muted-foreground flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />{t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Education */}
                    {analysis.extracted_data.education.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1.5">
                          <GraduationCap className="h-3.5 w-3.5" /> Education
                        </h4>
                        <ul className="flex flex-col gap-1">
                          {analysis.extracted_data.education.map((e) => (
                            <li key={e} className="text-sm text-muted-foreground flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />{e}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Certifications */}
                    {analysis.extracted_data.certifications.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1.5">
                          <Award className="h-3.5 w-3.5" /> Certifications
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.extracted_data.certifications.map((c) => (
                            <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Languages */}
                    {analysis.extracted_data.languages.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1.5">
                          <Languages className="h-3.5 w-3.5" /> Languages
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.extracted_data.languages.map((l) => (
                            <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Match Ready Badge */}
                    {analysis.match_score_ready && (
                      <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        <p className="text-sm text-green-700">
                          Embedding generated — ready for job matching
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium text-foreground">No analysis yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload your resume to get AI-powered insights and enable job matching
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">My Applications</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {studentApplications.map((app) => (
                <div key={app.id} className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{app.jobTitle}</h3>
                    <p className="text-sm text-muted-foreground">{app.company}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />Applied on {app.appliedDate}
                    </p>
                  </div>
                  <Badge className={statusColors[app.status] || ""}>{app.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
