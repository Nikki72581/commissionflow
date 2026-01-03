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
import { Loader2, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Database, FileText, Code2 } from 'lucide-react';
import {
  discoverRestApiEntities,
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
  const [dataSourceType, setDataSourceType] = useState<DataSourceType>('REST_API');
  const [selectedEntity, setSelectedEntity] = useState<string>('');

  const [discovering, setDiscovering] = useState(false);
  const [saving, setSaving] = useState(false);

  const [restApiEntities, setRestApiEntities] = useState<EntityOption[]>([]);
  const [genericInquiries, setGenericInquiries] = useState<EntityOption[]>([]);

  const [error, setError] = useState<string | null>(null);
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
      // Always discover REST API entities (they're standard)
      const entities = await discoverRestApiEntities(integrationId);
      setRestApiEntities(
        entities.map((e) => ({
          name: e.name,
          displayName: e.displayName || e.name,
          description: e.description || '',
          screenId: e.screenId,
        }))
      );

      // Try to discover Generic Inquiries
      try {
        const inquiries = await discoverGenericInquiries(integrationId);
        setGenericInquiries(
          inquiries.map((gi) => ({
            name: gi.name,
            displayName: gi.displayName || gi.name,
            description: gi.description || '',
          }))
        );
      } catch (error) {
        console.warn('Generic Inquiries not available:', error);
        // This is okay - not all Acumatica instances have GI configured
      }

      // Auto-select Invoice if nothing is selected
      if (!selectedEntity && entities.length > 0) {
        const invoiceEntity = entities.find((e) => e.name === 'Invoice');
        if (invoiceEntity) {
          setSelectedEntity(invoiceEntity.name);
        }
      }
    } catch (error) {
      console.error('Failed to discover data sources:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to discover data sources'
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

  const availableEntities =
    dataSourceType === 'REST_API' ? restApiEntities : genericInquiries;

  const canContinue = selectedEntity !== '';
  const hasDiscovered = restApiEntities.length > 0;

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

      {/* Data Source Type Selection */}
      <Card className="border-purple-500/20">
        <CardHeader>
          <CardTitle>Data Source Type</CardTitle>
          <CardDescription>
            Choose how you want to retrieve invoice data from Acumatica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={dataSourceType}
            onValueChange={(value) => {
              setDataSourceType(value as DataSourceType);
              setSelectedEntity(''); // Reset entity selection when changing type
            }}
          >
            {/* REST API Option */}
            <div
              className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                dataSourceType === 'REST_API'
                  ? 'border-purple-500 bg-purple-500/5'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-500/50'
              }`}
              onClick={() => {
                setDataSourceType('REST_API');
                setSelectedEntity('');
              }}
            >
              <RadioGroupItem value="REST_API" id="rest-api" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-5 w-5 text-purple-600" />
                  <Label
                    htmlFor="rest-api"
                    className="text-base font-semibold cursor-pointer"
                  >
                    Standard REST API Entities
                  </Label>
                  <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full">
                    Recommended
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use Acumatica's built-in Invoice, SalesInvoice, or SalesOrder entities
                </p>
                <ul className="mt-2 text-xs text-muted-foreground space-y-1">
                  <li>✓ Works out-of-the-box for most configurations</li>
                  <li>✓ Includes standard fields + custom fields</li>
                  <li>✓ Best for: Standard Acumatica implementations</li>
                </ul>
              </div>
            </div>

            {/* Generic Inquiry Option */}
            <div
              className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                dataSourceType === 'GENERIC_INQUIRY'
                  ? 'border-purple-500 bg-purple-500/5'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-500/50'
              }`}
              onClick={() => {
                setDataSourceType('GENERIC_INQUIRY');
                setSelectedEntity('');
              }}
            >
              <RadioGroupItem value="GENERIC_INQUIRY" id="generic-inquiry" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <Label
                    htmlFor="generic-inquiry"
                    className="text-base font-semibold cursor-pointer"
                  >
                    Generic Inquiry (OData)
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use a pre-configured Generic Inquiry from Acumatica
                </p>
                <ul className="mt-2 text-xs text-muted-foreground space-y-1">
                  <li>✓ Maximum flexibility - any fields, any joins</li>
                  <li>✓ Requires Acumatica admin to create the inquiry</li>
                  <li>✓ Best for: Complex or custom implementations</li>
                </ul>
                {genericInquiries.length === 0 && hasDiscovered && (
                  <Alert className="mt-3 border-yellow-500/50 bg-yellow-500/10">
                    <AlertDescription className="text-xs">
                      No Generic Inquiries found. They must be created in Acumatica and
                      exposed via OData.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* DAC OData Option (Advanced) */}
            <div
              className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer opacity-50 ${
                dataSourceType === 'DAC_ODATA'
                  ? 'border-purple-500 bg-purple-500/5'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <RadioGroupItem value="DAC_ODATA" id="dac-odata" disabled />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Code2 className="h-5 w-5 text-gray-500" />
                  <Label htmlFor="dac-odata" className="text-base font-semibold">
                    Direct DAC Access (Advanced)
                  </Label>
                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-500/10 text-gray-600 dark:text-gray-400 rounded-full">
                    Coming Soon
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Query Acumatica's data access classes directly
                </p>
                <ul className="mt-2 text-xs text-muted-foreground space-y-1">
                  <li>✓ Most flexible, requires technical knowledge</li>
                  <li>✓ Can access any data in the system</li>
                  <li>✓ Best for: Technical users with complex requirements</li>
                </ul>
              </div>
            </div>
          </RadioGroup>

          {/* Discover Button */}
          {!hasDiscovered && (
            <Button
              onClick={handleDiscoverDataSources}
              disabled={discovering}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {discovering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Discovering Data Sources...
                </>
              ) : (
                'Discover Available Data Sources'
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Entity Selection */}
      {hasDiscovered && availableEntities.length > 0 && (
        <Card className="border-purple-500/20">
          <CardHeader>
            <CardTitle>
              Select{' '}
              {dataSourceType === 'REST_API' ? 'Entity' : 'Generic Inquiry'}
            </CardTitle>
            <CardDescription>
              Choose which{' '}
              {dataSourceType === 'REST_API'
                ? 'Acumatica entity'
                : 'Generic Inquiry'}{' '}
              to use as your data source
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
