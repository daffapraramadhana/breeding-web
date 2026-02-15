"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { useApi } from "@/hooks/use-api";
import { BatchPnlDetail } from "@/types/api";
import { formatDate, formatCurrency, formatQuantity, parseDecimal } from "@/lib/utils";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const MOVEMENT_TYPE_STYLES: Record<string, string> = {
  IN: "bg-green-100 text-green-800 border-green-200",
  OUT: "bg-red-100 text-red-800 border-red-200",
};

const MOVEMENT_SOURCE_STYLES: Record<string, string> = {
  PURCHASE: "bg-blue-100 text-blue-800 border-blue-200",
  PRODUCTION_CONSUME: "bg-orange-100 text-orange-800 border-orange-200",
  PRODUCTION_OUTPUT: "bg-purple-100 text-purple-800 border-purple-200",
  SALES: "bg-green-100 text-green-800 border-green-200",
};

const SOURCE_LABELS: Record<string, string> = {
  PURCHASE: "Purchase",
  PRODUCTION_CONSUME: "Production Consume",
  PRODUCTION_OUTPUT: "Production Output",
  SALES: "Sales",
};

export default function BatchPnlDetailPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = use(params);
  const { data, isLoading } = useApi<BatchPnlDetail>(
    `/reports/batch-pnl/${batchId}`
  );

  if (isLoading) return <PageSkeleton />;
  if (!data) return <div>Batch P&L data not found</div>;

  const profit = parseDecimal(data.grossProfit);
  const margin = parseDecimal(data.margin);
  const purchaseCost = parseDecimal(data.costs.purchase);
  const productionCost = parseDecimal(data.costs.productionConsume);
  const revenue = parseDecimal(data.revenue);

  const costChartData = [
    ...(purchaseCost > 0
      ? [{ name: "Purchase Cost", value: purchaseCost }]
      : []),
    ...(productionCost > 0
      ? [{ name: "Production Cost", value: productionCost }]
      : []),
  ];

  const COST_COLORS = ["hsl(217, 91%, 60%)", "hsl(25, 95%, 53%)"];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`P&L: ${data.batch.batchNumber}`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/reports/batch-pnl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      {/* Section A: Batch Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Batch Number</p>
              <p className="font-medium">{data.batch.batchNumber}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Species</p>
              <p className="font-medium">{data.batch.species}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant="outline"
                className={
                  data.batch.status === "ACTIVE"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-slate-100 text-slate-800 border-slate-200"
                }
              >
                {data.batch.status}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Farm</p>
              <p className="font-medium">{data.batch.farm.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Kandang</p>
              <p className="font-medium">{data.batch.kandang.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Period</p>
              <p className="font-medium">
                {formatDate(data.batch.startDate)}
                {" — "}
                {data.batch.endDate ? formatDate(data.batch.endDate) : "Ongoing"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Initial Qty</p>
              <p className="font-medium">
                {data.batch.initialQty.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current Qty</p>
              <p className="font-medium">
                {data.batch.currentQty.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section B: P&L Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.revenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.costs.totalCost)}
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Purchase</span>
                <span>{formatCurrency(data.costs.purchase)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Production</span>
                <span>{formatCurrency(data.costs.productionConsume)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            <DollarSign
              className={`h-4 w-4 ${profit >= 0 ? "text-green-600" : "text-red-600"}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(data.grossProfit)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Margin</CardTitle>
            <Percent
              className={`h-4 w-4 ${margin >= 0 ? "text-green-600" : "text-red-600"}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${margin >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {margin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section C: Cost Breakdown Chart */}
      {costChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={costChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {costChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COST_COLORS[index % COST_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span className="text-sm">Purchase Cost</span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(data.costs.purchase)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-orange-500" />
                      <span className="text-sm">Production Cost</span>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(data.costs.productionConsume)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Cost</span>
                    <span className="font-bold">
                      {formatCurrency(data.costs.totalCost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span className="text-sm">Revenue</span>
                    </div>
                    <span className="font-medium text-green-600">
                      {formatCurrency(data.revenue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section D: Revenue Breakdown Table */}
      {data.revenueBreakdown && data.revenueBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">COGS</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.revenueBreakdown.map((item, idx) => {
                    const itemRevenue = parseDecimal(item.revenue);
                    const itemCost = parseDecimal(item.totalCost);
                    const itemMargin =
                      itemRevenue > 0
                        ? ((itemRevenue - itemCost) / itemRevenue) * 100
                        : 0;
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {item.itemName}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatQuantity(item.quantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          {formatCurrency(item.revenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitCost)}
                        </TableCell>
                        <TableCell className="text-right text-red-600 font-medium">
                          {formatCurrency(item.totalCost)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-medium ${itemMargin >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {itemMargin.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section E: Movement History Table */}
      {data.movements && data.movements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Movement History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Movement #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.movements.map((mv) => (
                    <TableRow key={mv.id}>
                      <TableCell>{formatDate(mv.createdAt)}</TableCell>
                      <TableCell className="font-medium">
                        {mv.movementNumber}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={MOVEMENT_TYPE_STYLES[mv.movementType]}
                        >
                          {mv.movementType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            MOVEMENT_SOURCE_STYLES[mv.movementSource]
                          }
                        >
                          {SOURCE_LABELS[mv.movementSource] || mv.movementSource}
                        </Badge>
                      </TableCell>
                      <TableCell>{mv.itemName}</TableCell>
                      <TableCell className="text-right">
                        {formatQuantity(mv.quantity)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(mv.unitCost)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(mv.totalCost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
