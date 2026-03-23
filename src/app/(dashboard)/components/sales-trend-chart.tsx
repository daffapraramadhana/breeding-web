"use client";

import { useTranslations } from "next-intl";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { DashboardTrends } from "@/types/api";

interface SalesTrendChartProps {
  trends: DashboardTrends | null;
}

export function SalesTrendChart({ trends }: SalesTrendChartProps) {
  const t = useTranslations("dashboard");

  const chartConfig: ChartConfig = {
    revenue: { label: t("revenue"), color: "var(--accent-green)" },
    orderCount: { label: t("orders"), color: "var(--accent-purple)" },
  };

  const data = trends?.salesTrend.map((s) => ({
    ...s,
    week: s.week.slice(5), // MM-DD format
  })) ?? [];

  const hasData = data.length > 0;

  const totalRevenue = data.reduce((sum, d) => sum + (d.revenue ?? 0), 0);

  return (
    <div className="rounded-[18px] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] shadow-[var(--glass-shadow)] p-[18px]">
      <p className="text-[9px] uppercase tracking-[1.5px] text-[var(--muted-foreground)] mb-2">
        {t("salesTrend")}
      </p>
      <p className="text-[22px] font-light text-[var(--foreground)] mb-2">
        {hasData
          ? `Rp ${totalRevenue.toLocaleString()}`
          : "—"}
      </p>
      {hasData ? (
        <ChartContainer config={chartConfig} className="h-[60px] w-full">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-green)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent-green)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(0,0,0,0.04)" vertical={false} />
            <XAxis dataKey="week" hide />
            <YAxis hide />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--accent-green)"
              strokeWidth={1.5}
              fill="url(#revenueGradient)"
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      ) : (
        <div className="flex h-[60px] items-center justify-center text-sm text-[var(--muted-foreground)]">
          {t("noData")}
        </div>
      )}
    </div>
  );
}
