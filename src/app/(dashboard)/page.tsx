"use client";

import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { DashboardStats, DashboardTrends } from "@/types/api";
import { DashboardKpiBanner } from "./components/dashboard-kpi-banner";
import { MortalityFcrChart } from "./components/mortality-fcr-chart";
import { ProjectPhaseChart } from "./components/project-phase-chart";
import { SalesTrendChart } from "./components/sales-trend-chart";
import { StockAlertsList } from "./components/stock-alerts-list";
import { OperationalCards } from "./components/operational-cards";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useApi<DashboardStats>("/dashboard/stats");
  const { data: trends, isLoading: trendsLoading } = useApi<DashboardTrends>("/dashboard/trends?days=30");

  const isLoading = statsLoading || trendsLoading;

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      ) : (
        <>
          {/* KPI Banner with Greeting */}
          {stats && <DashboardKpiBanner stats={stats} trends={trends} userName={user?.name} />}

          {/* Charts + Alerts Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.6fr_1fr]">
            <MortalityFcrChart trends={trends} />
            <StockAlertsList />
          </div>

          {/* Operations Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SalesTrendChart trends={trends} />
            {stats && <OperationalCards stats={stats} />}
          </div>

          {/* Project Phase Chart */}
          {stats && <ProjectPhaseChart stats={stats} />}
        </>
      )}
    </div>
  );
}
