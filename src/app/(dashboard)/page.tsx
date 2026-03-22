"use client";

import { PageHeader } from "@/components/shared/page-header";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { useApi } from "@/hooks/use-api";
import { DashboardStats, DashboardTrends } from "@/types/api";
import { DashboardKpiBanner } from "./components/dashboard-kpi-banner";
import { MortalityFcrChart } from "./components/mortality-fcr-chart";
import { ProjectPhaseChart } from "./components/project-phase-chart";
import { SalesTrendChart } from "./components/sales-trend-chart";
import { StockAlertsList } from "./components/stock-alerts-list";
import { OperationalCards } from "./components/operational-cards";
import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { data: stats, isLoading: statsLoading } = useApi<DashboardStats>("/dashboard/stats");
  const { data: trends, isLoading: trendsLoading } = useApi<DashboardTrends>("/dashboard/trends?days=30");

  const isLoading = statsLoading || trendsLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      {isLoading ? (
        <div className="space-y-6">
          <CardSkeleton />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
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
          {/* KPI Banner */}
          {stats && <DashboardKpiBanner stats={stats} />}

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <MortalityFcrChart trends={trends} />
            <ProjectPhaseChart stats={stats} />
          </div>

          {/* Sales + Stock Alerts Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SalesTrendChart trends={trends} />
            <StockAlertsList />
          </div>

          {/* Operational Cards */}
          {stats && <OperationalCards stats={stats} />}
        </>
      )}
    </div>
  );
}
