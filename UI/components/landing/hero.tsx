import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PhoneStack } from "./mockups/phone-stack"

export function Hero() {
  return (
    <section className="bg-[#f7f7f7] overflow-hidden">
      <div className="mx-auto grid max-w-[1140px] items-center gap-12 px-5 md:px-10 py-16 md:py-20 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <span className="inline-block rounded-full bg-coral px-5 py-2.5 text-[11.5px] font-bold uppercase tracking-[1.8px] text-white mb-7">
            Job-Readiness Platform
          </span>
          <h1 className="font-[family-name:var(--font-playfair)] font-black text-foreground leading-[1.06] tracking-tight mb-5 text-[clamp(44px,5.2vw,68px)]">
            Where learning<br />meets <span className="text-coral">hiring.</span>
          </h1>
          <p className="text-[17px] text-muted-foreground leading-relaxed max-w-[480px] mb-9">
            CompanionLMS combines SCORM-compliant courses with AI-powered job matching. Students build verified skills, then get matched to roles that fit their profile - all in one platform.
          </p>
          <div className="flex flex-wrap items-center gap-4 mb-9">
            <Button size="lg" asChild className="rounded-full bg-foreground hover:bg-foreground/90 text-white px-8">
              <Link href="/student/register">
                Start Learning <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-full border-gray-300 hover:border-foreground px-8">
              <Link href="/company/login">Hire Talent</Link>
            </Button>
          </div>
          <div className="flex gap-8">
            {[
              { value: "15,420+", label: "Active Students" },
              { value: "342", label: "Partner Companies" },
              { value: "89%", label: "Placement Rate" },
            ].map((stat) => (
              <div key={stat.label}>
                <b className="text-xl font-bold text-foreground block">{stat.value}</b>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:block">
          <PhoneStack />
        </div>
      </div>
    </section>
  )
}
