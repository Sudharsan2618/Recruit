"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1140px] items-center justify-between px-5 md:px-10 h-[72px]">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={32} />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link href="#how" className="text-[14.5px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </Link>
          <Link href="#pillars" className="text-[14.5px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            Platform
          </Link>
          <Link href="#students" className="text-[14.5px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            Students
          </Link>
          <Link href="#companies" className="text-[14.5px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            Employers
          </Link>
          <Link href="#contact" className="text-[14.5px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            Contact
          </Link>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="outline" size="sm" asChild className="rounded-full">
            <Link href="/student/login">Login</Link>
          </Button>
          <Button size="sm" asChild className="rounded-full bg-coral hover:bg-coral-dark text-white">
            <Link href="/student/register">Register</Link>
          </Button>
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-white px-5 pb-4 md:hidden">
          <div className="flex flex-col gap-1 py-3">
            {[
              { href: "#how", label: "How It Works" },
              { href: "#pillars", label: "Platform" },
              { href: "#students", label: "Students" },
              { href: "#companies", label: "Employers" },
              { href: "#contact", label: "Contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <Button variant="outline" asChild className="w-full justify-center rounded-full">
              <Link href="/student/login">Login</Link>
            </Button>
            <Button asChild className="w-full justify-center rounded-full bg-coral hover:bg-coral-dark text-white">
              <Link href="/student/register">Register</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
