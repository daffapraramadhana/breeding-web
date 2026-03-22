"use client";

import { useTranslations } from "next-intl";
import { Bird, TrendingUp, Skull, FolderOpen } from "lucide-react";
import { DashboardStats } from "@/types/api";
import { formatQuantity } from "@/lib/utils";

interface DashboardKpiBannerProps {
  stats: DashboardStats;
}

export function DashboardKpiBanner({ stats }: DashboardKpiBannerProps) {
  const t = useTranslations("dashboard");

  const kpis = [
    {
      label: t("birdPopulation"),
      value: formatQuantity(stats.birdPopulation),
      icon: Bird,
      color: "text-blue-400",
    },
    {
      label: t("avgFcr"),
      value: stats.avgFcr !== null ? stats.avgFcr.toFixed(2) : "-",
      icon: TrendingUp,
      color: "text-amber-400",
    },
    {
      label: t("mortalityRate"),
      value: stats.mortalityRate !== null ? `${stats.mortalityRate.toFixed(1)}%` : "-",
      icon: Skull,
      color: "text-red-400",
    },
    {
      label: t("activeProjects"),
      value: String(stats.activeProjects),
      icon: FolderOpen,
      color: "text-green-400",
    },
  ];

  return (
    <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white">
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="text-center">
            <div className="mb-2 flex items-center justify-center">
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </div>
            <p className="text-sm text-slate-300">{kpi.label}</p>
            <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
