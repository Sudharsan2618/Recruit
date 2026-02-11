"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, BookOpen, Briefcase, TrendingUp, Activity } from "lucide-react"
import { adminDashboard } from "@/lib/mock-data"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"

export default function AdminDashboard() {
  const d = adminDashboard

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and key performance indicators.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardContent className="flex flex-col p-5">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Monthly Revenue</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">${d.monthlyRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col p-5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Students</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{d.totalStudents.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col p-5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Companies</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{d.totalCompanies}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col p-5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Active Courses</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{d.activeCoursesCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col p-5">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Job Postings</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{d.totalJobPostings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col p-5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Engagement</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{d.engagementRate}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={d.revenueTrend}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis axisLine={false} tickLine={false} className="text-xs" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: "0.5rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={d.userGrowth}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis axisLine={false} tickLine={false} className="text-xs" />
                <Tooltip
                  contentStyle={{ borderRadius: "0.5rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Legend />
                <Line type="monotone" dataKey="students" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="companies" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">New Users This Month</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{d.newUsersThisMonth.toLocaleString()}</p>
            <p className="mt-1 text-xs text-success flex items-center gap-1"><TrendingUp className="h-3 w-3" />+8.2% from last month</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-accent">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Job Matches This Month</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{d.jobMatchesThisMonth}</p>
            <p className="mt-1 text-xs text-success flex items-center gap-1"><TrendingUp className="h-3 w-3" />+12.5% from last month</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="mt-1 text-3xl font-bold text-foreground">${d.totalRevenue.toLocaleString()}</p>
            <p className="mt-1 text-xs text-success flex items-center gap-1"><TrendingUp className="h-3 w-3" />+15.1% from last month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
