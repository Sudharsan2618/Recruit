"use client"

import React from "react"
import { usePathname } from "next/navigation"

import { PortalShell } from "@/components/portal-shell"
import {
  LayoutDashboard,
  BarChart3,
  Briefcase,
  Users,
  Building2,
} from "lucide-react"

const companyNav = [
  { label: "Dashboard", href: "/company", icon: LayoutDashboard },
  { label: "Talent Analytics", href: "/company/talent", icon: BarChart3 },
  { label: "Job Management", href: "/company/jobs", icon: Briefcase },
  { label: "Candidate Pipeline", href: "/company/candidates", icon: Users },
  { label: "Company Profile", href: "/company/profile", icon: Building2 },
]

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname === "/company/login") {
    return <>{children}</>
  }

  return (
    <PortalShell portalName="Company Portal" navItems={companyNav} portalColor="bg-accent">
      {children}
    </PortalShell>
  )
}
