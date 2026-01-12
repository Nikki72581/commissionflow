import { NextResponse } from 'next/server'
import { generateOpenApiSpec } from '@/lib/openapi-generator'

/**
 * GET /api/v1/openapi.json
 * Returns the OpenAPI 3.0 specification for the CommissionFlow API
 * This endpoint is public (no authentication required)
 */
export async function GET() {
  const spec = generateOpenApiSpec()
  return NextResponse.json(spec)
}
