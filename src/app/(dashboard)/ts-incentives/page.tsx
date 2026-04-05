"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { TsIncentive } from "@/types/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TsIncentivesPage() {
  const t = useTranslations("tsIncentives");
  const tc = useTranslations("common");
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const {
    data: items,
    meta,
    isLoading,
    refetch,
  } = usePaginated<TsIncentive>("/ts-incentives", {
    page,
    limit: 10,
    search,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TsIncentive | null>(null);
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<TsIncentive | null>(null);

  const columns: Column<TsIncentive>[] = [
    { header: tc("name"), accessorKey: "name" },
    { header: t("amount"), accessorKey: "amount" },
    {
      header: tc("description"),
      cell: (row) => row.description || "-",
    },
    {
      header: tc("created"),
      cell: (row) => formatDate(row.createdAt),
      className: "w-[150px]",
    },
    {
      header: tc("actions"),
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(row);
            }}
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
    setFormName("");
    setFormAmount("");
    setFormDescription("");
    setDialogOpen(true);
  }

  function handleEdit(item: TsIncentive) {
    setEditing(item);
    setFormName(item.name);
    setFormAmount(item.amount);
    setFormDescription(item.description || "");
    setDialogOpen(true);
  }

  function handleDeleteClick(item: TsIncentive) {
    setDeleting(item);
    setDeleteDialogOpen(true);
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
        amount: formAmount.trim(),
        ...(formDescription.trim() && { description: formDescription.trim() }),
      };

      if (editing) {
        await fetchApi(`/ts-incentives/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success(tc("entityUpdated", { entity: t("entity") }));
      } else {
        await fetchApi("/ts-incentives", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success(tc("entityCreated", { entity: t("entity") }));
      }

      setDialogOpen(false);
      refetch();
    } catch {
      toast.error(
        editing
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
      await fetchApi(`/ts-incentives/${deleting.id}`, {
        method: "DELETE",
      });
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
        data={items}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? tc("editEntity", { entity: t("entity") }) : tc("newEntity", { entity: t("entity") })}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? tc("updateDetails", { entity: t("entity") })
                : tc("fillDetails", { entity: t("entity") })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{tc("name")}</Label>
              <Input
                id="name"
                placeholder={tc("enterField", { field: tc("name") })}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">{t("amount")}</Label>
              <Input
                id="amount"
                placeholder={tc("enterField", { field: t("amount") })}
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{tc("description")}</Label>
              <Input
                id="description"
                placeholder={tc("enterField", { field: tc("description") })}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              {tc("cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? tc("saving")
                : editing
                  ? tc("update")
                  : tc("create")}
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
