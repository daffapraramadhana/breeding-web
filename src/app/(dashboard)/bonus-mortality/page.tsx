"use client";

import { useState } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { BonusMortality } from "@/types/api";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DetailRow {
  minMortality: string;
  maxMortality: string;
  bonus: string;
}

export default function BonusMortalityPage() {
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
  } = usePaginated<BonusMortality>("/bonus-mortality", {
    page,
    limit: 10,
    search,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BonusMortality | null>(null);
  const [formName, setFormName] = useState("");
  const [formBonusUnitOption, setFormBonusUnitOption] = useState("");
  const [formStatus, setFormStatus] = useState("");
  const [formDetails, setFormDetails] = useState<DetailRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<BonusMortality | null>(null);

  const columns: Column<BonusMortality>[] = [
    { header: "Name", accessorKey: "name" },
    {
      header: "Unit Option",
      cell: (row) => row.bonusUnitOption || "-",
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
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
    setFormBonusUnitOption("");
    setFormStatus("");
    setFormDetails([]);
    setDialogOpen(true);
  }

  function handleEdit(item: BonusMortality) {
    setEditing(item);
    setFormName(item.name);
    setFormBonusUnitOption(item.bonusUnitOption || "");
    setFormStatus(item.status);
    setFormDetails(
      item.details?.map((d) => ({
        minMortality: d.minMortality,
        maxMortality: d.maxMortality,
        bonus: d.bonus,
      })) || []
    );
    setDialogOpen(true);
  }

  function handleDeleteClick(item: BonusMortality) {
    setDeleting(item);
    setDeleteDialogOpen(true);
  }

  function addDetail() {
    setFormDetails([
      ...formDetails,
      { minMortality: "", maxMortality: "", bonus: "" },
    ]);
  }

  function removeDetail(index: number) {
    setFormDetails(formDetails.filter((_, i) => i !== index));
  }

  function updateDetail(index: number, field: keyof DetailRow, value: string) {
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
        bonusUnitOption: formBonusUnitOption,
        status: formStatus,
        details: formDetails,
      };

      if (editing) {
        await fetchApi(`/bonus-mortality/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Bonus Mortality updated successfully");
      } else {
        await fetchApi("/bonus-mortality", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Bonus Mortality created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch {
      toast.error(
        editing
          ? "Failed to update bonus mortality"
          : "Failed to create bonus mortality"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;

    try {
      await fetchApi(`/bonus-mortality/${deleting.id}`, {
        method: "DELETE",
      });
      toast.success("Bonus Mortality deleted successfully");
      setDeleteDialogOpen(false);
      setDeleting(null);
      refetch();
    } catch {
      toast.error("Failed to delete bonus mortality");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bonus Mortality"
        description="Manage bonus mortality configurations"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Bonus Mortality
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
        searchPlaceholder="Search bonus mortality..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No bonus mortality found"
        emptyDescription="Get started by creating your first bonus mortality."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Bonus Mortality
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Bonus Mortality" : "New Bonus Mortality"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the bonus mortality details below."
                : "Fill in the details to create a new bonus mortality."}
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
              <Label>Bonus Unit Option</Label>
              <Select
                value={formBonusUnitOption}
                onValueChange={setFormBonusUnitOption}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER_KG">PER_KG</SelectItem>
                  <SelectItem value="PER_BIRD">PER_BIRD</SelectItem>
                  <SelectItem value="FLAT">FLAT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Details</Label>
                <Button type="button" variant="outline" size="sm" onClick={addDetail}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Detail
                </Button>
              </div>
              {formDetails.map((detail, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Min Mortality"
                    value={detail.minMortality}
                    onChange={(e) =>
                      updateDetail(index, "minMortality", e.target.value)
                    }
                  />
                  <Input
                    placeholder="Max Mortality"
                    value={detail.maxMortality}
                    onChange={(e) =>
                      updateDetail(index, "maxMortality", e.target.value)
                    }
                  />
                  <Input
                    placeholder="Bonus"
                    value={detail.bonus}
                    onChange={(e) =>
                      updateDetail(index, "bonus", e.target.value)
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDetail(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
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
        title="Delete Bonus Mortality"
        description={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
