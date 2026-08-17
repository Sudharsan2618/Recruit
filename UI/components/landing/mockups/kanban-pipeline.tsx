export function KanbanPipeline() {
  const columns = [
    {
      title: "New",
      count: 4,
      color: "text-coral",
      candidates: [
        { initials: "AK", name: "Aisha Kumar", role: "Full Stack Developer", score: "87%", bg: "bg-coral" },
        { initials: "RJ", name: "Rahul Joshi", role: "Backend Engineer", score: "82%", bg: "bg-blue-600" },
      ],
    },
    {
      title: "Review",
      count: 2,
      color: "text-amber-600",
      candidates: [
        { initials: "PS", name: "Priya Sharma", role: "Data Analyst", score: "79%", bg: "bg-emerald-600" },
        { initials: "MR", name: "Meera Reddy", role: "DevOps Engineer", score: "75%", bg: "bg-purple-600" },
      ],
    },
    {
      title: "Interview",
      count: 1,
      color: "text-blue-600",
      candidates: [
        { initials: "SV", name: "Suresh Verma", role: "ML Engineer", score: "91%", bg: "bg-orange-600" },
      ],
    },
    {
      title: "Offer",
      count: 1,
      color: "text-emerald-600",
      candidates: [
        { initials: "NK", name: "Neha Kapoor", role: "Frontend Lead", score: "Hired ✓", bg: "bg-emerald-600" },
      ],
    },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-[0_16px_56px_rgba(0,0,0,.08)] p-4 border border-[#eee]">
      <div className="grid grid-cols-4 gap-2.5">
        {columns.map((col) => (
          <div key={col.title}>
            <h5 className={`text-[10px] font-semibold mb-2 ${col.color}`}>
              {col.title} ({col.count})
            </h5>
            {col.candidates.map((c) => (
              <div key={c.name} className="bg-[#fafafa] border border-[#f0f0f0] rounded-[8px] p-2 mb-1.5">
                <div className={`w-[22px] h-[22px] rounded-full ${c.bg} text-white flex items-center justify-center text-[7px] font-bold mb-1`}>
                  {c.initials}
                </div>
                <h6 className="text-[8px] font-semibold">{c.name}</h6>
                <p className="text-[7px] text-muted-foreground">{c.role}</p>
                <div className="text-[8px] font-bold text-coral mt-0.5">{c.score}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Talent Analytics */}
      <div className="mt-4 bg-white rounded-2xl shadow-[0_16px_56px_rgba(0,0,0,.08)] overflow-hidden border border-[#eee]">
        <div className="flex justify-between items-center px-5 py-3 border-b border-[#f5f5f5]">
          <h4 className="text-[13px] font-bold">Talent Pool Analytics</h4>
          <span className="text-[10px] text-muted-foreground">This month</span>
        </div>
        <div className="grid grid-cols-3">
          {[
            { label: "Students", value: "256", sub: "In talent pool" },
            { label: "Avg Completion", value: "73%", sub: "Across courses" },
            { label: "Top Skill", value: "Python", sub: "89 students" },
          ].map((kpi) => (
            <div key={kpi.label} className="px-4 py-3 border-r border-[#f5f5f5] last:border-r-0">
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{kpi.label}</div>
              <div className="text-lg font-bold mt-0.5">{kpi.value}</div>
              <div className="text-[9px] text-muted-foreground">{kpi.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
