"use client";

import { useState, useEffect } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi, fetchPaginated } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Batch, BatchStatus, Kandang } from "@/types/api";

const LIMIT = 10;

const STATUS_CONFIG: Record<BatchStatus, { label: string; className: string }> =
  {
    ACTIVE: {
      label: "Active",
      className:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    },
    CLOSED: {
      label: "Closed",
      className:
        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    },
  };

export default function BatchesPage() {
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  const { data, meta, isLoading, refetch } = usePaginated<Batch>("/batches", {
    page,
    limit: LIMIT,
    search,
  });

  // Kandang list for dropdown
  const [kandangs, setKandangs] = useState<Kandang[]>([]);

  useEffect(() => {
    fetchPaginated<Kandang>("/kandangs", { limit: 100 })
      .then((res) => setKandangs(res.data))
      .catch(() => {});
  }, []);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Batch | null>(null);
  const [formData, setFormData] = useState({
    kandangId: "",
    batchNumber: "",
    species: "",
    initialQty: "",
    startDate: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openCreate() {
    setEditing(null);
    setFormData({
      kandangId: "",
      batchNumber: "",
      species: "",
      initialQty: "",
      startDate: "",
      notes: "",
    });
    setDialogOpen(true);
  }

  function openEdit(batch: Batch) {
    setEditing(batch);
    setFormData({
      kandangId: batch.kandangId,
      batchNumber: batch.batchNumber,
      species: batch.species,
      initialQty: String(batch.initialQty),
      startDate: batch.startDate ? batch.startDate.split("T")[0] : "",
      notes: batch.notes || "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (
      !formData.kandangId ||
      !formData.batchNumber.trim() ||
      !formData.species.trim() ||
      !formData.initialQty ||
      !formData.startDate
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string | number> = {
        kandangId: formData.kandangId,
        batchNumber: formData.batchNumber,
        species: formData.species,
        initialQty: Number(formData.initialQty),
        startDate: formData.startDate,
      };
      if (formData.notes.trim()) {
        body.notes = formData.notes;
      }

      if (editing) {
        await fetchApi(`/batches/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Batch updated successfully");
      } else {
        await fetchApi("/batches", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Batch created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save batch"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await fetchApi(`/batches/${deleteTarget.id}`, {
        method: "DELETE",
      });
      toast.success("Batch deleted successfully");
      setDeleteTarget(null);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete batch"
      );
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Batch>[] = [
    { header: "Batch Number", accessorKey: "batchNumber" },
    { header: "Species", accessorKey: "species" },
    {
      header: "Initial Qty",
      cell: (row) => row.initialQty.toLocaleString(),
    },
    {
      header: "Kandang",
      cell: (row) => row.kandang?.name || "-",
    },
    {
      header: "Status",
      cell: (row) => {
        const config = STATUS_CONFIG[row.status];
        return (
          <Badge variant="outline" className={config.className}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      header: "Start Date",
      cell: (row) => formatDate(row.startDate),
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
        title="Batches"
        description="Manage animal batches across kandangs"
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Batch
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
        searchPlaceholder="Search batches..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No batches found"
        emptyDescription="Get started by creating a new batch."
        emptyAction={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Batch
          </Button>
        }
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Batch" : "Create Batch"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number</Label>
              <Input
                id="batchNumber"
                placeholder="e.g. BATCH-001"
                value={formData.batchNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    batchNumber: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="species">Species</Label>
              <Input
                id="species"
                placeholder="e.g. Ayam Broiler"
                value={formData.species}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, species: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kandang">Kandang</Label>
              <Select
                value={formData.kandangId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, kandangId: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select kandang" />
                </SelectTrigger>
                <SelectContent>
                  {kandangs.map((kandang) => (
                    <SelectItem key={kandang.id} value={kandang.id}>
                      {kandang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initialQty">Initial Quantity</Label>
                <Input
                  id="initialQty"
                  type="number"
                  placeholder="0"
                  min="1"
                  value={formData.initialQty}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      initialQty: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes (optional)"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
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
        title="Delete Batch"
        description={`Are you sure you want to delete batch "${deleteTarget?.batchNumber}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={deleting ? "Deleting..." : "Delete"}
      />
    </div>
  );
}
