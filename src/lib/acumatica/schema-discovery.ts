/**
 * Acumatica Schema Discovery Service
 *
 * Dynamically discovers available entities, fields, and data sources
 * from a specific Acumatica instance.
 */

import { AcumaticaClient } from "./client";
import { DataSourceType } from "@prisma/client";
import {
  DiscoveredSchema,
  EntityInfo,
  FieldInfo,
  InquiryInfo,
  AcumaticaFieldType,
} from "./config-types";
import { prisma } from "@/lib/prisma";

// ============================================
// Schema Discovery Service
// ============================================

export class SchemaDiscoveryService {
  /**
   * Discover available REST API entities
   */
  static async discoverRestApiEntities(
    client: AcumaticaClient
  ): Promise<EntityInfo[]> {
    // Standard Acumatica entities commonly used for invoice data
    const standardEntities: EntityInfo[] = [
      {
        name: "Invoice",
        endpoint: `/entity/Default/${client.apiVersion}/Invoice`,
        displayName: "AR Invoice & Memos",
        description: "Accounts Receivable invoices and credit/debit memos",
        screenId: "AR301000",
      },
      {
        name: "SalesInvoice",
        endpoint: `/entity/Default/${client.apiVersion}/SalesInvoice`,
        displayName: "Sales Order Invoices",
        description: "Invoices created from Sales Orders",
        screenId: "SO303000",
      },
      {
        name: "SalesOrder",
        endpoint: `/entity/Default/${client.apiVersion}/SalesOrder`,
        displayName: "Sales Orders",
        description: "Sales Order documents",
        screenId: "SO301000",
      },
    ];

    // TODO: In the future, we could dynamically discover all available entities
    // by querying the Acumatica metadata endpoint, but for now we use the standard set

    return standardEntities;
  }

