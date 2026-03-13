"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectPnlAnalysisTab } from "./components/project-pnl-analysis";
import { ProductionForecastTab } from "./components/production-forecast";
import { DashboardSummaryTab } from "./components/dashboard-summary";

export default function AiInsightsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Insights"
        description="Analisis cerdas berbasis AI untuk peternakan Anda"
      />

      <Tabs defaultValue="project-pnl">
        <TabsList>
          <TabsTrigger value="project-pnl">Analisis P&L</TabsTrigger>
          <TabsTrigger value="production-forecast">
            Perkiraan Produksi
          </TabsTrigger>
          <TabsTrigger value="dashboard-summary">
            Ringkasan Dashboard
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
