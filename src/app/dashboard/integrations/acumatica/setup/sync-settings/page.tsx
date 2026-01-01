'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SyncSettingsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/dashboard/integrations">Integrations</Link>
          <span>/</span>
          <Link href="/dashboard/integrations/acumatica/setup">Acumatica Setup</Link>
          <span>/</span>
          <span>Sync Settings</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sync Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Step 3 of 6: Configure data synchronization settings
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
          style={{ width: '50%' }}
        />
      </div>

      {/* Placeholder Card */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Configuration</CardTitle>
          <CardDescription>
            This page is under construction. The sync settings will allow you to configure
            date ranges, sync frequency, and other import options.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            <p className="mb-4">Coming soon...</p>
            <p className="text-sm">
              In the next step, you'll be able to configure:
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Invoice date range filters</li>
              <li>• Branch and document type filters</li>
              <li>• Import level (invoice total vs line items)</li>
              <li>• Automatic sync schedule</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Link href="/dashboard/integrations/acumatica/setup/salespeople">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Salespeople
          </Button>
        </Link>

        <Button
          onClick={() => router.push('/dashboard/integrations')}
          className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          Continue to Integrations
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
