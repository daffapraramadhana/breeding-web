"use client";

import { useState } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { usePaginated } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Warehouse, WarehouseOwnerType } from "@/types/api";

const LIMIT = 10;

export default function WarehousesPage() {
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
      toast.error("Code and name are required");
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
        toast.success("Warehouse updated successfully");
      } else {
        await fetchApi("/warehouses", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Warehouse created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save warehouse"
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
      toast.success("Warehouse deleted successfully");
      setDeleteTarget(null);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete warehouse"
      );
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Warehouse>[] = [
    { header: "Code", accessorKey: "code" },
    { header: "Name", accessorKey: "name" },
    {
      header: "Branch",
      cell: (row) => row.branch?.name || "—",
    },
    {
      header: "Owner Type",
      cell: (row) => row.ownerType || "—",
    },
    {
      header: "Created",
      cell: (row) => formatDate(row.createdAt),
    },
    {
      header: "Actions",
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
        title="Warehouses"
        description="Manage warehouses and storage locations"
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Warehouse
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
        searchPlaceholder="Search warehouses..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No warehouses found"
        emptyDescription="Get started by creating a new warehouse."
        emptyAction={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Warehouse
          </Button>
        }
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Warehouse" : "Create Warehouse"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                placeholder="e.g. WH-001"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Warehouse name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Branch</Label>
              <BranchCombobox
                value={formData.branchId}
                onChange={(id) =>
                  setFormData((prev) => ({ ...prev, branchId: id }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Owner Type</Label>
              <Select
                value={formData.ownerType}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, ownerType: v as WarehouseOwnerType }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select owner type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRANCH">Branch</SelectItem>
                  <SelectItem value="FARM">Farm</SelectItem>
                  <SelectItem value="COOP">Coop</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerId">Owner ID</Label>
              <Input
                id="ownerId"
                placeholder="Owner ID"
                value={formData.ownerId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, ownerId: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Warehouse"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={deleting ? "Deleting..." : "Delete"}
      />
    </div>
  );
}
