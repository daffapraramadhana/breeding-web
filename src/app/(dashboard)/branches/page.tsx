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
import { Branch } from "@/types/api";

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

export default function BranchesPage() {
  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch branches
  const { data: branches, meta, isLoading, refetch } = usePaginated<Branch>(
    "/branches",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formRegion, setFormRegion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);

  // Table columns
  const columns: Column<Branch>[] = [
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
      header: "Region",
      cell: (row) => row.region || "-",
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
    setEditingBranch(null);
    setFormCode("");
    setFormName("");
    setFormRegion("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(branch: Branch) {
    setEditingBranch(branch);
    setFormCode(branch.code);
    setFormName(branch.name);
    setFormRegion(branch.region || "");
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(branch: Branch) {
    setDeletingBranch(branch);
    setDeleteDialogOpen(true);
  }

  // Submit create/edit
  async function handleSubmit() {
    if (!formCode.trim()) {
      toast.error("Branch code is required");
      return;
    }

    if (!formName.trim()) {
      toast.error("Branch name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        code: formCode.trim(),
        name: formName.trim(),
        ...(formRegion.trim() && { region: formRegion.trim() }),
      };

      if (editingBranch) {
        await fetchApi(`/branches/${editingBranch.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Branch updated successfully");
      } else {
        await fetchApi("/branches", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Branch created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingBranch ? "Failed to update branch" : "Failed to create branch"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingBranch) return;

    try {
      await fetchApi(`/branches/${deletingBranch.id}`, {
        method: "DELETE",
      });
      toast.success("Branch deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingBranch(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete branch");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        description="Manage your organization branches"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Branch
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={branches}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search branches..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No branches found"
        emptyDescription="Get started by creating your first branch."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Branch
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBranch ? "Edit Branch" : "New Branch"}
            </DialogTitle>
            <DialogDescription>
              {editingBranch
                ? "Update the branch details below."
                : "Fill in the details to create a new branch."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="branch-code">Code</Label>
              <Input
                id="branch-code"
                placeholder="Enter branch code"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-name">Name</Label>
              <Input
                id="branch-name"
                placeholder="Enter branch name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-region">Region</Label>
              <Input
                id="branch-region"
                placeholder="Enter region (optional)"
                value={formRegion}
                onChange={(e) => setFormRegion(e.target.value)}
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
                : editingBranch
                  ? "Update Branch"
                  : "Create Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Branch"
        description={`Are you sure you want to delete "${deletingBranch?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
