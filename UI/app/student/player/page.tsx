"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
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
  Clock,
  StickyNote,
  Save,
} from "lucide-react"
import { 
  getCourseDetail, 
  getLesson, 
  getQuiz, 
  startTrackingSession,
  sendHeartbeat,
  endTrackingSession,
  trackActivity,
  getCourseProgress,
  updateLessonProgress,
  getStudentAnalytics,
  type CourseDetail, 
  type LessonFull, 
  type LessonBrief, 
  type QuizOut,
  type LessonProgressOut,
  type StudentActivitySummary
} from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { PlayerSkeleton } from "@/components/skeletons"

const contentTypeIcons: Record<string, React.ElementType> = {
  video: Video,
  text: BookOpen,
  quiz: HelpCircle,
  pdf: FileText,
}

// ── Watched-range helpers (unique seconds tracking) ──
function mergeRanges(ranges: [number, number][]): [number, number][] {
  if (ranges.length === 0) return []
  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = [sorted[0]]
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1]
    if (sorted[i][0] <= last[1]) {
      last[1] = Math.max(last[1], sorted[i][1])
    } else {
      merged.push(sorted[i])
    }
  }
  return merged
}

function totalUniqueSeconds(ranges: [number, number][]): number {
  return mergeRanges(ranges).reduce((sum, [s, e]) => sum + (e - s), 0)
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
  const [lessonProgressMap, setLessonProgressMap] = useState<Record<number, LessonProgressOut>>({})
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
  
  // Tracking & Analytics State
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<StudentActivitySummary | null>(null)
  const videoTimeRef = useRef<number>(0)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const watchedRangesRef = useRef<[number, number][]>([])
  const lastReportedTimeRef = useRef<number>(0)

  // Notes State
  const [noteText, setNoteText] = useState<string>("")
  const [notesOpen, setNotesOpen] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)

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
            await loadLesson(data.modules[0].lessons[0].lesson_id, data)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load course")
      } finally {
        setLoading(false)
      }
    }
    fetchCourse()
  }, [slug, router])

  // Dual-Path Initialization: PostgreSQL (Progress) & MongoDB (Analytics)
  useEffect(() => {
    if (!user || !course) return

    async function initTracking() {
      // 1. Initialize MongoDB Tracking Session
      try {
        const sessionRes = await startTrackingSession({
          user_id: user.user_id,
          device_info: {
            device_type: window.innerWidth < 768 ? "mobile" : "desktop",
            browser: navigator.userAgent.split(' ').pop(),
            os: navigator.platform
          }
        })
        setSessionId(sessionRes.session_id)
      } catch (trackingErr) {
        console.warn("Failed to start tracking session:", trackingErr)
      }

      // 2. Fetch existing progress from PostgreSQL (Current State)
      try {
        if (user.student_id) {
          const progress = await getCourseProgress(user.student_id, course.course_id)
          const completedIds = new Set(progress.filter(p => p.is_completed).map(p => p.lesson_id))
          const progressMap: Record<number, LessonProgressOut> = {}
          progress.forEach(p => { progressMap[p.lesson_id] = p })
          
          setCompletedLessons(completedIds)
          setLessonProgressMap(progressMap)
        }
      } catch (pErr) {
        console.warn("Failed to fetch course progress", pErr)
      }

      // 3. Fetch MongoDB Analytics Summary (History/Aggregation)
      try {
        if (user.student_id) {
          const summary = await getStudentAnalytics(user.student_id, course.course_id)
          setAnalytics(summary)
        }
      } catch (aErr) {
        console.warn("Failed to fetch student analytics", aErr)
      }
    }

    initTracking()
  }, [user, course?.course_id])

  // Heartbeat Timer (60s)
  useEffect(() => {
    if (!sessionId) return
    const interval = setInterval(async () => {
      try {
        await sendHeartbeat({
          session_id: sessionId,
          current_page: window.location.pathname
        })
      } catch (err) {
        console.warn("Heartbeat failed", err)
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [sessionId])

  // YouTube PostMessage listener — captures real currentTime from iframe
  useEffect(() => {
    function handleYTMessage(e: MessageEvent) {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data
        if (data?.event === "infoDelivery" && data?.info?.currentTime != null) {
          videoTimeRef.current = data.info.currentTime
        }
        // Also capture player state changes
        if (data?.event === "onStateChange" && data?.info != null) {
          // state 0 = ended, 1 = playing, 2 = paused
          if (data.info === 0 && currentLesson && user?.student_id && course) {
            // Video ended — fire final tracking
            const totalDuration = (currentLesson.duration_minutes || 0) * 60
            if (totalDuration > 0) {
              watchedRangesRef.current.push([lastReportedTimeRef.current, totalDuration])
            }
          }
        }
      } catch { /* ignore non-JSON messages */ }
    }
    window.addEventListener("message", handleYTMessage)
    return () => window.removeEventListener("message", handleYTMessage)
  }, [currentLesson, user, course])

  // Load saved notes when lesson changes
  useEffect(() => {
    if (!currentLesson) return
    const key = `note_lesson_${currentLesson.lesson_id}`
    const saved = localStorage.getItem(key)
    setNoteText(saved || "")
    setNoteSaved(false)
  }, [currentLesson?.lesson_id])

  // Periodic Granular Tracking for MongoDB (Video Progress) — with unique watched-seconds
  useEffect(() => {
    if (!currentLesson || currentLesson.content_type !== "video" || !course) return
    
    // Timer to sync video position every 20 seconds
    const interval = setInterval(() => {
      const currentTime = videoTimeRef.current
      if (currentTime > 0 && user?.student_id) {
        // Record watched range segment
        const lastTime = lastReportedTimeRef.current
        if (currentTime > lastTime) {
          watchedRangesRef.current.push([Math.floor(lastTime), Math.floor(currentTime)])
        } else if (currentTime < lastTime) {
          // User seeked backward — start a new range from current position
          // The previous range was already recorded
        }
        lastReportedTimeRef.current = currentTime

        // Compute unique seconds from merged ranges
        const uniqueSeconds = totalUniqueSeconds(watchedRangesRef.current)
        const totalDuration = (currentLesson.duration_minutes || 0) * 60

        // Path A: PostgreSQL (State update for Resume function)
        updateLessonProgress(user.student_id, course.course_id, {
          lesson_id: currentLesson.lesson_id,
          video_position_seconds: Math.floor(currentTime),
          time_spent_seconds: Math.floor(uniqueSeconds)
        }).catch(() => {})

        // Path B: MongoDB (Granular xAPI log)
        trackActivity({
          student_id: user.student_id,
          course_id: course.course_id,
          lesson_id: currentLesson.lesson_id,
          activity_type: "video_watched",
          session_id: sessionId || undefined,
          details: {
            video_progress: {
              current_time_seconds: Math.floor(currentTime),
              total_duration_seconds: totalDuration,
              percentage_watched: totalDuration > 0 ? (uniqueSeconds / totalDuration) * 100 : 0
            }
          }
        }).catch(() => {})
      }
    }, 20000)

    return () => clearInterval(interval)
  }, [currentLesson, sessionId, user, course])

  // Cleanup session on unmount
  useEffect(() => {
    return () => {
      if (sessionId) {
        endTrackingSession(sessionId).catch(console.error)
      }
    }
  }, [sessionId])

  // Save note handler
  function handleSaveNote() {
    if (!currentLesson) return
    const key = `note_lesson_${currentLesson.lesson_id}`
    localStorage.setItem(key, noteText)
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)

    // Track note_taken activity
    if (user?.student_id && course) {
      trackActivity({
        student_id: user.student_id,
        course_id: course.course_id,
        lesson_id: currentLesson.lesson_id,
        activity_type: "note_taken",
        session_id: sessionId || undefined,
        details: {
          note: { content_length: noteText.length }
        }
      }).catch(console.warn)
    }
  }

  async function loadLesson(lessonId: number, courseData?: CourseDetail) {
    try {
      setLessonLoading(true)
      setQuizStarted(false)
      setQuizSubmitted(false)
      setQuizAnswers({})
      setQuizResult(null)
      videoTimeRef.current = 0
      lastReportedTimeRef.current = 0
      watchedRangesRef.current = []
      
      const lesson = await getLesson(lessonId)
      setCurrentLesson(lesson)

      // Track Activity: Lesson Started (MongoDB)
      const activeCourse = courseData || course;
      if (user?.student_id && activeCourse) {
        trackActivity({
          student_id: user.student_id,
          course_id: activeCourse.course_id,
          lesson_id: lesson.lesson_id,
          activity_type: "lesson_started",
          session_id: sessionId || undefined
        }).catch(console.warn)

        // Track document_viewed for PDF lessons
        if (lesson.content_type === "pdf") {
          trackActivity({
            student_id: user.student_id,
            course_id: activeCourse.course_id,
            lesson_id: lesson.lesson_id,
            activity_type: "document_viewed",
            session_id: sessionId || undefined,
            details: { document: { url: lesson.content_url || "", type: "pdf" } }
          }).catch(console.warn)
        }
      }
      
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

  async function handleMarkComplete() {
    if (!currentLesson || !course || !user?.student_id) return
    const isCompleted = completedLessons.has(currentLesson.lesson_id)
    const newCompleted = !isCompleted

    // 1. Persist to PostgreSQL first — only update UI on success
    try {
      await updateLessonProgress(user.student_id, course.course_id, {
        lesson_id: currentLesson.lesson_id,
        is_completed: newCompleted
      })
    } catch (err) {
      console.error("Failed to update progress:", err)
      return // Don't toggle UI if backend failed
    }

    // 2. Update local state only after backend confirms
    setCompletedLessons((prev) => {
      const next = new Set(prev)
      if (newCompleted) {
        next.add(currentLesson.lesson_id)
      } else {
        next.delete(currentLesson.lesson_id)
      }
      return next
    })

    // 3. Track Activity: Lesson Completed (MongoDB Analytics Path)
    if (newCompleted) {
      trackActivity({
        student_id: user.student_id,
        course_id: course.course_id,
        lesson_id: currentLesson.lesson_id,
        activity_type: "lesson_completed",
        session_id: sessionId || undefined
      }).catch(console.warn)

      // Refresh analytics summary after completion
      getStudentAnalytics(user.student_id, course.course_id).then(setAnalytics).catch(() => {})

      // Check for Course Completion
      const allLessons = course.modules.flatMap((m) => m.lessons)
      if (completedLessons.size + 1 === allLessons.length) {
        trackActivity({
          student_id: user.student_id,
          course_id: course.course_id,
          activity_type: "course_completed",
          session_id: sessionId || undefined
        }).catch(console.warn)
      }
    }
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
    if (!quizData || !course || !currentLesson) return
    
    let correctCount = 0
    quizData.questions.forEach(q => {
      if (quizAnswers[q.question_id] === 0) correctCount++
    })
    
    const percentage = Math.round((correctCount / quizData.questions.length) * 100)
    const passed = percentage >= parseFloat(quizData.pass_percentage)
    
    setQuizResult({
      score: percentage,
      passed: passed
    })
    setQuizSubmitted(true)

    // Track Activity: Quiz Submitted (MongoDB Analytics/xAPI Path)
    if (user?.student_id) {
      trackActivity({
        student_id: user.student_id,
        course_id: course.course_id,
        lesson_id: currentLesson.lesson_id,
        activity_type: "quiz_submitted",
        session_id: sessionId || undefined,
        details: {
          quiz_result: {
            quiz_id: quizData.quiz_id,
            score: percentage,
            percentage: percentage,
            passed: passed,
            time_taken_seconds: 60 
          }
        }
      }).catch(console.warn)
    }
    
    if (passed) {
      handleMarkComplete()
    }
  }

  if (loading) {
    return <PlayerSkeleton />
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

  // Resume logic hint
  const savedPosition = currentLesson ? lessonProgressMap[currentLesson.lesson_id]?.video_position_seconds : 0

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
          {analytics && (
             <div className="hidden lg:flex items-center gap-4 px-4 border-l border-border h-8">
               <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] font-medium text-slate-500">
                    {Math.round(analytics.total_time_spent_seconds / 60)}m spent
                  </span>
               </div>
               <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/5 text-emerald-600 border-emerald-500/20 py-0 px-1.5">
                    {analytics.lessons_completed} completed
                  </Badge>
               </div>
             </div>
          )}
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
        <div className="flex flex-1 flex-col overflow-y-auto bg-background pl-6">
          {/* Video / Content Wrapper */}
          <div className="w-full bg-black relative flex flex-col group">
            <div className="w-full relative flex-1 flex flex-col">
              
              {lessonLoading ? (
                <div className="flex-1 min-h-[400px] flex items-center justify-center bg-black/40">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading lesson...</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  {/* Video Player */}
                  {/* YouTube Video Player */}
                  {currentLesson?.content_type === "video" && currentLesson?.video_external_id && (
                    <div className="aspect-video relative bg-black">
                      <iframe
                        key={`${currentLesson.lesson_id}-${savedPosition}`}
                        src={`https://www.youtube.com/embed/${currentLesson.video_external_id}?rel=0&modestbranding=1&showinfo=0&autoplay=1&start=${savedPosition || 0}&enablejsapi=1&origin=${typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : ''}`}
                        className="absolute inset-0 h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={currentLesson.title}
                      />
                    </div>
                  )}

                  {/* Self-hosted MP4/Video Player (GCS bucket) */}
                  {currentLesson?.content_type === "video" && !currentLesson?.video_external_id && currentLesson?.content_url && (
                    <div className="aspect-video relative bg-black">
                      <video
                        ref={videoRef}
                        key={`mp4-${currentLesson.lesson_id}`}
                        src={currentLesson.content_url}
                        controls
                        autoPlay
                        className="absolute inset-0 h-full w-full"
                        onTimeUpdate={(e) => {
                          videoTimeRef.current = e.currentTarget.currentTime
                        }}
                        onLoadedMetadata={(e) => {
                          // Resume from saved position
                          if (savedPosition && savedPosition > 0) {
                            e.currentTarget.currentTime = savedPosition
                          }
                        }}
                        onEnded={() => {
                          // Record final watched segment
                          const ct = videoTimeRef.current
                          if (ct > lastReportedTimeRef.current) {
                            watchedRangesRef.current.push([
                              Math.floor(lastReportedTimeRef.current),
                              Math.floor(ct)
                            ])
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Quiz Content */}
                  {currentLesson?.content_type === "quiz" && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 to-slate-950 min-h-[500px]">
                      {quizLoading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      ) : quizSubmitted ? (
                        <div className="max-w-lg w-full bg-white/5 backdrop-blur border border-white/10 p-10 rounded-2xl text-center animate-in zoom-in-95 duration-500">
                          <div className={cn(
                            "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
                            quizResult?.passed ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                          )}>
                            {quizResult?.passed ? <Trophy className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
                          </div>
                          <h2 className="text-2xl font-bold text-white mb-2">
                             {quizResult?.passed ? "Excellent Work!" : "Keep Practicing"}
                          </h2>
                          <div className="flex items-center justify-center gap-3 mb-6">
                            <div className="text-4xl font-bold text-white">{quizResult?.score}%</div>
                            <div className="text-slate-500 text-xs font-medium uppercase tracking-wider text-left">
                              Final<br/>Score
                            </div>
                          </div>
                          <p className="text-sm text-slate-400 mb-8 leading-relaxed max-w-sm mx-auto">
                            {quizResult?.passed 
                              ? "You've mastered the concepts in this module. Proceed to the next section."
                              : "Review the material and try again to unlock the next module."
                            }
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button 
                              onClick={() => { setQuizSubmitted(false); setQuizStarted(true); }}
                              variant="outline"
                              className="h-11 border-white/20 text-white hover:bg-white/10"
                            >
                              <RotateCcw className="w-4 h-4 mr-2" /> Retake Quiz
                            </Button>
                            {quizResult?.passed && (
                              <Button 
                                onClick={handleNextLesson}
                                className="h-11"
                              >
                                Continue Learning <ChevronRight className="w-4 h-4 ml-2" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : quizStarted && quizData ? (
                        <div className="max-w-2xl w-full space-y-6 animate-in fade-in duration-500">
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Knowledge Check</p>
                              <h3 className="text-lg font-bold text-white">{quizData.title}</h3>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Pass: {quizData.pass_percentage}%</p>
                            </div>
                          </div>
                          
                          <div className="space-y-5">
                            {quizData.questions.map((q, idx) => (
                              <div key={q.question_id} className="bg-white/5 border border-white/10 p-6 rounded-xl">
                                <p className="text-sm font-medium text-slate-300 mb-4 flex items-start gap-3">
                                  <span className="text-primary font-bold text-xs mt-0.5">{idx + 1}.</span>
                                  {q.question_text}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {q.options?.map((opt, optIdx) => (
                                    <button
                                      key={optIdx}
                                      onClick={() => setQuizAnswers(prev => ({ ...prev, [q.question_id]: optIdx }))}
                                      className={cn(
                                        "px-4 py-3 rounded-lg text-left text-sm transition-all duration-200 border",
                                        quizAnswers[q.question_id] === optIdx
                                          ? "bg-primary border-primary text-white font-medium"
                                          : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:bg-white/10"
                                      )}
                                    >
                                      <span className="mr-2 opacity-50 text-xs">
                                        {String.fromCharCode(65 + optIdx)}.
                                      </span>
                                      {opt.text}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                            <p className="text-xs text-slate-500">Answer all questions before submitting.</p>
                            <Button 
                              onClick={handleQuizSubmit}
                              disabled={Object.keys(quizAnswers).length < quizData.questions.length}
                              className="h-11"
                            >
                              Submit Answers
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-md w-full text-center space-y-6 animate-in fade-in duration-500">
                          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                            <Brain className="w-8 h-8 text-primary" />
                          </div>
                          <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">Quiz Time</h2>
                            <p className="text-sm text-slate-400 leading-relaxed">
                              Test your knowledge. You need at least 
                              <span className="text-white font-semibold ml-1">{quizData?.pass_percentage}%</span> to pass.
                            </p>
                          </div>
                          <div className="flex items-center justify-center gap-6 py-2">
                            <div className="text-center">
                              <p className="text-xl font-bold text-white">{quizData?.total_questions || 0}</p>
                              <p className="text-xs text-slate-500">Questions</p>
                            </div>
                            <div className="w-px h-6 bg-white/10" />
                            <div className="text-center">
                              <p className="text-xl font-bold text-white">{quizData?.time_limit_minutes || 15}</p>
                              <p className="text-xs text-slate-500">Minutes</p>
                            </div>
                          </div>
                          <Button 
                            size="lg"
                            className="w-full h-12"
                            onClick={() => setQuizStarted(true)}
                          >
                            Start Quiz
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PDF Viewer */}
                  {currentLesson?.content_type === "pdf" && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                       <div className="h-12 bg-muted flex items-center justify-between px-6 shrink-0 border-b border-border">
                         <div className="flex items-center gap-2">
                           <FileText className="w-4 h-4 text-primary" />
                           <span className="text-sm font-medium text-foreground">{currentLesson.title}</span>
                         </div>
                         <Button
                           variant="ghost"
                           size="sm"
                           className="h-8 text-muted-foreground hover:text-foreground"
                           onClick={() => {
                             // Track resource download
                             if (user?.student_id && course && currentLesson) {
                               trackActivity({
                                 student_id: user.student_id,
                                 course_id: course.course_id,
                                 lesson_id: currentLesson.lesson_id,
                                 activity_type: "resource_downloaded",
                                 session_id: sessionId || undefined,
                                 details: { resource: { url: currentLesson.content_url || "", type: "pdf" } }
                               }).catch(console.warn)
                             }
                             window.open(currentLesson.content_url || "#", "_blank")
                           }}
                         >
                           <Download className="w-3.5 h-3.5 mr-2" /> Download
                         </Button>
                       </div>
                       <iframe 
                        src={`${currentLesson.content_url}#toolbar=0`} 
                        className="flex-1 w-full border-none min-h-[600px]"
                        title={currentLesson.title}
                       />
                    </div>
                  )}

                  {/* Text content display */}
                  {currentLesson?.content_type === "text" && currentLesson?.text_content && (
                    <div className="flex-1 p-8 bg-background min-h-[400px]">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground max-w-4xl mx-auto">
                        {currentLesson.text_content}
                      </pre>
                    </div>
                  )}

                  {/* Fallback / No content placeholder */}
                  {(!currentLesson || (currentLesson.content_type !== "video" && currentLesson.content_type !== "quiz" && currentLesson.content_type !== "pdf" && currentLesson.content_type !== "text")) && (
                    <div className="flex-1 flex flex-col items-center justify-center bg-muted/30 p-12 text-center min-h-[400px]">
                      <div className="mb-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mx-auto">
                          {currentLesson ? React.createElement(contentTypeIcons[currentLesson.content_type] || BookOpen, { className: "h-7 w-7 text-primary" }) : <Play className="h-7 w-7 text-primary" />}
                        </div>
                      </div>
                      <div className="max-w-md space-y-3">
                        <Badge variant="outline" className="text-xs">
                          {currentLesson?.content_type || "Reading Material"}
                        </Badge>
                        <h2 className="text-2xl font-bold text-foreground">
                          {currentLesson?.title || "Select a lesson to begin"}
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Review the material below to master these concepts.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Player Quick Controls (Overlay on hover) - only for videos */}
              {currentLesson?.content_type === "video" && (
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none p-4 flex items-end justify-between z-10">
                  <div className="flex items-center gap-3 pointer-events-auto">
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 text-xs font-medium" onClick={handlePrevLesson} disabled={isFirst}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                    </Button>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 text-xs font-medium" onClick={handleNextLesson} disabled={isLast}>
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lesson Info Area - Consistent with app design system */}
          {currentLesson?.content_type !== "quiz" && (
            <div className="bg-background border-t border-border">
              <div className="max-w-5xl mx-auto px-6 py-8 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left: Lesson Details */}
                  <div className="flex-1 space-y-6">
                    {/* Lesson Title & Type */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {currentLesson && contentTypeIcons[currentLesson.content_type] && (
                          <div className="p-1.5 bg-primary/10 rounded-lg">
                            {React.createElement(contentTypeIcons[currentLesson.content_type], { className: "h-4 w-4 text-primary" })}
                          </div>
                        )}
                        <Badge variant="outline" className="text-xs">{currentLesson?.content_type || "Lesson"}</Badge>
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">
                        {currentLesson?.title || "Select a lesson"}
                      </h2>
                    </div>

                    {/* Text Content */}
                    {currentLesson?.text_content ? (
                      <Card className="border-border">
                        <CardContent className="p-6">
                          <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
                            {currentLesson.text_content.split('\n\n').map((para, i) => (
                              <p key={i}>{para}</p>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ) : currentLesson?.description ? (
                      <Card className="border-border">
                        <CardContent className="p-6">
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {currentLesson.description}
                          </p>
                        </CardContent>
                      </Card>
                    ) : null}

                    {/* Notes Panel */}
                    <div className="border-t border-border pt-4">
                      <button
                        onClick={() => setNotesOpen(!notesOpen)}
                        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                      >
                        <StickyNote className="w-4 h-4" />
                        <span>My Notes</span>
                        <ChevronDown className={cn("w-4 h-4 ml-auto transition-transform", notesOpen && "rotate-180")} />
                      </button>
                      {notesOpen && (
                        <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Write your notes here..."
                            className="w-full min-h-[120px] p-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                          />
                          <div className="flex items-center justify-between">
                            <span className={cn("text-xs transition-opacity", noteSaved ? "text-emerald-500 opacity-100" : "opacity-0")}>
                              ✓ Saved
                            </span>
                            <Button size="sm" variant="outline" className="h-8" onClick={handleSaveNote}>
                              <Save className="w-3.5 h-3.5 mr-1.5" /> Save Note
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Instructor */}
                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {course?.instructor?.first_name?.[0]}{course?.instructor?.last_name?.[0]}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Instructor</p>
                        <p className="text-sm font-semibold text-foreground">
                          {course?.instructor?.first_name} {course?.instructor?.last_name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-4 w-full lg:w-64 shrink-0">
                    <Card className="border-border">
                      <CardContent className="p-5 space-y-4">
                        <Button
                          size="lg"
                          variant={currentLesson && completedLessons.has(currentLesson.lesson_id) ? "outline" : "default"}
                          onClick={handleMarkComplete}
                          disabled={!currentLesson}
                          className={cn(
                            "w-full h-11 font-semibold transition-all",
                            currentLesson && completedLessons.has(currentLesson.lesson_id) 
                              ? "border-emerald-500/50 text-emerald-600 bg-emerald-50 hover:bg-emerald-100" 
                              : ""
                          )}
                        >
                          {currentLesson && completedLessons.has(currentLesson.lesson_id) ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Completed
                            </>
                          ) : (
                            <>
                              <Circle className="mr-2 h-4 w-4 opacity-40" />
                              Mark Complete
                            </>
                          )}
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handlePrevLesson} 
                            disabled={isFirst} 
                            className="h-10 font-medium"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleNextLesson} 
                            disabled={isLast} 
                            className="h-10 font-medium"
                          >
                            Next <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-2">
                            <span>Overall Progress</span>
                            <span className="font-medium">{Math.round(progressPercent)}%</span>
                          </div>
                          <Progress value={progressPercent} className="h-1.5" />
                        </div>
                      </CardContent>
                    </Card>
                    {analytics && (
                       <Card className="border-slate-100 bg-slate-50/30">
                         <CardContent className="p-4 space-y-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Learning Stats (MongoDB)</p>
                            <div className="grid grid-cols-2 gap-2">
                               <div className="bg-white rounded-lg p-2 border border-slate-100">
                                  <p className="text-[10px] text-slate-400">Time Spent</p>
                                  <p className="text-xs font-bold text-slate-700">{Math.round(analytics.total_time_spent_seconds / 60)}m</p>
                               </div>
                               <div className="bg-white rounded-lg p-2 border border-slate-100">
                                  <p className="text-[10px] text-slate-400">Started</p>
                                  <p className="text-xs font-bold text-slate-700">{analytics.lessons_started} lessons</p>
                               </div>
                            </div>
                         </CardContent>
                       </Card>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Premium Sidebar - Curriculum Panel */}
        {sidebarOpen && (
          <aside className="w-[330px] flex flex-col border-l border-border/40 bg-gradient-to-b from-white to-slate-50/80 dark:from-slate-900 dark:to-slate-950 overflow-hidden shrink-0 z-10 animate-in slide-in-from-right duration-500 shadow-[-8px_0_30px_rgba(0,0,0,0.06)]">
            {/* Sidebar Header */}
            <div className="px-7 pt-7 pb-5 border-b border-border/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Course Content</p>
                  <h4 className="text-lg font-extrabold text-foreground tracking-tight">Curriculum</h4>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary bg-primary/5 uppercase py-1.5 px-3 rounded-full">
                  {totalLessons} Lessons
                </Badge>
              </div>
              {/* Mini progress bar in header */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-muted/60 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                  {progressPercent}%
                </span>
              </div>
            </div>
            
            {/* Module List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--border)) transparent' }}>
              {course.modules.map((mod, modIdx) => {
                const moduleLessons = mod.lessons
                const moduleCompletedCount = moduleLessons.filter(l => completedLessons.has(l.lesson_id)).length
                const isModuleExpanded = expandedModules.includes(mod.module_id)
                const hasActiveLesson = moduleLessons.some(l => currentLesson?.lesson_id === l.lesson_id)
                
                return (
                  <div 
                    key={mod.module_id} 
                    className={cn(
                      "rounded-2xl border overflow-hidden transition-all duration-300",
                      isModuleExpanded 
                        ? "border-primary/15 bg-white dark:bg-slate-900/60 shadow-lg shadow-primary/5" 
                        : "border-border/40 bg-white/60 dark:bg-slate-900/30 hover:border-border/60 hover:shadow-md"
                    )}
                  >
                    {/* Module Header */}
                    <button
                      onClick={() => toggleModule(mod.module_id)}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-all duration-200 group/module"
                    >
                      {/* Module Number Badge */}
                      <div className={cn(
                        "h-11 w-11 rounded-[14px] flex items-center justify-center text-sm font-extrabold shrink-0 transition-all duration-300",
                        hasActiveLesson || isModuleExpanded
                          ? "bg-gradient-to-br from-primary to-emerald-500 text-white shadow-md shadow-primary/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover/module:bg-primary/10 group-hover/module:text-primary"
                      )}>
                        {modIdx + 1}
                      </div>

                      {/* Module Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-foreground leading-tight">{mod.title}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30 inline-block" />
                            {mod.lessons.length} Stages
                          </span>
                          <span className="text-muted-foreground/30 mx-1">•</span>
                          <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                            {mod.duration_minutes || 0} Min
                          </span>
                          {moduleCompletedCount > 0 && (
                            <>
                              <span className="text-muted-foreground/30 mx-1">•</span>
                              <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">
                                {moduleCompletedCount}/{moduleLessons.length} Done
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expand/Collapse Toggle */}
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300",
                        isModuleExpanded 
                          ? "bg-primary/10 text-primary rotate-180" 
                          : "bg-slate-100 dark:bg-slate-800 text-muted-foreground/50 group-hover/module:bg-primary/10 group-hover/module:text-primary"
                      )}>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </button>
                    
                    {/* Expanded Lesson List */}
                    {isModuleExpanded && (
                      <div className="pb-3 px-3 animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className="space-y-1">
                          {mod.lessons.map((lesson) => {
                            const Icon = contentTypeIcons[lesson.content_type] || FileText
                            const isActive = currentLesson?.lesson_id === lesson.lesson_id
                            const isCompleted = completedLessons.has(lesson.lesson_id)
                            return (
                              <button
                                key={lesson.lesson_id}
                                onClick={() => handleLessonClick(lesson)}
                                className={cn(
                                  "flex w-full items-center gap-3.5 rounded-xl px-4 py-3.5 text-[13px] transition-all duration-200 group/lesson relative",
                                  isActive
                                    ? "bg-gradient-to-r from-primary to-teal-600 text-white shadow-lg shadow-primary/25"
                                    : "text-foreground/70 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-foreground"
                                )}
                              >
                                {/* Active Indicator Bar */}
                                {isActive && (
                                  <div className="absolute left-0 top-2 bottom-2 w-1 bg-white/80 rounded-r-full" />
                                )}

                                {/* Lesson Icon */}
                                <div className={cn(
                                  "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                                  isActive 
                                    ? "bg-white/20" 
                                    : isCompleted 
                                      ? "bg-emerald-50 dark:bg-emerald-500/10" 
                                      : "bg-slate-100 dark:bg-slate-800 group-hover/lesson:bg-primary/10"
                                )}>
                                  {isCompleted && !isActive ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <Icon className={cn(
                                      "h-4 w-4 transition-colors",
                                      isActive 
                                        ? "text-white" 
                                        : "text-slate-400 dark:text-slate-500 group-hover/lesson:text-primary"
                                    )} />
                                  )}
                                </div>
                                
                                {/* Lesson Title */}
                                <span className={cn(
                                  "truncate text-left flex-1 leading-tight",
                                  isActive ? "font-bold" : "font-medium"
                                )}>
                                  {lesson.title}
                                </span>

                                {/* Completed Check for Active */}
                                {isCompleted && isActive && (
                                  <CheckCircle2 className="h-4 w-4 text-white/70 shrink-0" />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
