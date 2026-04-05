"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { DriverBonus } from "@/types/api";
import { EmployeeCombobox } from "@/components/forms/employee-combobox";

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

export default function DriverBonusesPage() {
  const t = useTranslations("driverBonuses");
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
  } = usePaginated<DriverBonus>("/driver-bonuses", {
    page,
    limit: 10,
    search,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DriverBonus | null>(null);
  const [formDeliveryId, setFormDeliveryId] = useState("");
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<DriverBonus | null>(null);

  const columns: Column<DriverBonus>[] = [
    { header: t("deliveryId"), accessorKey: "deliveryId" },
    {
      header: t("employee"),
      cell: (row) => row.employee?.name || "-",
    },
    { header: t("amount"), accessorKey: "amount" },
    {
      header: t("paymentStatus"),
      cell: (row) => <StatusBadge status={row.paymentStatus} />,
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
    setFormDeliveryId("");
    setFormEmployeeId("");
    setFormAmount("");
    setDialogOpen(true);
  }

  function handleEdit(item: DriverBonus) {
    setEditing(item);
    setFormDeliveryId(item.deliveryId);
    setFormEmployeeId(item.employeeId);
    setFormAmount(item.amount);
    setDialogOpen(true);
  }

  function handleDeleteClick(item: DriverBonus) {
    setDeleting(item);
    setDeleteDialogOpen(true);
  }

  async function handleSubmit() {
    if (!formDeliveryId.trim()) {
      toast.error(tc("required", { field: t("deliveryId") }));
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        deliveryId: formDeliveryId.trim(),
        employeeId: formEmployeeId,
        amount: formAmount.trim(),
      };

      if (editing) {
        await fetchApi(`/driver-bonuses/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success(tc("entityUpdated", { entity: t("entity") }));
      } else {
        await fetchApi("/driver-bonuses", {
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
      await fetchApi(`/driver-bonuses/${deleting.id}`, {
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
              <Label htmlFor="deliveryId">{t("deliveryId")}</Label>
              <Input
                id="deliveryId"
                placeholder={tc("enterField", { field: t("deliveryId") })}
                value={formDeliveryId}
                onChange={(e) => setFormDeliveryId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("employee")}</Label>
              <EmployeeCombobox
                value={formEmployeeId}
                onChange={setFormEmployeeId}
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
        description={tc("confirmDelete", { name: t("entity") })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={tc("delete")}
      />
    </div>
  );
}
