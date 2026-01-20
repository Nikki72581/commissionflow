import { NextRequest } from "next/server";
import { withApiAuth, ApiContext } from "@/lib/api-middleware";
import { createSuccessResponse, handleApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { CommissionStatus, Prisma } from "@prisma/client";

/**
 * GET /api/v1/commissions
 * List commission calculations
 */
export const GET = withApiAuth(
  async (request: NextRequest, context: ApiContext) => {
    try {
      const { searchParams } = request.nextUrl;
      const page = parseInt(searchParams.get("page") || "1");
      const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
      const skip = (page - 1) * limit;
      const status = searchParams.get("status");
      const userId = searchParams.get("userId");
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");

      const where: Prisma.CommissionCalculationWhereInput = {
        organizationId: context.organizationId,
      };

      if (
        status &&
        Object.values(CommissionStatus).includes(status as CommissionStatus)
      ) {
        where.status = status as CommissionStatus;
      }

      if (userId) {
        where.userId = userId;
      }

      if (startDate || endDate) {
        where.calculatedAt = {};
        if (startDate) {
          where.calculatedAt.gte = new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          where.calculatedAt.lte = end;
        }
      }

      const [commissions, total] = await Promise.all([
        prisma.commissionCalculation.findMany({
          where,
          include: {
            salesTransaction: {
              select: {
                id: true,
                amount: true,
                transactionDate: true,
                description: true,
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
              },
            },
          },
          orderBy: { calculatedAt: "desc" },
          take: limit,
          skip,
        }),
        prisma.commissionCalculation.count({ where }),
      ]);

      return createSuccessResponse({
        commissions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { requiredScope: "commissions:read" },
);
