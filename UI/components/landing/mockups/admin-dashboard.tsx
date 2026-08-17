export function AdminDashboard() {
  return (
    <div className="bg-white rounded-2xl shadow-[0_16px_56px_rgba(0,0,0,.08)] overflow-hidden border border-[#eee]">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-[#f5f5f5]">
        <h4 className="text-[13px] font-bold">Admin Dashboard</h4>
        <span className="text-[10px] text-emerald-600 font-medium">Live</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 border-b border-[#f5f5f5]">
        {[
          { label: "Students", value: "15,420", sub: "+12% this month" },
          { label: "Companies", value: "342", sub: "+8 new" },
          { label: "Placement Rate", value: "89%", sub: "+3% vs last quarter" },
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
        {/* Application Pipeline Chart */}
        <div className="mb-4">
          <h5 className="text-[11px] font-semibold mb-2">Application Pipeline</h5>
          <div className="flex items-end gap-1.5 h-[60px]">
            {[30, 55, 45, 70, 85, 60].map((h, i) => (
              <div key={i} className="flex-1 bg-[#f5f5f5] rounded-t-[3px] relative" style={{ height: "100%" }}>
                <div className="absolute bottom-0 w-full bg-coral rounded-t-[3px]" style={{ height: `${h}%` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[6px] text-muted-foreground mt-1">
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>

        {/* Job Table */}
        <div>
          <table className="w-full">
            <thead>
              <tr className="text-left text-[9px] text-muted-foreground font-medium border-b border-[#f5f5f5]">
                <th className="pb-1.5 font-medium">Job Title</th>
                <th className="pb-1.5 font-medium">Company</th>
                <th className="pb-1.5 font-medium">Applied</th>
                <th className="pb-1.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { title: "Senior SDE", company: "TechCorp", count: 24, status: "Active", badge: "bg-emerald-50 text-emerald-600" },
                { title: "Data Analyst", company: "DataFlow", count: 18, status: "Active", badge: "bg-emerald-50 text-emerald-600" },
                { title: "ML Engineer", company: "InnovateLabs", count: 12, status: "Review", badge: "bg-coral/10 text-coral" },
                { title: "DevOps Lead", company: "CloudFirst", count: 9, status: "Paused", badge: "bg-blue-50 text-blue-600" },
              ].map((job) => (
                <tr key={job.title} className="border-b border-[#fafafa]">
                  <td className="py-2 text-[10px] font-semibold">{job.title}</td>
                  <td className="py-2 text-[10px] text-muted-foreground">{job.company}</td>
                  <td className="py-2 text-[10px]">{job.count}</td>
                  <td className="py-2">
                    <span className={`text-[7px] font-semibold px-1.5 py-0.5 rounded-full ${job.badge}`}>
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
