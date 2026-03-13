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
import { BreederCardType } from "@/types/api";

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

export default function BreederCardTypesPage() {
  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch breeder card types
  const { data: cardTypes, meta, isLoading, refetch } = usePaginated<BreederCardType>(
    "/breeder-card-types",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCardType, setEditingCardType] = useState<BreederCardType | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCardType, setDeletingCardType] = useState<BreederCardType | null>(null);

  // Table columns
  const columns: Column<BreederCardType>[] = [
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
    setEditingCardType(null);
    setFormName("");
    setFormDescription("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(cardType: BreederCardType) {
    setEditingCardType(cardType);
    setFormName(cardType.name);
    setFormDescription(cardType.description || "");
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(cardType: BreederCardType) {
    setDeletingCardType(cardType);
    setDeleteDialogOpen(true);
  }

  // Submit create/edit
  async function handleSubmit() {
    if (!formName.trim()) {
      toast.error("Card type name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        name: formName.trim(),
        ...(formDescription.trim() && { description: formDescription.trim() }),
      };

      if (editingCardType) {
        await fetchApi(`/breeder-card-types/${editingCardType.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Card type updated successfully");
      } else {
        await fetchApi("/breeder-card-types", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Card type created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingCardType ? "Failed to update card type" : "Failed to create card type"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingCardType) return;

    try {
      await fetchApi(`/breeder-card-types/${deletingCardType.id}`, {
        method: "DELETE",
      });
      toast.success("Card type deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingCardType(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete card type");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Breeder Card Types"
        description="Manage breeder card type classifications"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Card Type
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={cardTypes}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search card types..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No card types found"
        emptyDescription="Get started by creating your first breeder card type."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Card Type
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCardType ? "Edit Card Type" : "New Card Type"}
            </DialogTitle>
            <DialogDescription>
              {editingCardType
                ? "Update the card type details below."
                : "Fill in the details to create a new breeder card type."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-type-name">Name</Label>
              <Input
                id="card-type-name"
                placeholder="Enter card type name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-type-description">Description</Label>
              <Input
                id="card-type-description"
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
                : editingCardType
                  ? "Update Card Type"
                  : "Create Card Type"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Card Type"
        description={`Are you sure you want to delete "${deletingCardType?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
