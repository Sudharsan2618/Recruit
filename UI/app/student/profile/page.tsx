"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { User, Mail, MapPin, GraduationCap, Award, FileText, Clock } from "lucide-react"
import { studentProfile, studentApplications } from "@/lib/mock-data"

const statusColors: Record<string, string> = {
  "Submitted to Admin": "bg-muted text-muted-foreground",
  "Forwarded to Company": "bg-primary/10 text-primary",
  "Interview Scheduled": "bg-success/10 text-success",
}

export default function ProfilePage() {
  const p = studentProfile

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground">Manage your profile, resume, and track applications.</p>
      </div>

      <Tabs defaultValue="profile" className="flex flex-col gap-4">
        <TabsList className="self-start">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="resume">Resume Builder</TabsTrigger>
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

        {/* Resume Builder Tab */}
        <TabsContent value="resume">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Auto-Generated Resume</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="rounded-lg border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{p.name}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{p.email}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.location}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Education</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.education}</p>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2"><Award className="h-4 w-4" /> Completed Courses</h3>
                  <ul className="mt-1 flex flex-col gap-1">
                    {p.completedCourses.map(c => (
                      <li key={c} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />{c}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground">Skills</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.skills.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button>Download PDF</Button>
                <Button variant="outline">Edit Resume</Button>
              </div>
            </CardContent>
          </Card>
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
