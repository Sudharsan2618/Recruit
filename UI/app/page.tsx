import Link from "next/link"
import { BookOpen, Briefcase, Users, ArrowRight, BarChart3, GraduationCap, Building2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">SkillBridge</span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <Link href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Features</Link>
          <Link href="#portals" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Portals</Link>
          <Link href="#stats" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Impact</Link>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild><Link href="/student/login">Student Login</Link></Button>
          <Button asChild><Link href="/company/login">Company Portal</Link></Button>
        </div>
      </nav>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-card px-6 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-muted-foreground">
            <span className="flex h-2 w-2 rounded-full bg-primary" />
            Trusted by 15,000+ learners worldwide
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Learn Skills.<br />Land Careers.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            SkillBridge combines world-class courses with direct access to top employers. Master in-demand skills through SCORM-compliant content and get matched with opportunities that fit your profile.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="gap-2">
              <Link href="/student/login">
                Start Learning <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/company/login">Hire Talent</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(172_66%_30%/0.06),transparent_70%)]" />
    </section>
  )
}

function StatsSection() {
  const stats = [
    { value: "15,420+", label: "Active Students" },
    { value: "48", label: "Expert-Led Courses" },
    { value: "342", label: "Partner Companies" },
    { value: "89%", label: "Job Placement Rate" },
  ]
  return (
    <section id="stats" className="border-y border-border bg-secondary/50 px-6 py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    { icon: BookOpen, title: "SCORM-Compliant Courses", description: "Industry-standard course content with automated tracking of completion, scores, and time spent across all learning modules." },
    { icon: BarChart3, title: "xAPI Learning Analytics", description: "Rich learning data capture beyond course boundaries. Track real-world skills application and learning activities." },
    { icon: Briefcase, title: "Smart Job Matching", description: "Our admin team reviews your profile and matches you with relevant opportunities from our network of partner companies." },
    { icon: Users, title: "Talent Pool Insights", description: "Companies get aggregated analytics on student skills, completion rates, and emerging competencies to guide hiring." },
  ]
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">Built on Global Learning Standards</h2>
          <p className="mt-4 text-pretty text-muted-foreground">Our platform integrates SCORM, xAPI, and LTI to deliver a reliable, interoperable learning experience.</p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border bg-card transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function PortalsSection() {
  const portals = [
    { icon: GraduationCap, title: "Student Portal", description: "Access courses, track your learning progress, earn skill badges, and apply for jobs matched to your growing expertise.", href: "/student/login", cta: "Explore as Student" },
    { icon: Building2, title: "Company Portal", description: "Post job openings, explore talent pool analytics, and manage your candidate pipeline with a Kanban-style board.", href: "/company/login", cta: "Explore as Company" },
    { icon: ShieldCheck, title: "Admin Portal", description: "Manage users, courses, and content. Match qualified students with company openings and monitor platform health.", href: "/admin/login", cta: "Explore as Admin" },
  ]
  return (
    <section id="portals" className="bg-secondary/30 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">Three Portals, One Platform</h2>
          <p className="mt-4 text-pretty text-muted-foreground">Each user group has a purpose-built experience designed for their unique needs.</p>
        </div>
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {portals.map((portal) => (
            <Card key={portal.title} className="group relative overflow-hidden border-border bg-card transition-all hover:shadow-lg">
              <CardContent className="flex flex-col p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <portal.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-foreground">{portal.title}</h3>
                <p className="mt-3 flex-1 leading-relaxed text-muted-foreground">{portal.description}</p>
                <Button variant="outline" asChild className="mt-6 gap-2 bg-transparent">
                  <Link href={portal.href}>
                    {portal.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">SkillBridge</span>
        </div>
        <p className="text-sm text-muted-foreground">Built with SCORM, xAPI, and LTI standards for interoperable education.</p>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <PortalsSection />
      <Footer />
    </main>
  )
}
