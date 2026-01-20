"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { DateRange } from "@/lib/date-range";

/**
 * Get organization ID for current user
 */
async function getOrganizationId(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { organizationId: true },
  });

  if (!user?.organizationId) {
    throw new Error("User not associated with an organization");
  }

  return user.organizationId;
}

/**
 * Get comprehensive dashboard statistics (optimized with SQL aggregations)
 *
 * Important: Both sales and commissions are filtered by the transaction date
 * to ensure consistent metrics. The average rate is calculated from commissions
 * that are linked to transactions within the date range.
 */
export async function getDashboardStats(dateRange?: DateRange) {
  try {
    const organizationId = await getOrganizationId();

    // Build date filter for SQL queries
    const dateFilter = dateRange
      ? {
          gte: dateRange.from,
          lte: dateRange.to,
        }
      : undefined;

    // Use SQL aggregations instead of fetching all records
    const [
      salesStats,
      // For commissions, filter by the linked transaction's date for consistency
      commissionsWithTransactionDate,
      activePlansCount,
      activeClientsCount,
      salesPeopleCount,
    ] = await Promise.all([
      // Sales aggregation - filtered by transactionDate
      prisma.salesTransaction.aggregate({
        where: {
          organizationId,
          ...(dateFilter && { transactionDate: dateFilter }),
        },
        _sum: { amount: true },
        _count: true,
      }),
      // All commissions - filtered by linked transaction's date for consistency
      prisma.commissionCalculation.findMany({
        where: {
          organizationId,
          ...(dateFilter && {
            salesTransaction: {
              transactionDate: dateFilter,
            },
          }),
        },
        select: {
          amount: true,
          status: true,
          salesTransaction: {
            select: { amount: true },
          },
        },
      }),
      // Active plans count
      prisma.commissionPlan.count({
        where: { organizationId, isActive: true },
      }),
      // Active clients count
      prisma.client.count({
        where: { organizationId },
      }),
      // Salespeople count
      prisma.user.count({
        where: { organizationId, role: "SALESPERSON" },
      }),
    ]);

    // Calculate commission stats from the filtered results
    const totalSales = salesStats._sum.amount || 0;
    const totalCommissions = commissionsWithTransactionDate.reduce(
      (sum, c) => sum + c.amount,
      0,
    );
    const pendingCommissions = commissionsWithTransactionDate
      .filter((c) => c.status === "PENDING")
      .reduce((sum, c) => sum + c.amount, 0);
    const approvedCommissions = commissionsWithTransactionDate
      .filter((c) => c.status === "APPROVED")
      .reduce((sum, c) => sum + c.amount, 0);
    const paidCommissions = commissionsWithTransactionDate
      .filter((c) => c.status === "PAID")
      .reduce((sum, c) => sum + c.amount, 0);

    // Calculate average rate from the actual commission/sale ratios
    // This ensures the rate is meaningful and capped at a reasonable maximum
    let averageCommissionRate = 0;
    if (totalSales > 0 && commissionsWithTransactionDate.length > 0) {
      // Calculate weighted average based on transaction amounts
      const totalLinkedSales = commissionsWithTransactionDate.reduce(
        (sum, c) => sum + c.salesTransaction.amount,
        0,
      );
      if (totalLinkedSales > 0) {
        averageCommissionRate = (totalCommissions / totalLinkedSales) * 100;
      }
    }

    return {
      success: true,
      data: {
        totalSales,
        salesCount: salesStats._count,
        totalCommissions,
        commissionsCount: commissionsWithTransactionDate.length,
        pendingCommissions,
        pendingCount: commissionsWithTransactionDate.filter(
          (c) => c.status === "PENDING",
        ).length,
        approvedCommissions,
        approvedCount: commissionsWithTransactionDate.filter(
          (c) => c.status === "APPROVED",
        ).length,
        paidCommissions,
        paidCount: commissionsWithTransactionDate.filter(
          (c) => c.status === "PAID",
        ).length,
        averageCommissionRate,
        activePlansCount,
        activeClientsCount,
        salesPeopleCount,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch dashboard stats",
    };
  }
}

/**
 * Get commission trends over time (monthly) - Optimized with minimal data fetching
 *
 * Groups data by transaction date (not calculation date) for consistent reporting
 */
export async function getCommissionTrends({
  months = 12,
  dateRange,
}: {
  months?: number;
  dateRange?: DateRange;
} = {}) {
  try {
    const organizationId = await getOrganizationId();

    // Build date filter based on transaction date for consistency
    const dateFilter = dateRange
      ? {
          gte: dateRange.from,
          lte: dateRange.to,
        }
      : undefined;

    // Fetch only the fields we need for grouping
    // Filter by transaction date, not calculation date
    const calculations = await prisma.commissionCalculation.findMany({
      where: {
        organizationId,
        ...(dateFilter && {
          salesTransaction: {
            transactionDate: dateFilter,
          },
        }),
      },
      select: {
        amount: true,
        salesTransaction: {
          select: {
            amount: true,
            transactionDate: true,
          },
        },
      },
      orderBy: {
        salesTransaction: {
          transactionDate: "asc",
        },
      },
    });

    // Group by month based on transaction date
    const monthlyData = new Map<
      string,
      { sales: number; commissions: number; count: number }
    >();

    calculations.forEach((calc) => {
      const date = new Date(calc.salesTransaction.transactionDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      const existing = monthlyData.get(monthKey) || {
        sales: 0,
        commissions: 0,
        count: 0,
      };
      monthlyData.set(monthKey, {
        sales: existing.sales + calc.salesTransaction.amount,
        commissions: existing.commissions + calc.amount,
        count: existing.count + 1,
      });
    });

    // Convert to array and get last N months
    const trends = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        sales: data.sales,
        commissions: data.commissions,
        count: data.count,
        rate: data.sales > 0 ? (data.commissions / data.sales) * 100 : 0,
      }))
      .slice(-months);

    return {
      success: true,
      data: trends,
    };
  } catch (error) {
    console.error("Error fetching commission trends:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch commission trends",
    };
  }
}

