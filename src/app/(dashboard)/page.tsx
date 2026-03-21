"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { fetchPaginated } from "@/lib/api";
import { PurchaseOrder, SalesOrder } from "@/types/api";
import { formatQuantity } from "@/lib/utils";

interface DashboardStats {
  activeProjects: number;
  birdPopulation: number;
  avgFcr: string;
  mortalityRate: string;
  openPOs: number;
  pendingSales: number;
  stockAlerts: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeProjects: 0,
    birdPopulation: 0,
    avgFcr: "-",
    mortalityRate: "-",
    openPOs: 0,
    pendingSales: 0,
    stockAlerts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [projects, pos, sos, stocks] = await Promise.allSettled([
          fetchPaginated("/projects", { limit: 1 }),
          fetchPaginated<PurchaseOrder>("/purchase-orders", { limit: 100 }),
          fetchPaginated<SalesOrder>("/sales-orders", { limit: 100 }),
          fetchPaginated("/inventory-stocks", { limit: 100, extra: { stockStatus: "LOW" } }),
        ]);

        const projectTotal = projects.status === "fulfilled" ? (projects.value.meta?.total || 0) : 0;

        const poData = pos.status === "fulfilled" ? pos.value.data : [];
        const soData = sos.status === "fulfilled" ? sos.value.data : [];
        const stockTotal = stocks.status === "fulfilled" ? (stocks.value.meta?.total || 0) : 0;

        const openPOs = poData.filter(
          (po) => po.status === "ORDERED" || po.status === "PROCESSING"
        ).length;

        const pendingSales = soData.filter(
          (so) => so.status === "PENDING_APPROVAL" || so.status === "APPROVED"
        ).length;

        setStats({
          activeProjects: projectTotal,
          birdPopulation: 0, // Placeholder - requires special endpoint
          avgFcr: "-", // Placeholder - requires special endpoint
          mortalityRate: "-", // Placeholder - requires special endpoint
          openPOs,
          pendingSales,
          stockAlerts: stockTotal,
        });
      } catch {
        // silently fail - dashboard shows partial data
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your farm operations"
      />

      {isLoading ? (
        <div className="space-y-6">
          <CardSkeleton />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Hero Banner */}
          <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white">
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-slate-300">Active Projects</p>
                <p className="text-3xl font-bold text-green-400">{stats.activeProjects}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-300">Bird Population</p>
                <p className="text-3xl font-bold text-blue-400">{formatQuantity(stats.birdPopulation)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-300">Avg FCR</p>
                <p className="text-3xl font-bold text-amber-400">{stats.avgFcr}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-300">Mortality Rate</p>
                <p className="text-3xl font-bold text-red-400">{stats.mortalityRate}%</p>
              </div>
            </div>
          </div>

          {/* Operational Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Open POs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.openPOs}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.pendingSales}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.stockAlerts}</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
