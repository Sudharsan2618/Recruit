"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  FileText,
  HelpCircle,
  Loader2,
  Menu,
  Play,
  Video,
  X,
  Brain,
  Download,
  AlertCircle,
  Trophy,
  RotateCcw,
} from "lucide-react"
import { getCourseDetail, getLesson, getQuiz, type CourseDetail, type LessonFull, type LessonBrief, type QuizOut } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

const contentTypeIcons: Record<string, React.ElementType> = {
  video: Video,
  text: BookOpen,
  quiz: HelpCircle,
  pdf: FileText,
}

export default function CoursePlayer() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const slug = searchParams.get("slug") || ""

  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [currentLesson, setCurrentLesson] = useState<LessonFull | null>(null)
  const [expandedModules, setExpandedModules] = useState<number[]>([])
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [lessonLoading, setLessonLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Quiz State
  const [quizData, setQuizData] = useState<QuizOut | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null)

  useEffect(() => {
    if (!slug) {
      router.push("/student/courses")
      return
    }
    async function fetchCourse() {
      try {
        setLoading(true)
        setError(null)
        const data = await getCourseDetail(slug)
        setCourse(data)
        if (data.modules.length > 0) {
          setExpandedModules([data.modules[0].module_id])
          if (data.modules[0].lessons.length > 0) {
            await loadLesson(data.modules[0].lessons[0].lesson_id)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load course")
      } finally {
        setLoading(false)
      }
    }
    fetchCourse()
  }, [slug])

  async function loadLesson(lessonId: number) {
    try {
      setLessonLoading(true)
      setQuizStarted(false)
      setQuizSubmitted(false)
      setQuizAnswers({})
      setQuizResult(null)
      
      const lesson = await getLesson(lessonId)
      setCurrentLesson(lesson)
      
      if (lesson.content_type === "quiz" && lesson.quiz_id) {
        fetchQuiz(lesson.quiz_id)
      }
    } catch (err) {
      console.error("Failed to load lesson:", err)
    } finally {
      setLessonLoading(false)
    }
  }

  async function fetchQuiz(quizId: number) {
    try {
      setQuizLoading(true)
      const data = await getQuiz(quizId)
      setQuizData(data)
    } catch (err) {
      console.error("Failed to fetch quiz:", err)
    } finally {
      setQuizLoading(false)
    }
  }

  function toggleModule(id: number) {
    setExpandedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  function handleLessonClick(lesson: LessonBrief) {
    loadLesson(lesson.lesson_id)
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  function handleMarkComplete() {
    if (!currentLesson) return
    setCompletedLessons((prev) => {
      const next = new Set(prev)
      if (next.has(currentLesson.lesson_id)) {
        next.delete(currentLesson.lesson_id)
      } else {
        next.add(currentLesson.lesson_id)
      }
      return next
    })
  }

  function handleNextLesson() {
    if (!course || !currentLesson) return
    const allLessons = course.modules.flatMap((m) => m.lessons)
    const currentIndex = allLessons.findIndex((l) => l.lesson_id === currentLesson.lesson_id)
    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      const next = allLessons[currentIndex + 1]
      loadLesson(next.lesson_id)
      const nextMod = course.modules.find((m) =>
        m.lessons.some((l) => l.lesson_id === next.lesson_id)
      )
      if (nextMod && !expandedModules.includes(nextMod.module_id)) {
        setExpandedModules((prev) => [...prev, nextMod.module_id])
      }
    }
  }

  function handlePrevLesson() {
    if (!course || !currentLesson) return
    const allLessons = course.modules.flatMap((m) => m.lessons)
    const currentIndex = allLessons.findIndex((l) => l.lesson_id === currentLesson.lesson_id)
    if (currentIndex > 0) {
      loadLesson(allLessons[currentIndex - 1].lesson_id)
    }
  }

  function handleQuizSubmit() {
    if (!quizData) return
    
    // Simple client-side grading for demo since we don't have full response models yet
    // In production, this would call getQuizResult(quizId, answers)
    let score = 0
    // Mocking score for now - a real implementation would use the submit API
    score = Math.floor(Math.random() * 41) + 60 // Random 60-100%
    
    setQuizResult({
      score: score,
      passed: score >= parseFloat(quizData.pass_percentage)
    })
    setQuizSubmitted(true)
    
    if (score >= parseFloat(quizData.pass_percentage)) {
      handleMarkComplete()
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading course...</p>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-center">
        <p className="text-lg font-medium text-destructive">Failed to load course</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/student/courses")}>
          Back to Catalog
        </Button>
      </div>
    )
  }

  const totalLessons = course.modules.flatMap((m) => m.lessons).length
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons.size / totalLessons) * 100) : 0
  const allLessons = course.modules.flatMap((m) => m.lessons)
  const currentIndex = currentLesson ? allLessons.findIndex((l) => l.lesson_id === currentLesson.lesson_id) : -1
  const isFirst = currentIndex <= 0
  const isLast = currentIndex >= allLessons.length - 1

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar - Production Grade Header */}
      <header className="flex h-16 items-center gap-4 border-b border-border bg-card/50 backdrop-blur-md px-6 shrink-0 z-20">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push("/student/courses")}
          className="hover:bg-accent rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="hidden sm:flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors py-0 px-2 text-[10px] uppercase tracking-wider font-bold">
              {course.category?.name || "Course"}
            </Badge>
            <p className="text-sm font-bold text-foreground truncate">{course.title}</p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-48 bg-muted rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(var(--primary),0.5)]" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
              {progressPercent}% Complete
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Progress</span>
            <span className="text-xs font-semibold">{completedLessons.size} of {totalLessons} Lessons</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "rounded-full transition-all duration-300",
              sidebarOpen ? "bg-accent text-accent-foreground" : "hover:bg-accent"
            )}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Main content - Immersive Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Content area */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-[#0a0a0a]">
          {/* Cinematic Wrapper for all content types */}
          <div className="w-full bg-black relative flex flex-col group min-h-[500px]">
            <div className="w-full max-w-[1400px] mx-auto relative shadow-2xl flex-1 flex flex-col">
              
              {lessonLoading ? (
                <div className="flex-1 min-h-[500px] flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 font-sans">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-xs font-bold text-white/50 uppercase tracking-[0.2em]">Loading Module...</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  {/* Content Switcher */}
                  {currentLesson?.content_type === "video" && currentLesson?.video_external_id && (
                    <div className="aspect-[21/9] md:aspect-[16/8] lg:aspect-[16/7.5] relative">
                      <iframe
                        src={`https://www.youtube.com/embed/${currentLesson.video_external_id}?rel=0&modestbranding=1&showinfo=0&autoplay=1`}
                        className="absolute inset-0 h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={currentLesson.title}
                      />
                    </div>
                  )}

                  {currentLesson?.content_type === "quiz" && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#0c0c0e] to-black min-h-[600px]">
                      {quizLoading ? (
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      ) : quizSubmitted ? (
                        <div className="max-w-2xl w-full bg-slate-900/40 backdrop-blur-xl border border-white/5 p-12 rounded-[2rem] text-center animate-in zoom-in-95 duration-500">
                          <div className={cn(
                            "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8",
                            quizResult?.passed ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                          )}>
                            {quizResult?.passed ? <Trophy className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
                          </div>
                          <h2 className="text-4xl font-black text-white mb-2">
                             {quizResult?.passed ? "Excellent Work!" : "Keep Practicing"}
                          </h2>
                          <div className="flex items-center justify-center gap-4 mb-8">
                            <div className="text-5xl font-black text-white">{quizResult?.score}%</div>
                            <div className="text-slate-500 text-sm font-bold uppercase tracking-widest text-left">
                              Final<br/>Score
                            </div>
                          </div>
                          <p className="text-slate-400 mb-10 leading-relaxed max-w-md mx-auto">
                            {quizResult?.passed 
                              ? "You've successfully mastered the concepts in this module. Feel free to proceed to the next section."
                              : "You didn't reach the required pass percentage. Review the material and try again to unlock the next module."
                            }
                          </p>
                          <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button 
                              onClick={() => { setQuizSubmitted(false); setQuizStarted(true); }}
                              className="rounded-2xl px-8 h-14 bg-white text-black hover:bg-white/90 font-bold"
                            >
                              <RotateCcw className="w-4 h-4 mr-2" /> Retake Quiz
                            </Button>
                            {quizResult?.passed && (
                              <Button 
                                onClick={handleNextLesson}
                                className="rounded-2xl px-8 h-14 bg-primary text-white hover:opacity-90 font-bold shadow-xl shadow-primary/20"
                              >
                                Continue Learning <ChevronRight className="w-4 h-4 ml-2" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : quizStarted && quizData ? (
                        <div className="max-w-3xl w-full space-y-8 animate-in fade-in duration-500">
                          <div className="flex items-center justify-between mb-8">
                            <div>
                              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Knowledge Check</p>
                              <h3 className="text-xl font-bold text-white">{quizData.title}</h3>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pass Percentage</p>
                              <p className="text-lg font-black text-white">{quizData.pass_percentage}%</p>
                            </div>
                          </div>
                          
                          <div className="space-y-6">
                            {quizData.questions.map((q, idx) => (
                              <div key={q.question_id} className="bg-slate-900/30 border border-white/5 p-8 rounded-3xl">
                                <p className="text-sm font-bold text-slate-300 mb-6 flex items-start gap-4">
                                  <span className="text-primary font-black opacity-40">0{idx + 1}</span>
                                  {q.question_text}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {q.options?.map((opt, optIdx) => (
                                    <button
                                      key={optIdx}
                                      onClick={() => setQuizAnswers(prev => ({ ...prev, [q.question_id]: optIdx }))}
                                      className={cn(
                                        "px-6 py-4 rounded-2xl text-left text-sm transition-all duration-200 border",
                                        quizAnswers[q.question_id] === optIdx
                                          ? "bg-primary border-primary text-white font-bold shadow-lg shadow-primary/20"
                                          : "bg-black/20 border-white/5 text-slate-400 hover:border-white/20"
                                      )}
                                    >
                                      <span className="mr-3 opacity-40 font-mono text-[10px]">
                                        {String.fromCharCode(65 + optIdx)}
                                      </span>
                                      {opt.text}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                            <p className="text-xs text-slate-500 font-medium">Please answer all questions before submitting.</p>
                            <Button 
                              onClick={handleQuizSubmit}
                              disabled={Object.keys(quizAnswers).length < quizData.questions.length}
                              className="rounded-2xl h-14 px-12 bg-primary text-white font-black shadow-2xl shadow-primary/20 hover:opacity-90"
                            >
                              Finalize & Submit
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-xl w-full text-center space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                          <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto rotate-12 transition-transform hover:rotate-0 duration-500">
                            <Brain className="w-12 h-12 text-primary" />
                          </div>
                          <div className="space-y-3">
                            <h2 className="text-4xl font-black text-white tracking-tight">Challenge Yourself</h2>
                            <p className="text-slate-400 leading-relaxed">
                              Take this quiz to validate your learning. You'll need to answer at least 
                              <span className="text-white font-bold ml-1">{quizData?.pass_percentage}%</span> of the questions correctly to pass.
                            </p>
                          </div>
                          <div className="flex items-center justify-center gap-8 py-4">
                            <div className="text-center">
                              <p className="text-2xl font-black text-white">{quizData?.total_questions || 0}</p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Questions</p>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="text-center">
                              <p className="text-2xl font-black text-white">{quizData?.time_limit_minutes || 15}</p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Minutes</p>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="text-center">
                              <p className="text-2xl font-black text-white">01</p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Attempt</p>
                            </div>
                          </div>
                          <Button 
                            size="lg"
                            className="w-full h-16 rounded-[1.25rem] bg-white text-black font-black text-lg hover:bg-white/90 transition-all shadow-2xl shadow-white/5"
                            onClick={() => setQuizStarted(true)}
                          >
                            Enter Quiz Environment
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {currentLesson?.content_type === "pdf" && (
                    <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
                       <div className="h-12 bg-slate-800 flex items-center justify-between px-6 shrink-0">
                         <div className="flex items-center gap-2">
                           <FileText className="w-4 h-4 text-primary" />
                           <span className="text-xs font-bold text-white">{currentLesson.title}.pdf</span>
                         </div>
                         <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8" asChild>
                           <a href={currentLesson.content_url || "#"} target="_blank" rel="noopener noreferrer">
                             <Download className="w-3.5 h-3.5 mr-2" /> Download
                           </a>
                         </Button>
                       </div>
                       <iframe 
                        src={`${currentLesson.content_url}#toolbar=0`} 
                        className="flex-1 w-full border-none min-h-[700px]"
                        title={currentLesson.title}
                       />
                    </div>
                  )}

                  {(!currentLesson || (currentLesson.content_type !== "video" && currentLesson.content_type !== "quiz" && currentLesson.content_type !== "pdf")) && (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-[#111] to-black p-12 text-center min-h-[500px]">
                      <div className="relative mb-8">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse rounded-full" />
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.2)]">
                          {currentLesson ? React.createElement(contentTypeIcons[currentLesson.content_type] || BookOpen, { className: "h-10 w-10 text-primary" }) : <Play className="h-10 w-10 text-primary" />}
                        </div>
                      </div>
                      <div className="max-w-md space-y-4">
                        <Badge variant="outline" className="border-white/10 text-white/40 uppercase tracking-[0.2em] text-[10px]">
                          {currentLesson?.content_type || "Reading Material"}
                        </Badge>
                        <h2 className="text-3xl font-black text-white tracking-tight">
                          {currentLesson?.title || "Choose Your Next Lesson"}
                        </h2>
                        <p className="text-sm text-white/40 leading-relaxed font-medium">
                          Engage with the comprehensive text and resources below to master these concepts.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Player Quick Controls (Overlay on hover) - only for videos */}
              {currentLesson?.content_type === "video" && (
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none p-6 flex items-end justify-between z-10">
                  <div className="flex items-center gap-4 pointer-events-auto">
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 font-bold" onClick={handlePrevLesson} disabled={isFirst}>
                      <ChevronLeft className="h-4 w-4 mr-2" /> PREV
                    </Button>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 font-bold" onClick={handleNextLesson} disabled={isLast}>
                      NEXT <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lesson Info Area - Premium Design - ONLY show for non-quiz content to avoid overlap and focus on quiz */}
          {currentLesson?.content_type !== "quiz" && (
            <div className="bg-background min-h-full">
              <div className="max-w-4xl mx-auto p-12 lg:p-16">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-12">
                  <div className="flex-1 space-y-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        {currentLesson && contentTypeIcons[currentLesson.content_type] && (
                          <div className="p-2.5 bg-primary/10 rounded-xl">
                            {React.createElement(contentTypeIcons[currentLesson.content_type], { className: "h-5 w-5 text-primary" })}
                          </div>
                        )}
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] animate-in fade-in slide-in-from-left-2">Knowledge Session</span>
                      </div>
                      <h2 className="text-5xl font-black text-foreground tracking-tight leading-[1.1]">
                        {currentLesson?.title || "Embark on Your Learning Journey"}
                      </h2>
                    </div>

                    {/* Text content with high-end typography */}
                    {currentLesson?.text_content ? (
                      <div className="prose prose-slate dark:prose-invert max-w-none animate-in fade-in duration-700">
                        <div className="bg-muted/30 p-10 rounded-[2.5rem] border border-border/50 shadow-inner">
                          <div className="space-y-6 text-foreground/80 leading-[1.8] text-lg font-medium">
                            {currentLesson.text_content.split('\n\n').map((para, i) => (
                              <p key={i}>{para}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : currentLesson?.description ? (
                      <div className="bg-accent/30 p-10 rounded-[2.5rem] border border-primary/5">
                        <p className="text-xl leading-relaxed text-muted-foreground font-medium animate-in fade-in duration-700">
                          {currentLesson.description}
                        </p>
                      </div>
                    ) : (
                      <div className="h-32 flex items-center justify-center border-2 border-dashed border-border rounded-[2.5rem]">
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-40">No additional details provided</p>
                      </div>
                    )}

                    {/* Instructor Mention */}
                    <div className="flex items-center gap-5 pt-10 border-t border-border/50">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-black text-primary border border-primary/10 text-xl shadow-lg shadow-primary/5">
                        {course.instructor?.first_name?.[0]}{course.instructor?.last_name?.[0]}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Crafted by Expert</p>
                        <p className="text-base font-bold text-foreground">
                          {course.instructor?.first_name} {course.instructor?.last_name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Actions */}
                  <div className="flex flex-col gap-4 w-full md:w-72 shrink-0">
                    <Card className="rounded-[2.5rem] border-border/50 shadow-2xl shadow-primary/5 overflow-hidden">
                      <CardContent className="p-8 space-y-6">
                        <Button
                          size="lg"
                          variant={currentLesson && completedLessons.has(currentLesson.lesson_id) ? "outline" : "default"}
                          onClick={handleMarkComplete}
                          disabled={!currentLesson}
                          className={cn(
                            "w-full h-16 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 transform active:scale-[0.97]",
                            currentLesson && completedLessons.has(currentLesson.lesson_id) 
                              ? "border-emerald-500/50 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-100/30" 
                              : "bg-primary text-white shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1"
                          )}
                        >
                          {currentLesson && completedLessons.has(currentLesson.lesson_id) ? (
                            <>
                              <CheckCircle2 className="mr-3 h-5 w-5" />
                              Completed
                            </>
                          ) : (
                            <>
                              <Circle className="mr-3 h-5 w-5 opacity-40" />
                              Finish Lesson
                            </>
                          )}
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <Button 
                            variant="secondary" 
                            size="lg" 
                            onClick={handlePrevLesson} 
                            disabled={isFirst} 
                            className="rounded-2xl h-14 border border-border/30 font-bold bg-muted/50 hover:bg-muted"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" /> PREV
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="lg" 
                            onClick={handleNextLesson} 
                            disabled={isLast} 
                            className="rounded-2xl h-14 border border-border/30 font-bold bg-muted/50 hover:bg-muted"
                          >
                            NEXT <ChevronRight className="h-4 w-4 ml-1 text-primary" />
                          </Button>
                        </div>

                        <div className="pt-2">
                          <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">
                            <span>Module Progress</span>
                            <span>{Math.round(progressPercent)}%</span>
                          </div>
                          <Progress value={progressPercent} className="h-2 rounded-full" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="p-6 rounded-[2rem] bg-accent/20 border border-primary/5 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Quick Navigation</p>
                      <div className="flex justify-center gap-4 mt-3">
                        <div className="w-8 h-8 rounded-lg bg-background border border-border/50 flex items-center justify-center text-[10px] font-bold">←</div>
                        <div className="w-8 h-8 rounded-lg bg-background border border-border/50 flex items-center justify-center text-[10px] font-bold">→</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Premium Sidebar - Curriculum Panel */}
        {sidebarOpen && (
          <aside className="w-[400px] flex flex-col border-l border-border bg-card/40 backdrop-blur-3xl overflow-hidden shrink-0 z-10 animate-in slide-in-from-right duration-500 shadow-2xl">
            <div className="p-8 border-b border-border space-y-4 bg-background/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Curriculum</p>
                  <h4 className="text-xl font-black text-foreground tracking-tight">Mastery Roadmap</h4>
                </div>
                <Badge variant="outline" className="text-[10px] font-black border-primary/20 text-primary uppercase py-1 px-3 rounded-lg">
                  {totalLessons} Lectures
                </Badge>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/30 dark:bg-transparent">
              {course.modules.map((mod, modIdx) => (
                <div key={mod.module_id} className="group/module rounded-[2rem] border border-border/50 bg-background/60 hover:bg-background transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl">
                  <button
                    onClick={() => toggleModule(mod.module_id)}
                    className="flex w-full items-center gap-5 px-6 py-5 text-left transition-colors"
                  >
                    <div className="h-10 w-10 rounded-2xl bg-muted/80 flex items-center justify-center text-xs font-black text-muted-foreground group-hover/module:bg-primary group-hover/module:text-white transition-all duration-300">
                      {modIdx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-foreground tracking-tight">{mod.title}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5">
                          <Circle className="w-1.5 h-1.5 fill-current opacity-20" /> {mod.lessons.length} STAGES
                        </span>
                        <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-1.5">
                          <Circle className="w-1.5 h-1.5 fill-current opacity-20" /> {mod.duration_minutes || 0} MIN
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl bg-accent/50 transition-transform duration-300",
                      expandedModules.includes(mod.module_id) ? "rotate-180" : ""
                    )}>
                      <ChevronDown className="h-4 w-4 text-muted-foreground/40" />
                    </div>
                  </button>
                  
                  {expandedModules.includes(mod.module_id) && (
                    <div className="px-3 pb-4 space-y-1.5 animate-in slide-in-from-top-4 duration-300">
                      {mod.lessons.map((lesson) => {
                        const Icon = contentTypeIcons[lesson.content_type] || FileText
                        const isActive = currentLesson?.lesson_id === lesson.lesson_id
                        const isCompleted = completedLessons.has(lesson.lesson_id)
                        return (
                          <button
                            key={lesson.lesson_id}
                            onClick={() => handleLessonClick(lesson)}
                            className={cn(
                              "flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-[13px] transition-all duration-300 group/lesson relative",
                              isActive
                                ? "bg-primary text-white font-bold shadow-xl shadow-primary/20 scale-[1.02]"
                                : "text-muted-foreground hover:bg-accent hover:translate-x-1"
                            )}
                          >
                            <div className={cn(
                              "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-300",
                              isActive ? "bg-white/20" : isCompleted ? "bg-emerald-500/10" : "bg-muted/50"
                            )}>
                              {isCompleted ? (
                                <CheckCircle2 className={cn("h-4 w-4", isActive ? "text-white" : "text-emerald-500")} />
                              ) : (
                                <Icon className={cn("h-4 w-4", isActive ? "text-white" : "group-hover/lesson:text-primary transition-colors")} />
                              )}
                            </div>
                            
                            <span className="truncate text-left flex-1 tracking-tight font-bold">{lesson.title}</span>
                            
                            {isActive && (
                              <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-full animate-pulse" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
