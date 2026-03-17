"use client";

import { useState } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { UnitOfMeasure } from "@/types/api";

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

export default function UnitOfMeasuresPage() {
  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch unit of measures
  const { data: uoms, meta, isLoading, refetch } = usePaginated<UnitOfMeasure>(
    "/unit-of-measures",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUom, setEditingUom] = useState<UnitOfMeasure | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUom, setDeletingUom] = useState<UnitOfMeasure | null>(null);

  // Table columns
  const columns: Column<UnitOfMeasure>[] = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Description",
      cell: (row) => row.description || "-",
    },
    {
      header: "Created",
      cell: (row) => formatDate(row.createdAt),
      className: "w-[150px]",
    },
    {
      header: "Actions",
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

  // Open create dialog
  function handleCreate() {
    setEditingUom(null);
    setFormName("");
    setFormDescription("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(uom: UnitOfMeasure) {
    setEditingUom(uom);
    setFormName(uom.name);
    setFormDescription(uom.description || "");
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(uom: UnitOfMeasure) {
    setDeletingUom(uom);
    setDeleteDialogOpen(true);
  }

  // Submit create/edit
  async function handleSubmit() {
    if (!formName.trim()) {
      toast.error("Unit of measure name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        name: formName.trim(),
        ...(formDescription.trim() && { description: formDescription.trim() }),
      };

      if (editingUom) {
        await fetchApi(`/unit-of-measures/${editingUom.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Unit of measure updated successfully");
      } else {
        await fetchApi("/unit-of-measures", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Unit of measure created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingUom ? "Failed to update unit of measure" : "Failed to create unit of measure"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingUom) return;

    try {
      await fetchApi(`/unit-of-measures/${deletingUom.id}`, {
        method: "DELETE",
      });
      toast.success("Unit of measure deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingUom(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete unit of measure");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unit of Measures"
        description="Manage units of measure for your products"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New UOM
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={uoms}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search units of measure..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No units of measure found"
        emptyDescription="Get started by creating your first unit of measure."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New UOM
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUom ? "Edit Unit of Measure" : "New Unit of Measure"}
            </DialogTitle>
            <DialogDescription>
              {editingUom
                ? "Update the unit of measure details below."
                : "Fill in the details to create a new unit of measure."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="uom-name">Name</Label>
              <Input
                id="uom-name"
                placeholder="Enter unit name (e.g., kg, pcs, liter)"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uom-description">Description</Label>
              <Input
                id="uom-description"
                placeholder="Enter description (optional)"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
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
                : editingUom
                  ? "Update UOM"
                  : "Create UOM"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Unit of Measure"
        description={`Are you sure you want to delete "${deletingUom?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