/**
 * Get top performing salespeople - Optimized with selective field fetching
 *
 * Filters by transaction date for consistency with other dashboard metrics
 */
export async function getTopPerformers(
  dateRange?: DateRange,
  limit: number = 10,
) {
  try {
    const organizationId = await getOrganizationId();

    // Build date filter based on transaction date for consistency
    const dateFilter = dateRange
      ? {
          gte: dateRange.from,
          lte: dateRange.to,
        }
      : undefined;

    // Fetch only the fields we need
    // Filter by transaction date, not calculation date
    const calculations = await prisma.commissionCalculation.findMany({
      where: {
        organizationId,
        ...(dateFilter && {
          salesTransaction: {
            transactionDate: dateFilter,
          },
        }),
      },
      select: {
        amount: true,
        userId: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        salesTransaction: {
          select: {
            amount: true,
          },
        },
      },
    });

    // Group by salesperson
    const performanceMap = new Map<
      string,
      {
        userId: string;
        name: string;
        email: string;
        totalSales: number;
        totalCommissions: number;
        salesCount: number;
        averageCommissionRate: number;
      }
    >();

    calculations.forEach((calc) => {
      const userId = calc.user.id;
      const existing = performanceMap.get(userId) || {
        userId,
        name:
          `${calc.user.firstName || ""} ${calc.user.lastName || ""}`.trim() ||
          calc.user.email,
        email: calc.user.email,
        totalSales: 0,
        totalCommissions: 0,
        salesCount: 0,
        averageCommissionRate: 0,
      };

      existing.totalSales += calc.salesTransaction.amount;
      existing.totalCommissions += calc.amount;
      existing.salesCount += 1;

      performanceMap.set(userId, existing);
    });

    // Calculate average commission rate after all data is collected
    const performers = Array.from(performanceMap.values())
      .map((performer) => ({
        ...performer,
        averageCommissionRate:
          performer.totalSales > 0
            ? (performer.totalCommissions / performer.totalSales) * 100
            : 0,
      }))
      .sort((a, b) => b.totalCommissions - a.totalCommissions)
      .slice(0, limit);

    return {
      success: true,
      data: performers,
    };
  } catch (error) {
    console.error("Error fetching top performers:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch top performers",
    };
  }
}

