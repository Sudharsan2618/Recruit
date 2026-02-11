"use client"

import { Building2 } from "lucide-react"

import { PortalAuth } from "@/components/portal-auth"

export default function CompanyLoginPage() {
  return (
    <PortalAuth
      portalName="Company Portal"
      portalDescription="Post roles, analyze the talent pool, and manage your candidate pipeline in one place."
      portalIcon={Building2}
      portalColor="bg-accent"
      features={[
        "Talent analytics with emerging skill trends",
        "Streamlined job management workflows",
        "Kanban pipeline for candidate reviews",
      ]}
      loginRedirect="/company"
      nameLabel="Company Name"
      namePlaceholder="TechStart Inc."
      emailLabel="Work Email"
      emailPlaceholder="hiring@techstart.com"
    />
  )
}
