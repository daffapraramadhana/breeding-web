"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { fetchPaginated } from "@/lib/api";
import { Employee } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { SelectedCoop } from "./step-own-farm";

interface StepAnakKandangProps {
  branchId: string;
  selectedCoops: SelectedCoop[];
  workerAssignments: Record<string, string[]>;
  setWorkerAssignments: (v: Record<string, string[]>) => void;
}

export function StepAnakKandang({
  branchId,
  selectedCoops,
  workerAssignments,
  setWorkerAssignments,
}: StepAnakKandangProps) {
  const checkedCoops = selectedCoops.filter((c) => c.checked);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchPaginated<Employee>("/employees", {
      limit: 100,
      search,
      extra: branchId ? { branchId } : undefined,
    })
      .then((res) => setEmployees(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [search, branchId]);

  function toggleWorker(coopId: string, employeeId: string) {
    const current = workerAssignments[coopId] || [];
    const updated = current.includes(employeeId)
      ? current.filter((id) => id !== employeeId)
      : [...current, employeeId];
    setWorkerAssignments({ ...workerAssignments, [coopId]: updated });
  }

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari karyawan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {checkedCoops.map((coop) => {
        const assigned = workerAssignments[coop.coopId] || [];
        return (
          <Card key={coop.coopId}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {coop.coopCode} - {coop.coopName}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({assigned.length} dipilih)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Memuat...</p>
              ) : employees.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Tidak ada karyawan ditemukan
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {employees.map((emp) => {
                    const isChecked = assigned.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-primary/5 border-primary/30"
                            : "bg-background hover:bg-muted/50"
                        }`}
                        onClick={() => toggleWorker(coop.coopId, emp.id)}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() =>
                            toggleWorker(coop.coopId, emp.id)
                          }
                        />
                        <div className="min-w-0">
                          <Label className="text-sm font-medium cursor-pointer truncate block">
                            {emp.name}
                          </Label>
                          <span className="text-xs text-muted-foreground truncate block">
                            {emp.position || "—"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
