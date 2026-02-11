"use client"

import { ShieldCheck } from "lucide-react"

import { PortalAuth } from "@/components/portal-auth"

export default function AdminLoginPage() {
  return (
    <PortalAuth
      portalName="Admin Portal"
      portalDescription="Oversee platform performance, manage users, and coordinate the job matching process."
      portalIcon={ShieldCheck}
      portalColor="bg-foreground"
      features={[
        "Unified dashboards for revenue and engagement",
        "User management with role-based access controls",
        "Job matching hub for candidate forwarding",
      ]}
      loginRedirect="/admin"
      nameLabel="Full Name"
      namePlaceholder="Sarah Admin"
      emailLabel="Admin Email"
      emailPlaceholder="admin@skillbridge.io"
    />
  )
}
