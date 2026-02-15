"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { formatCurrency } from "@/lib/utils";
import { fetchPaginated, fetchApi } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import {
  Layers,
  Package,
  ShoppingCart,
  FileText,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface KPIData {
  activeBatches: number;
  totalItems: number;
  recentPOs: number;
  recentSOs: number;
  poTotal: number;
  soTotal: number;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function DashboardPage() {
  const [kpi, setKpi] = useState<KPIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [batches, items, pos, sos] = await Promise.all([
          fetchPaginated("/batches", { limit: 1 }),
          fetchPaginated("/items", { limit: 1 }),
          fetchPaginated("/purchase-orders", { limit: 100 }),
          fetchPaginated("/sales-orders", { limit: 100 }),
        ]);

        const poData = pos.data as Array<{ status: string; totalAmount: string }>;
        const soData = sos.data as Array<{ status: string; totalAmount: string }>;

        const poTotal = poData.reduce(
          (sum, po) => sum + parseFloat(po.totalAmount || "0"),
          0
        );
        const soTotal = soData.reduce(
          (sum, so) => sum + parseFloat(so.totalAmount || "0"),
          0
        );

        // Status breakdown
        const statusCount: Record<string, number> = {};
        [...poData, ...soData].forEach((doc) => {
          statusCount[doc.status] = (statusCount[doc.status] || 0) + 1;
        });
        setStatusData(
          Object.entries(statusCount).map(([name, value]) => ({ name, value }))
        );

        setKpi({
          activeBatches: batches.meta?.total || 0,
          totalItems: items.meta?.total || 0,
          recentPOs: pos.meta?.total || 0,
          recentSOs: sos.meta?.total || 0,
          poTotal,
          soTotal,
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Batches
                </CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi?.activeBatches || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total animal batches
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Items
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi?.totalItems || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Registered inventory items
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Purchase Orders
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi?.recentPOs || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total purchase orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Sales Orders
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi?.recentSOs || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total sales orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Purchasing
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(kpi?.poTotal || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Outstanding payables
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Sales
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(kpi?.soTotal || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Outstanding receivables
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Purchasing vs Sales</CardTitle>
                <CardDescription>Total value comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        name: "Total",
                        Purchasing: kpi?.poTotal || 0,
                        Sales: kpi?.soTotal || 0,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="Purchasing" fill="hsl(var(--chart-1))" />
                    <Bar dataKey="Sales" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Document Status</CardTitle>
                <CardDescription>
                  Breakdown of PO and SO statuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {statusData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    No document data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
