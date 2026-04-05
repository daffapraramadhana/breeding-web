"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { BonusIp } from "@/types/api";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DetailRow {
  minIp: string;
  maxIp: string;
  bonus: string;
}

export default function BonusIpPage() {
  const t = useTranslations("bonusIp");
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
  } = usePaginated<BonusIp>("/bonus-ip", {
    page,
    limit: 10,
    search,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BonusIp | null>(null);
  const [formName, setFormName] = useState("");
  const [formBonusUnitOption, setFormBonusUnitOption] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [formDetails, setFormDetails] = useState<DetailRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<BonusIp | null>(null);

  const columns: Column<BonusIp>[] = [
    { header: tc("name"), accessorKey: "name" },
    {
      header: t("bonusUnitOption"),
      cell: (row) => row.bonusUnitOption || "-",
    },
    {
      header: tc("status"),
      cell: (row) => <StatusBadge status={row.status} />,
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
    setFormBonusUnitOption("");
    setFormStatus("");
    setFormDetails([]);
    setDialogOpen(true);
  }

  function handleEdit(item: BonusIp) {
    setEditing(item);
    setFormName(item.name);
    setFormBonusUnitOption(item.bonusUnitOption || "");
    setFormStatus(item.status);
    setFormDetails(
      item.details?.map((d) => ({
        minIp: d.minIp,
        maxIp: d.maxIp,
        bonus: d.bonus,
      })) || []
    );
    setDialogOpen(true);
  }

  function handleDeleteClick(item: BonusIp) {
    setDeleting(item);
    setDeleteDialogOpen(true);
  }

  function addDetail() {
    setFormDetails([...formDetails, { minIp: "", maxIp: "", bonus: "" }]);
  }

  function removeDetail(index: number) {
    setFormDetails(formDetails.filter((_, i) => i !== index));
  }

  function updateDetail(index: number, field: keyof DetailRow, value: string) {
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
        bonusUnitOption: formBonusUnitOption,
        status: formStatus,
        details: formDetails,
      };

      if (editing) {
        await fetchApi(`/bonus-ip/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success(tc("entityUpdated", { entity: t("entity") }));
      } else {
        await fetchApi("/bonus-ip", {
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
      await fetchApi(`/bonus-ip/${deleting.id}`, {
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
        <DialogContent className="max-w-2xl">
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
              <Label>{t("bonusUnitOption")}</Label>
              <Select
                value={formBonusUnitOption}
                onValueChange={setFormBonusUnitOption}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectUnitOption")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER_KG">PER_KG</SelectItem>
                  <SelectItem value="PER_BIRD">PER_BIRD</SelectItem>
                  <SelectItem value="FLAT">FLAT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{tc("status")}</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger>
                  <SelectValue placeholder={tc("selectField", { field: tc("status") })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("details")}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addDetail}>
                  <Plus className="mr-1 h-3 w-3" />
                  {t("addDetail")}
                </Button>
              </div>
              {formDetails.map((detail, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={t("minIp")}
                    value={detail.minIp}
                    onChange={(e) =>
                      updateDetail(index, "minIp", e.target.value)
                    }
                  />
                  <Input
                    placeholder={t("maxIp")}
                    value={detail.maxIp}
                    onChange={(e) =>
                      updateDetail(index, "maxIp", e.target.value)
                    }
                  />
                  <Input
                    placeholder={t("bonus")}
                    value={detail.bonus}
                    onChange={(e) =>
                      updateDetail(index, "bonus", e.target.value)
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDetail(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
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
