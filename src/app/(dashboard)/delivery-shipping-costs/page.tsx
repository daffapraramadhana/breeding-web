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
import { DeliveryShippingCost } from "@/types/api";

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

export default function DeliveryShippingCostsPage() {
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
  } = usePaginated<DeliveryShippingCost>("/delivery-shipping-costs", {
    page,
    limit: 10,
    search,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryShippingCost | null>(null);
  const [formDeliveryId, setFormDeliveryId] = useState("");
  const [formFuelCost, setFormFuelCost] = useState("");
  const [formTollCost, setFormTollCost] = useState("");
  const [formOtherCost, setFormOtherCost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<DeliveryShippingCost | null>(null);

  const columns: Column<DeliveryShippingCost>[] = [
    { header: "Delivery ID", accessorKey: "deliveryId" },
    {
      header: "Fuel Cost",
      cell: (row) => row.fuelCost || "-",
    },
    {
      header: "Toll Cost",
      cell: (row) => row.tollCost || "-",
    },
    {
      header: "Other",
      cell: (row) => row.otherCost || "-",
    },
    { header: "Total Cost", accessorKey: "totalCost" },
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
    setFormDeliveryId("");
    setFormFuelCost("");
    setFormTollCost("");
    setFormOtherCost("");
    setDialogOpen(true);
  }

  function handleEdit(item: DeliveryShippingCost) {
    setEditing(item);
    setFormDeliveryId(item.deliveryId);
    setFormFuelCost(item.fuelCost || "");
    setFormTollCost(item.tollCost || "");
    setFormOtherCost(item.otherCost || "");
    setDialogOpen(true);
  }

  function handleDeleteClick(item: DeliveryShippingCost) {
    setDeleting(item);
    setDeleteDialogOpen(true);
  }

  async function handleSubmit() {
    if (!formDeliveryId.trim()) {
      toast.error("Delivery ID is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        deliveryId: formDeliveryId.trim(),
        fuelCost: formFuelCost.trim(),
        tollCost: formTollCost.trim(),
        otherCost: formOtherCost.trim(),
      };

      if (editing) {
        await fetchApi(`/delivery-shipping-costs/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Shipping cost updated successfully");
      } else {
        await fetchApi("/delivery-shipping-costs", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Shipping cost created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch {
      toast.error(
        editing
          ? "Failed to update shipping cost"
          : "Failed to create shipping cost"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;

    try {
      await fetchApi(`/delivery-shipping-costs/${deleting.id}`, {
        method: "DELETE",
      });
      toast.success("Shipping cost deleted successfully");
      setDeleteDialogOpen(false);
      setDeleting(null);
      refetch();
    } catch {
      toast.error("Failed to delete shipping cost");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Shipping Costs"
        description="Manage delivery shipping costs"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Shipping Cost
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
        searchPlaceholder="Search shipping costs..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No shipping costs found"
        emptyDescription="Get started by creating your first shipping cost."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Shipping Cost
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Shipping Cost" : "New Shipping Cost"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the shipping cost details below."
                : "Fill in the details to create a new shipping cost."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryId">Delivery ID</Label>
              <Input
                id="deliveryId"
                placeholder="Enter delivery ID"
                value={formDeliveryId}
                onChange={(e) => setFormDeliveryId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuelCost">Fuel Cost</Label>
              <Input
                id="fuelCost"
                placeholder="Enter fuel cost"
                value={formFuelCost}
                onChange={(e) => setFormFuelCost(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tollCost">Toll Cost</Label>
              <Input
                id="tollCost"
                placeholder="Enter toll cost"
                value={formTollCost}
                onChange={(e) => setFormTollCost(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otherCost">Other Cost</Label>
              <Input
                id="otherCost"
                placeholder="Enter other cost"
                value={formOtherCost}
                onChange={(e) => setFormOtherCost(e.target.value)}
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
        title="Delete Shipping Cost"
        description="Are you sure you want to delete this shipping cost? This action cannot be undone."
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
