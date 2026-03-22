"use client";

import { useState } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations('vehicles');
  const tc = useTranslations('common');

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
      header: t('plateNumber'),
      accessorKey: "plateNumber",
    },
    {
      header: tc('type'),
      cell: (row) => row.type || "-",
    },
    {
      header: t('capacity'),
      cell: (row) => row.capacity || "-",
    },
    {
      header: tc('created'),
      cell: (row) => formatDate(row.createdAt),
      className: "w-[150px]",
    },
    {
      header: tc('actions'),
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
      toast.error(tc('required', { field: t('plateNumber') }));
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
        toast.success(tc('entityUpdated', { entity: t('entity') }));
      } else {
        await fetchApi("/vehicles", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success(tc('entityCreated', { entity: t('entity') }));
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingVehicle ? tc('entityUpdateFailed', { entity: t('entity') }) : tc('entityCreateFailed', { entity: t('entity') })
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
      toast.success(tc('entityDeleted', { entity: t('entity') }));
      setDeleteDialogOpen(false);
      setDeletingVehicle(null);
      refetch();
    } catch (error) {
      toast.error(tc('entityDeleteFailed', { entity: t('entity') }));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {tc('newEntity', { entity: t('entity') })}
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
        searchPlaceholder={tc('searchField', { field: t('title') })}
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle={tc('noResults', { entity: t('title') })}
        emptyDescription={tc('getStartedAlt', { entity: t('entity') })}
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {tc('newEntity', { entity: t('entity') })}
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? tc('editEntity', { entity: t('entity') }) : tc('newEntity', { entity: t('entity') })}
            </DialogTitle>
            <DialogDescription>
              {editingVehicle
                ? tc('updateDetails', { entity: t('entity') })
                : tc('fillDetailsAlt', { entity: t('entity') })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle-plate">{t('plateNumber')}</Label>
              <Input
                id="vehicle-plate"
                placeholder={tc('enterField', { field: t('plateNumber') })}
                value={formPlateNumber}
                onChange={(e) => setFormPlateNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-type">{tc('type')}</Label>
              <Input
                id="vehicle-type"
                placeholder={tc('enterFieldOptional', { field: t('vehicleType') })}
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-capacity">{t('capacity')}</Label>
              <Input
                id="vehicle-capacity"
                placeholder={tc('enterFieldOptional', { field: t('capacity') })}
                value={formCapacity}
                onChange={(e) => setFormCapacity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-description">{tc('description')}</Label>
              <Input
                id="vehicle-description"
                placeholder={tc('enterFieldOptional', { field: tc('description') })}
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
              {tc('cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? tc('saving')
                : editingVehicle
                  ? tc('updateEntity', { entity: t('entity') })
                  : tc('createEntity', { entity: t('entity') })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={tc('deleteEntity', { entity: t('entity') })}
        description={tc('confirmDelete', { name: deletingVehicle?.plateNumber ?? '' })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={tc('delete')}
      />
    </div>
  );
}
