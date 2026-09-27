"use client";

import { useState } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ProjectCoopCombobox } from "@/components/forms/project-coop-combobox";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { CoopDepletionEntry } from "@/types/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const TODAY = new Date().toISOString().slice(0, 10);

export default function CoopDepletionsPage() {
  const t = useTranslations("coopDepletions");
  const tc = useTranslations("common");

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data: entries, meta, isLoading, refetch } = usePaginated<CoopDepletionEntry>(
    "/coop-depletions",
    { page, limit: 10, search }
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CoopDepletionEntry | null>(null);
  const [formCoop, setFormCoop] = useState("");
  const [formDate, setFormDate] = useState(TODAY);
  const [formMortality, setFormMortality] = useState("");
  const [formCulling, setFormCulling] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<CoopDepletionEntry | null>(null);

  const columns: Column<CoopDepletionEntry>[] = [
    { header: t("entryDate"), cell: (row) => formatDate(row.entryDate), className: "w-[140px]" },
    {
      header: t("coop"),
      cell: (row) => `${row.projectCoop.coop.code} — ${row.projectCoop.coop.name}`,
    },
    {
      header: t("mortality"),
      cell: (row) => row.mortalityCount.toLocaleString(),
      className: "w-[110px]",
    },
    {
      header: t("culling"),
      cell: (row) => row.cullingCount.toLocaleString(),
      className: "w-[110px]",
    },
    { header: t("notes"), cell: (row) => row.notes ?? "-" },
    {
      header: tc("actions"),
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setDeleting(row); setDeleteDialogOpen(true); }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
      className: "w-[100px]",
    },
  ];

  function handleCreate() {
    setEditing(null);
    setFormCoop("");
    setFormDate(TODAY);
    setFormMortality("");
    setFormCulling("");
    setFormNotes("");
    setDialogOpen(true);
  }

  function handleEdit(row: CoopDepletionEntry) {
    setEditing(row);
    setFormCoop(row.projectCoop.id);
    setFormDate(row.entryDate.slice(0, 10));
    setFormMortality(String(row.mortalityCount));
    setFormCulling(String(row.cullingCount));
    setFormNotes(row.notes ?? "");
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!editing && !formCoop) {
      toast.error(tc("required", { field: t("coop") }));
      return;
    }
    const mortality = Number(formMortality || 0);
    const culling = Number(formCulling || 0);
    if (!Number.isInteger(mortality) || !Number.isInteger(culling) || mortality < 0 || culling < 0) {
      toast.error(tc("required", { field: t("mortality") }));
      return;
    }
    if (mortality + culling <= 0) {
      toast.error(t("countRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      if (editing) {
        // Kandang dan tanggal tidak dikirim: UpdateCoopDepletionDto menghilangkan
        // keduanya, dan `forbidNonWhitelisted` menolak properti yang tidak dideklarasikan.
        await fetchApi(`/coop-depletions/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            mortalityCount: mortality,
            cullingCount: culling,
            notes: formNotes.trim() || undefined,
          }),
        });
        toast.success(tc("entityUpdated", { entity: t("entity") }));
      } else {
        await fetchApi("/coop-depletions", {
          method: "POST",
          body: JSON.stringify({
            projectCoopId: formCoop,
            entryDate: formDate,
            mortalityCount: mortality,
            cullingCount: culling,
            notes: formNotes.trim() || undefined,
          }),
        });
        toast.success(tc("entityCreated", { entity: t("entity") }));
      }
      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : editing
            ? tc("entityUpdateFailed", { entity: t("entity") })
            : tc("entityCreateFailed", { entity: t("entity") })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await fetchApi(`/coop-depletions/${deleting.id}`, { method: "DELETE" });
      toast.success(tc("entityDeleted", { entity: t("entity") }));
      setDeleteDialogOpen(false);
      setDeleting(null);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tc("entityDeleteFailed", { entity: t("entity") })
      );
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
        data={entries}
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
            <DialogTitle>
              {editing ? tc("editEntity", { entity: t("entity") }) : tc("newEntity", { entity: t("entity") })}
            </DialogTitle>
            <DialogDescription>
              {editing ? tc("updateDetails", { entity: t("entity") }) : t("description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("coop")}</Label>
              <ProjectCoopCombobox value={formCoop} onChange={setFormCoop} disabled={!!editing} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="depletion-date">{t("entryDate")}</Label>
              <Input
                id="depletion-date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                disabled={!!editing}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="depletion-mortality">{t("mortality")}</Label>
                <Input
                  id="depletion-mortality"
                  type="number"
                  min={0}
                  step="1"
                  value={formMortality}
                  onChange={(e) => setFormMortality(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depletion-culling">{t("culling")}</Label>
                <Input
                  id="depletion-culling"
                  type="number"
                  min={0}
                  step="1"
                  value={formCulling}
                  onChange={(e) => setFormCulling(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="depletion-notes">{t("notes")}</Label>
              <Input
                id="depletion-notes"
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
              {isSubmitting
                ? tc("saving")
                : editing
                  ? tc("updateEntity", { entity: t("entity") })
                  : tc("createEntity", { entity: t("entity") })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={tc("deleteEntity", { entity: t("entity") })}
        description={tc("confirmDelete", { name: deleting ? formatDate(deleting.entryDate) : "" })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={tc("delete")}
      />
    </div>
  );
}
