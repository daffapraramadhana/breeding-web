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
import { Customer } from "@/types/api";

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

export default function CustomersPage() {
  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch customers
  const { data: customers, meta, isLoading, refetch } = usePaginated<Customer>(
    "/customers",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formName, setFormName] = useState("");
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCreditLimit, setFormCreditLimit] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  // Table columns
  const columns: Column<Customer>[] = [
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
      header: "Credit Limit",
      cell: (row) => row.creditLimit ? Number(row.creditLimit).toLocaleString() : "-",
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
    setEditingCustomer(null);
    setFormName("");
    setFormContactPerson("");
    setFormPhone("");
    setFormEmail("");
    setFormAddress("");
    setFormCreditLimit("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(customer: Customer) {
    setEditingCustomer(customer);
    setFormName(customer.name);
    setFormContactPerson(customer.contactPerson || "");
    setFormPhone(customer.phone || "");
    setFormEmail(customer.email || "");
    setFormAddress(customer.address || "");
    setFormCreditLimit(customer.creditLimit || "");
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(customer: Customer) {
    setDeletingCustomer(customer);
    setDeleteDialogOpen(true);
  }

  // Submit create/edit
  async function handleSubmit() {
    if (!formName.trim()) {
      toast.error("Customer name is required");
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
        ...(formCreditLimit.trim() && { creditLimit: formCreditLimit.trim() }),
      };

      if (editingCustomer) {
        await fetchApi(`/customers/${editingCustomer.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Customer updated successfully");
      } else {
        await fetchApi("/customers", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Customer created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingCustomer ? "Failed to update customer" : "Failed to create customer"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingCustomer) return;

    try {
      await fetchApi(`/customers/${deletingCustomer.id}`, {
        method: "DELETE",
      });
      toast.success("Customer deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingCustomer(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete customer");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage your customers and their contact information"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Customer
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search customers..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No customers found"
        emptyDescription="Get started by adding your first customer."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Customer
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Edit Customer" : "New Customer"}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? "Update the customer details below."
                : "Fill in the details to add a new customer."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Name</Label>
              <Input
                id="customer-name"
                placeholder="Enter customer name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-contact">Contact Person</Label>
              <Input
                id="customer-contact"
                placeholder="Enter contact person (optional)"
                value={formContactPerson}
                onChange={(e) => setFormContactPerson(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone</Label>
              <Input
                id="customer-phone"
                placeholder="Enter phone number (optional)"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                placeholder="Enter email address (optional)"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-address">Address</Label>
              <Input
                id="customer-address"
                placeholder="Enter address (optional)"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-credit-limit">Credit Limit</Label>
              <Input
                id="customer-credit-limit"
                type="number"
                placeholder="Enter credit limit (optional)"
                value={formCreditLimit}
                onChange={(e) => setFormCreditLimit(e.target.value)}
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
                : editingCustomer
                  ? "Update Customer"
                  : "Create Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Customer"
        description={`Are you sure you want to delete "${deletingCustomer?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
