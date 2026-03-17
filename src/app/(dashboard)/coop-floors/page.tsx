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
import { CoopFloor } from "@/types/api";
import { CoopCombobox } from "@/components/forms/coop-combobox";

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

export default function CoopFloorsPage() {
  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch coop floors
  const { data: coopFloors, meta, isLoading, refetch } = usePaginated<CoopFloor>(
    "/coop-floors",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<CoopFloor | null>(null);
  const [formCoopId, setFormCoopId] = useState("");
  const [formFloorNumber, setFormFloorNumber] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFloor, setDeletingFloor] = useState<CoopFloor | null>(null);

  // Table columns
  const columns: Column<CoopFloor>[] = [
    {
      header: "Coop",
      cell: (row) =>
        row.coop ? `${row.coop.code} - ${row.coop.name}` : "-",
    },
    {
      header: "Floor Number",
      cell: (row) => row.floorNumber,
      className: "w-[120px]",
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
    setEditingFloor(null);
    setFormCoopId("");
    setFormFloorNumber("");
    setFormDescription("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(floor: CoopFloor) {
    setEditingFloor(floor);
    setFormCoopId(floor.coopId || "");
    setFormFloorNumber(String(floor.floorNumber));
    setFormDescription(floor.description || "");
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(floor: CoopFloor) {
    setDeletingFloor(floor);
    setDeleteDialogOpen(true);
  }

  // Submit create/edit
  async function handleSubmit() {
    if (!formCoopId) {
      toast.error("Coop is required");
      return;
    }

    if (!formFloorNumber.trim()) {
      toast.error("Floor number is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        coopId: formCoopId,
        floorNumber: Number(formFloorNumber),
        ...(formDescription.trim() && { description: formDescription.trim() }),
      };

      if (editingFloor) {
        await fetchApi(`/coop-floors/${editingFloor.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Coop floor updated successfully");
      } else {
        await fetchApi("/coop-floors", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Coop floor created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingFloor
          ? "Failed to update coop floor"
          : "Failed to create coop floor"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingFloor) return;

    try {
      await fetchApi(`/coop-floors/${deletingFloor.id}`, {
        method: "DELETE",
      });
      toast.success("Coop floor deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingFloor(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete coop floor");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coop Floors"
        description="Manage coop floor levels"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Coop Floor
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={coopFloors}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search coop floors..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No coop floors found"
        emptyDescription="Get started by creating your first coop floor."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Coop Floor
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFloor ? "Edit Coop Floor" : "New Coop Floor"}
            </DialogTitle>
            <DialogDescription>
              {editingFloor
                ? "Update the coop floor details below."
                : "Fill in the details to create a new coop floor."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="floor-coop">Coop</Label>
              <CoopCombobox
                value={formCoopId}
                onChange={setFormCoopId}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor-number">Floor Number</Label>
              <Input
                id="floor-number"
                type="number"
                placeholder="Enter floor number"
                value={formFloorNumber}
                onChange={(e) => setFormFloorNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor-description">Description</Label>
              <Textarea
                id="floor-description"
                placeholder="Enter description (optional)"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
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
                : editingFloor
                  ? "Update Coop Floor"
                  : "Create Coop Floor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Coop Floor"
        description={`Are you sure you want to delete floor ${deletingFloor?.floorNumber}? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
