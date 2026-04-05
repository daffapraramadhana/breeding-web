"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { FcrStandard, FcrStandardDetail } from "@/types/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function FcrStandardsPage() {
  const t = useTranslations("fcrStandards");
  const tc = useTranslations("common");
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data: standards, meta, isLoading, refetch } = usePaginated<FcrStandard>(
    "/fcr-standards",
    { page, limit: 10, search }
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FcrStandard | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDetails, setFormDetails] = useState<FcrStandardDetail[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<FcrStandard | null>(null);

  const columns: Column<FcrStandard>[] = [
    { header: tc("name"), accessorKey: "name" },
    { header: tc("description"), cell: (row) => row.description || "-" },
    { header: tc("created"), cell: (row) => formatDate(row.createdAt), className: "w-[150px]" },
    {
      header: tc("actions"),
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteClick(row); }}>
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
    setFormDescription("");
    setFormDetails([]);
    setDialogOpen(true);
  }

  function handleEdit(item: FcrStandard) {
    setEditing(item);
    setFormName(item.name);
    setFormDescription(item.description || "");
    setFormDetails(item.details || []);
    setDialogOpen(true);
  }

  function handleDeleteClick(item: FcrStandard) {
    setDeleting(item);
    setDeleteDialogOpen(true);
  }

  function addDetail() {
    setFormDetails([...formDetails, { day: 0, fcr: "" }]);
  }

  function removeDetail(index: number) {
    setFormDetails(formDetails.filter((_, i) => i !== index));
  }

  function updateDetail(index: number, field: keyof FcrStandardDetail, value: string | number) {
    const updated = [...formDetails];
    updated[index] = { ...updated[index], [field]: value };
    setFormDetails(updated);
  }

  async function handleSubmit() {
    if (!formName.trim()) {
      toast.error(tc("required", { field: tc("name") }));
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        name: formName.trim(),
        ...(formDescription.trim() && { description: formDescription.trim() }),
        details: formDetails,
      };

      if (editing) {
        await fetchApi(`/fcr-standards/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success(tc("entityUpdated", { entity: t("entity") }));
      } else {
        await fetchApi("/fcr-standards", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success(tc("entityCreated", { entity: t("entity") }));
      }

      setDialogOpen(false);
      refetch();
    } catch {
      toast.error(editing ? tc("entityUpdateFailed", { entity: t("entity") }) : tc("entityCreateFailed", { entity: t("entity") }));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await fetchApi(`/fcr-standards/${deleting.id}`, { method: "DELETE" });
      toast.success(tc("entityDeleted", { entity: t("entity") }));
      setDeleteDialogOpen(false);
      setDeleting(null);
      refetch();
    } catch {
      toast.error(tc("entityDeleteFailed", { entity: t("entity") }));
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
        data={standards}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder={t("searchPlaceholder")}
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle={tc("noResults", { entity: t("entity") })}
        emptyDescription={tc("getStarted", { entity: t("entity") })}
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {tc("newEntity", { entity: t("entity") })}
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? tc("editEntity", { entity: t("entity") }) : tc("newEntity", { entity: t("entity") })}</DialogTitle>
            <DialogDescription>
              {editing ? tc("updateDetails", { entity: t("entity") }) : tc("fillDetails", { entity: t("entity") })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fcr-name">{tc("name")}</Label>
              <Input id="fcr-name" placeholder={tc("enterField", { field: tc("name") })} value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fcr-description">{tc("description")}</Label>
              <Textarea
                id="fcr-description"
                placeholder={tc("enterFieldOptional", { field: tc("description") })}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("details")}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addDetail}>
                  <Plus className="mr-1 h-3 w-3" />
                  {t("addDetail")}
                </Button>
              </div>
              {formDetails.length > 0 && (
                <div className="space-y-2">
                  {formDetails.map((detail, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder={t("day")}
                          value={detail.day || ""}
                          onChange={(e) => updateDetail(index, "day", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder={t("fcr")}
                          value={detail.fcr}
                          onChange={(e) => updateDetail(index, "fcr", e.target.value)}
                        />
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeDetail(index)}>
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>{tc("cancel")}</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? tc("saving") : editing ? tc("update") : tc("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={tc("deleteEntity", { entity: t("entity") })}
        description={tc("confirmDelete", { name: deleting?.name ?? "" })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={tc("delete")}
      />
    </div>
  );
}
