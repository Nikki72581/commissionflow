// app/onboarding/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Users, Plug, BarChart3, Key, Sparkles } from 'lucide-react';

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    planTier: 'STARTER',
    role: 'ADMIN',
  });

  useEffect(() => {
    if (!user) return;

    setFormData((prev) => ({
      ...prev,
      firstName: prev.firstName || user.firstName || '',
      lastName: prev.lastName || user.lastName || '',
    }));
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const error = await response.json();
        alert(error.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 -z-10 bg-background">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <Card className="w-full max-w-2xl border-2 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to CommissionFlow!</CardTitle>
          <CardDescription className="text-base">
            Let&apos;s set up your organization to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="Jamie"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Chen"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Plan Selection */}
            <div className="space-y-3">
              <Label>Choose Your Plan</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Free Plan */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, planTier: 'STARTER' })}
                  className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                    formData.planTier === 'STARTER'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                      : 'border-border hover:border-blue-300'
                  }`}
                >
                  {formData.planTier === 'STARTER' && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    </div>
                  )}
                  <div className="font-semibold text-lg">Free</div>
                  <div className="text-2xl font-bold mt-1">$0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                  <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      Unlimited salespeople
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      Commission plans
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      CSV data import
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      Basic reporting
                    </li>
                  </ul>
                </button>

                {/* Team Plan */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, planTier: 'GROWTH' })}
                  className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                    formData.planTier === 'GROWTH'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
                      : 'border-border hover:border-purple-300'
                  }`}
                >
                  {formData.planTier === 'GROWTH' && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="h-5 w-5 text-purple-500" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full">
                      Popular
                    </span>
                  </div>
                  <div className="font-semibold text-lg mt-4">Team</div>
                  <div className="text-2xl font-bold mt-1">$49<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                  <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-purple-500" />
                      Team invitations
                    </li>
                    <li className="flex items-center gap-2">
                      <Plug className="h-3.5 w-3.5 text-purple-500" />
                      ERP integrations
                    </li>
                    <li className="flex items-center gap-2">
                      <BarChart3 className="h-3.5 w-3.5 text-purple-500" />
                      Advanced reporting
                    </li>
                    <li className="flex items-center gap-2">
                      <Key className="h-3.5 w-3.5 text-purple-500" />
                      API access
                    </li>
                  </ul>
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                You can change your plan anytime from the billing settings
              </p>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90" disabled={loading}>
              {loading ? (
                'Setting up...'
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Complete Setup
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
