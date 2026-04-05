"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectPnlAnalysisTab } from "./components/project-pnl-analysis";
import { ProductionForecastTab } from "./components/production-forecast";
import { DashboardSummaryTab } from "./components/dashboard-summary";

export default function AiInsightsPage() {
  const t = useTranslations("aiInsights");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <Tabs defaultValue="project-pnl">
        <TabsList>
          <TabsTrigger value="project-pnl">{t("pnlAnalysis")}</TabsTrigger>
          <TabsTrigger value="production-forecast">
            {t("productionForecast")}
          </TabsTrigger>
          <TabsTrigger value="dashboard-summary">
            {t("dashboardSummary")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="project-pnl" className="mt-6">
          <ProjectPnlAnalysisTab />
        </TabsContent>

        <TabsContent value="production-forecast" className="mt-6">
          <ProductionForecastTab />
        </TabsContent>

        <TabsContent value="dashboard-summary" className="mt-6">
          <DashboardSummaryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
