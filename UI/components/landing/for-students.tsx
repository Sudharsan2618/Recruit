import { StudentDashboard } from "./mockups/student-dashboard"

export function ForStudents() {
  return (
    <section id="students" className="py-20 md:py-24">
      <div className="mx-auto max-w-[1140px] px-5 md:px-10">
        <div className="grid gap-16 items-center lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-coral px-4 py-2 text-[11px] font-bold uppercase tracking-[1.5px] text-white mb-6">
              For Students
            </span>
            <h2 className="font-[family-name:var(--font-playfair)] font-bold text-foreground text-[clamp(36px,4.5vw,56px)] leading-[1.08] mb-5">
              Confidence that lands offers
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-6">
              CompanionLMS helps students build verified skills, analyze their resume with AI, and get matched to the right opportunities.
            </p>
            <b className="text-[15px] font-semibold mb-3 block">Via the app and website:</b>
            <ul className="space-y-1.5">
              {[
                "SCORM-compliant courses with progress tracking and certificates",
                "AI resume analysis with ATS scoring and hiring decisions",
                "AI-powered job matching with skill gap analysis",
                "SQL coding practice with company-specific questions",
                "24/7 self-paced learning with instant feedback",
                "Application tracking through the full pipeline",
              ].map((item) => (
                <li key={item} className="text-[14.5px] text-foreground/80 pl-5 relative before:absolute before:left-0 before:top-[10px] before:w-2 before:h-2 before:rounded-full before:bg-coral">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <StudentDashboard />
          </div>
        </div>
      </div>
    </section>
  )
}
