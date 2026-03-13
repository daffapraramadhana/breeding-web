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
import { LogisticsVerification } from "@/types/api";

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

export default function LogisticsVerificationsPage() {
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
  } = usePaginated<LogisticsVerification>("/logistics-verifications", {
    page,
    limit: 10,
    search,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LogisticsVerification | null>(null);
  const [formReferenceType, setFormReferenceType] = useState("");
  const [formReferenceId, setFormReferenceId] = useState("");
  const [formVerificationType, setFormVerificationType] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<LogisticsVerification | null>(null);

  const columns: Column<LogisticsVerification>[] = [
    { header: "Reference Type", accessorKey: "referenceType" },
    {
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Verified By",
      cell: (row) => row.verifiedBy || "-",
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
    setFormReferenceType("");
    setFormReferenceId("");
    setFormVerificationType("");
    setFormNotes("");
    setDialogOpen(true);
  }

  function handleEdit(item: LogisticsVerification) {
    setEditing(item);
    setFormReferenceType(item.referenceType);
    setFormReferenceId(item.referenceId);
    setFormVerificationType(item.verificationType || "");
    setFormNotes(item.notes || "");
    setDialogOpen(true);
  }

  function handleDeleteClick(item: LogisticsVerification) {
    setDeleting(item);
    setDeleteDialogOpen(true);
  }

  async function handleSubmit() {
    if (!formReferenceType.trim()) {
      toast.error("Reference type is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        referenceType: formReferenceType.trim(),
        referenceId: formReferenceId.trim(),
        verificationType: formVerificationType.trim(),
        notes: formNotes.trim(),
      };

      if (editing) {
        await fetchApi(`/logistics-verifications/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Verification updated successfully");
      } else {
        await fetchApi("/logistics-verifications", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Verification created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch {
      toast.error(
        editing
          ? "Failed to update verification"
          : "Failed to create verification"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;

    try {
      await fetchApi(`/logistics-verifications/${deleting.id}`, {
        method: "DELETE",
      });
      toast.success("Verification deleted successfully");
      setDeleteDialogOpen(false);
      setDeleting(null);
      refetch();
    } catch {
      toast.error("Failed to delete verification");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Logistics Verifications"
        description="Manage logistics verifications"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Verification
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
        searchPlaceholder="Search verifications..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No verifications found"
        emptyDescription="Get started by creating your first verification."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Verification
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Verification" : "New Verification"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the verification details below."
                : "Fill in the details to create a new verification."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="referenceType">Reference Type</Label>
              <Input
                id="referenceType"
                placeholder="Enter reference type"
                value={formReferenceType}
                onChange={(e) => setFormReferenceType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referenceId">Reference ID</Label>
              <Input
                id="referenceId"
                placeholder="Enter reference ID"
                value={formReferenceId}
                onChange={(e) => setFormReferenceId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verificationType">Verification Type</Label>
              <Input
                id="verificationType"
                placeholder="Enter verification type"
                value={formVerificationType}
                onChange={(e) => setFormVerificationType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Enter notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
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
        title="Delete Verification"
        description="Are you sure you want to delete this verification? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
