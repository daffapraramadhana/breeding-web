"use client";

import { useState } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { BranchCombobox } from "@/components/forms/branch-combobox";
import { EntityCombobox } from "@/components/forms/entity-combobox";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Warehouse, WarehouseOwnerType } from "@/types/api";

const LIMIT = 10;

export default function WarehousesPage() {
  const t = useTranslations('warehouses');
  const tc = useTranslations('common');

  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  const { data, meta, isLoading, refetch } = usePaginated<Warehouse>(
    "/warehouses",
    { page, limit: LIMIT, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    branchId: "",
    ownerType: "" as WarehouseOwnerType | "",
    ownerId: "",
  });
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const ownerTypeLabels: Record<WarehouseOwnerType, string> = {
    BRANCH: t('branch'),
    FARM: "Farm",
    COOP: "Coop",
  };

  function openCreate() {
    setEditing(null);
    setFormData({ code: "", name: "", branchId: "", ownerType: "", ownerId: "" });
    setDialogOpen(true);
  }

  function openEdit(warehouse: Warehouse) {
    setEditing(warehouse);
    setFormData({
      code: warehouse.code,
      name: warehouse.name,
      branchId: warehouse.branchId || "",
      ownerType: warehouse.ownerType || "",
      ownerId: warehouse.ownerId || "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error(t('codeAndNameRequired'));
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = {
        code: formData.code,
        name: formData.name,
      };
      if (formData.branchId) {
        body.branchId = formData.branchId;
      }
      if (formData.ownerType) {
        body.ownerType = formData.ownerType;
      }
      if (formData.ownerId.trim()) {
        body.ownerId = formData.ownerId;
      }

      if (editing) {
        await fetchApi(`/warehouses/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success(tc('entityUpdated', { entity: t('entity') }));
      } else {
        await fetchApi("/warehouses", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success(tc('entityCreated', { entity: t('entity') }));
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('failedToSave')
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await fetchApi(`/warehouses/${deleteTarget.id}`, {
        method: "DELETE",
      });
      toast.success(tc('entityDeleted', { entity: t('entity') }));
      setDeleteTarget(null);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tc('entityDeleteFailed', { entity: t('entity') })
      );
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Warehouse>[] = [
    { header: tc('code'), accessorKey: "code" },
    { header: tc('name'), accessorKey: "name" },
    {
      header: t('branch'),
      cell: (row) => row.branch?.name || "—",
    },
    {
      header: t('ownerType'),
      cell: (row) => row.ownerType ? ownerTypeLabels[row.ownerType] || row.ownerType : "—",
    },
    {
      header: tc('created'),
      cell: (row) => formatDate(row.createdAt),
    },
    {
      header: tc('actions'),
      className: "w-[100px]",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {tc('addEntity', { entity: t('entity') })}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder={tc('searchField', { field: t('title') })}
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle={tc('noResults', { entity: t('entity') })}
        emptyDescription={tc('getStarted', { entity: t('entity') })}
        emptyAction={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {tc('addEntity', { entity: t('entity') })}
          </Button>
        }
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing
                ? tc('editEntity', { entity: t('entity') })
                : tc('createEntity', { entity: t('entity') })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">{tc('code')}</Label>
              <Input
                id="code"
                placeholder={t('codePlaceholder')}
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{tc('name')}</Label>
              <Input
                id="name"
                placeholder={t('warehouseName')}
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t('branch')}</Label>
              <BranchCombobox
                value={formData.branchId}
                onChange={(id) =>
                  setFormData((prev) => ({ ...prev, branchId: id }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t('ownerType')}</Label>
              <Select
                value={formData.ownerType}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, ownerType: v as WarehouseOwnerType, ownerId: "" }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={tc('selectField', { field: t('ownerType') })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRANCH">{t('branch')}</SelectItem>
                  <SelectItem value="FARM">Farm</SelectItem>
                  <SelectItem value="COOP">Coop</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.ownerType && (
              <div className="space-y-2">
                <Label>{t('owner')}</Label>
                <EntityCombobox
                  endpoint={
                    formData.ownerType === "BRANCH"
                      ? "/branches"
                      : formData.ownerType === "FARM"
                        ? "/farms"
                        : "/coops"
                  }
                  value={formData.ownerId}
                  onChange={(id) =>
                    setFormData((prev) => ({ ...prev, ownerId: id }))
                  }
                  placeholder={tc('selectField', { field: ownerTypeLabels[formData.ownerType as WarehouseOwnerType] || formData.ownerType.toLowerCase() })}
                  searchPlaceholder={tc('searchField', { field: ownerTypeLabels[formData.ownerType as WarehouseOwnerType] || formData.ownerType.toLowerCase() })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              {tc('cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving
                ? tc('saving')
                : editing
                  ? tc('update')
                  : tc('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={tc('deleteEntity', { entity: t('entity') })}
        description={tc('confirmDelete', { name: deleteTarget?.name || '' })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={deleting ? tc('saving') : tc('delete')}
      />
    </div>
  );
}
