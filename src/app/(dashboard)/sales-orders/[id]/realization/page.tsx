"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { useApi } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  SalesOrder, SalesRealization, SalesRealizationLine, WeighingLocation,
} from "@/types/api";

interface LineDraft {
  sourceProjectCoopId: string;
  pickupDate: string;
  dtpsNumber: string;
  birdCount: string;
  totalWeightKg: string;
  isCulled: boolean;
  unitPrice: string;
  discountPerKg: string;
  adminFeePerKg: string;
  savingsPerKg: string;
  lineNotes: string;
}

const EMPTY: LineDraft = {
  sourceProjectCoopId: "", pickupDate: new Date().toISOString().slice(0, 10),
  dtpsNumber: "", birdCount: "", totalWeightKg: "", isCulled: false,
  unitPrice: "", discountPerKg: "", adminFeePerKg: "", savingsPerKg: "", lineNotes: "",
};

/** R4: truk ditimbang dan ayam dihitung, jadi AVG adalah turunan. */
function avgOf(birds: string, tonnage: string) {
  return birds && tonnage && Number(birds) > 0
    ? (Number(tonnage) / Number(birds)).toFixed(4)
    : "";
}

export default function SalesRealizationPage() {
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations("salesRealization");
  const tc = useTranslations("common");

  const { data: order } = useApi<SalesOrder>(`/sales-orders/${id}`);
  const [realization, setRealization] = useState<SalesRealization | null>(null);
  const [notStarted, setNotStarted] = useState(false);

  const load = useCallback(() => {
    fetchApi<SalesRealization>(`/sales-orders/${id}/realization`)
      .then((r) => { setRealization(r); setNotStarted(false); })
      .catch(() => { setRealization(null); setNotStarted(true); });
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const [startOpen, setStartOpen] = useState(false);
  const [headerDate, setHeaderDate] = useState(new Date().toISOString().slice(0, 10));
  const [weighing, setWeighing] = useState<WeighingLocation>("ORIGIN_COOP");
  const [plate, setPlate] = useState("");
  const [headerNotes, setHeaderNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!realization) return;
    setHeaderDate(realization.realizationDate.slice(0, 10));
    setWeighing(realization.weighingLocation);
    // B6: backend menyalin plat customer saat realisasi dibuka, jadi yang
    // tampil di sini adalah salinan itu, bukan master yang bisa berubah.
    setPlate(realization.vehiclePlate ?? "");
    setHeaderNotes(realization.notes ?? "");
  }, [realization]);

  const [lineOpen, setLineOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<SalesRealizationLine | null>(null);
  const [draft, setDraft] = useState<LineDraft>(EMPTY);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<SalesRealizationLine | null>(null);

  // Backend menolak kandang yang tidak dijanjikan; batasi pilihannya agar
  // penggunanya tidak menemukan aturan itu lewat pesan kesalahan.
  const promisedCoops = useMemo(() => {
    const seen = new Map<string, string>();
    for (const l of order?.lines ?? []) {
      if (!l.sourceProjectCoopId) continue;
      const label = l.sourceProjectCoop
        ? `${l.sourceProjectCoop.coop.code} — ${l.sourceProjectCoop.coop.name}`
        : l.sourceProjectCoopId.slice(0, 8);
      seen.set(l.sourceProjectCoopId, label);
    }
    return [...seen.entries()].map(([value, label]) => ({ value, label }));
  }, [order]);

  async function handleStart() {
    setIsSaving(true);
    try {
      await fetchApi(`/sales-orders/${id}/realization`, {
        method: "POST",
        body: JSON.stringify({ realizationDate: headerDate, weighingLocation: weighing }),
      });
      toast.success(tc("entityCreated", { entity: t("entity") }));
      setStartOpen(false);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tc("entityCreateFailed", { entity: t("entity") }));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveHeader() {
    if (!realization) return;
    setIsSaving(true);
    try {
      await fetchApi(`/sales-realizations/${realization.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          realizationDate: headerDate,
          weighingLocation: weighing,
          vehiclePlate: plate.trim() || undefined,
          notes: headerNotes.trim() || undefined,
        }),
      });
      toast.success(tc("entityUpdated", { entity: t("entity") }));
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tc("entityUpdateFailed", { entity: t("entity") }));
    } finally {
      setIsSaving(false);
    }
  }

  function openNewLine() {
    setEditingLine(null);
    setDraft({ ...EMPTY, sourceProjectCoopId: promisedCoops[0]?.value ?? "" });
    setLineOpen(true);
  }

  function openEditLine(line: SalesRealizationLine) {
    setEditingLine(line);
    setDraft({
      sourceProjectCoopId: line.sourceProjectCoopId,
      pickupDate: line.pickupDate.slice(0, 10),
      dtpsNumber: line.dtpsNumber,
      birdCount: String(line.birdCount),
      totalWeightKg: String(Number(line.totalWeightKg)),
      isCulled: line.isCulled,
      unitPrice: line.unitPrice ? String(Number(line.unitPrice)) : "",
      discountPerKg: line.discountPerKg ? String(Number(line.discountPerKg)) : "",
      adminFeePerKg: line.adminFeePerKg ? String(Number(line.adminFeePerKg)) : "",
      savingsPerKg: line.savingsPerKg ? String(Number(line.savingsPerKg)) : "",
      lineNotes: line.lineNotes ?? "",
    });
    setLineOpen(true);
  }

  async function handleSaveLine() {
    if (!realization) return;
    if (
      !draft.sourceProjectCoopId || !draft.dtpsNumber.trim() ||
      !(Number(draft.birdCount) > 0) || !(Number(draft.totalWeightKg) > 0)
    ) {
      toast.error(t("lineRequired"));
      return;
    }

    // avgWeightKg, totalPrice dan allocationReleased tidak dikirim — ketiganya
    // diturunkan backend, dan forbidNonWhitelisted menolak 400 kalau ikut ada.
    const common = {
      pickupDate: draft.pickupDate,
      dtpsNumber: draft.dtpsNumber.trim(),
      birdCount: Number(draft.birdCount),
      totalWeightKg: Number(draft.totalWeightKg),
      isCulled: draft.isCulled,
      unitPrice: draft.unitPrice ? Number(draft.unitPrice) : undefined,
      discountPerKg: draft.discountPerKg ? Number(draft.discountPerKg) : undefined,
      adminFeePerKg: draft.adminFeePerKg ? Number(draft.adminFeePerKg) : undefined,
      savingsPerKg: draft.savingsPerKg ? Number(draft.savingsPerKg) : undefined,
      lineNotes: draft.lineNotes.trim() || undefined,
    };

    setIsSaving(true);
    try {
      if (editingLine) {
        await fetchApi(`/sales-realization-lines/${editingLine.id}`, {
          method: "PATCH",
          body: JSON.stringify(common),
        });
        toast.success(tc("entityUpdated", { entity: t("entity") }));
      } else {
        await fetchApi(`/sales-realizations/${realization.id}/lines`, {
          method: "POST",
          body: JSON.stringify({ ...common, sourceProjectCoopId: draft.sourceProjectCoopId }),
        });
        toast.success(tc("entityCreated", { entity: t("entity") }));
      }
      setLineOpen(false);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tc("entityCreateFailed", { entity: t("entity") }));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteLine() {
    if (!deleting) return;
    try {
      await fetchApi(`/sales-realization-lines/${deleting.id}`, { method: "DELETE" });
      toast.success(tc("entityDeleted", { entity: t("entity") }));
      setDeleteOpen(false);
      setDeleting(null);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tc("entityDeleteFailed", { entity: t("entity") }));
    }
  }

  const lines = realization?.lines ?? [];
  const num = (v: string | null) => (v ? Number(v) : 0);
  const totals = {
    price: lines.reduce((s, l) => s + num(l.totalPrice), 0),
    discount: lines.reduce((s, l) => s + num(l.discountPerKg) * num(l.totalWeightKg), 0),
    adminFee: lines.reduce((s, l) => s + num(l.adminFeePerKg) * num(l.totalWeightKg), 0),
    savings: lines.reduce((s, l) => s + num(l.savingsPerKg) * num(l.totalWeightKg), 0),
  };
  const orderedBirds = (order?.lines ?? []).reduce((s, l) => s + (l.birdCount ?? 0), 0);
  const realizedBirds = lines.reduce((s, l) => s + l.birdCount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t("title")}: ${order?.doNumber ?? id.slice(0, 8)}`}
        description={t("description")}
        actions={
          <Button variant="outline" asChild>
            <Link href={`/sales-orders/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tc("back")}
            </Link>
          </Button>
        }
      />

      {notStarted ? (
        <Card>
          <CardContent className="space-y-4 py-8 text-center">
            <p className="text-muted-foreground">{t("notStarted")}</p>
            <Button onClick={() => setStartOpen(true)}>{t("start")}</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("title")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <dl className="grid gap-2 text-sm md:col-span-2 md:grid-cols-4">
                <div>
                  <dt className="text-muted-foreground">DO</dt>
                  <dd className="font-medium">{order?.doNumber ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{tc("name")}</dt>
                  <dd className="font-medium">{order?.customer?.name ?? order?.breeder?.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("recipient")}</dt>
                  <dd className="font-medium">{order?.recipientName ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{tc("address")}</dt>
                  <dd className="font-medium">{order?.recipientAddress ?? "—"}</dd>
                </div>
              </dl>
              <div className="space-y-2">
                <Label htmlFor="rz-date">{t("realizationDate")}</Label>
                <Input id="rz-date" type="date" value={headerDate}
                  onChange={(e) => setHeaderDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("weighingLocation")}</Label>
                <Select value={weighing} onValueChange={(v) => setWeighing(v as WeighingLocation)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORIGIN_COOP">{t("originCoop")}</SelectItem>
                    <SelectItem value="DESTINATION_CUSTOMER">{t("destinationCustomer")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rz-plate">{t("vehiclePlate")}</Label>
                <Input id="rz-plate" value={plate} onChange={(e) => setPlate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rz-notes">{t("notes")}</Label>
                <Textarea id="rz-notes" value={headerNotes}
                  onChange={(e) => setHeaderNotes(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Button onClick={handleSaveHeader} disabled={isSaving}>
                  {isSaving ? tc("saving") : tc("update")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("lines")}</CardTitle>
              <Button size="sm" onClick={openNewLine} disabled={promisedCoops.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                {t("addLine")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("pickupDate")}</TableHead>
                      <TableHead>{t("sourceCoop")}</TableHead>
                      <TableHead>{t("dtpsNumber")}</TableHead>
                      <TableHead className="text-right">{t("birdCount")}</TableHead>
                      <TableHead className="text-right">{t("totalWeight")}</TableHead>
                      <TableHead className="text-right">{t("avgWeight")}</TableHead>
                      <TableHead className="text-right">{t("unitPrice")}</TableHead>
                      <TableHead className="text-right">{t("discountPerKg")}</TableHead>
                      <TableHead className="text-right">{t("adminFeePerKg")}</TableHead>
                      <TableHead className="text-right">{t("savingsPerKg")}</TableHead>
                      <TableHead className="text-right">{t("totalPrice")}</TableHead>
                      <TableHead className="w-[100px]">{tc("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="py-6 text-center text-muted-foreground">
                          {tc("noResults", { entity: t("lines") })}
                        </TableCell>
                      </TableRow>
                    ) : (
                      lines.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell>{formatDate(l.pickupDate)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>
                                {l.sourceProjectCoop
                                  ? `${l.sourceProjectCoop.coop.code} — ${l.sourceProjectCoop.coop.name}`
                                  : "—"}
                              </span>
                              {l.isCulled && <Badge variant="secondary">{t("culled")}</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>{l.dtpsNumber}</TableCell>
                          <TableCell className="text-right">{l.birdCount.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{Number(l.totalWeightKg)}</TableCell>
                          <TableCell className="text-right">{Number(l.avgWeightKg).toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            {l.unitPrice ? formatCurrency(l.unitPrice) : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {l.discountPerKg ? formatCurrency(l.discountPerKg) : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {l.adminFeePerKg ? formatCurrency(l.adminFeePerKg) : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {l.savingsPerKg ? formatCurrency(l.savingsPerKg) : "—"}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {l.totalPrice ? formatCurrency(l.totalPrice) : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm"
                                aria-label={`${tc("editEntity", { entity: t("lines") })} ${l.dtpsNumber}`}
                                onClick={() => openEditLine(l)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm"
                                aria-label={`${tc("deleteEntity", { entity: t("lines") })} ${l.dtpsNumber}`}
                                onClick={() => { setDeleting(l); setDeleteOpen(true); }}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-2 text-sm md:w-80 md:justify-self-end">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("totalRealized")}</span>
                  <span className="font-medium">{formatCurrency(totals.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("totalDiscount")}</span>
                  <span>{formatCurrency(totals.discount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PPN %</span>
                  <span>{order?.vatPercent ? Number(order.vatPercent) : 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("totalAdminFee")}</span>
                  <span>{formatCurrency(totals.adminFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("totalSavings")}</span>
                  <span>{formatCurrency(totals.savings)}</span>
                </div>
              </div>

              {/* A2: boleh melebihi pesanan, jadi ini peringatan, bukan penghalang. */}
              {realizedBirds > orderedBirds && (
                <p className="text-sm text-destructive">
                  {t("exceedsOrder", { birds: realizedBirds, ordered: orderedBirds })}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("start")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">{t("realizationDate")}</Label>
              <Input id="start-date" type="date" value={headerDate}
                onChange={(e) => setHeaderDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("weighingLocation")}</Label>
              <Select value={weighing} onValueChange={(v) => setWeighing(v as WeighingLocation)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORIGIN_COOP">{t("originCoop")}</SelectItem>
                  <SelectItem value="DESTINATION_CUSTOMER">{t("destinationCustomer")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartOpen(false)} disabled={isSaving}>
              {tc("cancel")}
            </Button>
            <Button onClick={handleStart} disabled={isSaving}>
              {isSaving ? tc("saving") : t("start")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lineOpen} onOpenChange={setLineOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLine ? tc("editEntity", { entity: t("lines") }) : t("addLine")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("sourceCoop")}</Label>
              <Select
                value={draft.sourceProjectCoopId}
                onValueChange={(v) => setDraft((d) => ({ ...d, sourceProjectCoopId: v }))}
                disabled={!!editingLine}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {promisedCoops.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="line-pickup">{t("pickupDate")}</Label>
              <Input id="line-pickup" type="date" value={draft.pickupDate}
                onChange={(e) => setDraft((d) => ({ ...d, pickupDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="line-dtps">{t("dtpsNumber")}</Label>
              <Input id="line-dtps" value={draft.dtpsNumber}
                onChange={(e) => setDraft((d) => ({ ...d, dtpsNumber: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="line-birds">{t("birdCount")}</Label>
              <Input id="line-birds" type="number" min={1} step="1" value={draft.birdCount}
                onChange={(e) => setDraft((d) => ({ ...d, birdCount: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="line-tonnage">{t("totalWeight")}</Label>
              <Input id="line-tonnage" type="number" min={0} step="0.0001" value={draft.totalWeightKg}
                onChange={(e) => setDraft((d) => ({ ...d, totalWeightKg: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="line-avg">{t("avgWeight")}</Label>
              <Input id="line-avg" value={avgOf(draft.birdCount, draft.totalWeightKg)} readOnly disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="line-price">{t("unitPrice")}</Label>
              <Input id="line-price" type="number" min={0} step="0.0001" value={draft.unitPrice}
                onChange={(e) => setDraft((d) => ({ ...d, unitPrice: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="line-discount">{t("discountPerKg")}</Label>
              <Input id="line-discount" type="number" min={0} step="0.01" value={draft.discountPerKg}
                onChange={(e) => setDraft((d) => ({ ...d, discountPerKg: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="line-admin">{t("adminFeePerKg")}</Label>
              <Input id="line-admin" type="number" min={0} step="0.01" value={draft.adminFeePerKg}
                onChange={(e) => setDraft((d) => ({ ...d, adminFeePerKg: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="line-savings">{t("savingsPerKg")}</Label>
              <Input id="line-savings" type="number" min={0} step="0.01" value={draft.savingsPerKg}
                onChange={(e) => setDraft((d) => ({ ...d, savingsPerKg: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="line-installment">{t("installmentPerKg")}</Label>
              <Input id="line-installment" type="number" value="" disabled />
              <p className="text-xs text-muted-foreground">{t("installmentDisabled")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="line-notes">{t("lineNotes")}</Label>
              <Input id="line-notes" value={draft.lineNotes}
                onChange={(e) => setDraft((d) => ({ ...d, lineNotes: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Checkbox id="line-culled" checked={draft.isCulled}
                onCheckedChange={(c) => setDraft((d) => ({ ...d, isCulled: c === true }))} />
              <Label htmlFor="line-culled">{t("culled")}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLineOpen(false)} disabled={isSaving}>
              {tc("cancel")}
            </Button>
            <Button onClick={handleSaveLine} disabled={isSaving}>
              {isSaving ? tc("saving") : editingLine ? tc("update") : tc("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={tc("deleteEntity", { entity: t("lines") })}
        description={tc("confirmDelete", { name: deleting?.dtpsNumber ?? "" })}
        onConfirm={handleDeleteLine}
        variant="destructive"
        confirmLabel={tc("delete")}
      />
    </div>
  );
}
