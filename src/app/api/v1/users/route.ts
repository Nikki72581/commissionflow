import { NextRequest } from "next/server";
import { withApiAuth, ApiContext } from "@/lib/api-middleware";
import { createSuccessResponse, handleApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { UserRole, Prisma } from "@prisma/client";

/**
 * GET /api/v1/users
 * List users/salespeople
 */
export const GET = withApiAuth(
  async (request: NextRequest, context: ApiContext) => {
    try {
      const { searchParams } = request.nextUrl;
      const page = parseInt(searchParams.get("page") || "1");
      const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
      const skip = (page - 1) * limit;
      const role = searchParams.get("role");

      const where: Prisma.UserWhereInput = {
        organizationId: context.organizationId,
      };

      if (role && Object.values(UserRole).includes(role as UserRole)) {
        where.role = role as UserRole;
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true,
            _count: {
              select: {
                salesTransactions: true,
                commissionCalculations: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip,
        }),
        prisma.user.count({ where }),
      ]);

      return createSuccessResponse({
        users,
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
  { requiredScope: "users:read" },
);
