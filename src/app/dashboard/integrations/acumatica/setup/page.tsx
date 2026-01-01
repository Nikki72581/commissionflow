'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { testAcumaticaConnection, saveAcumaticaConnection } from '@/actions/integrations/acumatica/connection';

const API_VERSIONS = [
  '23.200.001',
  '24.100.001',
  '24.200.001',
  '25.100.001',
];

export default function AcumaticaSetupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    instanceUrl: '',
    apiVersion: '24.200.001',
    companyId: '',
    username: '',
    password: '',
  });

  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear test result when form changes
    if (testResult) {
      setTestResult(null);
    }
  };

  const handleTestConnection = async () => {
    console.log('[Client] handleTestConnection called');
    setTesting(true);
    setTestResult(null);

    try {
      console.log('[Client] Testing connection with:', {
        instanceUrl: formData.instanceUrl,
        apiVersion: formData.apiVersion,
        companyId: formData.companyId,
        username: formData.username,
        // Don't log password
      });

      console.log('[Client] Calling testAcumaticaConnection...');
      const result = await testAcumaticaConnection(formData);
      console.log('[Client] Test result received:', JSON.stringify(result));

      if (!result) {
        console.error('[Client] Result is null or undefined');
        const errorResult = {
          success: false as const,
          error: 'No response from server',
        };
        setTestResult(errorResult);
        console.log('[Client] Set error result:', JSON.stringify(errorResult));
        return;
      }

      // Force a new object to ensure React detects the change
      const finalResult = {
        success: result.success,
        error: result.error,
      };
      console.log('[Client] Setting test result:', JSON.stringify(finalResult));
      setTestResult(finalResult);
      console.log('[Client] Test result state updated');
    } catch (error) {
      console.error('[Client] Test connection error:', error);
      const errorResult = {
        success: false as const,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      };
      setTestResult(errorResult);
      console.log('[Client] Set exception result:', JSON.stringify(errorResult));
    } finally {
      console.log('[Client] Setting testing to false');
      setTesting(false);
    }
  };

  const handleSaveAndContinue = async () => {
    setSaving(true);

    try {
      const result = await saveAcumaticaConnection(formData);

      if (result.success) {
        // Navigate to next step (salesperson mapping)
        router.push('/dashboard/integrations/acumatica/setup/salespeople');
      } else {
        setTestResult({
          success: false,
          error: result.error || 'Failed to save connection',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: 'An unexpected error occurred',
      });
    } finally {
      setSaving(false);
    }
  };

  const isFormValid =
    formData.instanceUrl &&
    formData.apiVersion &&
    formData.companyId &&
    formData.username &&
    formData.password;

  const canProceed = testResult?.success === true;

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
          Connect to Acumatica
        </h1>
        <p className="text-muted-foreground mt-2">
          Step 1 of 6: Enter your Acumatica instance credentials
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
          style={{ width: '16.67%' }}
        />
      </div>

      <Card className="border-purple-500/20">
        <CardHeader>
          <CardTitle>Connection Settings</CardTitle>
          <CardDescription>
            Enter your Acumatica instance details. You can find these in your
            Acumatica admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instance URL */}
          <div className="space-y-2">
            <Label htmlFor="instanceUrl">
              Instance URL <span className="text-red-500">*</span>
            </Label>
            <Input
              id="instanceUrl"
              type="url"
              placeholder="https://yourcompany.acumatica.com"
              value={formData.instanceUrl}
              onChange={(e) => handleInputChange('instanceUrl', e.target.value)}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              The full URL of your Acumatica instance (must use HTTPS)
            </p>
          </div>

          {/* API Version */}
          <div className="space-y-2">
            <Label htmlFor="apiVersion">
              API Version <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.apiVersion}
              onValueChange={(value) => handleInputChange('apiVersion', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {API_VERSIONS.map((version) => (
                  <SelectItem key={version} value={version}>
                    {version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Select the API version that matches your Acumatica instance
            </p>
          </div>

          {/* Company ID */}
          <div className="space-y-2">
            <Label htmlFor="companyId">
              Company ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="companyId"
              placeholder="MYCOMPANY"
              value={formData.companyId}
              onChange={(e) => handleInputChange('companyId', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Your Acumatica tenant/company identifier
            </p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">
              Username <span className="text-red-500">*</span>
            </Label>
            <Input
              id="username"
              autoComplete="username"
              placeholder="admin"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              API user with access to Sales Invoice, Salesperson, and Customer endpoints
            </p>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Password will be encrypted and stored securely
            </p>
          </div>

          {/* Test Result */}
          {testResult && (
            <Alert
              variant={testResult.success ? 'default' : 'destructive'}
              className={
                testResult.success
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : ''
              }
            >
              <div className="flex items-start gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 mt-0.5" />
                )}
                <AlertDescription>
                  {testResult.success
                    ? 'Connection successful! You can proceed to the next step.'
                    : `Connection failed: ${testResult.error}`}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleTestConnection}
              disabled={!isFormValid || testing}
              variant="outline"
              className="flex-1"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>

            <Button
              onClick={handleSaveAndContinue}
              disabled={!canProceed || saving}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save & Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
        <CardHeader>
          <CardTitle className="text-lg">Need Help Finding Your Credentials?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Instance URL:</strong> This is the web address you use to access Acumatica
            (e.g., https://yourcompany.acumatica.com)
          </p>
          <p>
            <strong>API Version:</strong> Found in Acumatica under System → Web Services → Contract-Based API
          </p>
          <p>
            <strong>Company ID:</strong> The tenant name shown in the login screen or company selector
          </p>
          <p>
            <strong>Credentials:</strong> We recommend creating a dedicated API user with read-only access to Sales Invoice, Salesperson, and Customer screens
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
