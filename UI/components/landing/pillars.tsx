import { Brain, BookOpen, FileText, Code } from "lucide-react"

const pillars = [
  {
    icon: Brain,
    title: "AI Job Matching",
    desc: "3-stage hybrid engine: vector embeddings (35%), skill overlap (35%), experience fit (20%), preference fit (10%).",
    color: "bg-coral/10 text-coral",
  },
  {
    icon: BookOpen,
    title: "SCORM Courses",
    desc: "Industry-standard content with per-lesson progress, xAPI analytics, quizzes, flashcards, and downloadable materials.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: FileText,
    title: "Resume Intelligence",
    desc: "AI-powered resume parsing, ATS scoring, skill extraction, hiring decisions, interview coaching, and rewrite suggestions.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Code,
    title: "Coding Practice",
    desc: "Server-side SQL execution with gamified leaderboard, difficulty tiers, company-specific questions, and first-solve points.",
    color: "bg-amber-50 text-amber-600",
  },
]

export function Pillars() {
  return (
    <section id="pillars" className="py-20 md:py-24 bg-[#f7f7f7]">
      <div className="mx-auto max-w-[1140px] px-5 md:px-10">
        <div className="text-center">
          <span className="inline-block rounded-full bg-coral px-4 py-2 text-[11px] font-bold uppercase tracking-[1.5px] text-white mb-6">
            Platform
          </span>
          <h2 className="font-[family-name:var(--font-playfair)] font-bold text-foreground text-[clamp(32px,4vw,48px)] leading-tight mb-4">
            Built on global learning standards
          </h2>
          <p className="text-base text-muted-foreground max-w-[560px] mx-auto">
            SCORM, xAPI, pgvector, and Gemini AI - powering every layer of the platform.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="p-8 rounded-2xl border border-border bg-white transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${pillar.color}`}>
                <pillar.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">{pillar.title}</h3>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
