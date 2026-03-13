"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Farm, FarmStatus } from "@/types/api";
import { BranchCombobox } from "@/components/forms/branch-combobox";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function FarmsPage() {
  const router = useRouter();

  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch farms
  const { data: farms, meta, isLoading, refetch } = usePaginated<Farm>(
    "/farms",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formBranchId, setFormBranchId] = useState("");
  const [formFarmType, setFormFarmType] = useState("");
  const [formStatus, setFormStatus] = useState<FarmStatus | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFarm, setDeletingFarm] = useState<Farm | null>(null);

  // Table columns
  const columns: Column<Farm>[] = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Branch",
      cell: (row) => row.branch?.name || "-",
    },
    {
      header: "Address",
      accessorKey: "address",
    },
    {
      header: "Farm Type",
      cell: (row) => row.farmType || "-",
    },
    {
      header: "Status",
      cell: (row) =>
        row.status ? <StatusBadge status={row.status} /> : "-",
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
    setEditingFarm(null);
    setFormName("");
    setFormAddress("");
    setFormBranchId("");
    setFormFarmType("");
    setFormStatus("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(farm: Farm) {
    setEditingFarm(farm);
    setFormName(farm.name);
    setFormAddress(farm.address || "");
    setFormBranchId(farm.branchId || "");
    setFormFarmType(farm.farmType || "");
    setFormStatus(farm.status || "");
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(farm: Farm) {
    setDeletingFarm(farm);
    setDeleteDialogOpen(true);
  }

  // Submit create/edit
  async function handleSubmit() {
    if (!formName.trim()) {
      toast.error("Farm name is required");
      return;
    }

    if (!formBranchId) {
      toast.error("Branch is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        name: formName.trim(),
        branchId: formBranchId,
        ...(formAddress.trim() && { address: formAddress.trim() }),
        ...(formFarmType.trim() && { farmType: formFarmType.trim() }),
        ...(formStatus && { status: formStatus }),
      };

      if (editingFarm) {
        await fetchApi(`/farms/${editingFarm.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Farm updated successfully");
      } else {
        await fetchApi("/farms", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Farm created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingFarm ? "Failed to update farm" : "Failed to create farm"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingFarm) return;

    try {
      await fetchApi(`/farms/${deletingFarm.id}`, {
        method: "DELETE",
      });
      toast.success("Farm deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingFarm(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete farm");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Farms"
        description="Manage your farms and their locations"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Farm
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={farms}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search farms..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        onRowClick={(farm) => router.push(`/farms/${farm.id}`)}
        emptyTitle="No farms found"
        emptyDescription="Get started by creating your first farm."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Farm
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFarm ? "Edit Farm" : "New Farm"}
            </DialogTitle>
            <DialogDescription>
              {editingFarm
                ? "Update the farm details below."
                : "Fill in the details to create a new farm."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="farm-branch">Branch</Label>
              <BranchCombobox
                value={formBranchId}
                onChange={setFormBranchId}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm-name">Name</Label>
              <Input
                id="farm-name"
                placeholder="Enter farm name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm-address">Address</Label>
              <Input
                id="farm-address"
                placeholder="Enter farm address (optional)"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm-type">Farm Type</Label>
              <Input
                id="farm-type"
                placeholder="Enter farm type (optional)"
                value={formFarmType}
                onChange={(e) => setFormFarmType(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm-status">Status</Label>
              <Select
                value={formStatus}
                onValueChange={(val) => setFormStatus(val as FarmStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>
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
                : editingFarm
                  ? "Update Farm"
                  : "Create Farm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Farm"
        description={`Are you sure you want to delete "${deletingFarm?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
