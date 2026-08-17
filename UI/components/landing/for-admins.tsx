import { AdminDashboard } from "./mockups/admin-dashboard"

export function ForAdmins() {
  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-[1140px] px-5 md:px-10">
        <div className="grid gap-16 items-center lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-coral px-4 py-2 text-[11px] font-bold uppercase tracking-[1.5px] text-white mb-6">
              For Admins
            </span>
            <h2 className="font-[family-name:var(--font-playfair)] font-bold text-foreground text-[clamp(36px,4.5vw,56px)] leading-[1.08] mb-5">
              Full platform control
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-6">
              Manage users, courses, job matching, and referrals from a single dashboard with real-time analytics.
            </p>
            <b className="text-[15px] font-semibold mb-3 block">Admin capabilities:</b>
            <ul className="space-y-1.5">
              {[
                "Platform-wide dashboard with 6+ analytics charts",
                "Job Matching Hub: review applicants, forward to companies in bulk",
                "Course Builder: full CRUD for modules, lessons, quizzes, flashcards",
                "User management: activate, suspend, delete with role-based access",
                "Referral & placement package management",
                "Skills, categories, and instructor catalog management",
              ].map((item) => (
                <li key={item} className="text-[14.5px] text-foreground/80 pl-5 relative before:absolute before:left-0 before:top-[10px] before:w-2 before:h-2 before:rounded-full before:bg-coral">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <AdminDashboard />
          </div>
        </div>
      </div>
    </section>
  )
}
