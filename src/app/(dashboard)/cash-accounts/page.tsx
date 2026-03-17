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
import { CashAccount } from "@/types/api";
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

export default function CashAccountsPage() {
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
  } = usePaginated<CashAccount>("/cash-accounts", {
    page,
    limit: 10,
    search,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CashAccount | null>(null);
  const [formBranchId, setFormBranchId] = useState("");
  const [formName, setFormName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<CashAccount | null>(null);

  const columns: Column<CashAccount>[] = [
    { header: "Name", accessorKey: "name" },
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
    setFormName("");
    setDialogOpen(true);
  }

  function handleEdit(item: CashAccount) {
    setEditing(item);
    setFormBranchId(item.branchId);
    setFormName(item.name);
    setDialogOpen(true);
  }

  function handleDeleteClick(item: CashAccount) {
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
        branchId: formBranchId,
        name: formName.trim(),
      };

      if (editing) {
        await fetchApi(`/cash-accounts/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Cash account updated successfully");
      } else {
        await fetchApi("/cash-accounts", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Cash account created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch {
      toast.error(
        editing
          ? "Failed to update cash account"
          : "Failed to create cash account"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;

    try {
      await fetchApi(`/cash-accounts/${deleting.id}`, {
        method: "DELETE",
      });
      toast.success("Cash account deleted successfully");
      setDeleteDialogOpen(false);
      setDeleting(null);
      refetch();
    } catch {
      toast.error("Failed to delete cash account");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cash Accounts"
        description="Manage cash accounts"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Cash Account
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
        searchPlaceholder="Search cash accounts..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No cash accounts found"
        emptyDescription="Get started by creating your first cash account."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Cash Account
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Cash Account" : "New Cash Account"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the cash account details below."
                : "Fill in the details to create a new cash account."}
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
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
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
        title="Delete Cash Account"
        description={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
