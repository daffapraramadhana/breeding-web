"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BatchPnlAnalysisTab } from "./components/batch-pnl-analysis";
import { ProductionForecastTab } from "./components/production-forecast";
import { DashboardSummaryTab } from "./components/dashboard-summary";

export default function AiInsightsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Insights"
        description="Analisis cerdas berbasis AI untuk peternakan Anda"
      />

      <Tabs defaultValue="batch-pnl">
        <TabsList>
          <TabsTrigger value="batch-pnl">Analisis P&L</TabsTrigger>
          <TabsTrigger value="production-forecast">
            Perkiraan Produksi
          </TabsTrigger>
          <TabsTrigger value="dashboard-summary">
            Ringkasan Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="batch-pnl" className="mt-6">
          <BatchPnlAnalysisTab />
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
