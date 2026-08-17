import Link from "next/link"
import { Logo } from "@/components/logo"

export function Footer() {
  return (
    <footer className="bg-white border-t border-border pt-14 pb-6 px-5 md:px-10">
      <div className="mx-auto max-w-[1140px] grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        {/* Brand */}
        <div>
          <Logo size={30} />
          <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[300px] mt-3 mb-5">
            CompanionLMS bridges the gap between learning and employment. We provide students with the coaching to become job-ready and employers with the automated, bias-free intelligence to hire them.
            <strong className="block mt-1 text-foreground">Assess. Improve. Succeed.</strong>
          </p>
          <div className="flex gap-2.5 mb-5">
            {["LinkedIn", "Facebook", "Instagram"].map((social) => (
              <a
                key={social}
                href="#"
                className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-coral hover:text-white transition-colors text-xs font-bold"
              >
                {social[0]}
              </a>
            ))}
          </div>
          <div className="flex gap-2">
            <a href="#" className="h-[34px] rounded-md bg-foreground text-white text-[10px] font-semibold px-3 flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5v-17A1.5 1.5 0 0 1 4.5 2h15A1.5 1.5 0 0 1 21 3.5v17l-9-4-9 4z"/></svg>
              Google Play
            </a>
            <a href="#" className="h-[34px] rounded-md bg-foreground text-white text-[10px] font-semibold px-3 flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83z"/></svg>
              App Store
            </a>
          </div>
        </div>

        {/* Platform */}
        <div>
          <h5 className="text-[13px] font-bold mb-3.5">Platform</h5>
          <ul className="space-y-2">
            {[
              { href: "#pillars", label: "Features" },
              { href: "#how", label: "How It Works" },
              { href: "#students", label: "For Students" },
              { href: "#companies", label: "For Employers" },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-[13px] text-muted-foreground hover:text-coral transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Get Started */}
        <div>
          <h5 className="text-[13px] font-bold mb-3.5">Get Started</h5>
          <ul className="space-y-2">
            {[
              { href: "/student/login", label: "Student Login" },
              { href: "/student/register", label: "Student Registration" },
              { href: "/company/login", label: "Employer Portal" },
              { href: "/admin/login", label: "Admin Portal" },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-[13px] text-muted-foreground hover:text-coral transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h5 className="text-[13px] font-bold mb-3.5">Company</h5>
          <ul className="space-y-2">
            {[
              { href: "#contact", label: "Contact" },
              { href: "#", label: "Privacy Policy" },
              { href: "#", label: "Terms of Service" },
              { href: "#", label: "Acceptable Use Policy" },
            ].map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="text-[13px] text-muted-foreground hover:text-coral transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="mx-auto max-w-[1140px] mt-8 pt-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-muted-foreground">
        <span>CompanionLMS &copy; 2026. Built with SCORM, xAPI &amp; LTI standards.</span>
        <Link href="/admin/login" className="hover:text-foreground transition-colors">
          Administration
        </Link>
      </div>
    </footer>
  )
}
