'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, FileText, Wrench } from 'lucide-react';
import {
  discoverGenericInquiries,
  selectDataSource,
  getDataSourceConfig,
} from '@/actions/integrations/acumatica/data-source';
import { getAcumaticaIntegration } from '@/actions/integrations/acumatica/connection';
import { DataSourceType } from '@prisma/client';

interface EntityOption {
  name: string;
  displayName: string;
  description: string;
  screenId?: string;
}

export default function DataSourceSelectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [integrationId, setIntegrationId] = useState<string | null>(null);
  const [dataSourceType, setDataSourceType] = useState<DataSourceType>('GENERIC_INQUIRY');
  const [selectedEntity, setSelectedEntity] = useState<string>('');

  const [discovering, setDiscovering] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [genericInquiries, setGenericInquiries] = useState<EntityOption[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);
  const [currentConfig, setCurrentConfig] = useState<{
    dataSourceType: DataSourceType;
    dataSourceEntity: string;
  } | null>(null);

  useEffect(() => {
    loadIntegration();
  }, []);

  const loadIntegration = async () => {
    try {
      const integration = await getAcumaticaIntegration();
      if (!integration) {
        router.push('/dashboard/integrations/acumatica/setup');
        return;
      }

      setIntegrationId(integration.id);

      // Load existing configuration if available
      const config = await getDataSourceConfig(integration.id);
      if (config) {
        setCurrentConfig({
          dataSourceType: config.dataSourceType,
          dataSourceEntity: config.dataSourceEntity,
        });
        setDataSourceType(config.dataSourceType);
        setSelectedEntity(config.dataSourceEntity);
      }
    } catch (error) {
      console.error('Failed to load integration:', error);
      setError('Failed to load integration');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscoverDataSources = async () => {
    if (!integrationId) return;

    setDiscovering(true);
    setError(null);

    try {
      console.log('[Data Source Page] Starting Generic Inquiry discovery...');
      console.log('[Data Source Page] Integration ID:', integrationId);

      // Discover Generic Inquiries (the primary data source)
      const inquiries = await discoverGenericInquiries(integrationId);

      console.log('[Data Source Page] Discovery completed. Found inquiries:', inquiries.length);
      console.log('[Data Source Page] Inquiries:', inquiries);

      setGenericInquiries(
        inquiries.map((gi) => ({
          name: gi.name,
          displayName: gi.displayName || gi.name,
          description: gi.description || '',
        }))
      );

      // Auto-select GENERIC_INQUIRY type
      setDataSourceType('GENERIC_INQUIRY');

      if (inquiries.length === 0) {
        console.warn('[Data Source Page] No Generic Inquiries found');
        setError(
          'No Generic Inquiries found. Please check:\n\n' +
          '1. Browser Console (F12) for detailed logs\n' +
          '2. Server terminal for error messages\n' +
          '3. Acumatica Web Service Endpoints (SM207045) - ensure Generic Inquiry OData is enabled\n' +
          '4. Your Generic Inquiry has "Expose via OData" checked and is SAVED\n' +
          '5. Try accessing https://your-instance/api/odata/gi/$metadata in your browser'
        );
      } else {
        console.log('[Data Source Page] Successfully found Generic Inquiries:',
          inquiries.map(i => i.name).join(', '));
      }
    } catch (error) {
      console.error('[Data Source Page] Failed to discover Generic Inquiries:', error);
      console.error('[Data Source Page] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      setError(
        error instanceof Error
          ? `Error: ${error.message}\n\nCheck browser console (F12) for detailed logs.`
          : 'Failed to discover Generic Inquiries. Check browser console (F12) for details.'
      );
    } finally {
      setDiscovering(false);
    }
  };

  const handleContinue = async () => {
    if (!integrationId || !selectedEntity) return;

    setSaving(true);
    setError(null);

    try {
      await selectDataSource(integrationId, dataSourceType, selectedEntity);
      router.push('/dashboard/integrations/acumatica/setup/field-mapping');
    } catch (error) {
      console.error('Failed to select data source:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to select data source'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTestOData = async () => {
    if (!integrationId) return;

    setTesting(true);
    setError(null);
    setDiagnosticResults(null);

    try {
      console.log('[Data Source Page] Running OData diagnostic test...');

      const response = await fetch('/api/acumatica/test-odata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Diagnostic test failed');
      }

      const results = await response.json();
      console.log('[Data Source Page] Diagnostic results:', results);
      setDiagnosticResults(results);

      // Check if any endpoint succeeded
      const successfulEndpoint = results.endpoints.find((e: any) => e.success);
      if (successfulEndpoint) {
        console.log('[Data Source Page] Found working OData endpoint:', successfulEndpoint.url);
      } else {
        console.warn('[Data Source Page] No OData endpoints are accessible');
        setError('No OData endpoints are accessible. See diagnostic results below.');
      }
    } catch (error) {
      console.error('[Data Source Page] Diagnostic test failed:', error);
      setError(
        error instanceof Error
          ? `Diagnostic test failed: ${error.message}`
          : 'Diagnostic test failed'
      );
    } finally {
      setTesting(false);
    }
  };

  const availableEntities = genericInquiries;

  const canContinue = selectedEntity !== '';
  const hasDiscovered = genericInquiries.length > 0;

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
          Choose Your Data Source
        </h1>
        <p className="text-muted-foreground mt-2">
          Step 2 of 7: Select where to retrieve invoice data from Acumatica
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
          style={{ width: '28.57%' }}
        />
      </div>

      {/* Current Config Alert */}
      {currentConfig && (
        <Alert className="border-emerald-500/30 bg-emerald-500/10">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-700 dark:text-emerald-400">
            Data source configured: {currentConfig.dataSourceType} - {currentConfig.dataSourceEntity}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Generic Inquiry Setup */}
      <Card className="border-purple-500/20">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <CardTitle>Generic Inquiry (OData)</CardTitle>
          </div>
          <CardDescription>
            CommissionFlow uses Generic Inquiries to retrieve invoice data from Acumatica.
            This provides maximum flexibility to match your specific Acumatica configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
            <h4 className="font-semibold text-sm mb-2">What you'll need:</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>Create a Generic Inquiry in Acumatica that returns your invoice/commission data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>Publish the Generic Inquiry via OData in Acumatica</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>Click "Discover Generic Inquiries" below to see available inquiries</span>
              </li>
            </ul>
          </div>

          {genericInquiries.length === 0 && hasDiscovered && (
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm">
                No Generic Inquiries found. Make sure you've created a Generic Inquiry in Acumatica and
                exposed it via OData. Check that Generic Inquiry OData is enabled in your Acumatica instance.
              </AlertDescription>
            </Alert>
          )}

          {/* Discover Button */}
          {!hasDiscovered && (
            <div className="space-y-2">
              <Button
                onClick={handleDiscoverDataSources}
                disabled={discovering}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {discovering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Discovering Generic Inquiries...
                  </>
                ) : (
                  'Discover Generic Inquiries'
                )}
              </Button>

              {/* Diagnostic Test Button */}
              <Button
                onClick={handleTestOData}
                disabled={testing}
                variant="outline"
                className="w-full"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Diagnostics...
                  </>
                ) : (
                  <>
                    <Wrench className="mr-2 h-4 w-4" />
                    Test OData Connection (Debug)
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diagnostic Results */}
      {diagnosticResults && (
        <Card className="border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              OData Diagnostic Results
            </CardTitle>
            <CardDescription>
              Tested at {new Date(diagnosticResults.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Instance: {diagnosticResults.instanceUrl}</p>
              <p className="text-sm font-medium">API Version: {diagnosticResults.apiVersion}</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Endpoint Test Results:</h4>
              {diagnosticResults.endpoints.map((endpoint: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    endpoint.success
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-xs font-mono">{endpoint.url}</code>
                    <span
                      className={`text-xs font-semibold ${
                        endpoint.success ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {endpoint.status} {endpoint.statusText}
                    </span>
                  </div>

                  {endpoint.success && endpoint.contentLength && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Received {endpoint.contentLength} characters of metadata
                    </p>
                  )}

                  {endpoint.entitySetCount !== undefined && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold mb-1">
                        Found {endpoint.entitySetCount} EntitySet{endpoint.entitySetCount !== 1 ? 's' : ''}
                      </p>
                      {endpoint.entitySetsFound && endpoint.entitySetsFound.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {endpoint.entitySetsFound.map((name: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-600 rounded"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {endpoint.error && (
                    <p className="text-xs text-red-600 mb-2">Error: {endpoint.error}</p>
                  )}

                  {endpoint.contentPreview && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                        Show response preview
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-900 text-gray-100 rounded overflow-x-auto">
                        {endpoint.contentPreview}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>

            <Alert className="border-blue-500/30 bg-blue-500/10">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs">
                <strong>What to check:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>If all endpoints show 404: Generic Inquiry OData is not enabled in Acumatica</li>
                  <li>If endpoints show 401/403: Authentication or permission issues</li>
                  <li>If endpoint succeeds but no inquiries found: No Generic Inquiries are published via OData</li>
                  <li>Check the response preview for EntitySet elements containing your inquiry names</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Generic Inquiry Selection */}
      {hasDiscovered && availableEntities.length > 0 && (
        <Card className="border-purple-500/20">
          <CardHeader>
            <CardTitle>Select Generic Inquiry</CardTitle>
            <CardDescription>
              Choose which Generic Inquiry to use as your data source
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedEntity} onValueChange={setSelectedEntity}>
              <div className="space-y-3">
                {availableEntities.map((entity) => (
                  <div
                    key={entity.name}
                    className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedEntity === entity.name
                        ? 'border-purple-500 bg-purple-500/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-500/50'
                    }`}
                    onClick={() => setSelectedEntity(entity.name)}
                  >
                    <RadioGroupItem value={entity.name} id={entity.name} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Label
                          htmlFor={entity.name}
                          className="text-base font-semibold cursor-pointer"
                        >
                          {entity.displayName}
                        </Label>
                        {entity.screenId && (
                          <span className="px-2 py-0.5 text-xs font-mono bg-gray-500/10 text-gray-600 dark:text-gray-400 rounded">
                            {entity.screenId}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {entity.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/integrations/acumatica/setup')}
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
              Continue to Field Mapping
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
