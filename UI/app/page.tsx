import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Pillars } from "@/components/landing/pillars"
import { ForStudents } from "@/components/landing/for-students"
import { ForCompanies } from "@/components/landing/for-companies"
import { ForAdmins } from "@/components/landing/for-admins"
import { StatsBar } from "@/components/landing/stats-bar"
import { Testimonial } from "@/components/landing/testimonial"
import { FeaturesGrid } from "@/components/landing/features-grid"
import { CtaForm } from "@/components/landing/cta-form"
import { Footer } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Pillars />
      <ForStudents />
      <ForCompanies />
      <ForAdmins />
      <StatsBar />
      <Testimonial />
      <FeaturesGrid />
      <CtaForm />
      <Footer />
    </main>
  )
}
