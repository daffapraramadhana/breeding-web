"use client";

import { useState, use } from "react";

import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowLeft, Check, X } from "lucide-react";
import Link from "next/link";

import { useApi } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import {
  Project,
  ProjectCoop,
  ProjectChickIn,
  ProjectWorker,
} from "@/types/api";
import { formatDate, formatCurrency } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CoopCombobox } from "@/components/forms/coop-combobox";
import { EmployeeCombobox } from "@/components/forms/employee-combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium mt-0.5">{value || "—"}</dd>
    </div>
  );
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: project, isLoading, refetch } = useApi<Project>(`/projects/${id}`);

  // ─── Coop Dialog ─────────────────────────────────────────
  const [coopDialogOpen, setCoopDialogOpen] = useState(false);
  const [coopFormCoopId, setCoopFormCoopId] = useState("");
  const [coopFormPplId, setCoopFormPplId] = useState("");
  const [coopSubmitting, setCoopSubmitting] = useState(false);

  // ─── Chick-In Dialog ─────────────────────────────────────
  const [chickInDialogOpen, setChickInDialogOpen] = useState(false);
  const [chickInFormCoopId, setChickInFormCoopId] = useState("");
  const [chickInFormPopulation, setChickInFormPopulation] = useState("");
  const [chickInSubmitting, setChickInSubmitting] = useState(false);

  // ─── Worker Dialog ───────────────────────────────────────
  const [workerDialogOpen, setWorkerDialogOpen] = useState(false);
  const [workerFormCoopId, setWorkerFormCoopId] = useState("");
  const [workerFormEmployeeId, setWorkerFormEmployeeId] = useState("");
  const [workerSubmitting, setWorkerSubmitting] = useState(false);

  // ─── Delete Coop ─────────────────────────────────────────
  const [deleteCoopOpen, setDeleteCoopOpen] = useState(false);
  const [deletingCoop, setDeletingCoop] = useState<ProjectCoop | null>(null);

  // ─── Computed KPIs ───────────────────────────────────────
  const allChickIns: ProjectChickIn[] =
    project?.projectCoops?.flatMap((pc) => pc.chickIns || []) || [];
  const totalPopulation = allChickIns.reduce((sum, ci) => sum + ci.population, 0);

  const allWorkers: ProjectWorker[] =
    project?.projectCoops?.flatMap((pc) => pc.workers || []) || [];

  // ─── Handlers ────────────────────────────────────────────
  async function handleAddCoop() {
    if (!coopFormCoopId) {
      toast.error("Please select a coop");
      return;
    }
    setCoopSubmitting(true);
    try {
      await fetchApi(`/projects/${id}/coops`, {
        method: "POST",
        body: JSON.stringify({
          coopId: coopFormCoopId,
          ...(coopFormPplId && { pplId: coopFormPplId }),
        }),
      });
      toast.success("Coop added to project");
      setCoopDialogOpen(false);
      setCoopFormCoopId("");
      setCoopFormPplId("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add coop");
    } finally {
      setCoopSubmitting(false);
    }
  }

  async function handleDeleteCoop() {
    if (!deletingCoop) return;
    try {
      await fetchApi(`/projects/${id}/coops/${deletingCoop.id}`, {
        method: "DELETE",
      });
      toast.success("Coop removed from project");
      setDeleteCoopOpen(false);
      setDeletingCoop(null);
      refetch();
    } catch {
      toast.error("Failed to remove coop");
    }
  }

  async function handleAddChickIn() {
    if (!chickInFormCoopId || !chickInFormPopulation) {
      toast.error("Please fill in all required fields");
      return;
    }
    setChickInSubmitting(true);
    try {
      await fetchApi(`/project-coops/${chickInFormCoopId}/chick-ins`, {
        method: "POST",
        body: JSON.stringify({
          population: parseInt(chickInFormPopulation),
        }),
      });
      toast.success("Chick-in recorded successfully");
      setChickInDialogOpen(false);
      setChickInFormCoopId("");
      setChickInFormPopulation("");
      refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add chick-in"
      );
    } finally {
      setChickInSubmitting(false);
    }
  }

  async function handleAddWorker() {
    if (!workerFormCoopId || !workerFormEmployeeId) {
      toast.error("Please fill in all required fields");
      return;
    }
    setWorkerSubmitting(true);
    try {
      await fetchApi(`/project-coops/${workerFormCoopId}/workers`, {
        method: "POST",
        body: JSON.stringify({ employeeId: workerFormEmployeeId }),
      });
      toast.success("Worker added successfully");
      setWorkerDialogOpen(false);
      setWorkerFormCoopId("");
      setWorkerFormEmployeeId("");
      refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add worker"
      );
    } finally {
      setWorkerSubmitting(false);
    }
  }

  // ─── Loading / Error States ──────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading project..." />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-8 w-24 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Project not found"
          actions={
            <Button variant="outline" asChild>
              <Link href="/projects">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const projectCoops = project.projectCoops || [];

  return (
    <div className="space-y-6">
      {/* ─── Header ─────────────────────────────────────────── */}
      <PageHeader
        title={`Project ${project.id.slice(0, 8)}`}
        description={`${project.branch?.name || "—"} / ${project.farm?.name || "—"}${project.startDate ? ` - Started ${formatDate(project.startDate)}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            {project.status && <StatusBadge status={project.status} />}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/projects">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        }
      />

      {/* ─── KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Population
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totalPopulation.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              FCR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">N/A</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mortality %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">N/A</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Step Progress ───────────────────────────────── */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-2">
            {[
              { label: "Kandang", count: projectCoops.length, done: projectCoops.length > 0 },
              { label: "Chick-In", count: allChickIns.length, done: allChickIns.length > 0 },
              { label: "Anak Kandang", count: allWorkers.length, done: allWorkers.length > 0 },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-2 flex-1">
                {i > 0 && (
                  <div className={`h-px flex-1 ${step.done ? "bg-primary" : "bg-border"}`} />
                )}
                <div className="flex flex-col items-center text-center min-w-[80px]">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.done
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.done ? "\u2713" : i + 1}
                  </div>
                  <span className="text-xs mt-1">{step.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {step.count > 0 ? `${step.count} items` : "Belum diisi"}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`h-px flex-1 ${arr[i + 1]?.done ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── Project Information & Settings ────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Informasi Project */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Project</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoItem label="Area (Branch)" value={project.branch?.name} />
              <InfoItem label="Farm" value={project.farm?.name} />
              <InfoItem
                label="Tanggal Mulai"
                value={project.startDate ? formatDate(project.startDate) : undefined}
              />
              <InfoItem
                label="Kategori Kontrak"
                value={project.contractCategory?.name}
              />
              <InfoItem
                label="Standar FCR"
                value={project.fcrStandard?.name}
              />
              <InfoItem
                label="Estimasi Hari Produksi"
                value={project.productionDayEstimate ? `${project.productionDayEstimate.name} (${project.productionDayEstimate.days} hari)` : undefined}
              />
              <InfoItem
                label="Status"
                value={
                  project.isActive !== undefined ? (
                    <Badge variant={project.isActive ? "default" : "secondary"}>
                      {project.isActive ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                  ) : undefined
                }
              />
            </dl>
          </CardContent>
        </Card>

        {/* Setting Project */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Setting Project</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoItem
                label="Insentif Supervisor"
                value={
                  project.supervisorIncentive
                    ? `${project.supervisorIncentive}%`
                    : undefined
                }
              />
              <InfoItem
                label="Cek Culling"
                value={
                  <span className="inline-flex items-center gap-1">
                    {project.checkCulling ? (
                      <><Check className="h-4 w-4 text-green-600" /> Ya</>
                    ) : (
                      <><X className="h-4 w-4 text-muted-foreground" /> Tidak</>
                    )}
                  </span>
                }
              />
              <InfoItem
                label="Cek Mortalitas"
                value={
                  <span className="inline-flex items-center gap-1">
                    {project.checkMortality ? (
                      <><Check className="h-4 w-4 text-green-600" /> Ya</>
                    ) : (
                      <><X className="h-4 w-4 text-muted-foreground" /> Tidak</>
                    )}
                  </span>
                }
              />
              <InfoItem
                label="% Tipe Kandang"
                value={
                  project.coopTypePercentage
                    ? `${project.coopTypePercentage}%`
                    : undefined
                }
              />
              <InfoItem
                label="Pengali Kumulatif"
                value={project.cumulativeMultiplier}
              />
              <InfoItem
                label="Pengali Kandang"
                value={project.coopMultiplier}
              />
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* ─── Tabs ───────────────────────────────────────────── */}
      <Tabs defaultValue="coops" className="space-y-4">
        <TabsList>
          <TabsTrigger value="coops">Coops</TabsTrigger>
          <TabsTrigger value="chick-ins">Chick-Ins</TabsTrigger>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="bonuses">Bonuses</TabsTrigger>
        </TabsList>

        {/* ─── Coops Tab ──────────────────────────────────────── */}
        <TabsContent value="coops" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Project Coops</h3>
            <Button
              size="sm"
              onClick={() => {
                setCoopFormCoopId("");
                setCoopFormPplId("");
                setCoopDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Coop
            </Button>
          </div>

          {projectCoops.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No coops assigned to this project yet.
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coop</TableHead>
                    <TableHead>PPL</TableHead>
                    <TableHead className="w-[120px]">Chick-Ins</TableHead>
                    <TableHead className="w-[120px]">Workers</TableHead>
                    <TableHead className="w-[140px]">Created</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectCoops.map((pc) => (
                    <TableRow key={pc.id}>
                      <TableCell>
                        {pc.coop
                          ? `${pc.coop.code} - ${pc.coop.name}`
                          : pc.coopName || pc.coopId.slice(0, 8)}
                      </TableCell>
                      <TableCell>{pc.ppl?.name || "—"}</TableCell>
                      <TableCell>{pc.chickIns?.length || 0}</TableCell>
                      <TableCell>{pc.workers?.length || 0}</TableCell>
                      <TableCell>{formatDate(pc.createdAt)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeletingCoop(pc);
                            setDeleteCoopOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ─── Chick-Ins Tab ──────────────────────────────────── */}
        <TabsContent value="chick-ins" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Chick-In Records</h3>
            <Button
              size="sm"
              onClick={() => {
                setChickInFormCoopId("");
                setChickInFormPopulation("");
                setChickInDialogOpen(true);
              }}
              disabled={projectCoops.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Chick-In
            </Button>
          </div>

          {allChickIns.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No chick-in records yet.
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coop</TableHead>
                    <TableHead>Population</TableHead>
                    <TableHead>Chick-In Date</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectCoops.flatMap((pc) =>
                    (pc.chickIns || []).map((ci) => (
                      <TableRow key={ci.id}>
                        <TableCell>
                          {pc.coop
                            ? `${pc.coop.code} - ${pc.coop.name}`
                            : pc.coopName || pc.coopId.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          {ci.population.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell>
                          {ci.rearingStartDate ? formatDate(ci.rearingStartDate) : "—"}
                        </TableCell>
                        <TableCell>{formatDate(ci.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ─── Workers Tab ────────────────────────────────────── */}
        <TabsContent value="workers" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Workers</h3>
            <Button
              size="sm"
              onClick={() => {
                setWorkerFormCoopId("");
                setWorkerFormEmployeeId("");
                setWorkerDialogOpen(true);
              }}
              disabled={projectCoops.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Worker
            </Button>
          </div>

          {allWorkers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No workers assigned yet.
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coop</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectCoops.flatMap((pc) =>
                    (pc.workers || []).map((w) => (
                      <TableRow key={w.id}>
                        <TableCell>
                          {pc.coop
                            ? `${pc.coop.code} - ${pc.coop.name}`
                            : pc.coopName || pc.coopId.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          {w.employee?.name || w.employeeId.slice(0, 8)}
                        </TableCell>
                        <TableCell>{formatDate(w.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ─── Bonuses Tab ────────────────────────────────────── */}
        <TabsContent value="bonuses" className="space-y-6">
          <h3 className="text-lg font-semibold">Bonus Configuration</h3>

          {/* FCR Deff */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">FCR Deff Bonus</CardTitle>
            </CardHeader>
            <CardContent>
              {project.projectBonusFcrDeffs && project.projectBonusFcrDeffs.length > 0 ? (
                <div className="space-y-3">
                  {project.projectBonusFcrDeffs.map((bonus) => (
                    <div key={bonus.id}>
                      <p className="text-sm text-muted-foreground mb-2">
                        Unit: {bonus.bonusUnitOption || "—"}
                      </p>
                      {bonus.details && bonus.details.length > 0 ? (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Min FCR</TableHead>
                                <TableHead>Max FCR</TableHead>
                                <TableHead>Bonus</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {bonus.details.map((d, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{d.minFcr}</TableCell>
                                  <TableCell>{d.maxFcr}</TableCell>
                                  <TableCell>{formatCurrency(d.bonus)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No detail rows configured.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No FCR Deff bonus configured.
                </p>
              )}
            </CardContent>
          </Card>

          {/* IP */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">IP Bonus</CardTitle>
            </CardHeader>
            <CardContent>
              {project.projectBonusIps && project.projectBonusIps.length > 0 ? (
                <div className="space-y-3">
                  {project.projectBonusIps.map((bonus) => (
                    <div key={bonus.id}>
                      <p className="text-sm text-muted-foreground mb-2">
                        Unit: {bonus.bonusUnitOption || "—"}
                      </p>
                      {bonus.details && bonus.details.length > 0 ? (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Min IP</TableHead>
                                <TableHead>Max IP</TableHead>
                                <TableHead>Bonus</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {bonus.details.map((d, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{d.minIp}</TableCell>
                                  <TableCell>{d.maxIp}</TableCell>
                                  <TableCell>{formatCurrency(d.bonus)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No detail rows configured.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No IP bonus configured.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Mortality */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mortality Bonus</CardTitle>
            </CardHeader>
            <CardContent>
              {project.projectBonusMortalities && project.projectBonusMortalities.length > 0 ? (
                <div className="space-y-3">
                  {project.projectBonusMortalities.map((bonus) => (
                    <div key={bonus.id}>
                      <p className="text-sm text-muted-foreground mb-2">
                        Unit: {bonus.bonusUnitOption || "—"}
                      </p>
                      {bonus.details && bonus.details.length > 0 ? (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Min Mortality</TableHead>
                                <TableHead>Max Mortality</TableHead>
                                <TableHead>Bonus</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {bonus.details.map((d, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>{d.minMortality}</TableCell>
                                  <TableCell>{d.maxMortality}</TableCell>
                                  <TableCell>{formatCurrency(d.bonus)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No detail rows configured.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No mortality bonus configured.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* ─── Dialogs ──────────────────────────────────────────── */}

      {/* Add Coop Dialog */}
      <Dialog open={coopDialogOpen} onOpenChange={setCoopDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Coop to Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Coop *</Label>
              <CoopCombobox value={coopFormCoopId} onChange={setCoopFormCoopId} />
            </div>
            <div className="space-y-2">
              <Label>PPL (Employee)</Label>
              <EmployeeCombobox
                value={coopFormPplId}
                onChange={setCoopFormPplId}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCoopDialogOpen(false)}
              disabled={coopSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddCoop} disabled={coopSubmitting}>
              {coopSubmitting ? "Adding..." : "Add Coop"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Chick-In Dialog */}
      <Dialog open={chickInDialogOpen} onOpenChange={setChickInDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Chick-In</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project Coop *</Label>
              <Select
                value={chickInFormCoopId}
                onValueChange={setChickInFormCoopId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select coop..." />
                </SelectTrigger>
                <SelectContent>
                  {projectCoops.map((pc) => (
                    <SelectItem key={pc.id} value={pc.id}>
                      {pc.coop
                        ? `${pc.coop.code} - ${pc.coop.name}`
                        : pc.coopName || pc.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="chickInPopulation">Population *</Label>
              <Input
                id="chickInPopulation"
                type="number"
                min="1"
                value={chickInFormPopulation}
                onChange={(e) => setChickInFormPopulation(e.target.value)}
                placeholder="Enter number of birds"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChickInDialogOpen(false)}
              disabled={chickInSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddChickIn} disabled={chickInSubmitting}>
              {chickInSubmitting ? "Adding..." : "Add Chick-In"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Worker Dialog */}
      <Dialog open={workerDialogOpen} onOpenChange={setWorkerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Worker</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project Coop *</Label>
              <Select
                value={workerFormCoopId}
                onValueChange={setWorkerFormCoopId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select coop..." />
                </SelectTrigger>
                <SelectContent>
                  {projectCoops.map((pc) => (
                    <SelectItem key={pc.id} value={pc.id}>
                      {pc.coop
                        ? `${pc.coop.code} - ${pc.coop.name}`
                        : pc.coopName || pc.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Employee *</Label>
              <EmployeeCombobox
                value={workerFormEmployeeId}
                onChange={setWorkerFormEmployeeId}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWorkerDialogOpen(false)}
              disabled={workerSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddWorker} disabled={workerSubmitting}>
              {workerSubmitting ? "Adding..." : "Add Worker"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Coop Confirmation */}
      <ConfirmDialog
        open={deleteCoopOpen}
        onOpenChange={setDeleteCoopOpen}
        title="Remove Coop"
        description={`Are you sure you want to remove this coop from the project? This action cannot be undone.`}
        onConfirm={handleDeleteCoop}
        variant="destructive"
        confirmLabel="Remove"
      />

    </div>
  );
}