  /**
   * Get the schema for a specific REST API entity
   */
  static async getRestApiEntitySchema(
    client: AcumaticaClient,
    entityName: string
  ): Promise<FieldInfo[]> {
    try {
      // Fetch the ad-hoc schema for the entity
      const schemaUrl = `/entity/Default/${client.apiVersion}/${entityName}/$adHocSchema`;

      const response = await client.makeRequest("GET", schemaUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch schema for ${entityName}: ${response.status} ${response.statusText}`
        );
      }

      const schemaData = await response.json();

      // Parse the schema and extract field information
      return this.parseRestApiSchema(schemaData, entityName);
    } catch (error) {
      console.error(`Error fetching REST API schema for ${entityName}:`, error);
      throw error;
    }
  }

  /**
   * Parse REST API schema data into FieldInfo array
   */
  private static parseRestApiSchema(
    schemaData: any,
    entityName: string
  ): FieldInfo[] {
    const fields: FieldInfo[] = [];

    // The schema structure varies by Acumatica version, but typically:
    // - schemaData.fields or schemaData.properties contains field definitions
    // - custom fields are prefixed with "custom/"

    const properties = schemaData.fields || schemaData.properties || schemaData;

    for (const [fieldName, fieldDef] of Object.entries(properties)) {
      const def = fieldDef as any;

      fields.push({
        name: fieldName,
        displayName: def.displayName || fieldName,
        type: this.mapAcumaticaType(def.type),
        description: def.description,
        isRequired: def.required === true,
        isCustom: fieldName.startsWith("custom/"),
        isNested: fieldName.includes("/"),
        parentEntity: this.getParentEntity(fieldName),
      });
    }

    return fields;
  }

  /**
   * Discover available Generic Inquiries exposed via OData
   */
  static async discoverGenericInquiries(
    client: AcumaticaClient
  ): Promise<InquiryInfo[]> {
    try {
      // Fetch the OData metadata for Generic Inquiries
      const metadataUrl = `/api/odata/gi/$metadata`;

      const response = await client.makeRequest("GET", metadataUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch Generic Inquiry metadata: ${response.status} ${response.statusText}`
        );
      }

      const metadataXml = await response.text();

      // Parse the OData metadata XML
      return this.parseGenericInquiryMetadata(metadataXml, client.apiVersion);
    } catch (error) {
      console.error("Error fetching Generic Inquiry metadata:", error);
      // Return empty array on error (GI might not be configured)
      return [];
    }
  }

  /**
   * Get the schema for a specific Generic Inquiry
   */
  static async getGenericInquirySchema(
    client: AcumaticaClient,
    inquiryName: string
  ): Promise<FieldInfo[]> {
    try {
      // Generic Inquiries expose their schema through OData metadata
      const metadataUrl = `/api/odata/gi/$metadata`;

      const response = await client.makeRequest("GET", metadataUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch Generic Inquiry schema: ${response.status} ${response.statusText}`
        );
      }

      const metadataXml = await response.text();

      // Parse the metadata for this specific inquiry
      return this.parseGenericInquirySchema(metadataXml, inquiryName);
    } catch (error) {
      console.error(
        `Error fetching Generic Inquiry schema for ${inquiryName}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Parse Generic Inquiry OData metadata XML
   */
  private static parseGenericInquiryMetadata(
    metadataXml: string,
    apiVersion: string
  ): InquiryInfo[] {
    const inquiries: InquiryInfo[] = [];

    // Simple XML parsing - look for EntitySet elements
    // In a production system, you'd use a proper XML parser
    const entitySetRegex = /<EntitySet Name="([^"]+)"/g;
    let match;

    while ((match = entitySetRegex.exec(metadataXml)) !== null) {
      const inquiryName = match[1];

      inquiries.push({
        name: inquiryName,
        inquiryName: inquiryName,
        endpoint: `/api/odata/gi/${inquiryName}`,
        displayName: inquiryName,
        description: `Generic Inquiry: ${inquiryName}`,
        isODataExposed: true,
      });
    }

    return inquiries;
  }

  /**
   * Parse Generic Inquiry schema from OData metadata
   */
  private static parseGenericInquirySchema(
    metadataXml: string,
    inquiryName: string
  ): FieldInfo[] {
    const fields: FieldInfo[] = [];

    // Find the EntityType definition for this inquiry
    const entityTypeRegex = new RegExp(
      `<EntityType Name="${inquiryName}"[\\s\\S]*?</EntityType>`,
      "g"
    );
    const entityTypeMatch = entityTypeRegex.exec(metadataXml);

    if (!entityTypeMatch) {
      return fields;
    }

    const entityTypeDef = entityTypeMatch[0];

    // Parse Property elements
    const propertyRegex = /<Property Name="([^"]+)" Type="([^"]+)"(.*?)\/>/g;
    let match;

    while ((match = propertyRegex.exec(entityTypeDef)) !== null) {
      const fieldName = match[1];
      const fieldType = match[2];
      const attributes = match[3];

      fields.push({
        name: fieldName,
        displayName: fieldName,
        type: this.mapODataType(fieldType),
        isRequired: attributes.includes('Nullable="false"'),
        isCustom: false,
        isNested: false,
      });
    }

    return fields;
  }

  /**
   * Discover available DAC entities (advanced)
   */
  static async discoverDacEntities(
    client: AcumaticaClient
  ): Promise<EntityInfo[]> {
    try {
      // Fetch the OData metadata for DAC entities
      const metadataUrl = `/api/odata/dac/$metadata`;

      const response = await client.makeRequest("GET", metadataUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch DAC metadata: ${response.status} ${response.statusText}`
        );
      }

      const metadataXml = await response.text();

      // Parse the OData metadata XML for DAC entities
      return this.parseDacMetadata(metadataXml);
    } catch (error) {
      console.error("Error fetching DAC metadata:", error);
      return [];
    }
  }

  /**
   * Get the schema for a specific DAC entity
   */
  static async getDacEntitySchema(
    client: AcumaticaClient,
    dacName: string
  ): Promise<FieldInfo[]> {
    try {
      const metadataUrl = `/api/odata/dac/$metadata`;

      const response = await client.makeRequest("GET", metadataUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch DAC schema: ${response.status} ${response.statusText}`
        );
      }

      const metadataXml = await response.text();

      // Parse the metadata for this specific DAC
      return this.parseDacSchema(metadataXml, dacName);
    } catch (error) {
      console.error(`Error fetching DAC schema for ${dacName}:`, error);
      throw error;
    }
  }

  /**
   * Parse DAC OData metadata
   */
  private static parseDacMetadata(metadataXml: string): EntityInfo[] {
    const entities: EntityInfo[] = [];

    // Simple XML parsing - look for EntitySet elements
    const entitySetRegex = /<EntitySet Name="([^"]+)"/g;
    let match;

    while ((match = entitySetRegex.exec(metadataXml)) !== null) {
      const dacName = match[1];

      entities.push({
        name: dacName,
        endpoint: `/api/odata/dac/${dacName}`,
        displayName: dacName,
        description: `DAC: ${dacName}`,
      });
    }

    return entities;
  }

  /**
   * Parse DAC schema from OData metadata
   */
  private static parseDacSchema(
    metadataXml: string,
    dacName: string
  ): FieldInfo[] {
    // Similar to Generic Inquiry schema parsing
    return this.parseGenericInquirySchema(metadataXml, dacName);
  }

  /**
   * Get sample data from a data source for preview
   */
  static async getSampleData(
    client: AcumaticaClient,
    dataSource: { type: DataSourceType; entity: string },
    limit: number = 10
  ): Promise<any[]> {
    try {
      let query = "";

      if (dataSource.type === "REST_API") {
        query = `/entity/Default/${client.apiVersion}/${dataSource.entity}?$top=${limit}`;
      } else if (dataSource.type === "GENERIC_INQUIRY") {
        query = `/api/odata/gi/${dataSource.entity}?$top=${limit}`;
      } else if (dataSource.type === "DAC_ODATA") {
        query = `/api/odata/dac/${dataSource.entity}?$top=${limit}`;
      }

      const response = await client.makeRequest("GET", query);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch sample data: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Handle different response formats
      if (data.value) {
        return data.value;
      } else if (Array.isArray(data)) {
        return data;
      } else {
        return [data];
      }
    } catch (error) {
      console.error("Error fetching sample data:", error);
      throw error;
    }
  }

  /**
   * Cache discovered schema in database
   */
  static async cacheSchema(
    integrationId: string,
    schema: DiscoveredSchema
  ): Promise<void> {
    await prisma.acumaticaIntegration.update({
      where: { id: integrationId },
      data: {
        discoveredSchema: schema as any,
        schemaLastUpdated: new Date(),
      },
    });
  }

  /**
   * Get cached schema from database
   */
  static async getCachedSchema(
    integrationId: string
  ): Promise<DiscoveredSchema | null> {
    const integration = await prisma.acumaticaIntegration.findUnique({
      where: { id: integrationId },
      select: {
        discoveredSchema: true,
        schemaLastUpdated: true,
      },
    });

    if (!integration?.discoveredSchema) {
      return null;
    }

    return integration.discoveredSchema as unknown as DiscoveredSchema;
  }

  /**
   * Build a complete discovered schema from an entity
   */
  static async buildDiscoveredSchema(
    client: AcumaticaClient,
    dataSourceType: DataSourceType,
    entityName: string
  ): Promise<DiscoveredSchema> {
    let fields: FieldInfo[] = [];
    let endpoint = "";

    if (dataSourceType === "REST_API") {
      fields = await this.getRestApiEntitySchema(client, entityName);
      endpoint = `/entity/Default/${client.apiVersion}/${entityName}`;
    } else if (dataSourceType === "GENERIC_INQUIRY") {
      fields = await this.getGenericInquirySchema(client, entityName);
      endpoint = `/api/odata/gi/${entityName}`;
    } else if (dataSourceType === "DAC_ODATA") {
      fields = await this.getDacEntitySchema(client, entityName);
      endpoint = `/api/odata/dac/${entityName}`;
    }

    const customFieldCount = fields.filter((f) => f.isCustom).length;
    const nestedEntities = [
      ...new Set(fields.filter((f) => f.isNested).map((f) => f.parentEntity!)),
    ];

    return {
      dataSourceType,
      entity: entityName,
      endpoint,
      fields,
      discoveredAt: new Date().toISOString(),
      apiVersion: client.apiVersion,
      totalFields: fields.length,
      customFieldCount,
      nestedEntities,
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Map Acumatica type to our type system
   */
  private static mapAcumaticaType(acumaticaType: string): AcumaticaFieldType {
    const typeMap: Record<string, AcumaticaFieldType> = {
      string: "string",
      String: "string",
      decimal: "decimal",
      Decimal: "decimal",
      int: "int",
      Int32: "int",
      Integer: "int",
      date: "date",
      Date: "date",
      datetime: "datetime",
      DateTime: "datetime",
      boolean: "boolean",
      Boolean: "boolean",
      guid: "guid",
      Guid: "guid",
    };

    return typeMap[acumaticaType] || "string";
  }

  /**
   * Map OData type to our type system
   */
  private static mapODataType(odataType: string): AcumaticaFieldType {
    // OData types like "Edm.String", "Edm.Decimal", etc.
    const cleanType = odataType.replace("Edm.", "");
    return this.mapAcumaticaType(cleanType);
  }

  /**
   * Extract parent entity from nested field path
   */
  private static getParentEntity(fieldPath: string): string | undefined {
    if (!fieldPath.includes("/")) {
      return undefined;
    }

    const parts = fieldPath.split("/");
    return parts[0];
  }

  /**
   * Enrich fields with sample data
   */
  static enrichFieldsWithSamples(
    fields: FieldInfo[],
    sampleData: any[]
  ): FieldInfo[] {
    if (sampleData.length === 0) {
      return fields;
    }

    const firstRecord = sampleData[0];

    return fields.map((field) => {
      // Get sample value from first record
      const sampleValue = this.getNestedValue(firstRecord, field.name);

      return {
        ...field,
        sampleValue: sampleValue !== undefined ? sampleValue : null,
      };
    });
  }

  /**
   * Get nested value from object using path like "Details/Amount"
   */
  private static getNestedValue(obj: any, path: string): any {
    const parts = path.split("/");
    let value = obj;

    for (const part of parts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }
}
