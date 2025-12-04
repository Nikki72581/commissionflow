'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { updateUserProfile, getUserProfile, updateNotificationPreferences } from '@/app/actions/settings'
import { User, Bell, Shield, Loader2 } from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  createdAt: Date
  emailNotifications: boolean
  salesAlerts: boolean
  commissionAlerts: boolean
  weeklyReports: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [salesAlerts, setSalesAlerts] = useState(true)
  const [commissionAlerts, setCommissionAlerts] = useState(true)
  const [weeklyReports, setWeeklyReports] = useState(false)

  // Load user profile
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)
        const result = await getUserProfile()

        if (result.success && result.data) {
          setProfile(result.data)
          setFirstName(result.data.firstName || '')
          setLastName(result.data.lastName || '')
          setEmail(result.data.email)
          setEmailNotifications(result.data.emailNotifications)
          setSalesAlerts(result.data.salesAlerts)
          setCommissionAlerts(result.data.commissionAlerts)
          setWeeklyReports(result.data.weeklyReports)
        } else {
          setError(result.error || 'Failed to load profile')
        }
      } catch (err) {
        setError('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const result = await updateUserProfile({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        email: email || undefined,
      })

      if (result.success) {
        setSuccess('Profile updated successfully')
        router.refresh()
      } else {
        setError(result.error || 'Failed to update profile')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function handlePreferencesUpdate() {
    setError(null)
    setSuccess(null)
    setSaving(true)

    try {
      const result = await updateNotificationPreferences({
        emailNotifications,
        salesAlerts,
        commissionAlerts,
        weeklyReports,
      })

      if (result.success) {
        setSuccess('Notification preferences updated successfully')
        router.refresh()
      } else {
        setError(result.error || 'Failed to update preferences')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Separator />

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Profile Information</CardTitle>
          </div>
          <CardDescription>
            Update your personal information and email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="firstName">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@example.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                This is the email associated with your account
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Role</Label>
              <div className="flex items-center h-9 px-3 py-2 rounded-md border bg-muted/50">
                <span className="text-sm font-medium">
                  {profile?.role === 'ADMIN' ? 'Administrator' : 'Salesperson'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Contact your administrator to change your role
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>
            Choose what notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <input
              type="checkbox"
              id="emailNotifications"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="h-4 w-4 rounded border-input cursor-pointer"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="salesAlerts">Sales Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when new sales are recorded
              </p>
            </div>
            <input
              type="checkbox"
              id="salesAlerts"
              checked={salesAlerts}
              onChange={(e) => setSalesAlerts(e.target.checked)}
              className="h-4 w-4 rounded border-input cursor-pointer"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="commissionAlerts">Commission Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about commission calculations and payouts
              </p>
            </div>
            <input
              type="checkbox"
              id="commissionAlerts"
              checked={commissionAlerts}
              onChange={(e) => setCommissionAlerts(e.target.checked)}
              className="h-4 w-4 rounded border-input cursor-pointer"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weeklyReports">Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">
                Receive weekly performance summaries
              </p>
            </div>
            <input
              type="checkbox"
              id="weeklyReports"
              checked={weeklyReports}
              onChange={(e) => setWeeklyReports(e.target.checked)}
              className="h-4 w-4 rounded border-input cursor-pointer"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={handlePreferencesUpdate}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security & Privacy */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Security & Privacy</CardTitle>
          </div>
          <CardDescription>
            Manage your account security and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Password</Label>
            <p className="text-sm text-muted-foreground">
              Password management is handled through your authentication provider
            </p>
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Two-Factor Authentication</Label>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account
            </p>
            <Button variant="outline" size="sm">
              Enable 2FA
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Account Created</Label>
            <p className="text-sm text-muted-foreground">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'N/A'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
