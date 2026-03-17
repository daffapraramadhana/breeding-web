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
import { BankAccount } from "@/types/api";
import { BranchCombobox } from "@/components/forms/branch-combobox";

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

export default function BankAccountsPage() {
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
  } = usePaginated<BankAccount>("/bank-accounts", {
    page,
    limit: 10,
    search,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [formBranchId, setFormBranchId] = useState("");
  const [formBankName, setFormBankName] = useState("");
  const [formAccountNumber, setFormAccountNumber] = useState("");
  const [formAccountHolder, setFormAccountHolder] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<BankAccount | null>(null);

  const columns: Column<BankAccount>[] = [
    { header: "Bank Name", accessorKey: "bankName" },
    { header: "Account Number", accessorKey: "accountNumber" },
    { header: "Account Holder", accessorKey: "accountHolder" },
    {
      header: "Branch",
      cell: (row) => row.branch?.name || "-",
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
    setFormBranchId("");
    setFormBankName("");
    setFormAccountNumber("");
    setFormAccountHolder("");
    setDialogOpen(true);
  }

  function handleEdit(item: BankAccount) {
    setEditing(item);
    setFormBranchId(item.branchId);
    setFormBankName(item.bankName);
    setFormAccountNumber(item.accountNumber);
    setFormAccountHolder(item.accountHolder);
    setDialogOpen(true);
  }

  function handleDeleteClick(item: BankAccount) {
    setDeleting(item);
    setDeleteDialogOpen(true);
  }

  async function handleSubmit() {
    if (!formBankName.trim()) {
      toast.error("Bank name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        branchId: formBranchId,
        bankName: formBankName.trim(),
        accountNumber: formAccountNumber.trim(),
        accountHolder: formAccountHolder.trim(),
      };

      if (editing) {
        await fetchApi(`/bank-accounts/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Bank account updated successfully");
      } else {
        await fetchApi("/bank-accounts", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Bank account created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch {
      toast.error(
        editing
          ? "Failed to update bank account"
          : "Failed to create bank account"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;

    try {
      await fetchApi(`/bank-accounts/${deleting.id}`, {
        method: "DELETE",
      });
      toast.success("Bank account deleted successfully");
      setDeleteDialogOpen(false);
      setDeleting(null);
      refetch();
    } catch {
      toast.error("Failed to delete bank account");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Accounts"
        description="Manage bank accounts"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Bank Account
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
        searchPlaceholder="Search bank accounts..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No bank accounts found"
        emptyDescription="Get started by creating your first bank account."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Bank Account
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Bank Account" : "New Bank Account"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the bank account details below."
                : "Fill in the details to create a new bank account."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Branch</Label>
              <BranchCombobox
                value={formBranchId}
                onChange={setFormBranchId}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="Enter bank name"
                value={formBankName}
                onChange={(e) => setFormBankName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                placeholder="Enter account number"
                value={formAccountNumber}
                onChange={(e) => setFormAccountNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountHolder">Account Holder</Label>
              <Input
                id="accountHolder"
                placeholder="Enter account holder"
                value={formAccountHolder}
                onChange={(e) => setFormAccountHolder(e.target.value)}
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
        title="Delete Bank Account"
        description="Are you sure you want to delete this bank account? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
