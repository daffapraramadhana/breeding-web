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
import { ProductionDayEstimate } from "@/types/api";

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

export default function ProductionDayEstimatesPage() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data: estimates, meta, isLoading, refetch } = usePaginated<ProductionDayEstimate>(
    "/production-day-estimates",
    { page, limit: 10, search }
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductionDayEstimate | null>(null);
  const [formName, setFormName] = useState("");
  const [formDays, setFormDays] = useState<number | "">("");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<ProductionDayEstimate | null>(null);

  const columns: Column<ProductionDayEstimate>[] = [
    { header: "Name", accessorKey: "name" },
    { header: "Days", cell: (row) => row.days, className: "w-[100px]" },
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
    setFormDays("");
    setFormDescription("");
    setDialogOpen(true);
  }

  function handleEdit(item: ProductionDayEstimate) {
    setEditing(item);
    setFormName(item.name);
    setFormDays(item.days);
    setFormDescription(item.description || "");
    setDialogOpen(true);
  }

  function handleDeleteClick(item: ProductionDayEstimate) {
    setDeleting(item);
    setDeleteDialogOpen(true);
  }

  async function handleSubmit() {
    if (!formName.trim()) {
      toast.error("Name is required");
      return;
    }
    if (formDays === "" || formDays < 0) {
      toast.error("Days is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        name: formName.trim(),
        days: formDays,
        ...(formDescription.trim() && { description: formDescription.trim() }),
      };

      if (editing) {
        await fetchApi(`/production-day-estimates/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Production day estimate updated successfully");
      } else {
        await fetchApi("/production-day-estimates", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Production day estimate created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch {
      toast.error(editing ? "Failed to update estimate" : "Failed to create estimate");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await fetchApi(`/production-day-estimates/${deleting.id}`, { method: "DELETE" });
      toast.success("Production day estimate deleted successfully");
      setDeleteDialogOpen(false);
      setDeleting(null);
      refetch();
    } catch {
      toast.error("Failed to delete estimate");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production Day Estimates"
        description="Manage production day estimate configurations"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Estimate
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={estimates}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Search estimates..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No production day estimates found"
        emptyDescription="Get started by creating your first production day estimate."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Estimate
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Estimate" : "New Estimate"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the estimate details below." : "Fill in the details to create a new production day estimate."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pde-name">Name</Label>
              <Input id="pde-name" placeholder="Enter name" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pde-days">Days</Label>
              <Input
                id="pde-days"
                type="number"
                placeholder="Enter number of days"
                value={formDays}
                onChange={(e) => setFormDays(e.target.value ? parseInt(e.target.value) : "")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pde-description">Description</Label>
              <Textarea
                id="pde-description"
                placeholder="Enter description (optional)"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editing ? "Update Estimate" : "Create Estimate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Estimate"
        description={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
