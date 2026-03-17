"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { fetchApi } from "@/lib/api";
import { useApi } from "@/hooks/use-api";
import { Project, Farm, Coop } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageHeader } from "@/components/shared/page-header";
import { BranchCombobox } from "@/components/forms/branch-combobox";
import { FarmCombobox } from "@/components/forms/farm-combobox";
import { ContractCategoryCombobox } from "@/components/forms/contract-category-combobox";
import { FcrStandardCombobox } from "@/components/forms/fcr-standard-combobox";
import { ProductionDayEstimateCombobox } from "@/components/forms/production-day-estimate-combobox";

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: project, isLoading } = useApi<Project>(`/projects/${id}`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // --- Form state ---
  const [branchId, setBranchId] = useState("");
  const [farmId, setFarmId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [contractCategoryId, setContractCategoryId] = useState("");
  const [supervisorIncentive, setSupervisorIncentive] = useState("10");
  const [isActive, setIsActive] = useState(true);
  const [fcrStandardId, setFcrStandardId] = useState("");
  const [productionDayEstimateId, setProductionDayEstimateId] = useState("");
  const [cullingType, setCullingType] = useState<
    "culling" | "culling-mortality"
  >("culling");

  // --- Derived: Fetch coops when farm is selected ---
  const { data: farmDetail } = useApi<Farm>(farmId ? `/farms/${farmId}` : "");
  const coops: Coop[] = farmDetail?.coops || [];

  // Pre-populate form when project loads
  useEffect(() => {
    if (project && !initialized) {
      setBranchId(project.branchId || "");
      setFarmId(project.farmId || "");
      setStartDate(project.startDate ? project.startDate.split("T")[0] : "");
      setContractCategoryId(project.contractCategoryId || "");
      setSupervisorIncentive(project.supervisorIncentive || "10");
      setIsActive(project.isActive !== false);
      setFcrStandardId(project.fcrStandardId || "");
      setProductionDayEstimateId(project.productionDayEstimateId || "");
      if (project.checkMortality) {
        setCullingType("culling-mortality");
      } else {
        setCullingType("culling");
      }
      setInitialized(true);
    }
  }, [project, initialized]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!branchId) {
      toast.error("Area (Branch) wajib dipilih");
      return;
    }
    if (!farmId) {
      toast.error("Farm wajib dipilih");
      return;
    }
    if (!startDate) {
      toast.error("Tanggal mulai wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        branchId,
        farmId,
        startDate,
        checkCulling:
          cullingType === "culling" || cullingType === "culling-mortality",
        checkMortality: cullingType === "culling-mortality",
        isActive,
      };

      if (contractCategoryId) body.contractCategoryId = contractCategoryId;
      if (fcrStandardId) body.fcrStandardId = fcrStandardId;
      if (productionDayEstimateId)
        body.productionDayEstimateId = productionDayEstimateId;
      if (supervisorIncentive)
        body.supervisorIncentive = parseFloat(supervisorIncentive);

      await fetchApi(`/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      toast.success("Project berhasil diperbarui");
      router.push(`/projects/${id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memperbarui project"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading..." />
        <Card>
          <CardContent className="py-8">
            <div className="h-8 w-48 animate-pulse rounded bg-muted mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Project tidak ditemukan"
          actions={
            <Button variant="outline" asChild>
              <Link href="/projects">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Project"
        actions={
          <Button variant="outline" asChild>
            <Link href={`/projects/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── Section 1: Informasi Project ──────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Project</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tanggal Mulai *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Kategori Proyek</Label>
              <ContractCategoryCombobox
                value={contractCategoryId}
                onChange={setContractCategoryId}
              />
            </div>

            <div className="space-y-2">
              <Label>Nama Area (Branch) *</Label>
              <BranchCombobox value={branchId} onChange={setBranchId} />
            </div>

            <div className="space-y-2">
              <Label>Nama Farm *</Label>
              <FarmCombobox
                value={farmId}
                onChange={setFarmId}
                branchId={branchId || undefined}
                disabled={!branchId}
                placeholder={
                  branchId ? "Pilih Farm" : "Pilih Area Terlebih Dahulu"
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Insentif SPV</Label>
              <div className="flex items-center gap-3">
                <Select
                  value={supervisorIncentive}
                  onValueChange={setSupervisorIncentive}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="10.5">10.5%</SelectItem>
                    <SelectItem value="11">11%</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="editNonAktif"
                    checked={!isActive}
                    onCheckedChange={(checked) => setIsActive(!checked)}
                  />
                  <Label
                    htmlFor="editNonAktif"
                    className="text-sm font-normal"
                  >
                    Non Aktif
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nama Kandang</Label>
              {!farmId ? (
                <p className="text-sm text-muted-foreground py-2">
                  Pilih Farm Terlebih Dahulu
                </p>
              ) : coops.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Tidak ada kandang di farm ini
                </p>
              ) : (
                <div className="space-y-1">
                  {coops.map((coop) => (
                    <div
                      key={coop.id}
                      className="text-sm py-1 px-3 bg-muted rounded"
                    >
                      {coop.code} - {coop.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ─── Section 2: Setting Project ────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Setting Project</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Standarisasi FCR</Label>
              <FcrStandardCombobox
                value={fcrStandardId}
                onChange={setFcrStandardId}
              />
            </div>

            <div className="space-y-2">
              <Label>Standarisasi Data Harian</Label>
              <ProductionDayEstimateCombobox
                value={productionDayEstimateId}
                onChange={setProductionDayEstimateId}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Pengakuan Jumlah Culling</Label>
              <RadioGroup
                value={cullingType}
                onValueChange={(val) =>
                  setCullingType(val as "culling" | "culling-mortality")
                }
                className="flex flex-col gap-2 mt-1"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="culling" id="edit-culling" />
                  <Label htmlFor="edit-culling" className="font-normal">
                    Jumlah Culling
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="culling-mortality"
                    id="edit-culling-mortality"
                  />
                  <Label
                    htmlFor="edit-culling-mortality"
                    className="font-normal"
                  >
                    Jumlah Culling + Jumlah Pemusnahan Data Harian
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* ─── Actions ───────────────────────────────────────── */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href={`/projects/${id}`}>Batal</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
