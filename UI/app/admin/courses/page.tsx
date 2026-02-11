"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, BookOpen, FileText, Video, Upload, Loader2 } from "lucide-react"
import { getCourses, getCategories, getAllMaterials, mapCourseToUI, mapMaterialToUI, type Category } from "@/lib/api"
import { webinars } from "@/lib/mock-data"

export default function CourseManagement() {
  const [search, setSearch] = useState("")
  const [courseOpen, setCourseOpen] = useState(false)
  const [courses, setCourses] = useState<ReturnType<typeof mapCourseToUI>[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [materials, setMaterials] = useState<ReturnType<typeof mapMaterialToUI>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [courseRes, catRes, matRes] = await Promise.all([
          getCourses({ page_size: 50 }),
          getCategories(),
          getAllMaterials(),
        ])
        setCourses(courseRes.courses.map(mapCourseToUI))
        setCategories(catRes)
        setMaterials(matRes.map(mapMaterialToUI))
      } catch (err) {
        console.error("Failed to fetch data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredCourses = courses.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Course & Content Management</h1>
          <p className="text-muted-foreground">Create courses, upload SCORM content, schedule webinars, and manage materials.</p>
        </div>
        <Dialog open={courseOpen} onOpenChange={setCourseOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 self-start"><Plus className="h-4 w-4" /> New Course</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-4">
              <div className="flex flex-col gap-1.5">
                <Label>Course Title</Label>
                <Input placeholder="e.g. Advanced Python Programming" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Category</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Skill Level</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Instructor</Label>
                  <Input placeholder="Instructor name" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Price (INR)</Label>
                  <Input type="number" placeholder="0 for free" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Description</Label>
                <Textarea rows={3} placeholder="Course description..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>SCORM Package</Label>
                <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border px-4 py-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Drag and drop SCORM .zip file or click to browse</p>
                    <Button variant="outline" size="sm">Browse Files</Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setCourseOpen(false)}>Cancel</Button>
                <Button onClick={() => setCourseOpen(false)}>Create Course</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Courses</TabsTrigger>
          <TabsTrigger value="webinars" className="gap-1.5"><Video className="h-3.5 w-3.5" /> Webinars</TabsTrigger>
          <TabsTrigger value="materials" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Materials</TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="mt-4 flex flex-col gap-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search courses..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading courses...</span>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead className="hidden md:table-cell">Students</TableHead>
                      <TableHead className="hidden md:table-cell">Rating</TableHead>
                      <TableHead className="hidden lg:table-cell">Price</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{course.title}</p>
                            <p className="text-xs text-muted-foreground">{course.instructor} - {course.duration}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{course.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-secondary text-secondary-foreground">{course.level}</Badge>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{course.students.toLocaleString()}</TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{course.rating > 0 ? course.rating.toFixed(1) : "—"}</TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                          {course.isFree ? <Badge className="bg-success/10 text-success">Free</Badge> : `₹${course.price.toLocaleString()}`}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline">Edit</Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">Remove</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Webinars Tab - still uses mock data (no backend endpoint yet) */}
        <TabsContent value="webinars" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {webinars.map((w) => (
              <Card key={w.id}>
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{w.title}</h3>
                      <p className="text-sm text-muted-foreground">{w.instructor}</p>
                    </div>
                    <Badge className={w.status === "upcoming" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>
                      {w.status === "upcoming" ? "Upcoming" : "Completed"}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{w.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{w.date} at {w.time}</span>
                    <span>{w.attendees} attendees</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Edit</Button>
                    {w.status === "upcoming" && <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">Cancel</Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading materials...</span>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead className="hidden md:table-cell">Size</TableHead>
                      <TableHead className="hidden md:table-cell">Downloads</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium text-foreground">{m.title}</TableCell>
                        <TableCell><Badge variant="outline">{m.type}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.course}</TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{m.size}</TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{m.downloads.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline">Replace</Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">Remove</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
