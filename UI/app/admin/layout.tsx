"use client"

import React from "react"
import { usePathname } from "next/navigation"

import { PortalShell } from "@/components/portal-shell"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GitMerge,
  BarChart3,
  Settings,
  UserCheck,
  Share2,
} from "lucide-react"

const adminNav = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "User Management", href: "/admin/users", icon: Users },
  { label: "Course Management", href: "/admin/courses", icon: BookOpen },
  { label: "Job Matching Hub", href: "/admin/matching", icon: GitMerge },
  { label: "Mentor Management", href: "/admin/mentors", icon: UserCheck },
  { label: "Referrals & Placements", href: "/admin/referrals", icon: Share2 },
  { label: "Analytics Center", href: "/admin/analytics", icon: BarChart3 },
  { label: "System Controls", href: "/admin/settings", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  return (
    <PortalShell portalName="Admin Portal" navItems={adminNav} portalColor="bg-foreground">
      {children}
    </PortalShell>
  )
}

