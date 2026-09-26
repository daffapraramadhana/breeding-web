"use client";

import { useState } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { MatureBirdStandard } from "@/types/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface RangeDraft {
  valueFrom: string;
  valueTo: string;
}

export default function MatureBirdStandardsPage() {
  const t = useTranslations('matureBirdStandards');
  const tc = useTranslations('common');

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data: standards, meta, isLoading, refetch } = usePaginated<MatureBirdStandard>(
    "/mature-bird-standards",
    { page, limit: 10, search }
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MatureBirdStandard | null>(null);
  const [formName, setFormName] = useState("");
  const [formRanges, setFormRanges] = useState<RangeDraft[]>([{ valueFrom: "", valueTo: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<MatureBirdStandard | null>(null);

  const columns: Column<MatureBirdStandard>[] = [
    { header: t('name'), accessorKey: "name" },
    {
      header: t('ranges'),
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.ranges.map((r) => (
            <Badge key={r.id} variant="secondary">
              {Number(r.valueFrom)} – {Number(r.valueTo)}
            </Badge>
          ))}
        </div>
      ),
    },
    { header: tc('created'), cell: (row) => formatDate(row.createdAt), className: "w-[150px]" },
    {
      header: tc('actions'),
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleting(row); setDeleteDialogOpen(true); }}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
      className: "w-[100px]",
    },
  ];

  function handleCreate() {
    setEditing(null);
    setFormName("");
    setFormRanges([{ valueFrom: "", valueTo: "" }]);
    setDialogOpen(true);
  }

  function handleEdit(row: MatureBirdStandard) {
    setEditing(row);
    setFormName(row.name);
    setFormRanges(
      row.ranges.length > 0
        ? row.ranges.map((r) => ({ valueFrom: String(Number(r.valueFrom)), valueTo: String(Number(r.valueTo)) }))
        : [{ valueFrom: "", valueTo: "" }]
    );
    setDialogOpen(true);
  }

  function updateRange(index: number, key: keyof RangeDraft, value: string) {
    setFormRanges((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }

  async function handleSubmit() {
    if (!formName.trim()) {
      toast.error(tc('required', { field: t('name') }));
      return;
    }
    const touched = formRanges.filter((r) => r.valueFrom.trim() || r.valueTo.trim());
    if (touched.length === 0) {
      toast.error(t('rangeRequired'));
      return;
    }
    // A row with only one side filled would otherwise be dropped silently
    // under a success toast, leaving a gap in the master data.
    const filled = touched.filter((r) => r.valueFrom.trim() && r.valueTo.trim());
    if (filled.length !== touched.length) {
      toast.error(t('rangeIncomplete'));
      return;
    }
    if (filled.some((r) => Number(r.valueTo) < Number(r.valueFrom))) {
      toast.error(t('rangeInvalid'));
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        name: formName.trim(),
        ranges: filled.map((r) => ({ valueFrom: Number(r.valueFrom), valueTo: Number(r.valueTo) })),
      };
      if (editing) {
        await fetchApi(`/mature-bird-standards/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) });
        toast.success(tc('entityUpdated', { entity: t('entity') }));
      } else {
        await fetchApi("/mature-bird-standards", { method: "POST", body: JSON.stringify(body) });
        toast.success(tc('entityCreated', { entity: t('entity') }));
      }
      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : editing
            ? tc('entityUpdateFailed', { entity: t('entity') })
            : tc('entityCreateFailed', { entity: t('entity') })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await fetchApi(`/mature-bird-standards/${deleting.id}`, { method: "DELETE" });
      toast.success(tc('entityDeleted', { entity: t('entity') }));
      setDeleteDialogOpen(false);
      setDeleting(null);
      refetch();
    } catch {
      toast.error(tc('entityDeleteFailed', { entity: t('entity') }));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {tc('newEntity', { entity: t('entity') })}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={standards}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder={t('searchPlaceholder')}
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle={tc('noResults', { entity: t('title') })}
        emptyDescription={tc('getStartedAlt', { entity: t('entity') })}
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {tc('newEntity', { entity: t('entity') })}
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? tc('editEntity', { entity: t('entity') }) : tc('newEntity', { entity: t('entity') })}
            </DialogTitle>
            <DialogDescription>
              {editing ? tc('updateDetails', { entity: t('entity') }) : tc('fillDetailsAlt', { entity: t('entity') })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="standard-name">{t('name')}</Label>
              <Input id="standard-name" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>{t('ranges')}</Label>
              <div className="space-y-2">
                {formRanges.map((r, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs" htmlFor={`range-from-${i}`}>{t('valueFrom')}</Label>
                      <Input id={`range-from-${i}`} type="number" min={0} step="0.01"
                        value={r.valueFrom} onChange={(e) => updateRange(i, "valueFrom", e.target.value)} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs" htmlFor={`range-to-${i}`}>{t('valueTo')}</Label>
                      <Input id={`range-to-${i}`} type="number" min={0} step="0.01"
                        value={r.valueTo} onChange={(e) => updateRange(i, "valueTo", e.target.value)} />
                    </div>
                    <Button variant="ghost" size="sm" disabled={formRanges.length === 1}
                      onClick={() => setFormRanges((prev) => prev.filter((_, idx) => idx !== i))}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm"
                onClick={() => setFormRanges((prev) => [...prev, { valueFrom: "", valueTo: "" }])}>
                <Plus className="mr-2 h-4 w-4" />
                {t('addRange')}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
              {tc('cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? tc('saving') : editing ? tc('updateEntity', { entity: t('entity') }) : tc('createEntity', { entity: t('entity') })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={tc('deleteEntity', { entity: t('entity') })}
        description={tc('confirmDelete', { name: deleting?.name ?? '' })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={tc('delete')}
      />
    </div>
  );
}
