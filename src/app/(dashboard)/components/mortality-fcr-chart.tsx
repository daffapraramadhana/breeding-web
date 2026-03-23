"use client";

import { useTranslations } from "next-intl";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { DashboardTrends } from "@/types/api";

interface MortalityFcrChartProps {
  trends: DashboardTrends | null;
}

export function MortalityFcrChart({ trends }: MortalityFcrChartProps) {
  const t = useTranslations("dashboard");

  const chartConfig: ChartConfig = {
    value: { label: t("fcrValue"), color: "var(--foreground)" },
    standard: { label: t("standardFcr"), color: "var(--muted-foreground)" },
    rate: { label: t("mortalityPercent"), color: "var(--accent-red)" },
  };

  // Merge FCR and mortality data by date
  const mergedData = trends?.fcrTrend.map((fcr) => {
    const mortality = trends.mortalityTrend.find((m) => m.date === fcr.date);
    return {
      date: fcr.date.slice(5), // MM-DD format
      value: Number(fcr.value.toFixed(3)),
      standard: Number(fcr.standard.toFixed(3)),
      rate: mortality?.rate ?? null,
    };
  }) ?? [];

  const hasData = mergedData.length > 0;

  return (
    <div className="rounded-[18px] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] shadow-[var(--glass-shadow)] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-[1.5px] text-[var(--muted-foreground)]">
          {t("mortalityFcrTrend")}
        </p>
        <div className="flex gap-1.5">
          {["1d", "7d", "1m", "all"].map((range) => (
            <button
              key={range}
              className={
                range === "1m"
                  ? "px-2.5 py-1 rounded-md text-[10px] font-medium bg-[var(--foreground)] text-[var(--background)]"
                  : "px-2.5 py-1 rounded-md text-[10px] font-medium bg-[var(--muted)] text-[var(--muted-foreground)]"
              }
            >
              {t(`timeRange.${range}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Inline legend */}
      <div className="flex gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="h-[2px] w-4 rounded-full bg-[var(--foreground)]" />
          <span className="text-[10px] text-[var(--muted-foreground)]">{t("fcrValue")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-[1px] w-4 rounded-full bg-[var(--muted-foreground)]" style={{ borderTop: "1px dashed var(--muted-foreground)", height: 0, width: 16 }} />
          <span className="text-[10px] text-[var(--muted-foreground)]">{t("standardFcr")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-[2px] w-4 rounded-full bg-[var(--accent-red)]" />
          <span className="text-[10px] text-[var(--muted-foreground)]">{t("mortalityPercent")}</span>
        </div>
      </div>

      {hasData ? (
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
          <LineChart data={mergedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
            <XAxis dataKey="date" fontSize={11} />
            <YAxis yAxisId="fcr" fontSize={11} />
            <YAxis yAxisId="mortality" orientation="right" fontSize={11} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              yAxisId="fcr"
              type="monotone"
              dataKey="value"
              stroke="var(--foreground)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="fcr"
              type="monotone"
              dataKey="standard"
              stroke="var(--muted-foreground)"
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line
              yAxisId="mortality"
              type="monotone"
              dataKey="rate"
              stroke="var(--accent-red)"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ChartContainer>
      ) : (
        <div className="flex h-[240px] items-center justify-center text-sm text-[var(--muted-foreground)]">
          {t("noData")}
        </div>
      )}
    </div>
  );
}
