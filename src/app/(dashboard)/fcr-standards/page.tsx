"use client";

import { useState } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { FcrStandard, FcrStandardDetail } from "@/types/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function FcrStandardsPage() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data: standards, meta, isLoading, refetch } = usePaginated<FcrStandard>(
    "/fcr-standards",
    { page, limit: 10, search }
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FcrStandard | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDetails, setFormDetails] = useState<FcrStandardDetail[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<FcrStandard | null>(null);

  const columns: Column<FcrStandard>[] = [
    { header: "Name", accessorKey: "name" },
    { header: "Description", cell: (row) => row.description || "-" },
    { header: "Created", cell: (row) => formatDate(row.createdAt), className: "w-[150px]" },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteClick(row); }}>
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
    setFormDescription("");
    setFormDetails([]);
    setDialogOpen(true);
  }

  function handleEdit(item: FcrStandard) {
    setEditing(item);
    setFormName(item.name);
    setFormDescription(item.description || "");
    setFormDetails(item.details || []);
    setDialogOpen(true);
  }

  function handleDeleteClick(item: FcrStandard) {
    setDeleting(item);
    setDeleteDialogOpen(true);
  }

  function addDetail() {
    setFormDetails([...formDetails, { day: 0, fcr: "" }]);
  }

  function removeDetail(index: number) {
    setFormDetails(formDetails.filter((_, i) => i !== index));
  }

  function updateDetail(index: number, field: keyof FcrStandardDetail, value: string | number) {
    const updated = [...formDetails];
    updated[index] = { ...updated[index], [field]: value };
    setFormDetails(updated);
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
        ...(formDescription.trim() && { description: formDescription.trim() }),
        details: formDetails,
      };

      if (editing) {
        await fetchApi(`/fcr-standards/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("FCR standard updated successfully");
      } else {
        await fetchApi("/fcr-standards", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("FCR standard created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch {
      toast.error(editing ? "Failed to update FCR standard" : "Failed to create FCR standard");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await fetchApi(`/fcr-standards/${deleting.id}`, { method: "DELETE" });
      toast.success("FCR standard deleted successfully");
      setDeleteDialogOpen(false);
      setDeleting(null);
      refetch();
    } catch {
      toast.error("Failed to delete FCR standard");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="FCR Standards"
        description="Manage feed conversion ratio standards"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Standard
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={standards}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Search FCR standards..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No FCR standards found"
        emptyDescription="Get started by creating your first FCR standard."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Standard
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit FCR Standard" : "New FCR Standard"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the FCR standard details below." : "Fill in the details to create a new FCR standard."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fcr-name">Name</Label>
              <Input id="fcr-name" placeholder="Enter name" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fcr-description">Description</Label>
              <Textarea
                id="fcr-description"
                placeholder="Enter description (optional)"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Details</Label>
                <Button type="button" variant="outline" size="sm" onClick={addDetail}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Detail
                </Button>
              </div>
              {formDetails.length > 0 && (
                <div className="space-y-2">
                  {formDetails.map((detail, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <Input
                          type="number"
                          placeholder="Day"
                          value={detail.day || ""}
                          onChange={(e) => updateDetail(index, "day", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder="FCR"
                          value={detail.fcr}
                          onChange={(e) => updateDetail(index, "fcr", e.target.value)}
                        />
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeDetail(index)}>
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editing ? "Update Standard" : "Create Standard"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete FCR Standard"
        description={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
