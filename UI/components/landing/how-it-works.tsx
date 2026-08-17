export function HowItWorks() {
  const steps = [
    {
      num: "1",
      title: "Learn & Build Skills",
      desc: "Enroll in SCORM-compliant courses, complete quizzes, earn verified certificates. Our AI tracks every skill you gain.",
    },
    {
      num: "2",
      title: "Get Matched & Verified",
      desc: "Upload your resume for AI scoring. Our 3-stage matching engine pairs you with roles using semantic, skill, experience, and preference signals.",
    },
    {
      num: "3",
      title: "Get Hired",
      desc: "Admins forward your profile to partner companies. Track your application through the pipeline - from review to interview to offer.",
    },
  ]

  return (
    <section id="how" className="py-20 md:py-24">
      <div className="mx-auto max-w-[1140px] px-5 md:px-10">
        <div className="text-center">
          <span className="inline-block rounded-full bg-coral px-4 py-2 text-[11px] font-bold uppercase tracking-[1.5px] text-white mb-6">
            How It Works
          </span>
          <h2 className="font-[family-name:var(--font-playfair)] font-bold text-foreground text-[clamp(32px,4vw,48px)] leading-tight mb-4">
            The career-readiness flywheel
          </h2>
          <p className="text-base text-muted-foreground max-w-[560px] mx-auto">
            From sign-up to job offer in a closed loop. Every step feeds the next.
          </p>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-3 relative">
          {/* Dotted connector line */}
          <div className="absolute top-[30px] left-[15%] right-[15%] h-[2px] bg-[repeating-linear-gradient(90deg,hsl(var(--coral))_0_8px,transparent_8px_16px)] hidden md:block" />

          {steps.map((step) => (
            <div key={step.num} className="text-center relative">
              <div className="w-14 h-14 rounded-full bg-coral text-white font-[family-name:var(--font-playfair)] text-[22px] font-bold flex items-center justify-center mx-auto mb-5 relative z-10">
                {step.num}
              </div>
              <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
