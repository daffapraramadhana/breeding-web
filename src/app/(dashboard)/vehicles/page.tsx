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
import { Vehicle } from "@/types/api";

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

export default function VehiclesPage() {
  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch vehicles
  const { data: vehicles, meta, isLoading, refetch } = usePaginated<Vehicle>(
    "/vehicles",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formPlateNumber, setFormPlateNumber] = useState("");
  const [formType, setFormType] = useState("");
  const [formCapacity, setFormCapacity] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);

  // Table columns
  const columns: Column<Vehicle>[] = [
    {
      header: "Plate Number",
      accessorKey: "plateNumber",
    },
    {
      header: "Type",
      cell: (row) => row.type || "-",
    },
    {
      header: "Capacity",
      cell: (row) => row.capacity || "-",
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
    setEditingVehicle(null);
    setFormPlateNumber("");
    setFormType("");
    setFormCapacity("");
    setFormDescription("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setFormPlateNumber(vehicle.plateNumber);
    setFormType(vehicle.type || "");
    setFormCapacity(vehicle.capacity || "");
    setFormDescription(vehicle.description || "");
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(vehicle: Vehicle) {
    setDeletingVehicle(vehicle);
    setDeleteDialogOpen(true);
  }

  // Submit create/edit
  async function handleSubmit() {
    if (!formPlateNumber.trim()) {
      toast.error("Plate number is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        plateNumber: formPlateNumber.trim(),
        ...(formType.trim() && { type: formType.trim() }),
        ...(formCapacity.trim() && { capacity: formCapacity.trim() }),
        ...(formDescription.trim() && { description: formDescription.trim() }),
      };

      if (editingVehicle) {
        await fetchApi(`/vehicles/${editingVehicle.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Vehicle updated successfully");
      } else {
        await fetchApi("/vehicles", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Vehicle created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingVehicle ? "Failed to update vehicle" : "Failed to create vehicle"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingVehicle) return;

    try {
      await fetchApi(`/vehicles/${deletingVehicle.id}`, {
        method: "DELETE",
      });
      toast.success("Vehicle deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingVehicle(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete vehicle");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicles"
        description="Manage your fleet vehicles and their details"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Vehicle
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={vehicles}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search vehicles..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No vehicles found"
        emptyDescription="Get started by adding your first vehicle."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Vehicle
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? "Edit Vehicle" : "New Vehicle"}
            </DialogTitle>
            <DialogDescription>
              {editingVehicle
                ? "Update the vehicle details below."
                : "Fill in the details to add a new vehicle."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle-plate">Plate Number</Label>
              <Input
                id="vehicle-plate"
                placeholder="Enter plate number"
                value={formPlateNumber}
                onChange={(e) => setFormPlateNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-type">Type</Label>
              <Input
                id="vehicle-type"
                placeholder="Enter vehicle type (optional)"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-capacity">Capacity</Label>
              <Input
                id="vehicle-capacity"
                placeholder="Enter capacity (optional)"
                value={formCapacity}
                onChange={(e) => setFormCapacity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-description">Description</Label>
              <Input
                id="vehicle-description"
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
                : editingVehicle
                  ? "Update Vehicle"
                  : "Create Vehicle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Vehicle"
        description={`Are you sure you want to delete "${deletingVehicle?.plateNumber}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
