import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, logApiUsage } from './api-key-service'
import { createErrorResponse, ApiErrorType } from './api-utils'
import { rateLimiter } from './rate-limiter'

export interface ApiContext {
  apiKeyId: string
  organizationId: string
  organization: {
    id: string
    name: string
    planTier: string
  }
  scopes: string[]
  rateLimit: number
}

/**
 * Authenticate API requests using API key
 */
export async function authenticateApiRequest(
  request: NextRequest
): Promise<
  { success: true; context: ApiContext } | { success: false; response: NextResponse }
> {
  // Extract API key from Authorization header
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      response: createErrorResponse(
        ApiErrorType.UNAUTHORIZED,
        'Missing or invalid Authorization header. Use: Authorization: Bearer <api_key>'
      ),
    }
  }

  const apiKey = authHeader.substring(7) // Remove "Bearer "

  // Validate API key
  const keyData = await validateApiKey(apiKey)

  if (!keyData) {
    return {
      success: false,
      response: createErrorResponse(
        ApiErrorType.UNAUTHORIZED,
        'Invalid or expired API key'
      ),
    }
  }

  // Check IP whitelist if configured
  if (keyData.ipWhitelist && keyData.ipWhitelist.length > 0) {
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (!keyData.ipWhitelist.includes(clientIp)) {
      return {
        success: false,
        response: createErrorResponse(
          ApiErrorType.FORBIDDEN,
          'IP address not whitelisted'
        ),
      }
    }
  }

  return {
    success: true,
    context: {
      apiKeyId: keyData.id,
      organizationId: keyData.organizationId,
      organization: keyData.organization,
      scopes: keyData.scopes,
      rateLimit: keyData.rateLimit,
    },
  }
}

/**
 * Check if API key has required scope
 */
export function hasScope(context: ApiContext, requiredScope: string): boolean {
  return context.scopes.includes(requiredScope) || context.scopes.includes('*')
}

/**
 * Higher-order function to wrap API route handlers with authentication
 * Supports both static routes and dynamic routes with params
 */
export function withApiAuth<TRouteContext = unknown>(
  handler: (
    request: NextRequest,
    context: ApiContext,
    routeContext: TRouteContext
  ) => Promise<NextResponse>,
  options?: { requiredScope?: string }
): (request: NextRequest, routeContext: TRouteContext) => Promise<NextResponse>

export function withApiAuth(
  handler: (request: NextRequest, context: ApiContext) => Promise<NextResponse>,
  options?: { requiredScope?: string }
): (request: NextRequest) => Promise<NextResponse>

export function withApiAuth<TRouteContext = unknown>(
  handler:
    | ((
        request: NextRequest,
        context: ApiContext,
        routeContext: TRouteContext
      ) => Promise<NextResponse>)
    | ((request: NextRequest, context: ApiContext) => Promise<NextResponse>),
  options?: { requiredScope?: string }
) {
  return async (
    request: NextRequest,
    routeContext?: TRouteContext
  ): Promise<NextResponse> => {
    const startTime = Date.now()

    // Authenticate request
    const authResult = await authenticateApiRequest(request)

    if (!authResult.success) {
      return authResult.response
    }

    const context = authResult.context

    // Check scope if required
    if (options?.requiredScope && !hasScope(context, options.requiredScope)) {
      return createErrorResponse(
        ApiErrorType.FORBIDDEN,
        `Missing required scope: ${options.requiredScope}`
      )
    }

    // Check rate limit
    const rateLimitResult = await rateLimiter.checkLimit(
      context.apiKeyId,
      context.rateLimit
    )

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: {
            type: 'RATE_LIMIT_EXCEEDED',
            message: 'Rate limit exceeded',
            details: {
              limit: context.rateLimit,
              resetAt: rateLimitResult.resetAt,
            },
          },
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': context.rateLimit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
          },
        }
      )
    }

    try {
      // Execute handler - supports both 2 and 3 parameter signatures
      const response =
        handler.length === 3
          ? await (
              handler as (
                request: NextRequest,
                context: ApiContext,
                routeContext: TRouteContext
              ) => Promise<NextResponse>
            )(request, context, routeContext as TRouteContext)
          : await (
              handler as (
                request: NextRequest,
                context: ApiContext
              ) => Promise<NextResponse>
            )(request, context)
      const duration = Date.now() - startTime

      // Log successful request (fire and forget to avoid blocking)
      logApiUsage({
        apiKeyId: context.apiKeyId,
        organizationId: context.organizationId,
        endpoint: request.nextUrl.pathname,
        method: request.method,
        statusCode: response.status,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0],
        userAgent: request.headers.get('user-agent') || undefined,
        duration,
      }).catch((error) => {
        console.error('Error logging API usage:', error)
      })

      return response
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage =
        error instanceof Error ? error.message : 'Internal error'

      // Log failed request (fire and forget)
      logApiUsage({
        apiKeyId: context.apiKeyId,
        organizationId: context.organizationId,
        endpoint: request.nextUrl.pathname,
        method: request.method,
        statusCode: 500,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0],
        userAgent: request.headers.get('user-agent') || undefined,
        duration,
        errorMessage,
      }).catch((logError) => {
        console.error('Error logging API usage:', logError)
      })

      throw error
    }
  }
}
