"use client";

import { useTranslations } from "next-intl";
import { PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "@/types/api";

interface ProjectPhaseChartProps {
  stats: DashboardStats | null;
}

const PHASE_COLORS = {
  rearing: "var(--color-chart-1)",
  harvest: "var(--color-chart-2)",
  cleaning: "var(--color-chart-3)",
  preparation: "var(--color-chart-4)",
};

export function ProjectPhaseChart({ stats }: ProjectPhaseChartProps) {
  const t = useTranslations("dashboard");

  const chartConfig: ChartConfig = {
    rearing: { label: t("rearing"), color: PHASE_COLORS.rearing },
    harvest: { label: t("harvest"), color: PHASE_COLORS.harvest },
    cleaning: { label: t("cleaning"), color: PHASE_COLORS.cleaning },
    preparation: { label: t("preparation"), color: PHASE_COLORS.preparation },
  };

  const phases = stats?.projectsByPhase;
  const data = phases
    ? [
        { name: "rearing", value: phases.rearing, fill: PHASE_COLORS.rearing },
        { name: "harvest", value: phases.harvest, fill: PHASE_COLORS.harvest },
        { name: "cleaning", value: phases.cleaning, fill: PHASE_COLORS.cleaning },
        { name: "preparation", value: phases.preparation, fill: PHASE_COLORS.preparation },
      ].filter((d) => d.value > 0)
    : [];

  const hasData = data.length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          {t("projectsByPhase")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </PieChart>
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
