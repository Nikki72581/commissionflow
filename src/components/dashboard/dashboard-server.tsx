import {
  getDashboardStats,
  getCommissionTrends,
  getTopPerformers,
} from "@/app/actions/dashboard";
import { getDateRangeFromPreset } from "@/lib/date-range";
import { DashboardContent } from "./dashboard-content";
import { DashboardSkeleton } from "./dashboard-skeleton";

export async function DashboardServer() {
  const defaultDateRange = getDateRangeFromPreset("thisMonth");

  const [statsResult, trendsResult, performersResult] = await Promise.all([
    getDashboardStats(defaultDateRange),
    getCommissionTrends({ dateRange: defaultDateRange }),
    getTopPerformers(defaultDateRange, 10),
  ]);

  if (!statsResult.success || !statsResult.data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Failed to load dashboard statistics
        </p>
      </div>
    );
  }

  const trends = (trendsResult.success ? trendsResult.data : []) || [];
  const performers =
    (performersResult.success ? performersResult.data : []) || [];

  return (
    <DashboardContent
      initialStats={statsResult.data}
      initialTrends={trends}
      initialPerformers={performers}
      initialDateRange={defaultDateRange}
    />
  );
}
