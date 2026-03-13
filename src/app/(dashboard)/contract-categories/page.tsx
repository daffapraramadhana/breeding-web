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
import { ContractCategory } from "@/types/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ContractCategoriesPage() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data: categories, meta, isLoading, refetch } = usePaginated<ContractCategory>(
    "/contract-categories",
    { page, limit: 10, search }
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContractCategory | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<ContractCategory | null>(null);

  const columns: Column<ContractCategory>[] = [
    { header: "Name", accessorKey: "name" },
    { header: "Description", cell: (row) => row.description || "-" },
    { header: "Created", cell: (row) => formatDate(row.createdAt), className: "w-[150px]" },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteClick(row); }}>
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
    setFormDescription("");
    setDialogOpen(true);
  }

  function handleEdit(item: ContractCategory) {
    setEditing(item);
    setFormName(item.name);
    setFormDescription(item.description || "");
    setDialogOpen(true);
  }

  function handleDeleteClick(item: ContractCategory) {
    setDeleting(item);
    setDeleteDialogOpen(true);
  }

  async function handleSubmit() {
    if (!formName.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        name: formName.trim(),
        ...(formDescription.trim() && { description: formDescription.trim() }),
      };

      if (editing) {
        await fetchApi(`/contract-categories/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Contract category updated successfully");
      } else {
        await fetchApi("/contract-categories", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Contract category created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch {
      toast.error(editing ? "Failed to update contract category" : "Failed to create contract category");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await fetchApi(`/contract-categories/${deleting.id}`, { method: "DELETE" });
      toast.success("Contract category deleted successfully");
      setDeleteDialogOpen(false);
      setDeleting(null);
      refetch();
    } catch {
      toast.error("Failed to delete contract category");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contract Categories"
        description="Manage contract categories"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Category
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={categories}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Search contract categories..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No contract categories found"
        emptyDescription="Get started by creating your first contract category."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Category
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Contract Category" : "New Contract Category"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the contract category details below." : "Fill in the details to create a new contract category."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cc-name">Name</Label>
              <Input id="cc-name" placeholder="Enter name" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-description">Description</Label>
              <Textarea
                id="cc-description"
                placeholder="Enter description (optional)"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editing ? "Update Category" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Contract Category"
        description={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
