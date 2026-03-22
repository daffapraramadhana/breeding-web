"use client";

import { useTranslations } from "next-intl";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardTrends } from "@/types/api";

interface SalesTrendChartProps {
  trends: DashboardTrends | null;
}

export function SalesTrendChart({ trends }: SalesTrendChartProps) {
  const t = useTranslations("dashboard");

  const chartConfig: ChartConfig = {
    revenue: { label: t("revenue"), color: "var(--color-chart-1)" },
    orderCount: { label: t("orders"), color: "var(--color-chart-2)" },
  };

  const data = trends?.salesTrend.map((s) => ({
    ...s,
    week: s.week.slice(5), // MM-DD format
  })) ?? [];

  const hasData = data.length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          {t("salesTrend")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t("last30Days")}</p>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" fontSize={12} />
              <YAxis yAxisId="revenue" fontSize={12} />
              <YAxis yAxisId="orders" orientation="right" fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar yAxisId="revenue" dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="orders" type="monotone" dataKey="orderCount" stroke="var(--color-orderCount)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            {t("noData")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
