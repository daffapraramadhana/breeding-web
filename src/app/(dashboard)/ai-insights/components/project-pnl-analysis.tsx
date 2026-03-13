"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  Lightbulb,
  Search,
  TrendingUp,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { analyzeProjectPnl, fetchPaginated, ApiError } from "@/lib/api";
import {
  AiInsightResponse,
  ProjectPnlAnalysis,
  ProjectAnalysisRequest,
  Farm,
} from "@/types/api";
import { toast } from "sonner";
import { InsightCard } from "./insight-card";
import { PenilaianBadge } from "./priority-badge";
import { AiLoading } from "./ai-loading";
import { CacheIndicator } from "./cache-indicator";

export function ProjectPnlAnalysisTab() {
  const [filters, setFilters] = useState<ProjectAnalysisRequest>({});
  const [result, setResult] = useState<AiInsightResponse<ProjectPnlAnalysis> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [farms, setFarms] = useState<Farm[]>([]);

  useEffect(() => {
    fetchPaginated<Farm>("/farms", { limit: 100 })
      .then((res) => setFarms(res.data))
      .catch(() => {});
  }, []);

  async function handleAnalyze(forceRefresh = false) {
    setIsLoading(true);
    try {
      const params = { ...filters };
      if (forceRefresh) {
        (params as Record<string, unknown>)._refresh = Date.now();
      }
      const data = await analyzeProjectPnl(params);
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={filters.startDateFrom || ""}
                onChange={(e) =>
                  setFilters({ ...filters, startDateFrom: e.target.value || undefined })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Akhir</Label>
              <Input
                type="date"
                value={filters.startDateTo || ""}
                onChange={(e) =>
                  setFilters({ ...filters, startDateTo: e.target.value || undefined })
                }
              />
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
              onClick={() => handleAnalyze()}
              disabled={isLoading || rateLimitCountdown > 0}
              aria-label="Mulai analisis AI"
            >
              <Search className="mr-2 h-4 w-4" />
              {rateLimitCountdown > 0
                ? `Tunggu ${rateLimitCountdown}s`
                : isLoading
                  ? "Menganalisis..."
                  : "Analisis dengan AI"}
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
              onRefresh={() => handleAnalyze(true)}
              isLoading={isLoading}
            />
          )}

          {/* Ringkasan */}
          <InsightCard title="Ringkasan" borderColor="border-l-blue-500">
            <p className="text-sm leading-relaxed">{insight.ringkasan}</p>
          </InsightCard>

          {/* Metrik Utama */}
          <div>
            <h3 className="text-sm font-medium mb-3">Metrik Utama</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Pendapatan</p>
                  <p className="text-2xl font-bold text-green-600">
                    {insight.metrik_utama.total_pendapatan}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Biaya</p>
                  <p className="text-2xl font-bold text-red-600">
                    {insight.metrik_utama.total_biaya}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Laba Kotor</p>
                  <p className="text-2xl font-bold">
                    {insight.metrik_utama.total_laba_kotor}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Margin Rata-rata</p>
                  <p className="text-2xl font-bold">
                    {insight.metrik_utama.margin_rata_rata}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Analisis per Proyek */}
          {insight.analisis_proyek.length > 0 && (
            <InsightCard title="Analisis per Proyek">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project ID</TableHead>
                      <TableHead>Penilaian</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insight.analisis_proyek.map((project) => (
                      <TableRow key={project.project_id}>
                        <TableCell className="font-medium">
                          {project.project_id}
                        </TableCell>
                        <TableCell>
                          <PenilaianBadge penilaian={project.penilaian} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {project.catatan}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </InsightCard>
          )}

          {/* Tren & Rekomendasi */}
          <div className="grid gap-6 md:grid-cols-2">
            {insight.tren.length > 0 && (
              <InsightCard
                title="Tren"
                icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
              >
                <ul className="space-y-2">
                  {insight.tren.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <ArrowUpRight className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </InsightCard>
            )}
            {insight.rekomendasi.length > 0 && (
              <InsightCard
                title="Rekomendasi"
                icon={<Lightbulb className="h-4 w-4 text-amber-500" />}
              >
                <ul className="space-y-2">
                  {insight.rekomendasi.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </InsightCard>
            )}
          </div>

          {/* Peringatan */}
          {insight.peringatan.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Peringatan</h3>
              {insight.peringatan.map((warning, idx) => (
                <Alert key={idx} variant="destructive" className="border-amber-200 bg-amber-50 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{warning}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
