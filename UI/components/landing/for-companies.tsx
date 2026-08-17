import { KanbanPipeline } from "./mockups/kanban-pipeline"

export function ForCompanies() {
  return (
    <section id="companies" className="py-20 md:py-24 bg-[#f7f7f7]">
      <div className="mx-auto max-w-[1140px] px-5 md:px-10">
        <div className="grid gap-16 items-center lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full bg-coral px-4 py-2 text-[11px] font-bold uppercase tracking-[1.5px] text-white mb-6">
              For Employers
            </span>
            <h2 className="font-[family-name:var(--font-playfair)] font-bold text-foreground text-[clamp(36px,4.5vw,56px)] leading-[1.08] mb-5">
              Hire verified talent, faster
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-6">
              Post roles, review AI-matched candidates, and manage your pipeline - all with admin-curated quality assurance.
            </p>
            <b className="text-[15px] font-semibold mb-3 block">Via the company portal:</b>
            <ul className="space-y-1.5">
              {[
                "Post jobs with skill requirements and experience ranges",
                "Receive admin-forwarded candidates with match scores",
                "Kanban pipeline: New, Under Review, Interviewing, Offer, Hired",
                "Talent pool analytics: top skills, growth trends, completion rates",
                "Candidate skill breakdowns with matched and missing skills",
              ].map((item) => (
                <li key={item} className="text-[14.5px] text-foreground/80 pl-5 relative before:absolute before:left-0 before:top-[10px] before:w-2 before:h-2 before:rounded-full before:bg-coral">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <KanbanPipeline />
          </div>
        </div>
      </div>
    </section>
  )
}
