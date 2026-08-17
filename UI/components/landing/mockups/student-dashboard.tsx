export function StudentDashboard() {
  return (
    <div className="bg-white rounded-2xl shadow-[0_16px_56px_rgba(0,0,0,.08)] overflow-hidden border border-[#eee]">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-[#f5f5f5]">
        <h4 className="text-[13px] font-bold">Student Dashboard</h4>
        <span className="text-[10px] text-muted-foreground">Last 30 days</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 border-b border-[#f5f5f5]">
        {[
          { label: "Enrolled", value: "3", sub: "Courses" },
          { label: "Completed", value: "1", sub: "Certificate earned" },
          { label: "Learned", value: "42h", sub: "Total hours" },
        ].map((kpi) => (
          <div key={kpi.label} className="px-4 py-3 border-r border-[#f5f5f5] last:border-r-0">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{kpi.label}</div>
            <div className="text-lg font-bold mt-0.5">{kpi.value}</div>
            <div className="text-[9px] text-muted-foreground">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Course Progress */}
        <div className="mb-4">
          <h5 className="text-[11px] font-semibold mb-2">Course Progress</h5>
          {[
            { name: "Advanced Data Structures", pct: 52, color: "bg-coral" },
            { name: "SQL for Analytics", pct: 60, color: "bg-emerald-500" },
            { name: "System Design", pct: 18, color: "bg-blue-500" },
          ].map((course) => (
            <div key={course.name} className="bg-white border border-[#f0f0f0] rounded-[10px] p-2.5 mb-2">
              <div className="flex justify-between text-[8px] mb-1">
                <span className="font-semibold">{course.name}</span>
                <span className="font-semibold">{course.pct}%</span>
              </div>
              <div className="h-[5px] bg-[#f0f0f0] rounded-full overflow-hidden">
                <div className={`h-full ${course.color} rounded-full`} style={{ width: `${course.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* AI Job Matches */}
        <div>
          <h5 className="text-[11px] font-semibold mb-2">AI Job Matches</h5>
          {[
            { title: "Senior Software Engineer", company: "TechCorp India", score: "87%", border: "border-coral" },
            { title: "Full Stack Developer", company: "InnovateLabs", score: "82%", border: "border-emerald-500" },
            { title: "Backend Engineer", company: "DataFlow Systems", score: "76%", border: "border-blue-500" },
          ].map((job) => (
            <div key={job.title} className={`bg-white border border-[#f0f0f0] border-l-[3px] ${job.border} rounded-[10px] p-2.5 mb-2`}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[8px] font-semibold">{job.title}</div>
                  <div className="text-[7px] text-muted-foreground">{job.company}</div>
                </div>
                <div className="text-[10px] font-bold text-coral">{job.score}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
