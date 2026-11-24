"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Eye, EyeOff, ShieldAlert } from "lucide-react"
import { Logo } from "@/components/logo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthProvider, useAuth } from "@/lib/auth-context"

function portalHome(userType?: string) {
  if (userType === "company") return "/company"
  if (userType === "admin") return "/admin"
  return "/student"
}

function ForcedResetForm() {
  const router = useRouter()
  const { user, loading, isAuthenticated, changePassword, logout } = useAuth()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Bounce users who shouldn't be here: not logged in, or already reset.
  useEffect(() => {
    if (loading) return
    if (!isAuthenticated) {
      router.replace("/student/login")
    } else if (user && !user.must_reset_password) {
      router.replace(portalHome(user.user_type))
    }
  }, [loading, isAuthenticated, user, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)
    const result = await changePassword(password)
    setIsLoading(false)

    if (result.success) {
      router.replace(portalHome(user?.user_type))
    } else {
      setError(result.error || "Could not update password")
    }
  }

  if (loading || !isAuthenticated || (user && !user.must_reset_password)) {
    return <div className="text-sm text-muted-foreground">Loading...</div>
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldAlert className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Set your new password</CardTitle>
        <CardDescription>
          For security, you must change the temporary password before continuing
          {user?.email ? <> — <span className="font-medium text-foreground">{user.email}</span></> : null}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive border border-destructive/20">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label>New Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Confirm Password</Label>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Set Password & Continue"
            )}
          </Button>
          <button
            type="button"
            onClick={logout}
            className="text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordRequiredPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-8">
          <div className="mb-8 flex items-center gap-2">
            <Logo size={36} />
            <span className="text-lg font-bold text-foreground">CompanionLMS</span>
          </div>
          <ForcedResetForm />
        </div>
      </div>
    </AuthProvider>
  )
}
