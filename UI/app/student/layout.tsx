"use client"

import React from "react"
import { usePathname, useRouter } from "next/navigation"

import { AuthProvider, useAuth } from "@/lib/auth-context"
import { PortalShell } from "@/components/portal-shell"
import {
  LayoutDashboard,
  BookOpen,
  Video,
  FolderOpen,
  Briefcase,
  User,
  UserCheck,
  Share2,
  Award,
} from "lucide-react"

const studentNav = [
  { label: "Dashboard", href: "/student", icon: LayoutDashboard },
  { label: "Course Catalog", href: "/student/courses", icon: BookOpen },
  { label: "Live Webinars", href: "/student/webinars", icon: Video },
  { label: "Materials Library", href: "/student/materials", icon: FolderOpen },
  { label: "Job Board", href: "/student/jobs", icon: Briefcase },
  { label: "Mentors", href: "/student/mentors", icon: UserCheck },
  { label: "Referrals", href: "/student/referrals", icon: Share2 },
  { label: "Placement Support", href: "/student/placements", icon: Award },
  { label: "My Profile", href: "/student/profile", icon: User },
]

function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  // Don't guard login page
  if (pathname === "/student/login") return <>{children}</>

  // Show loading while restoring session
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push("/student/login")
    return null
  }

  return <>{children}</>
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Login page — no shell
  if (pathname === "/student/login") {
    return <>{children}</>
  }

  // Immersive player — no sidebar (Option B)
  if (pathname === "/student/player") {
    return <>{children}</>
  }

  // All other pages — standard sidebar layout
  return (
    <PortalShell portalName="Student Portal" navItems={studentNav} portalColor="bg-primary">
      {children}
    </PortalShell>
  )
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        <LayoutContent>{children}</LayoutContent>
      </AuthGuard>
    </AuthProvider>
  )
}
