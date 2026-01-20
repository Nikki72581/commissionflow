import { NextRequest } from "next/server";
import { withApiAuth, ApiContext } from "@/lib/api-middleware";
import {
  createSuccessResponse,
  createErrorResponse,
  ApiErrorType,
  handleApiError,
} from "@/lib/api-utils";
import { prisma } from "@/lib/db";

/**
 * GET /api/v1/commissions/:id
 * Get a single commission calculation with detailed explanation
 */
export const GET = withApiAuth(
  async (
    request: NextRequest,
    context: ApiContext,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    try {
      const { id } = await params;
      const commission = await prisma.commissionCalculation.findFirst({
        where: {
          id: id,
          organizationId: context.organizationId,
        },
        include: {
          salesTransaction: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
              client: {
                select: {
                  id: true,
                  name: true,
                  tier: true,
                },
              },
              productCategory: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          commissionPlan: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      if (!commission) {
        return createErrorResponse(
          ApiErrorType.NOT_FOUND,
          "Commission calculation not found",
        );
      }

      // Build explanation from metadata if available
      // The metadata JSON contains calculation details stored during commission calculation
      const metadata = commission.metadata as Record<string, unknown> | null;

      const explanation = {
        ruleTrace: metadata?.ruleTrace || [],
        calculation: {
          saleAmount: commission.salesTransaction.amount,
          calculatedAmount: commission.amount,
          finalAmount: commission.amount,
          ...(metadata?.calculation || {}),
        },
        inputSnapshot: {
          saleAmount: commission.salesTransaction.amount,
          clientTier: commission.salesTransaction.client?.tier || null,
          productCategory:
            commission.salesTransaction.productCategory?.name || null,
          ...(metadata?.inputSnapshot || {}),
        },
      };

      return createSuccessResponse({
        ...commission,
        explanation,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { requiredScope: "commissions:read" },
);
