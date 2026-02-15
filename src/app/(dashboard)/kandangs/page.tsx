"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi, fetchPaginated } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Kandang, KandangStatus, Farm } from "@/types/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

const KANDANG_STATUS_COLORS: Record<KandangStatus, string> = {
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  INACTIVE: "bg-gray-100 text-gray-800 border-gray-200",
  MAINTENANCE: "bg-amber-100 text-amber-800 border-amber-200",
};

const KANDANG_STATUSES: KandangStatus[] = ["ACTIVE", "INACTIVE", "MAINTENANCE"];

interface KandangFormData {
  farmId: string;
  name: string;
  capacity: string;
  status: KandangStatus;
}

const INITIAL_FORM: KandangFormData = {
  farmId: "",
  name: "",
  capacity: "",
  status: "ACTIVE",
};

export default function KandangsPage() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data, meta, isLoading, refetch } = usePaginated<Kandang>(
    "/kandangs",
    { page, limit: 10, search }
  );

  const [farms, setFarms] = useState<Farm[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingKandang, setEditingKandang] = useState<Kandang | null>(null);
  const [deletingKandang, setDeletingKandang] = useState<Kandang | null>(null);
  const [form, setForm] = useState<KandangFormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadFarms = useCallback(async () => {
    try {
      const result = await fetchPaginated<Farm>("/farms", { limit: 100 });
      setFarms(result.data);
    } catch {
      toast.error("Failed to load farms");
    }
  }, []);

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const openCreateDialog = () => {
    setEditingKandang(null);
    setForm(INITIAL_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (kandang: Kandang) => {
    setEditingKandang(kandang);
    setForm({
      farmId: kandang.farmId,
      name: kandang.name,
      capacity: String(kandang.capacity),
      status: kandang.status,
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (kandang: Kandang) => {
    setDeletingKandang(kandang);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.farmId || !form.name || !form.capacity) {
      toast.error("Please fill in all required fields");
      return;
    }

    const capacity = parseInt(form.capacity, 10);
    if (isNaN(capacity) || capacity <= 0) {
      toast.error("Capacity must be a positive number");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        farmId: form.farmId,
        name: form.name,
        capacity,
        status: form.status,
      };

      if (editingKandang) {
        await fetchApi(`/kandangs/${editingKandang.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Kandang updated successfully");
      } else {
        await fetchApi("/kandangs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Kandang created successfully");
      }

      setDialogOpen(false);
      setForm(INITIAL_FORM);
      setEditingKandang(null);
      refetch();
    } catch (error) {
      toast.error(
        editingKandang
          ? "Failed to update kandang"
          : "Failed to create kandang"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingKandang) return;

    try {
      await fetchApi(`/kandangs/${deletingKandang.id}`, {
        method: "DELETE",
      });
      toast.success("Kandang deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingKandang(null);
      refetch();
    } catch {
      toast.error("Failed to delete kandang");
    }
  };

  const columns: Column<Kandang>[] = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Farm",
      cell: (row) => row.farm?.name ?? "-",
    },
    {
      header: "Capacity",
      accessorKey: "capacity",
      className: "text-right",
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge
          variant="outline"
          className={KANDANG_STATUS_COLORS[row.status]}
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Created",
      cell: (row) => formatDate(row.createdAt),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(row);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteDialog(row);
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
        title="Kandangs"
        description="Manage your kandangs (pens/enclosures)"
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Kandang
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        search={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search kandangs..."
        page={page}
        totalPages={meta?.totalPages ?? 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No kandangs found"
        emptyDescription="Get started by creating your first kandang."
        emptyAction={
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Kandang
          </Button>
        }
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingKandang ? "Edit Kandang" : "New Kandang"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="farmId">Farm *</Label>
              <Select
                value={form.farmId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, farmId: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a farm" />
                </SelectTrigger>
                <SelectContent>
                  {farms.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id}>
                      {farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Enter kandang name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="Enter capacity"
                min={1}
                value={form.capacity}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, capacity: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    status: value as KandangStatus,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {KANDANG_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : editingKandang
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Kandang"
        description={`Are you sure you want to delete "${deletingKandang?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