/**
 * Get detailed performance report for a specific salesperson
 *
 * Filters by transaction date for consistency with other dashboard metrics
 */
export async function getSalespersonReport(
  userId: string,
  dateRange?: DateRange,
) {
  try {
    const organizationId = await getOrganizationId();

    // Verify user belongs to organization
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Build date filter based on transaction date for consistency
    const dateFilter = dateRange
      ? {
          gte: dateRange.from,
          lte: dateRange.to,
        }
      : undefined;

    const calculations = await prisma.commissionCalculation.findMany({
      where: {
        organizationId,
        userId,
        ...(dateFilter && {
          salesTransaction: {
            transactionDate: dateFilter,
          },
        }),
      },
      include: {
        salesTransaction: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
        commissionPlan: true,
      },
      orderBy: {
        salesTransaction: {
          transactionDate: "desc",
        },
      },
    });

    const filteredCalculations = calculations;

    // Calculate stats
    const totalSales = filteredCalculations.reduce(
      (sum, calc) => sum + calc.salesTransaction.amount,
      0,
    );
    const totalCommissions = filteredCalculations.reduce(
      (sum, calc) => sum + calc.amount,
      0,
    );
    const pendingCommissions = filteredCalculations
      .filter((calc) => calc.status === "PENDING")
      .reduce((sum, calc) => sum + calc.amount, 0);
    const approvedCommissions = filteredCalculations
      .filter((calc) => calc.status === "APPROVED")
      .reduce((sum, calc) => sum + calc.amount, 0);
    const paidCommissions = filteredCalculations
      .filter((calc) => calc.status === "PAID")
      .reduce((sum, calc) => sum + calc.amount, 0);

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          name:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.email,
          email: user.email,
        },
        summary: {
          totalSales,
          totalCommissions,
          salesCount: filteredCalculations.length,
          averageCommissionRate:
            totalSales > 0 ? (totalCommissions / totalSales) * 100 : 0,
          averageSaleAmount:
            filteredCalculations.length > 0
              ? totalSales / filteredCalculations.length
              : 0,
          pendingCommissions,
          approvedCommissions,
          paidCommissions,
        },
        calculations: filteredCalculations,
      },
    };
  } catch (error) {
    console.error("Error fetching salesperson report:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch salesperson report",
    };
  }
}

/**
 * Get data for CSV export
 *
 * Filters by transaction date for consistency with other dashboard metrics
 */
export async function getCommissionExportData(dateRange?: DateRange) {
  try {
    const organizationId = await getOrganizationId();

    // Build date filter based on transaction date for consistency
    const dateFilter = dateRange
      ? {
          gte: dateRange.from,
          lte: dateRange.to,
        }
      : undefined;

    const calculations = await prisma.commissionCalculation.findMany({
      where: {
        organizationId,
        ...(dateFilter && {
          salesTransaction: {
            transactionDate: dateFilter,
          },
        }),
      },
      include: {
        user: true,
        salesTransaction: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
        commissionPlan: true,
      },
      orderBy: {
        salesTransaction: {
          transactionDate: "desc",
        },
      },
    });

    // Format for export
    const exportData = calculations.map((calc) => ({
      salespersonName:
        `${calc.user.firstName || ""} ${calc.user.lastName || ""}`.trim() ||
        calc.user.email,
      salespersonEmail: calc.user.email,
      saleDate: calc.salesTransaction.transactionDate,
      saleAmount: calc.salesTransaction.amount,
      commissionAmount: calc.amount,
      commissionPercentage: (calc.amount / calc.salesTransaction.amount) * 100,
      projectName: calc.salesTransaction.project?.name || "No Project",
      clientName: calc.salesTransaction.project?.client?.name || "No Client",
      commissionPlan: calc.commissionPlan?.name || "No Plan",
      status: calc.status,
      approvedDate: calc.approvedAt,
      paidDate: "paidAt" in calc ? (calc as any).paidAt : null,
    }));

    return {
      success: true,
      data: exportData,
    };
  } catch (error) {
    console.error("Error fetching export data:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch export data",
    };
  }
}
