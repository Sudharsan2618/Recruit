"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2 } from "lucide-react"
import { companyProfile } from "@/lib/mock-data"

export default function CompanyProfilePage() {
  const p = companyProfile

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Company Profile</h1>
        <p className="text-muted-foreground">Manage your company public profile and contact details.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Company Information</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Company Name</Label>
                <Input defaultValue={p.name} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Industry</Label>
                <Select defaultValue={p.industry}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Company Size</Label>
                <Select defaultValue={p.size}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10 employees">1-10 employees</SelectItem>
                    <SelectItem value="10-50 employees">10-50 employees</SelectItem>
                    <SelectItem value="50-200 employees">50-200 employees</SelectItem>
                    <SelectItem value="200+ employees">200+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Founded</Label>
                <Input defaultValue={p.founded} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Location</Label>
                <Input defaultValue={p.location} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Website</Label>
                <Input defaultValue={p.website} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Contact Email</Label>
                <Input defaultValue={p.contactEmail} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Textarea defaultValue={p.description} rows={4} />
            </div>
            <Button className="self-start">Save Changes</Button>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Company Logo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted">
              <Building2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <Button variant="outline" size="sm">Upload Logo</Button>
            <p className="text-center text-xs text-muted-foreground">PNG or JPG, max 2MB. This will appear on your job listings.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
