"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Copy, Check, CheckCircle2, KeyRound } from "lucide-react"
import { createUser, type CreateUserResult } from "@/lib/api"

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateUserDialog({ open, onOpenChange, onCreated }: CreateUserDialogProps) {
  const [userType, setUserType] = useState<"student" | "company">("student")
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [companyName, setCompanyName] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreateUserResult | null>(null)
  const [copied, setCopied] = useState(false)

  function resetForm() {
    setUserType("student")
    setEmail("")
    setFirstName("")
    setLastName("")
    setCompanyName("")
    setError(null)
    setCreated(null)
    setCopied(false)
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      // If an account was created this session, make sure the list refreshes.
      if (created) onCreated()
      resetForm()
    }
    onOpenChange(next)
  }

  async function handleSubmit() {
    setError(null)

    if (!email.trim()) {
      setError("Email is required")
      return
    }
    if (userType === "student" && (!firstName.trim() || !lastName.trim())) {
      setError("First and last name are required for students")
      return
    }
    if (userType === "company" && !companyName.trim()) {
      setError("Company name is required for companies")
      return
    }

    setSubmitting(true)
    try {
      const result = await createUser({
        email: email.trim(),
        user_type: userType,
        first_name: userType === "student" ? firstName.trim() : undefined,
        last_name: userType === "student" ? lastName.trim() : undefined,
        company_name: userType === "company" ? companyName.trim() : undefined,
      })
      setCreated(result)
    } catch (e: any) {
      setError(e.message || "Failed to create user")
    } finally {
      setSubmitting(false)
    }
  }

  async function copyPassword() {
    if (!created) return
    try {
      await navigator.clipboard.writeText(created.temp_password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Couldn't copy — select and copy the password manually.")
    }
  }

  function createAnother() {
    if (created) onCreated()
    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Account created
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium text-foreground text-right">{created.name}</span>
                </div>
                <div className="mt-1.5 flex justify-between gap-3">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-foreground text-right break-all">{created.email}</span>
                </div>
                <div className="mt-1.5 flex justify-between gap-3">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium text-foreground capitalize">{created.user_type}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" /> Temporary password
                </Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 select-all rounded-md border border-border bg-background px-3 py-2 font-mono text-sm tracking-wide">
                    {created.temp_password}
                  </code>
                  <Button type="button" variant="outline" size="icon" onClick={copyPassword} title="Copy password">
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this with the user securely. They&apos;ll be required to set a new password on first login.
                  <span className="font-medium text-foreground"> This password won&apos;t be shown again.</span>
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={createAnother}>Create another</Button>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Account type</Label>
                <Select value={userType} onValueChange={(v) => setUserType(v as "student" | "company")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                />
              </div>

              {userType === "student" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>First name *</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Last name *</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Company name *</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                A one-time temporary password is generated automatically. The user must change it on first login.
              </p>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
