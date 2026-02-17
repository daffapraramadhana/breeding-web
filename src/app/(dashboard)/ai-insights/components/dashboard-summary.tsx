"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { getDashboardSummary, ApiError } from "@/lib/api";
import {
  AiInsightResponse,
  DashboardSummary,
  DashboardSummaryRequest,
} from "@/types/api";
import { toast } from "sonner";
import { InsightCard } from "./insight-card";
import { PriorityBadge } from "./priority-badge";
import { AiLoading } from "./ai-loading";
import { CacheIndicator } from "./cache-indicator";
import { format, startOfMonth } from "date-fns";

export function DashboardSummaryTab() {
  const today = new Date();
  const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
  const todayStr = format(today, "yyyy-MM-dd");

  const [filters, setFilters] = useState<DashboardSummaryRequest>({
    periodStart: monthStart,
    periodEnd: todayStr,
  });
  const [result, setResult] = useState<AiInsightResponse<DashboardSummary> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

  async function handleSummarize(forceRefresh = false) {
    setIsLoading(true);
    try {
      const params = { ...filters };
      if (forceRefresh) {
        (params as Record<string, unknown>)._refresh = Date.now();
      }
      const data = await getDashboardSummary(params);
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          const match = err.message.match(/(\d+)\s*detik/);
          const seconds = match ? parseInt(match[1]) : 45;
          setRateLimitCountdown(seconds);
          const interval = setInterval(() => {
            setRateLimitCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(interval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          toast.error(`Terlalu banyak permintaan. Coba lagi dalam ${seconds} detik.`);
        } else if (err.status === 503) {
          toast.error("Layanan AI belum dikonfigurasi. Hubungi administrator.");
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error("Gagal menghubungi server. Periksa koneksi Anda.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const insight = result?.insight;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
            <div className="space-y-2">
              <Label>Periode Mulai</Label>
              <Input
                type="date"
                value={filters.periodStart || ""}
                onChange={(e) =>
                  setFilters({ ...filters, periodStart: e.target.value || undefined })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Periode Akhir</Label>
              <Input
                type="date"
                value={filters.periodEnd || ""}
                onChange={(e) =>
                  setFilters({ ...filters, periodEnd: e.target.value || undefined })
                }
              />
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={() => handleSummarize()}
              disabled={isLoading || rateLimitCountdown > 0}
              aria-label="Buat ringkasan dashboard"
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              {rateLimitCountdown > 0
                ? `Tunggu ${rateLimitCountdown}s`
                : isLoading
                  ? "Membuat ringkasan..."
                  : "Buat Ringkasan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && <AiLoading />}

      {/* Empty state */}
      {!isLoading && !insight && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BrainCircuit className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">
            Klik tombol di atas untuk memulai analisis AI
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            AI akan menganalisis data peternakan Anda dan memberikan insight
            yang actionable
          </p>
        </div>
      )}

      {/* Results */}
      {!isLoading && insight && (
        <div className="space-y-6">
          {/* Cache indicator */}
          {result && (
            <CacheIndicator
              cached={result.cached}
              generatedAt={result.generatedAt}
              expiresAt={result.expiresAt}
              onRefresh={() => handleSummarize(true)}
              isLoading={isLoading}
            />
          )}

          {/* Ringkasan Eksekutif */}
          <InsightCard title="Ringkasan Eksekutif" borderColor="border-l-blue-500">
            <p className="text-sm leading-relaxed">
              {insight.ringkasan_eksekutif}
            </p>
          </InsightCard>

          {/* Metrik Kunci */}
          <div>
            <h3 className="text-sm font-medium mb-3">Metrik Kunci</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Pendapatan</p>
                  <p className="text-2xl font-bold text-green-600">
                    {insight.metrik_kunci.pendapatan}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Biaya</p>
                  <p className="text-2xl font-bold text-red-600">
                    {insight.metrik_kunci.biaya}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Laba Kotor</p>
                  <p className="text-2xl font-bold">
                    {insight.metrik_kunci.laba_kotor}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Margin</p>
                  <p className="text-2xl font-bold">
                    {insight.metrik_kunci.margin}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Batch Aktif</p>
                  <p className="text-2xl font-bold">
                    {insight.metrik_kunci.batch_aktif}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    Batch Selesai Periode
                  </p>
                  <p className="text-2xl font-bold">
                    {insight.metrik_kunci.batch_selesai_periode}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Highlights & Perhatian */}
          <div className="grid gap-6 md:grid-cols-2">
            {insight.highlights.length > 0 && (
              <InsightCard
                title="Highlights"
                icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
                borderColor="border-l-green-500"
              >
                <ul className="space-y-2">
                  {insight.highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </InsightCard>
            )}
            {insight.perhatian.length > 0 && (
              <InsightCard
                title="Perhatian"
                icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
                borderColor="border-l-amber-500"
              >
                <ul className="space-y-2">
                  {insight.perhatian.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </InsightCard>
            )}
          </div>

          {/* Cash Flow Insight */}
          <InsightCard
            title="Cash Flow Insight"
            icon={<DollarSign className="h-4 w-4 text-blue-500" />}
          >
            <p className="text-sm leading-relaxed">
              {insight.cash_flow_insight}
            </p>
          </InsightCard>

          {/* Aksi Prioritas */}
          {insight.aksi_prioritas.length > 0 && (
            <InsightCard title="Aksi Prioritas">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Prioritas</TableHead>
                      <TableHead>Aksi</TableHead>
                      <TableHead>Alasan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insight.aksi_prioritas.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <PriorityBadge priority={item.prioritas} />
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.aksi}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.alasan}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </InsightCard>
          )}
        </div>
      )}
    </div>
  );
}
