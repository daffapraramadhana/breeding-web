"use client";

import { useState } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Coop, CoopStatus } from "@/types/api";
import { FarmCombobox } from "@/components/forms/farm-combobox";
import { BranchCombobox } from "@/components/forms/branch-combobox";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CoopsPage() {
  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch coops
  const { data: coops, meta, isLoading, refetch } = usePaginated<Coop>(
    "/coops",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoop, setEditingCoop] = useState<Coop | null>(null);
  const [formFarmId, setFormFarmId] = useState("");
  const [formBranchId, setFormBranchId] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formCapacity, setFormCapacity] = useState("");
  const [formStatus, setFormStatus] = useState<CoopStatus>("ACTIVE");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCoop, setDeletingCoop] = useState<Coop | null>(null);

  // Table columns
  const columns: Column<Coop>[] = [
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
      header: "Farm",
      cell: (row) => row.farm?.name || "-",
    },
    {
      header: "Capacity",
      cell: (row) => row.capacity?.toLocaleString() || "-",
      className: "w-[100px]",
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
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
    setEditingCoop(null);
    setFormFarmId("");
    setFormBranchId("");
    setFormCode("");
    setFormName("");
    setFormCapacity("");
    setFormStatus("ACTIVE");
    setFormDescription("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(coop: Coop) {
    setEditingCoop(coop);
    setFormFarmId(coop.farmId || "");
    setFormBranchId(coop.branchId || "");
    setFormCode(coop.code);
    setFormName(coop.name);
    setFormCapacity(String(coop.capacity || ""));
    setFormStatus(coop.status || "ACTIVE");
    setFormDescription(coop.description || "");
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(coop: Coop) {
    setDeletingCoop(coop);
    setDeleteDialogOpen(true);
  }

  // Submit create/edit
  async function handleSubmit() {
    if (!formCode.trim()) {
      toast.error("Coop code is required");
      return;
    }

    if (!formName.trim()) {
      toast.error("Coop name is required");
      return;
    }

    if (!formFarmId) {
      toast.error("Farm is required");
      return;
    }

    if (!formBranchId) {
      toast.error("Branch is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        farmId: formFarmId,
        branchId: formBranchId,
        code: formCode.trim(),
        name: formName.trim(),
        capacity: Number(formCapacity) || 0,
        status: formStatus,
        ...(formDescription.trim() && { description: formDescription.trim() }),
      };

      if (editingCoop) {
        await fetchApi(`/coops/${editingCoop.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Coop updated successfully");
      } else {
        await fetchApi("/coops", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Coop created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingCoop ? "Failed to update coop" : "Failed to create coop"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingCoop) return;

    try {
      await fetchApi(`/coops/${deletingCoop.id}`, {
        method: "DELETE",
      });
      toast.success("Coop deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingCoop(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete coop");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coops"
        description="Manage your coops and their configurations"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Coop
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={coops}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search coops..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No coops found"
        emptyDescription="Get started by creating your first coop."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Coop
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCoop ? "Edit Coop" : "New Coop"}
            </DialogTitle>
            <DialogDescription>
              {editingCoop
                ? "Update the coop details below."
                : "Fill in the details to create a new coop."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coop-branch">Branch</Label>
              <BranchCombobox
                value={formBranchId}
                onChange={setFormBranchId}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coop-farm">Farm</Label>
              <FarmCombobox
                value={formFarmId}
                onChange={setFormFarmId}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coop-code">Code</Label>
              <Input
                id="coop-code"
                placeholder="Enter coop code"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coop-name">Name</Label>
              <Input
                id="coop-name"
                placeholder="Enter coop name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coop-capacity">Capacity</Label>
              <Input
                id="coop-capacity"
                type="number"
                placeholder="Enter capacity"
                value={formCapacity}
                onChange={(e) => setFormCapacity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coop-status">Status</Label>
              <Select
                value={formStatus}
                onValueChange={(val) => setFormStatus(val as CoopStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coop-description">Description</Label>
              <Textarea
                id="coop-description"
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
                : editingCoop
                  ? "Update Coop"
                  : "Create Coop"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Coop"
        description={`Are you sure you want to delete "${deletingCoop?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
