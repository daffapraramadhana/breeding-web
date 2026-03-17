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
import { MatureBirdType } from "@/types/api";

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

export default function MatureBirdTypesPage() {
  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch mature bird types
  const { data: birdTypes, meta, isLoading, refetch } = usePaginated<MatureBirdType>(
    "/mature-bird-types",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBirdType, setEditingBirdType] = useState<MatureBirdType | null>(null);
  const [formType, setFormType] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingBirdType, setDeletingBirdType] = useState<MatureBirdType | null>(null);

  // Table columns
  const columns: Column<MatureBirdType>[] = [
    {
      header: "Type",
      accessorKey: "type",
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
    setEditingBirdType(null);
    setFormType("");
    setFormDescription("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(birdType: MatureBirdType) {
    setEditingBirdType(birdType);
    setFormType(birdType.type);
    setFormDescription(birdType.description || "");
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(birdType: MatureBirdType) {
    setDeletingBirdType(birdType);
    setDeleteDialogOpen(true);
  }

  // Submit create/edit
  async function handleSubmit() {
    if (!formType.trim()) {
      toast.error("Bird type is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        type: formType.trim(),
        ...(formDescription.trim() && { description: formDescription.trim() }),
      };

      if (editingBirdType) {
        await fetchApi(`/mature-bird-types/${editingBirdType.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Bird type updated successfully");
      } else {
        await fetchApi("/mature-bird-types", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Bird type created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingBirdType ? "Failed to update bird type" : "Failed to create bird type"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingBirdType) return;

    try {
      await fetchApi(`/mature-bird-types/${deletingBirdType.id}`, {
        method: "DELETE",
      });
      toast.success("Bird type deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingBirdType(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete bird type");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mature Bird Types"
        description="Manage mature bird type classifications"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Bird Type
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={birdTypes}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search bird types..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No bird types found"
        emptyDescription="Get started by creating your first mature bird type."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Bird Type
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBirdType ? "Edit Bird Type" : "New Bird Type"}
            </DialogTitle>
            <DialogDescription>
              {editingBirdType
                ? "Update the bird type details below."
                : "Fill in the details to create a new mature bird type."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bird-type">Type</Label>
              <Input
                id="bird-type"
                placeholder="Enter bird type name"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bird-type-description">Description</Label>
              <Input
                id="bird-type-description"
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
                : editingBirdType
                  ? "Update Bird Type"
                  : "Create Bird Type"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Bird Type"
        description={`Are you sure you want to delete "${deletingBirdType?.type}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
