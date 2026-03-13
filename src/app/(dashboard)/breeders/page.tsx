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
import { Breeder } from "@/types/api";

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

export default function BreedersPage() {
  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch breeders
  const { data: breeders, meta, isLoading, refetch } = usePaginated<Breeder>(
    "/breeders",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBreeder, setEditingBreeder] = useState<Breeder | null>(null);
  const [formName, setFormName] = useState("");
  const [formCardTypeId, setFormCardTypeId] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingBreeder, setDeletingBreeder] = useState<Breeder | null>(null);

  // Table columns
  const columns: Column<Breeder>[] = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Card Type",
      cell: (row) => row.cardType?.name || row.cardTypeId || "-",
    },
    {
      header: "Phone",
      cell: (row) => row.phone || "-",
    },
    {
      header: "Address",
      cell: (row) => row.address || "-",
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
    setEditingBreeder(null);
    setFormName("");
    setFormCardTypeId("");
    setFormPhone("");
    setFormAddress("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(breeder: Breeder) {
    setEditingBreeder(breeder);
    setFormName(breeder.name);
    setFormCardTypeId(breeder.cardTypeId || "");
    setFormPhone(breeder.phone || "");
    setFormAddress(breeder.address || "");
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(breeder: Breeder) {
    setDeletingBreeder(breeder);
    setDeleteDialogOpen(true);
  }

  // Submit create/edit
  async function handleSubmit() {
    if (!formName.trim()) {
      toast.error("Breeder name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        name: formName.trim(),
        ...(formCardTypeId.trim() && { cardTypeId: formCardTypeId.trim() }),
        ...(formPhone.trim() && { phone: formPhone.trim() }),
        ...(formAddress.trim() && { address: formAddress.trim() }),
      };

      if (editingBreeder) {
        await fetchApi(`/breeders/${editingBreeder.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Breeder updated successfully");
      } else {
        await fetchApi("/breeders", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Breeder created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingBreeder ? "Failed to update breeder" : "Failed to create breeder"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingBreeder) return;

    try {
      await fetchApi(`/breeders/${deletingBreeder.id}`, {
        method: "DELETE",
      });
      toast.success("Breeder deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingBreeder(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete breeder");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Breeders"
        description="Manage your breeders and their information"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Breeder
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={breeders}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search breeders..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No breeders found"
        emptyDescription="Get started by adding your first breeder."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Breeder
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBreeder ? "Edit Breeder" : "New Breeder"}
            </DialogTitle>
            <DialogDescription>
              {editingBreeder
                ? "Update the breeder details below."
                : "Fill in the details to add a new breeder."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="breeder-name">Name</Label>
              <Input
                id="breeder-name"
                placeholder="Enter breeder name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breeder-card-type">Card Type ID</Label>
              <Input
                id="breeder-card-type"
                placeholder="Enter card type ID (optional)"
                value={formCardTypeId}
                onChange={(e) => setFormCardTypeId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breeder-phone">Phone</Label>
              <Input
                id="breeder-phone"
                placeholder="Enter phone number (optional)"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breeder-address">Address</Label>
              <Input
                id="breeder-address"
                placeholder="Enter address (optional)"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
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
                : editingBreeder
                  ? "Update Breeder"
                  : "Create Breeder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Breeder"
        description={`Are you sure you want to delete "${deletingBreeder?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
