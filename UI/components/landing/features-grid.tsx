import { Activity, BookOpen, Shield, Code, Bell, CreditCard } from "lucide-react"

const features = [
  {
    icon: Activity,
    title: "xAPI Learning Analytics",
    desc: "Session heartbeat tracking, activity recording, engagement heatmaps, and pre-computed analytics aggregates.",
    color: "bg-coral/10 text-coral",
  },
  {
    icon: BookOpen,
    title: "SCORM & xAPI Content",
    desc: "Standards-compliant course delivery with automated completion tracking, scores, and time spent.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Shield,
    title: "AI Resume Scoring",
    desc: "ATS analysis, skill extraction, hiring intelligence, interview coaching, and improvement plans.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Code,
    title: "SQL Coding Practice",
    desc: "Server-side execution, gamified leaderboard, company-specific questions, and difficulty tiers.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    desc: "Multi-channel alerts via Novu: push, email, SMS. Real-time in-app notifications with 30s polling.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: CreditCard,
    title: "Razorpay Payments",
    desc: "Course purchases, mentor sessions, referral packages, subscriptions, and company candidate fees.",
    color: "bg-pink-50 text-pink-600",
  },
]

export function FeaturesGrid() {
  return (
    <section className="py-20 md:py-24 bg-[#f7f7f7]">
      <div className="mx-auto max-w-[1140px] px-5 md:px-10">
        <div className="text-center">
          <span className="inline-block border-2 border-coral text-coral px-4 py-1.5 text-[11px] font-bold uppercase tracking-[1.5px] rounded-full mb-6">
            Everything Included
          </span>
          <h2 className="font-[family-name:var(--font-playfair)] font-bold text-foreground text-[clamp(32px,4vw,48px)] leading-tight">
            One platform, every capability
          </h2>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-7 rounded-xl border border-border bg-white"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${feature.color}`}>
                <feature.icon className="w-5 h-5" />
              </div>
              <h4 className="text-[15px] font-bold mb-1.5">{feature.title}</h4>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
