"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CloudRain,
  Lightbulb,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { getProductionForecast, fetchPaginated, ApiError } from "@/lib/api";
import {
  AiInsightResponse,
  ProductionForecast,
  ProductionForecastRequest,
  Farm,
} from "@/types/api";
import { toast } from "sonner";
import { InsightCard } from "./insight-card";
import { ForecastTable } from "./forecast-table";
import { AiLoading } from "./ai-loading";
import { CacheIndicator } from "./cache-indicator";

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agt", "Sep", "Okt", "Nov", "Des",
];

const chartConfig: ChartConfig = {
  pendapatan: { label: "Pendapatan", color: "var(--color-chart-1)" },
  biaya: { label: "Biaya", color: "var(--color-chart-2)" },
};

function parseCurrencyString(str: string): number {
  return parseFloat(str.replace(/[^\d,-]/g, "").replace(/\./g, "").replace(",", ".")) || 0;
}

export function ProductionForecastTab() {
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState<ProductionForecastRequest>({
    forecastYear: currentYear,
  });
  const [result, setResult] = useState<AiInsightResponse<ProductionForecast> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [farms, setFarms] = useState<Farm[]>([]);

  useEffect(() => {
    fetchPaginated<Farm>("/farms", { limit: 100 })
      .then((res) => setFarms(res.data))
      .catch(() => {});
  }, []);

  async function handleForecast(forceRefresh = false) {
    setIsLoading(true);
    try {
      const params = { ...filters };
      if (forceRefresh) {
        (params as Record<string, unknown>)._refresh = Date.now();
      }
      const data = await getProductionForecast(params);
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

  const chartData = insight
    ? insight.jadwal_produksi.reduce(
        (acc, row) => {
          const existing = acc.find((d) => d.bulan === row.bulan);
          const pendapatan = parseCurrencyString(row.estimasi_pendapatan);
          const biaya = parseCurrencyString(row.estimasi_biaya);
          if (existing) {
            existing.pendapatan += pendapatan;
            existing.biaya += biaya;
          } else {
            acc.push({
              bulan: row.bulan,
              name: MONTH_SHORT[row.bulan - 1],
              pendapatan,
              biaya,
            });
          }
          return acc;
        },
        [] as { bulan: number; name: string; pendapatan: number; biaya: number }[]
      ).sort((a, b) => a.bulan - b.bulan)
    : [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tahun</Label>
              <Select
                value={String(filters.forecastYear)}
                onValueChange={(v) =>
                  setFilters({ ...filters, forecastYear: parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear, currentYear + 1, currentYear + 2].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Farm</Label>
              <Select
                value={filters.farmId || "ALL"}
                onValueChange={(v) =>
                  setFilters({ ...filters, farmId: v === "ALL" ? undefined : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua farm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Farm</SelectItem>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={() => handleForecast()}
              disabled={isLoading || rateLimitCountdown > 0}
              aria-label="Buat perkiraan produksi"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              {rateLimitCountdown > 0
                ? `Tunggu ${rateLimitCountdown}s`
                : isLoading
                  ? "Membuat perkiraan..."
                  : "Buat Perkiraan"}
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
              onRefresh={() => handleForecast(true)}
              isLoading={isLoading}
            />
          )}

          {/* Ringkasan */}
          <InsightCard title="Ringkasan" borderColor="border-l-blue-500">
            <p className="text-sm leading-relaxed">{insight.ringkasan}</p>
          </InsightCard>

          {/* Proyeksi Tahunan */}
          <div>
            <h3 className="text-sm font-medium mb-3">Proyeksi Tahunan</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Est. Pendapatan</p>
                  <p className="text-2xl font-bold text-green-600">
                    {insight.proyeksi_tahunan.total_estimasi_pendapatan}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Est. Biaya</p>
                  <p className="text-2xl font-bold text-red-600">
                    {insight.proyeksi_tahunan.total_estimasi_biaya}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Est. Laba Kotor</p>
                  <p className="text-2xl font-bold">
                    {insight.proyeksi_tahunan.estimasi_laba_kotor}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Est. Margin</p>
                  <p className="text-2xl font-bold">
                    {insight.proyeksi_tahunan.estimasi_margin}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Jadwal Produksi Table */}
          <ForecastTable data={insight.jadwal_produksi} />

          {/* Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-base font-medium mb-4">
                  Pendapatan vs Biaya per Bulan
                </h3>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={chartData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) =>
                        `${(v / 1_000_000).toFixed(0)}jt`
                      }
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="pendapatan"
                      fill="var(--color-chart-1)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="biaya"
                      fill="var(--color-chart-2)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Pertimbangan Musiman & Risiko */}
          <div className="grid gap-6 md:grid-cols-2">
            {insight.pertimbangan_musiman.length > 0 && (
              <InsightCard
                title="Pertimbangan Musiman"
                icon={<CloudRain className="h-4 w-4 text-blue-500" />}
              >
                <ul className="space-y-2">
                  {insight.pertimbangan_musiman.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CloudRain className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </InsightCard>
            )}
            {insight.risiko.length > 0 && (
              <InsightCard
                title="Risiko"
                icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
              >
                <ul className="space-y-2">
                  {insight.risiko.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </InsightCard>
            )}
          </div>

          {/* Rekomendasi Tambahan */}
          {insight.rekomendasi_tambahan.length > 0 && (
            <InsightCard
              title="Rekomendasi Tambahan"
              icon={<Lightbulb className="h-4 w-4 text-amber-500" />}
            >
              <ul className="space-y-2">
                {insight.rekomendasi_tambahan.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </InsightCard>
          )}
        </div>
      )}
    </div>
  );
}
