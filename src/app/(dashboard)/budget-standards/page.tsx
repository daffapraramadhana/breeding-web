"use client";

import { useState } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { BudgetStandard } from "@/types/api";

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

interface DetailRow {
  category: string;
  amount: string;
}

export default function BudgetStandardsPage() {
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
  } = usePaginated<BudgetStandard>("/budget-standards", {
    page,
    limit: 10,
    search,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetStandard | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDetails, setFormDetails] = useState<DetailRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<BudgetStandard | null>(null);

  const columns: Column<BudgetStandard>[] = [
    { header: "Name", accessorKey: "name" },
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

  function handleCreate() {
    setEditing(null);
    setFormName("");
    setFormDescription("");
    setFormDetails([]);
    setDialogOpen(true);
  }

  function handleEdit(item: BudgetStandard) {
    setEditing(item);
    setFormName(item.name);
    setFormDescription(item.description || "");
    setFormDetails(
      item.details?.map((d) => ({ category: d.category, amount: d.amount })) ||
        []
    );
    setDialogOpen(true);
  }

  function handleDeleteClick(item: BudgetStandard) {
    setDeleting(item);
    setDeleteDialogOpen(true);
  }

  function addDetail() {
    setFormDetails([...formDetails, { category: "", amount: "" }]);
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
      toast.error("Name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        name: formName.trim(),
        ...(formDescription.trim() && { description: formDescription.trim() }),
        details: formDetails,
      };

      if (editing) {
        await fetchApi(`/budget-standards/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Budget standard updated successfully");
      } else {
        await fetchApi("/budget-standards", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Budget standard created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch {
      toast.error(
        editing
          ? "Failed to update budget standard"
          : "Failed to create budget standard"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;

    try {
      await fetchApi(`/budget-standards/${deleting.id}`, {
        method: "DELETE",
      });
      toast.success("Budget standard deleted successfully");
      setDeleteDialogOpen(false);
      setDeleting(null);
      refetch();
    } catch {
      toast.error("Failed to delete budget standard");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget Standards"
        description="Manage budget standards"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Budget Standard
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
        searchPlaceholder="Search budget standards..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No budget standards found"
        emptyDescription="Get started by creating your first budget standard."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Budget Standard
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Budget Standard" : "New Budget Standard"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the budget standard details below."
                : "Fill in the details to create a new budget standard."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Details</Label>
                <Button type="button" variant="outline" size="sm" onClick={addDetail}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Detail
                </Button>
              </div>
              {formDetails.map((detail, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Category"
                    value={detail.category}
                    onChange={(e) =>
                      updateDetail(index, "category", e.target.value)
                    }
                  />
                  <Input
                    placeholder="Amount"
                    value={detail.amount}
                    onChange={(e) =>
                      updateDetail(index, "amount", e.target.value)
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
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : editing
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Budget Standard"
        description={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
