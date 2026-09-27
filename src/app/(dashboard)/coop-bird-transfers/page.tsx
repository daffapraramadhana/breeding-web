"use client";

import { useState, useEffect } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectCoopCombobox } from "@/components/forms/project-coop-combobox";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { CoopBirdTransfer, CoopPopulationRow } from "@/types/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const TODAY = new Date().toISOString().slice(0, 10);

export default function CoopBirdTransfersPage() {
  const t = useTranslations("coopBirdTransfers");
  const tc = useTranslations("common");

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data: transfers, meta, isLoading, refetch } = usePaginated<CoopBirdTransfer>(
    "/coop-bird-transfers",
    { page, limit: 10, search }
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formSource, setFormSource] = useState("");
  const [formDestination, setFormDestination] = useState("");
  const [formQuantity, setFormQuantity] = useState("");
  const [formDate, setFormDate] = useState(TODAY);
  const [formNotes, setFormNotes] = useState("");
  const [sourceAvailable, setSourceAvailable] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!formSource) {
      setSourceAvailable(null);
      return;
    }
    fetchApi<CoopPopulationRow>(`/coop-populations/${formSource}`)
      .then((res) => setSourceAvailable(res.population.quantityAvailable))
      .catch(() => setSourceAvailable(null));
  }, [formSource]);

  const columns: Column<CoopBirdTransfer>[] = [
    { header: t("transferNumber"), accessorKey: "transferNumber", className: "w-[170px]" },
    { header: t("transferDate"), cell: (row) => formatDate(row.transferDate), className: "w-[140px]" },
    {
      header: t("source"),
      cell: (row) => `${row.sourceProjectCoop.coop.code} — ${row.sourceProjectCoop.coop.name}`,
    },
    {
      header: t("destination"),
      cell: (row) =>
        `${row.destinationProjectCoop.coop.code} — ${row.destinationProjectCoop.coop.name}`,
    },
    {
      header: t("quantity"),
      cell: (row) => <Badge variant="secondary">{row.quantity.toLocaleString()}</Badge>,
      className: "w-[110px]",
    },
    { header: t("notes"), cell: (row) => row.notes ?? "-" },
  ];

  function handleCreate() {
    setFormSource("");
    setFormDestination("");
    setFormQuantity("");
    setFormDate(TODAY);
    setFormNotes("");
    setSourceAvailable(null);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!formSource || !formDestination) {
      toast.error(tc("required", { field: t("source") }));
      return;
    }
    if (formSource === formDestination) {
      toast.error(t("sameCoop"));
      return;
    }
    const qty = Number(formQuantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      toast.error(tc("required", { field: t("quantity") }));
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchApi("/coop-bird-transfers", {
        method: "POST",
        body: JSON.stringify({
          sourceProjectCoopId: formSource,
          destinationProjectCoopId: formDestination,
          quantity: qty,
          transferDate: formDate,
          notes: formNotes.trim() || undefined,
        }),
      });
      toast.success(tc("entityCreated", { entity: t("entity") }));
      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tc("entityCreateFailed", { entity: t("entity") })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {tc("newEntity", { entity: t("entity") })}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={transfers}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder={t("searchPlaceholder")}
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle={tc("noResults", { entity: t("title") })}
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {tc("newEntity", { entity: t("entity") })}
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tc("newEntity", { entity: t("entity") })}</DialogTitle>
            <DialogDescription>{t("immutableHint")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("source")}</Label>
              <ProjectCoopCombobox value={formSource} onChange={setFormSource} />
              {sourceAvailable !== null && (
                <p className="text-xs text-muted-foreground">
                  {t("sourceAvailable")}: {sourceAvailable.toLocaleString()}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("destination")}</Label>
              <ProjectCoopCombobox value={formDestination} onChange={setFormDestination} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-quantity">{t("quantity")}</Label>
              <Input
                id="transfer-quantity"
                type="number"
                min={1}
                step="1"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-date">{t("transferDate")}</Label>
              <Input
                id="transfer-date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-notes">{t("notes")}</Label>
              <Input
                id="transfer-notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
              {tc("cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? tc("saving") : tc("createEntity", { entity: t("entity") })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
