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
import { Supplier } from "@/types/api";

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

export default function SuppliersPage() {
  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch suppliers
  const { data: suppliers, meta, isLoading, refetch } = usePaginated<Supplier>(
    "/suppliers",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formName, setFormName] = useState("");
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  // Table columns
  const columns: Column<Supplier>[] = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Contact Person",
      cell: (row) => row.contactPerson || "-",
    },
    {
      header: "Phone",
      cell: (row) => row.phone || "-",
    },
    {
      header: "Email",
      cell: (row) => row.email || "-",
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
    setEditingSupplier(null);
    setFormName("");
    setFormContactPerson("");
    setFormPhone("");
    setFormEmail("");
    setFormAddress("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(supplier: Supplier) {
    setEditingSupplier(supplier);
    setFormName(supplier.name);
    setFormContactPerson(supplier.contactPerson || "");
    setFormPhone(supplier.phone || "");
    setFormEmail(supplier.email || "");
    setFormAddress(supplier.address || "");
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(supplier: Supplier) {
    setDeletingSupplier(supplier);
    setDeleteDialogOpen(true);
  }

  // Submit create/edit
  async function handleSubmit() {
    if (!formName.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        name: formName.trim(),
        ...(formContactPerson.trim() && { contactPerson: formContactPerson.trim() }),
        ...(formPhone.trim() && { phone: formPhone.trim() }),
        ...(formEmail.trim() && { email: formEmail.trim() }),
        ...(formAddress.trim() && { address: formAddress.trim() }),
      };

      if (editingSupplier) {
        await fetchApi(`/suppliers/${editingSupplier.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Supplier updated successfully");
      } else {
        await fetchApi("/suppliers", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Supplier created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingSupplier ? "Failed to update supplier" : "Failed to create supplier"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingSupplier) return;

    try {
      await fetchApi(`/suppliers/${deletingSupplier.id}`, {
        method: "DELETE",
      });
      toast.success("Supplier deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingSupplier(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete supplier");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage your suppliers and vendor contacts"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Supplier
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={suppliers}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search suppliers..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No suppliers found"
        emptyDescription="Get started by adding your first supplier."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Supplier
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? "Edit Supplier" : "New Supplier"}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier
                ? "Update the supplier details below."
                : "Fill in the details to add a new supplier."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-name">Name</Label>
              <Input
                id="supplier-name"
                placeholder="Enter supplier name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-contact">Contact Person</Label>
              <Input
                id="supplier-contact"
                placeholder="Enter contact person (optional)"
                value={formContactPerson}
                onChange={(e) => setFormContactPerson(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-phone">Phone</Label>
              <Input
                id="supplier-phone"
                placeholder="Enter phone number (optional)"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-email">Email</Label>
              <Input
                id="supplier-email"
                type="email"
                placeholder="Enter email address (optional)"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-address">Address</Label>
              <Input
                id="supplier-address"
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
                : editingSupplier
                  ? "Update Supplier"
                  : "Create Supplier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Supplier"
        description={`Are you sure you want to delete "${deletingSupplier?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
