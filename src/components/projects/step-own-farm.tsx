"use client";

import { useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { Farm, Coop } from "@/types/api";
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
import { BranchCombobox } from "@/components/forms/branch-combobox";
import { FarmCombobox } from "@/components/forms/farm-combobox";
import { ContractCategoryCombobox } from "@/components/forms/contract-category-combobox";
import { FcrStandardCombobox } from "@/components/forms/fcr-standard-combobox";
import { ProductionDayEstimateCombobox } from "@/components/forms/production-day-estimate-combobox";
import { EmployeeCombobox } from "@/components/forms/employee-combobox";
import { BonusFcrDeffCombobox } from "@/components/forms/bonus-fcr-deff-combobox";
import { BonusIpCombobox } from "@/components/forms/bonus-ip-combobox";
import { BonusMortalityCombobox } from "@/components/forms/bonus-mortality-combobox";

export interface SelectedCoop {
  coopId: string;
  coopName: string;
  coopCode: string;
  capacity: number;
  pplId: string;
  checked: boolean;
}

export interface BonusRow {
  type: "fcr-deff" | "ip" | "mortality";
  bonusId: string;
  unitOption: "KG" | "BIRD";
}

interface StepOwnFarmProps {
  branchId: string;
  setBranchId: (v: string) => void;
  farmId: string;
  setFarmId: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  contractCategoryId: string;
  setContractCategoryId: (v: string) => void;
  supervisorIncentive: string;
  setSupervisorIncentive: (v: string) => void;
  isActive: boolean;
  setIsActive: (v: boolean) => void;
  fcrStandardId: string;
  setFcrStandardId: (v: string) => void;
  productionDayEstimateId: string;
  setProductionDayEstimateId: (v: string) => void;
  cullingType: "culling" | "culling-mortality";
  setCullingType: (v: "culling" | "culling-mortality") => void;
  coopTypePercentage: string;
  setCoopTypePercentage: (v: string) => void;
  cumulativeMultiplier: string;
  setCumulativeMultiplier: (v: string) => void;
  coopMultiplier: string;
  setCoopMultiplier: (v: string) => void;
  selectedCoops: SelectedCoop[];
  setSelectedCoops: (v: SelectedCoop[]) => void;
  bonusRows: BonusRow[];
  setBonusRows: (v: BonusRow[]) => void;
}

export function StepOwnFarm(props: StepOwnFarmProps) {
  const {
    branchId, setBranchId, farmId, setFarmId, startDate, setStartDate,
    contractCategoryId, setContractCategoryId, supervisorIncentive, setSupervisorIncentive,
    isActive, setIsActive, fcrStandardId, setFcrStandardId,
    productionDayEstimateId, setProductionDayEstimateId, cullingType, setCullingType,
    coopTypePercentage, setCoopTypePercentage, cumulativeMultiplier, setCumulativeMultiplier,
    coopMultiplier, setCoopMultiplier, selectedCoops, setSelectedCoops,
    bonusRows, setBonusRows,
  } = props;

  const { data: farmDetail } = useApi<Farm>(farmId ? `/farms/${farmId}` : "");
  const coops: Coop[] = farmDetail?.coops || [];

  // Reset farmId when branchId changes
  useEffect(() => {
    setFarmId("");
    setSelectedCoops([]);
  }, [branchId]);

  // Sync selectedCoops when farm coops load
  useEffect(() => {
    if (coops.length > 0 && selectedCoops.length === 0) {
      setSelectedCoops(
        coops.map((c) => ({
          coopId: c.id,
          coopName: c.name,
          coopCode: c.code,
          capacity: c.capacity,
          pplId: "",
          checked: false,
        }))
      );
    }
  }, [coops]);

  function toggleCoop(coopId: string) {
    setSelectedCoops(
      selectedCoops.map((c) =>
        c.coopId === coopId ? { ...c, checked: !c.checked } : c
      )
    );
  }

  function updateCoopPpl(coopId: string, pplId: string) {
    setSelectedCoops(
      selectedCoops.map((c) =>
        c.coopId === coopId ? { ...c, pplId } : c
      )
    );
  }

  function addBonusRow() {
    setBonusRows([...bonusRows, { type: "fcr-deff", bonusId: "", unitOption: "BIRD" }]);
  }

  function removeBonusRow(index: number) {
    setBonusRows(bonusRows.filter((_, i) => i !== index));
  }

  function updateBonusRow(index: number, field: keyof BonusRow, value: string) {
    const updated = [...bonusRows];
    if (field === "type") {
      updated[index] = { type: value as BonusRow["type"], bonusId: "", unitOption: "BIRD" };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setBonusRows(updated);
  }

  return (
    <div className="space-y-6">
      {/* Informasi Project */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Project</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Tanggal Mulai *</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Kategori Proyek</Label>
            <ContractCategoryCombobox value={contractCategoryId} onChange={setContractCategoryId} />
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
              placeholder={branchId ? "Pilih Farm" : "Pilih Area Terlebih Dahulu"}
            />
          </div>
          <div className="space-y-2">
            <Label>Insentif SPV</Label>
            <div className="flex items-center gap-3">
              <Select value={supervisorIncentive} onValueChange={setSupervisorIncentive}>
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
                <Checkbox id="nonAktif" checked={!isActive} onCheckedChange={(checked) => setIsActive(!checked)} />
                <Label htmlFor="nonAktif" className="text-sm font-normal">Non Aktif</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nama Kandang */}
      {farmId && (
        <Card>
          <CardHeader>
            <CardTitle>Nama Kandang</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCoops.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada kandang di farm ini</p>
            ) : (
              <div className="space-y-3">
                {selectedCoops.map((coop) => (
                  <div key={coop.coopId} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <Checkbox
                      checked={coop.checked}
                      onCheckedChange={() => toggleCoop(coop.coopId)}
                    />
                    <div className="min-w-[200px]">
                      <div className="font-medium text-sm">
                        {coop.coopCode} - {coop.coopName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {coop.capacity.toLocaleString()} Ekor
                      </div>
                    </div>
                    {coop.checked && (
                      <div className="flex-1 max-w-[300px]">
                        <EmployeeCombobox
                          value={coop.pplId}
                          onChange={(pplId) => updateCoopPpl(coop.coopId, pplId)}
                          branchId={branchId}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Setting Project */}
      <Card>
        <CardHeader>
          <CardTitle>Setting Project</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Standarisasi FCR</Label>
            <FcrStandardCombobox value={fcrStandardId} onChange={setFcrStandardId} />
          </div>
          <div className="space-y-2">
            <Label>Standarisasi Data Harian</Label>
            <ProductionDayEstimateCombobox value={productionDayEstimateId} onChange={setProductionDayEstimateId} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Pengakuan Jumlah Culling</Label>
            <RadioGroup
              value={cullingType}
              onValueChange={(val) => setCullingType(val as "culling" | "culling-mortality")}
              className="flex flex-col gap-2 mt-1"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="culling" id="culling" />
                <Label htmlFor="culling" className="font-normal">Jumlah Culling</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="culling-mortality" id="culling-mortality" />
                <Label htmlFor="culling-mortality" className="font-normal">Jumlah Culling + Jumlah Pemusnahan Data Harian</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Bonus */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bonus</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={addBonusRow}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Bonus
          </Button>
        </CardHeader>
        <CardContent>
          {bonusRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada bonus. Klik &quot;Tambah Bonus&quot; untuk menambahkan.
            </p>
          ) : (
            <div className="space-y-4">
              {bonusRows.map((row, index) => (
                <div key={index} className="flex items-end gap-3">
                  <div className="space-y-2 w-[180px]">
                    {index === 0 && <Label>Tipe Bonus</Label>}
                    <Select value={row.type} onValueChange={(val) => updateBonusRow(index, "type", val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fcr-deff">Bonus FCR</SelectItem>
                        <SelectItem value="ip">Bonus IP</SelectItem>
                        <SelectItem value="mortality">Bonus Mortality</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 flex-1">
                    {index === 0 && <Label>Pilih Bonus</Label>}
                    {row.type === "fcr-deff" && (
                      <BonusFcrDeffCombobox value={row.bonusId} onChange={(val) => updateBonusRow(index, "bonusId", val)} />
                    )}
                    {row.type === "ip" && (
                      <BonusIpCombobox value={row.bonusId} onChange={(val) => updateBonusRow(index, "bonusId", val)} />
                    )}
                    {row.type === "mortality" && (
                      <BonusMortalityCombobox value={row.bonusId} onChange={(val) => updateBonusRow(index, "bonusId", val)} />
                    )}
                  </div>
                  <div className="space-y-2 w-[140px]">
                    {index === 0 && <Label>Satuan</Label>}
                    <Select value={row.unitOption} onValueChange={(val) => updateBonusRow(index, "unitOption", val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BIRD">Ekor Jual</SelectItem>
                        <SelectItem value="KG">KG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeBonusRow(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Multiplier fields */}
          <div className="grid gap-4 md:grid-cols-3 mt-6 pt-4 border-t">
            <div className="space-y-2">
              <Label>Persentase Jenis Kandang (%)</Label>
              <Input type="number" step="0.01" value={coopTypePercentage} onChange={(e) => setCoopTypePercentage(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Pengkali Profit Kumulatif</Label>
              <Input type="number" step="0.01" value={cumulativeMultiplier} onChange={(e) => setCumulativeMultiplier(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Pengkali Profit Kandang</Label>
              <Input type="number" step="0.01" value={coopMultiplier} onChange={(e) => setCoopMultiplier(e.target.value)} placeholder="0" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
