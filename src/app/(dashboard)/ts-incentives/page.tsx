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
import { TsIncentive } from "@/types/api";

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

export default function TsIncentivesPage() {
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
  } = usePaginated<TsIncentive>("/ts-incentives", {
    page,
    limit: 10,
    search,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TsIncentive | null>(null);
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<TsIncentive | null>(null);

  const columns: Column<TsIncentive>[] = [
    { header: "Name", accessorKey: "name" },
    { header: "Amount", accessorKey: "amount" },
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

  function handleCreate() {
    setEditing(null);
    setFormName("");
    setFormAmount("");
    setFormDescription("");
    setDialogOpen(true);
  }

  function handleEdit(item: TsIncentive) {
    setEditing(item);
    setFormName(item.name);
    setFormAmount(item.amount);
    setFormDescription(item.description || "");
    setDialogOpen(true);
  }

  function handleDeleteClick(item: TsIncentive) {
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
        amount: formAmount.trim(),
        ...(formDescription.trim() && { description: formDescription.trim() }),
      };

      if (editing) {
        await fetchApi(`/ts-incentives/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("TS incentive updated successfully");
      } else {
        await fetchApi("/ts-incentives", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("TS incentive created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch {
      toast.error(
        editing
          ? "Failed to update TS incentive"
          : "Failed to create TS incentive"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;

    try {
      await fetchApi(`/ts-incentives/${deleting.id}`, {
        method: "DELETE",
      });
      toast.success("TS incentive deleted successfully");
      setDeleteDialogOpen(false);
      setDeleting(null);
      refetch();
    } catch {
      toast.error("Failed to delete TS incentive");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="TS Incentives"
        description="Manage TS incentives"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New TS Incentive
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
        searchPlaceholder="Search TS incentives..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No TS incentives found"
        emptyDescription="Get started by creating your first TS incentive."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New TS Incentive
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit TS Incentive" : "New TS Incentive"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the TS incentive details below."
                : "Fill in the details to create a new TS incentive."}
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
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                placeholder="Enter amount"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter description"
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
        title="Delete TS Incentive"
        description={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
