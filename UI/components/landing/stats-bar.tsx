export function StatsBar() {
  const stats = [
    { value: "15,420+", label: "Active Students" },
    { value: "48", label: "Expert-Led Courses" },
    { value: "342", label: "Partner Companies" },
    { value: "89%", label: "Placement Rate" },
  ]

  return (
    <section className="py-16 bg-[#f7f7f7]">
      <div className="mx-auto max-w-[1140px] px-5 md:px-10">
        <div className="bg-foreground rounded-2xl py-12 px-10 grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <b className="font-[family-name:var(--font-playfair)] text-[clamp(28px,3.5vw,42px)] font-extrabold text-white block">
                {stat.value}
              </b>
              <span className="text-[13px] text-emerald-300 font-medium">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
