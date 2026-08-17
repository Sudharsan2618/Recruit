export function Testimonial() {
  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-[740px] px-5 md:px-10 text-center">
        <p className="font-[family-name:var(--font-playfair)] text-[clamp(20px,2.4vw,28px)] font-semibold leading-[1.45] text-foreground">
          &ldquo;We used to guess where students needed help. Now the placement team sees exactly where to focus - and our offer rate speaks for itself.&rdquo;
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-coral to-orange-400 flex items-center justify-center text-white font-bold text-sm">
            PK
          </div>
          <div className="text-left">
            <strong className="text-sm block">Priya Kulkarni</strong>
            <small className="text-xs text-muted-foreground">Director of Placements, Partner University</small>
          </div>
        </div>
      </div>
    </section>
  )
}
