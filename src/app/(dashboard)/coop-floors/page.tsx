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

  // Fetch coop bloks
  const { data: coopFloors, meta, isLoading, refetch } = usePaginated<CoopFloor>(
    "/coop-floors",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<CoopFloor | null>(null);
  const [formCoopId, setFormCoopId] = useState("");
  const [formFarmId, setFormFarmId] = useState("");
  const [formBranchId, setFormBranchId] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPopulation, setFormPopulation] = useState("");
  const [formArea, setFormArea] = useState("");
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
      header: "Code",
      accessorKey: "code",
      className: "w-[120px]",
    },
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Luas (m²)",
      cell: (row) => row.area?.toLocaleString() || "-",
      className: "w-[100px]",
    },
    {
      header: "Populasi/m²",
      cell: (row) => row.population?.toLocaleString() || "-",
      className: "w-[110px]",
    },
    {
      header: "Max Populasi",
      cell: (row) => row.maxPopulation?.toLocaleString() || "-",
      className: "w-[120px]",
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
    setFormFarmId("");
    setFormBranchId("");
    setFormCode("");
    setFormName("");
    setFormDescription("");
    setFormPopulation("");
    setFormArea("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(floor: CoopFloor) {
    setEditingFloor(floor);
    setFormCoopId(floor.coopId || "");
    setFormFarmId(floor.farmId || "");
    setFormBranchId(floor.branchId || "");
    setFormCode(floor.code || "");
    setFormName(floor.name || "");
    setFormDescription(floor.description || "");
    setFormPopulation(String(floor.population || ""));
    setFormArea(String(floor.area || ""));
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

    if (!formCode.trim()) {
      toast.error("Code is required");
      return;
    }

    if (!formName.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!formPopulation || Number(formPopulation) <= 0) {
      toast.error("Populasi per m² is required");
      return;
    }
    if (!formArea || Number(formArea) <= 0) {
      toast.error("Luas is required");
      return;
    }
    const maxPopulation = Number(formPopulation) * Number(formArea);
    if (maxPopulation <= 0) {
      toast.error("Max populasi harus lebih dari 0");
      return;
    }

    if (!formFarmId || !formBranchId) {
      toast.error("Please select a coop to auto-fill farm and branch");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        coopId: formCoopId,
        farmId: formFarmId,
        branchId: formBranchId,
        code: formCode.trim(),
        name: formName.trim(),
        population: Number(formPopulation),
        area: Number(formArea),
        maxPopulation: Number(formPopulation) * Number(formArea),
        ...(formDescription.trim() && { description: formDescription.trim() }),
      };

      if (editingFloor) {
        await fetchApi(`/coop-floors/${editingFloor.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Coop blok berhasil diupdate");
      } else {
        await fetchApi("/coop-floors", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Coop blok berhasil dibuat");
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingFloor
          ? "Failed to update coop blok"
          : "Failed to create coop blok"
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
      toast.success("Coop blok berhasil dihapus");
      setDeleteDialogOpen(false);
      setDeletingFloor(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete coop blok");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coop Bloks"
        description="Kelola blok kandang"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Coop Blok
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
        searchPlaceholder="Search coop bloks..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No coop bloks found"
        emptyDescription="Get started by creating your first coop blok."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Coop Blok
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFloor ? "Edit Coop Blok" : "New Coop Blok"}
            </DialogTitle>
            <DialogDescription>
              {editingFloor
                ? "Update detail blok kandang."
                : "Isi detail untuk membuat blok kandang baru."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="floor-coop">Coop</Label>
              <CoopCombobox
                value={formCoopId}
                onChange={setFormCoopId}
                onCoopSelect={(coop) => {
                  if (coop) {
                    setFormFarmId(coop.farmId);
                    setFormBranchId(coop.branchId);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor-code">Code</Label>
              <Input
                id="floor-code"
                placeholder="Enter floor code"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor-name">Name</Label>
              <Input
                id="floor-name"
                placeholder="Enter floor name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor-population">Populasi / m²</Label>
              <Input
                id="floor-population"
                type="number"
                placeholder="Populasi per m²"
                value={formPopulation}
                onChange={(e) => setFormPopulation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor-area">Luas (m²)</Label>
              <Input
                id="floor-area"
                type="number"
                placeholder="Luas kandang dalam m²"
                value={formArea}
                onChange={(e) => setFormArea(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Populasi (otomatis)</Label>
              <Input
                type="number"
                readOnly
                disabled
                value={
                  formPopulation && formArea
                    ? Number(formPopulation) * Number(formArea)
                    : ""
                }
                placeholder="Populasi × Luas"
                className="bg-muted text-muted-foreground"
              />
              {formPopulation && formArea && (
                <p className="text-xs text-muted-foreground">
                  {formPopulation} × {formArea} = {Number(formPopulation) * Number(formArea)} ekor
                </p>
              )}
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
                  ? "Update Coop Blok"
                  : "Create Coop Blok"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Coop Blok"
        description={`Are you sure you want to delete "${deletingFloor?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
