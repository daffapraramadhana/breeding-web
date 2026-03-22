"use client";

import { useTranslations } from "next-intl";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardTrends } from "@/types/api";

interface MortalityFcrChartProps {
  trends: DashboardTrends | null;
}

export function MortalityFcrChart({ trends }: MortalityFcrChartProps) {
  const t = useTranslations("dashboard");

  const chartConfig: ChartConfig = {
    value: { label: t("fcrValue"), color: "var(--color-chart-1)" },
    standard: { label: t("standardFcr"), color: "var(--color-chart-3)" },
    rate: { label: t("mortalityPercent"), color: "var(--color-chart-4)" },
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          {t("mortalityFcrTrend")}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t("last30Days")}</p>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <LineChart data={mergedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis yAxisId="fcr" fontSize={12} />
              <YAxis yAxisId="mortality" orientation="right" fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                yAxisId="fcr"
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="fcr"
                type="monotone"
                dataKey="standard"
                stroke="var(--color-standard)"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
              />
              <Line
                yAxisId="mortality"
                type="monotone"
                dataKey="rate"
                stroke="var(--color-rate)"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            </LineChart>
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
