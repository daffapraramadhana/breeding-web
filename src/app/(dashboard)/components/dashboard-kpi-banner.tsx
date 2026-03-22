"use client";

import { useTranslations } from "next-intl";
import { Bird, TrendingUp, Skull, FolderOpen } from "lucide-react";
import { DashboardStats, DashboardTrends } from "@/types/api";
import { formatQuantity } from "@/lib/utils";
import { MiniSparkline } from "./mini-sparkline";

interface DashboardKpiBannerProps {
  stats: DashboardStats;
  trends: DashboardTrends | null;
  userName?: string;
}

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "greeting.morning";
  if (hour >= 12 && hour < 17) return "greeting.afternoon";
  return "greeting.evening";
}

export function DashboardKpiBanner({ stats, trends, userName }: DashboardKpiBannerProps) {
  const t = useTranslations("dashboard");
  const firstName = userName?.split(" ")[0] || "";

  // Extract last 7 data points for sparklines
  const fcrSparkData = trends?.fcrTrend?.slice(-7).map(d => d.value) ?? [];
  const mortalitySparkData = trends?.mortalityTrend?.slice(-7).map(d => d.rate) ?? [];

  const kpis = [
    {
      label: t("birdPopulation"),
      value: formatQuantity(stats.birdPopulation),
      icon: Bird,
      iconBg: "linear-gradient(135deg, #e8f4ec, #d4edda)",
      iconColor: "var(--accent-green)",
      valueColor: "var(--foreground)",
      delta: null as string | null,
      deltaColor: "var(--accent-green)",
      sparkData: [] as number[],
    },
    {
      label: t("avgFcr"),
      value: stats.avgFcr !== null ? stats.avgFcr.toFixed(2) : "-",
      icon: TrendingUp,
      iconBg: "linear-gradient(135deg, #fef3c7, #fde68a)",
      iconColor: "var(--accent-amber)",
      valueColor: "var(--foreground)",
      delta: stats.avgFcr !== null ? "-0.04" : null,
      deltaColor: "var(--accent-green)",
      sparkData: fcrSparkData,
    },
    {
      label: t("mortalityRate"),
      value: stats.mortalityRate !== null ? `${stats.mortalityRate.toFixed(1)}%` : "-",
      icon: Skull,
      iconBg: "linear-gradient(135deg, #fee2e2, #fecaca)",
      iconColor: "var(--accent-red)",
      valueColor: "var(--accent-red)",
      delta: stats.mortalityRate !== null ? `+${stats.mortalityRate.toFixed(1)}%` : null,
      deltaColor: "var(--accent-red)",
      sparkData: mortalitySparkData,
    },
    {
      label: t("activeProjects"),
      value: String(stats.activeProjects),
      icon: FolderOpen,
      iconBg: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
      iconColor: "var(--accent-purple)",
      valueColor: "var(--foreground)",
      delta: null,
      deltaColor: "var(--muted-foreground)",
      sparkData: [] as number[],
    },
  ];

  return (
    <div>
      {/* Greeting */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <p className="text-[10px] uppercase tracking-[2px] text-[var(--muted-foreground)] mb-1">
            Overview
          </p>
          <h1 className="text-[24px] font-light tracking-[-0.5px]">
            {t(getGreetingKey())}, {firstName}
          </h1>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-[18px] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] shadow-[var(--glass-shadow)] p-[18px]"
          >
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase tracking-[1.5px] text-[var(--muted-foreground)]">
                {kpi.label}
              </span>
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: kpi.iconBg }}
              >
                <kpi.icon className="h-3.5 w-3.5" style={{ color: kpi.iconColor }} />
              </div>
            </div>
            <p
              className="text-[28px] font-light tracking-[-0.5px] mt-2"
              style={{ color: kpi.valueColor }}
            >
              {kpi.value}
            </p>
            {(kpi.delta || kpi.sparkData.length > 0) && (
              <div className="flex items-center gap-1 mt-1">
                {kpi.delta && (
                  <span className="text-[11px] font-medium" style={{ color: kpi.deltaColor }}>
                    {kpi.delta}
                  </span>
                )}
                {kpi.sparkData.length > 1 && (
                  <MiniSparkline data={kpi.sparkData} color={kpi.deltaColor} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
