"use client";

import { addDays, format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SelectedCoop } from "./step-own-farm";

export interface ChickInData {
  population: number;
  rearingStartDate: string;
  rearingEndDate: string;
  harvestStartDate: string;
  harvestEndDate: string;
  cleaningStartDate: string;
  cleaningEndDate: string;
  prepStartDate: string;
  prepEndDate: string;
}

interface StepChickinProps {
  selectedCoops: SelectedCoop[];
  chickIns: Record<string, ChickInData>;
  setChickIns: (v: Record<string, ChickInData>) => void;
}

function computeDates(docInDate: string) {
  const base = parseISO(docInDate);
  const rearingEnd = addDays(base, 25);
  const harvestStart = addDays(rearingEnd, 1);
  const harvestEnd = addDays(harvestStart, 9);
  const cleaningStart = addDays(harvestEnd, 1);
  const cleaningEnd = addDays(cleaningStart, 6);
  const prepStart = addDays(cleaningEnd, 1);
  const prepEnd = addDays(prepStart, 17);

  return {
    rearingEndDate: format(rearingEnd, "yyyy-MM-dd"),
    harvestStartDate: format(harvestStart, "yyyy-MM-dd"),
    harvestEndDate: format(harvestEnd, "yyyy-MM-dd"),
    cleaningStartDate: format(cleaningStart, "yyyy-MM-dd"),
    cleaningEndDate: format(cleaningEnd, "yyyy-MM-dd"),
    prepStartDate: format(prepStart, "yyyy-MM-dd"),
    prepEndDate: format(prepEnd, "yyyy-MM-dd"),
  };
}

export function StepChickin({
  selectedCoops,
  chickIns,
  setChickIns,
}: StepChickinProps) {
  const checkedCoops = selectedCoops.filter((c) => c.checked);

  function updateField(coopId: string, field: keyof ChickInData, value: string | number) {
    const current = chickIns[coopId] || {
      population: 0,
      rearingStartDate: "",
      rearingEndDate: "",
      harvestStartDate: "",
      harvestEndDate: "",
      cleaningStartDate: "",
      cleaningEndDate: "",
      prepStartDate: "",
      prepEndDate: "",
    };

    if (field === "rearingStartDate" && typeof value === "string" && value) {
      const dates = computeDates(value);
      setChickIns({
        ...chickIns,
        [coopId]: {
          ...current,
          rearingStartDate: value,
          ...dates,
        },
      });
    } else {
      setChickIns({
        ...chickIns,
        [coopId]: { ...current, [field]: value },
      });
    }
  }

  const dateColumns = [
    { key: "rearingStartDate" as const, label: "DOC IN" },
    { key: "rearingEndDate" as const, label: "Akhir Rearing" },
    { key: "harvestStartDate" as const, label: "Mulai Panen" },
    { key: "harvestEndDate" as const, label: "Akhir Panen" },
    { key: "cleaningStartDate" as const, label: "Mulai Cuci" },
    { key: "cleaningEndDate" as const, label: "Akhir Cuci" },
    { key: "prepStartDate" as const, label: "Mulai Istirahat" },
    { key: "prepEndDate" as const, label: "Akhir Istirahat" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Jadwal Chick In & Produksi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium">Kandang</th>
                  <th className="text-left py-2 pr-4 font-medium">Populasi</th>
                  {dateColumns.map((col) => (
                    <th key={col.key} className="text-left py-2 pr-2 font-medium whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {checkedCoops.map((coop) => {
                  const data = chickIns[coop.coopId];
                  return (
                    <tr key={coop.coopId} className="border-b last:border-b-0">
                      <td className="py-3 pr-4">
                        <div className="font-medium whitespace-nowrap">
                          {coop.coopCode} - {coop.coopName}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Input
                          type="number"
                          className="w-[100px]"
                          value={data?.population || ""}
                          onChange={(e) =>
                            updateField(coop.coopId, "population", parseInt(e.target.value) || 0)
                          }
                          placeholder="0"
                        />
                      </td>
                      {dateColumns.map((col) => (
                        <td key={col.key} className="py-3 pr-2">
                          {col.key === "rearingStartDate" ? (
                            <Input
                              type="date"
                              className="w-[140px]"
                              value={data?.rearingStartDate || ""}
                              onChange={(e) =>
                                updateField(coop.coopId, "rearingStartDate", e.target.value)
                              }
                            />
                          ) : (
                            <div className="text-muted-foreground whitespace-nowrap px-2 py-1.5 bg-muted/50 rounded text-xs min-w-[100px]">
                              {data?.[col.key] || "—"}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <Label className="text-xs text-muted-foreground">
              Keterangan: Masukkan tanggal DOC IN, tanggal lainnya akan dihitung otomatis
              (Rearing 25 hari, Panen 10 hari, Cuci 7 hari, Istirahat 18 hari)
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
