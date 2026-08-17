export function PhoneStack() {
  return (
    <div className="relative flex justify-center items-end h-[480px]">
      {/* LEFT PHONE: Course Dashboard */}
      <div className="phone-side phone-left w-[200px] bg-white rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,.12)] border-2 border-[#e8e8e8] overflow-hidden relative z-2 rotate-[-6deg] mr-[-40px] mb-6 opacity-85">
        <div className="p-3 bg-[#fafafa] border-b border-[#f0f0f0]">
          <div className="w-[50px] h-[5px] bg-[#333] rounded-full mx-auto mb-2" />
          <div className="flex justify-between text-[8px] text-muted-foreground">
            <span>9:41</span><span>Dashboard</span>
          </div>
        </div>
        <div className="p-3">
          <span className="inline-block text-[7px] font-bold uppercase tracking-wider bg-coral/10 text-coral px-2 py-0.5 rounded-full mb-1.5">In Progress</span>
          <div className="bg-white border border-[#f0f0f0] rounded-[10px] p-2.5 mb-2">
            <h5 className="text-[8px] font-semibold mb-1">Advanced Data Structures</h5>
            <p className="text-[7px] text-muted-foreground">Module 4 of 8 &middot; Trees & Graphs</p>
            <div className="h-[5px] bg-[#f0f0f0] rounded-full mt-1.5 overflow-hidden">
              <div className="h-full w-[52%] bg-coral rounded-full" />
            </div>
          </div>
          <div className="bg-white border border-[#f0f0f0] rounded-[10px] p-2.5 mb-2">
            <h5 className="text-[8px] font-semibold mb-1">SQL for Analytics</h5>
            <div className="h-[5px] bg-[#f0f0f0] rounded-full mt-1.5 overflow-hidden">
              <div className="h-full w-[60%] bg-emerald-500 rounded-full" />
            </div>
          </div>
          <div className="flex gap-1 mt-2">
            <div className="flex-1 bg-coral/10 rounded-[6px] p-1.5 text-center">
              <div className="text-[12px] font-bold text-coral">3</div>
              <div className="text-[6px] text-muted-foreground">Enrolled</div>
            </div>
            <div className="flex-1 bg-emerald-50 rounded-[6px] p-1.5 text-center">
              <div className="text-[12px] font-bold text-emerald-600">1</div>
              <div className="text-[6px] text-muted-foreground">Completed</div>
            </div>
            <div className="flex-1 bg-blue-50 rounded-[6px] p-1.5 text-center">
              <div className="text-[12px] font-bold text-blue-600">42h</div>
              <div className="text-[6px] text-muted-foreground">Learned</div>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER PHONE: Job Matching */}
      <div className="phone-main w-[240px] bg-white rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,.12)] border-2 border-[#e8e8e8] overflow-hidden relative z-3">
        <div className="p-3 bg-[#fafafa] border-b border-[#f0f0f0]">
          <div className="w-[50px] h-[5px] bg-[#333] rounded-full mx-auto mb-2" />
          <div className="flex justify-between text-[8px] text-muted-foreground">
            <span>9:41</span><span>AI Match</span>
          </div>
        </div>
        <div className="p-3">
          <div className="bg-coral text-white p-2.5 rounded-[8px] mb-2">
            <h4 className="text-[9px] font-bold">AI Job Match</h4>
            <p className="text-[7px] opacity-80">Senior Software Engineer at TechCorp</p>
          </div>
          <div className="flex items-center gap-2 bg-[#fafafa] rounded-[8px] p-2 mb-2">
            <div className="w-8 h-8 rounded-full border-[2.5px] border-coral bg-coral/10 flex items-center justify-center text-[9px] font-bold text-coral shrink-0">87%</div>
            <div>
              <div className="text-[9px] font-semibold">Composite Match</div>
              <div className="text-[7px] text-muted-foreground">Excellent fit for your profile</div>
            </div>
          </div>
          <div className="text-[7px] font-semibold mb-1">Match Breakdown</div>
          {[
            { label: "Semantic Fit", pct: 92, color: "bg-emerald-500" },
            { label: "Skill Match", pct: 85, color: "bg-emerald-500" },
            { label: "Experience Fit", pct: 78, color: "bg-blue-500" },
            { label: "Preference Fit", pct: 80, color: "bg-blue-500" },
          ].map((item) => (
            <div key={item.label} className="mb-1.5">
              <div className="flex justify-between text-[7px] mb-0.5">
                <span>{item.label}</span>
                <span className="font-semibold">{item.pct}%</span>
              </div>
              <div className="h-[5px] bg-[#f0f0f0] rounded-full overflow-hidden">
                <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
          <div className="text-[7px] font-semibold mt-2 mb-1">Skills Matched</div>
          <div className="flex flex-wrap gap-1 mb-2">
            {["Python", "React", "Node.js"].map((s) => (
              <span key={s} className="text-[6px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">{s}</span>
            ))}
            {["AWS", "Docker"].map((s) => (
              <span key={s} className="text-[6px] bg-coral/10 text-coral px-1.5 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
          <div className="text-[7px] font-semibold text-coral mb-1">Boost Your Match</div>
          <div className="bg-white border border-[#f0f0f0] border-l-2 border-l-coral rounded-[10px] p-2">
            <h5 className="text-[8px] font-semibold">AWS Cloud Practitioner</h5>
            <p className="text-[7px] text-muted-foreground">Close 2 skill gaps &middot; 8h course</p>
          </div>
        </div>
      </div>

      {/* RIGHT PHONE: Resume Score */}
      <div className="phone-side phone-right w-[200px] bg-white rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,.12)] border-2 border-[#e8e8e8] overflow-hidden relative z-2 rotate-[6deg] ml-[-40px] mb-6 opacity-85">
        <div className="p-3 bg-[#fafafa] border-b border-[#f0f0f0]">
          <div className="w-[50px] h-[5px] bg-[#333] rounded-full mx-auto mb-2" />
          <div className="flex justify-between text-[8px] text-muted-foreground">
            <span>9:41</span><span>Resume AI</span>
          </div>
        </div>
        <div className="p-3">
          <span className="inline-block text-[7px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full mb-1.5">Score: 72/100</span>
          <div className="bg-white border border-[#f0f0f0] rounded-[10px] p-2.5 mb-2">
            <h5 className="text-[8px] font-semibold mb-1.5">Resume Intelligence</h5>
            <div className="grid grid-cols-2 gap-1">
              {[
                { label: "ATS Score", val: 85, color: "text-emerald-600 bg-emerald-50" },
                { label: "Skills", val: 78, color: "text-emerald-600 bg-emerald-50" },
                { label: "Experience", val: 62, color: "text-coral bg-coral/10" },
                { label: "Match", val: 80, color: "text-emerald-600 bg-emerald-50" },
              ].map((item) => (
                <div key={item.label} className={`rounded-[6px] p-1.5 text-center ${item.color.split(" ")[1]}`}>
                  <div className={`text-[10px] font-bold ${item.color.split(" ")[0]}`}>{item.val}</div>
                  <div className="text-[6px] text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-[#f0f0f0] rounded-[10px] p-2.5 mb-2">
            <h5 className="text-[8px] font-semibold mb-0.5">Strengths</h5>
            <p className="text-[7px] text-muted-foreground">Strong Python & ML skills, relevant project experience</p>
          </div>
          <div className="bg-white border border-[#f0f0f0] rounded-[10px] p-2.5 mb-2">
            <h5 className="text-[8px] font-semibold mb-0.5">Improvements</h5>
            <p className="text-[7px] text-muted-foreground">Add quantified achievements, include cloud certifications</p>
          </div>
          <div className="bg-white border border-[#f0f0f0] border-l-2 border-l-emerald-500 rounded-[10px] p-2.5">
            <h5 className="text-[8px] font-semibold mb-0.5">Hiring Decision</h5>
            <div className="text-[9px] font-bold text-emerald-600">&#10003; Advance to Interview</div>
          </div>
        </div>
      </div>
    </div>
  )
}
