"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function CtaForm() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <section id="contact" className="py-20 md:py-24 bg-[#f7f7f7]">
      <div className="mx-auto max-w-[720px] px-5 md:px-10">
        <div className="text-center">
          <span className="inline-block rounded-full bg-coral px-4 py-2 text-[11px] font-bold uppercase tracking-[1.5px] text-white mb-6">
            Get In Touch
          </span>
          <h2 className="font-[family-name:var(--font-playfair)] font-bold text-foreground text-[clamp(28px,3.5vw,40px)] leading-tight mb-3">
            Implement CompanionLMS in your institution today
          </h2>
          <p className="text-[15px] text-muted-foreground mb-9">
            Talk to our team about course delivery, talent analytics, and job matching. We will walk you through a live demo.
          </p>
        </div>

        {submitted ? (
          <div className="bg-white rounded-2xl border border-border p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-2">Thank you!</h3>
            <p className="text-sm text-muted-foreground">Our education partnership team will contact you shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-8 md:p-10 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">First Name *</Label>
              <Input required placeholder="First name" className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Last Name *</Label>
              <Input required placeholder="Last name" className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Work Email *</Label>
              <Input type="email" required placeholder="you@institution.edu" className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Work Phone *</Label>
              <Input type="tel" required placeholder="+91 98765 43210" className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Institution Name</Label>
              <Input placeholder="University or college name" className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Number of Students *</Label>
              <Input type="number" required placeholder="e.g. 2500" className="rounded-xl" />
            </div>
            <div className="col-span-full">
              <Label className="text-xs font-semibold mb-1.5 block">Message *</Label>
              <textarea
                required
                rows={3}
                placeholder="Tell us about your goals"
                className="w-full rounded-xl border border-input bg-white px-3 py-2.5 text-sm font-[family-name:var(--font-inter)] text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="col-span-full">
              <Button type="submit" className="w-full rounded-full bg-foreground hover:bg-foreground/90 text-white py-6 text-[15px]">
                Schedule a Demo &rarr;
              </Button>
              <p className="text-[11px] text-muted-foreground text-center mt-3">
                By submitting, you agree to our{" "}
                <a href="#" className="underline hover:text-foreground">Terms of Service</a>
                {" "}and{" "}
                <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
