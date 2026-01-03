'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Info,
} from 'lucide-react';
import {
  saveFilterConfig,
  getFilterConfig,
  getDefaultFilterConfig,
} from '@/actions/integrations/acumatica/filters';
import { getAcumaticaIntegration } from '@/actions/integrations/acumatica/connection';
import type { FilterConfig } from '@/lib/acumatica/config-types';

export default function FiltersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [integrationId, setIntegrationId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Status filters
  const [statusValues, setStatusValues] = useState<string[]>(['Open', 'Closed']);

  // Document type filters
  const [includeInvoice, setIncludeInvoice] = useState(true);
  const [includeCreditMemo, setIncludeCreditMemo] = useState(false);
  const [includeDebitMemo, setIncludeDebitMemo] = useState(false);

  // Date range
  const [startDate, setStartDate] = useState('');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const integration = await getAcumaticaIntegration();
      if (!integration) {
        router.push('/dashboard/integrations/acumatica/setup');
        return;
      }

      setIntegrationId(integration.id);

      // Load existing filter config or defaults
      const existingConfig = await getFilterConfig(integration.id);
      if (existingConfig) {
        setStatusValues(existingConfig.status.allowedValues);

        if (existingConfig.documentType) {
          const types = existingConfig.documentType.allowedValues;
          setIncludeInvoice(types.includes('Invoice'));
          setIncludeCreditMemo(types.includes('Credit Memo'));
          setIncludeDebitMemo(types.includes('Debit Memo'));
        }

        setStartDate(existingConfig.dateRange.startDate.split('T')[0]);
      } else {
        // Set defaults
        const defaults = await getDefaultFilterConfig();
        setStatusValues(defaults.status.allowedValues);
        setStartDate(defaults.dateRange.startDate.split('T')[0]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load filter configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = (status: string, checked: boolean) => {
    if (checked) {
      setStatusValues([...statusValues, status]);
    } else {
      setStatusValues(statusValues.filter((s) => s !== status));
    }
  };

  const handleContinue = async () => {
    if (!integrationId) return;

    setSaving(true);
    setError(null);

    try {
      const documentTypes: string[] = [];
      if (includeInvoice) documentTypes.push('Invoice');
      if (includeCreditMemo) documentTypes.push('Credit Memo');
      if (includeDebitMemo) documentTypes.push('Debit Memo');

      const filterConfig: FilterConfig = {
        status: {
          field: 'Status',
          allowedValues: statusValues,
        },
        documentType: {
          field: 'Type',
          allowedValues: documentTypes,
        },
        dateRange: {
          field: 'Date',
          startDate: new Date(startDate).toISOString(),
        },
      };

      await saveFilterConfig(integrationId, filterConfig);
      router.push('/dashboard/integrations/acumatica/setup/preview');
    } catch (error) {
      console.error('Failed to save filter config:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to save filter configuration'
      );
    } finally {
      setSaving(false);
    }
  };

  const canContinue = statusValues.length > 0 && startDate &&
    (includeInvoice || includeCreditMemo || includeDebitMemo);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
          Configure Data Filters
        </h1>
        <p className="text-muted-foreground mt-2">
          Step 4 of 7: Choose which records to import from Acumatica
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
          style={{ width: '57.14%' }}
        />
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Alert */}
      <Alert className="border-blue-500/30 bg-blue-500/10">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700 dark:text-blue-400">
          These filters determine which invoices will be imported from Acumatica. You can
          adjust these later if needed.
        </AlertDescription>
      </Alert>

      {/* Status Filter */}
      <Card className="border-purple-500/20">
        <CardHeader>
          <CardTitle>
            Status Filter <span className="text-red-500">*</span>
          </CardTitle>
          <CardDescription>
            Import records with these statuses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {['Hold', 'Balanced', 'Open', 'Closed', 'Voided'].map((status) => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${status.toLowerCase()}`}
                checked={statusValues.includes(status)}
                onCheckedChange={(checked) =>
                  handleStatusToggle(status, checked as boolean)
                }
              />
              <Label
                htmlFor={`status-${status.toLowerCase()}`}
                className="text-sm font-normal cursor-pointer"
              >
                {status}
                {status === 'Open' && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (released, awaiting payment)
                  </span>
                )}
                {status === 'Closed' && (
                  <span className="ml-2 text-xs text-muted-foreground">(paid)</span>
                )}
              </Label>
            </div>
          ))}
          {statusValues.length === 0 && (
            <p className="text-sm text-red-500">
              At least one status must be selected
            </p>
          )}
        </CardContent>
      </Card>

      {/* Document Type Filter */}
      <Card className="border-purple-500/20">
        <CardHeader>
          <CardTitle>
            Document Type Filter <span className="text-red-500">*</span>
          </CardTitle>
          <CardDescription>
            Import these document types
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="type-invoice"
              checked={includeInvoice}
              onCheckedChange={(checked) => setIncludeInvoice(checked as boolean)}
            />
            <Label
              htmlFor="type-invoice"
              className="text-sm font-normal cursor-pointer"
            >
              Invoice
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="type-credit-memo"
              checked={includeCreditMemo}
              onCheckedChange={(checked) => setIncludeCreditMemo(checked as boolean)}
            />
            <Label
              htmlFor="type-credit-memo"
              className="text-sm font-normal cursor-pointer"
            >
              Credit Memo
              <span className="ml-2 text-xs text-muted-foreground">
                (creates negative amounts)
              </span>
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="type-debit-memo"
              checked={includeDebitMemo}
              onCheckedChange={(checked) => setIncludeDebitMemo(checked as boolean)}
            />
            <Label
              htmlFor="type-debit-memo"
              className="text-sm font-normal cursor-pointer"
            >
              Debit Memo
            </Label>
          </div>

          {!includeInvoice && !includeCreditMemo && !includeDebitMemo && (
            <p className="text-sm text-red-500">
              At least one document type must be selected
            </p>
          )}
        </CardContent>
      </Card>

      {/* Date Range Filter */}
      <Card className="border-purple-500/20">
        <CardHeader>
          <CardTitle>
            Date Range <span className="text-red-500">*</span>
          </CardTitle>
          <CardDescription>
            Import invoices from this date forward
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">
              Start Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            <p className="text-sm text-muted-foreground">
              Only invoices on or after this date will be imported
            </p>
          </div>

          <Alert className="border-yellow-500/30 bg-yellow-500/10">
            <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> There is no end date. The integration will continuously
              sync new invoices as they are created in Acumatica.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Branch Filter - Coming Soon */}
      <Card className="border-gray-500/20 opacity-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Branch Filter</CardTitle>
              <CardDescription>Filter by specific branches (optional)</CardDescription>
            </div>
            <span className="px-2 py-1 text-xs font-medium bg-gray-500/10 text-gray-600 dark:text-gray-400 rounded-full">
              Coming Soon
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Advanced branch filtering will be available in a future update.
          </p>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/integrations/acumatica/setup/field-mapping')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Button
          onClick={handleContinue}
          disabled={!canContinue || saving}
          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue to Preview
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
