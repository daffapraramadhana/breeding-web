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
import { ChickInPlan } from "@/types/api";
import { CoopCombobox } from "@/components/forms/coop-combobox";

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

export default function ChickInPlansPage() {
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
  } = usePaginated<ChickInPlan>("/chick-in-plans", {
    page,
    limit: 10,
    search,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ChickInPlan | null>(null);
  const [formName, setFormName] = useState("");
  const [formPlannedDate, setFormPlannedDate] = useState("");
  const [formCoopId, setFormCoopId] = useState("");
  const [formPopulation, setFormPopulation] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<ChickInPlan | null>(null);

  const columns: Column<ChickInPlan>[] = [
    { header: "Name", accessorKey: "name" },
    {
      header: "Planned Date",
      cell: (row) => formatDate(row.plannedDate),
    },
    {
      header: "Population",
      cell: (row) => row.population ?? "-",
    },
    {
      header: "Notes",
      cell: (row) => row.notes || "-",
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
    setFormPlannedDate("");
    setFormCoopId("");
    setFormPopulation("");
    setFormNotes("");
    setDialogOpen(true);
  }

  function handleEdit(item: ChickInPlan) {
    setEditing(item);
    setFormName(item.name);
    setFormPlannedDate(item.plannedDate?.split("T")[0] || "");
    setFormCoopId(item.coopId || "");
    setFormPopulation(item.population?.toString() || "");
    setFormNotes(item.notes || "");
    setDialogOpen(true);
  }

  function handleDeleteClick(item: ChickInPlan) {
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
        plannedDate: formPlannedDate,
        ...(formCoopId && { coopId: formCoopId }),
        ...(formPopulation && { population: Number(formPopulation) }),
        ...(formNotes.trim() && { notes: formNotes.trim() }),
      };

      if (editing) {
        await fetchApi(`/chick-in-plans/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Chick-in plan updated successfully");
      } else {
        await fetchApi("/chick-in-plans", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Chick-in plan created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch {
      toast.error(
        editing
          ? "Failed to update chick-in plan"
          : "Failed to create chick-in plan"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;

    try {
      await fetchApi(`/chick-in-plans/${deleting.id}`, {
        method: "DELETE",
      });
      toast.success("Chick-in plan deleted successfully");
      setDeleteDialogOpen(false);
      setDeleting(null);
      refetch();
    } catch {
      toast.error("Failed to delete chick-in plan");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chick-in Plans"
        description="Manage chick-in plans"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Chick-in Plan
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
        searchPlaceholder="Search chick-in plans..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No chick-in plans found"
        emptyDescription="Get started by creating your first chick-in plan."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Chick-in Plan
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Chick-in Plan" : "New Chick-in Plan"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the chick-in plan details below."
                : "Fill in the details to create a new chick-in plan."}
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
              <Label htmlFor="plannedDate">Planned Date</Label>
              <Input
                id="plannedDate"
                type="date"
                value={formPlannedDate}
                onChange={(e) => setFormPlannedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Coop</Label>
              <CoopCombobox value={formCoopId} onChange={setFormCoopId} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="population">Population</Label>
              <Input
                id="population"
                type="number"
                placeholder="Enter population"
                value={formPopulation}
                onChange={(e) => setFormPopulation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Enter notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
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
        title="Delete Chick-in Plan"
        description={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
