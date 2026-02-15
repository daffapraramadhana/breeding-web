"use client";

import { useState, useEffect, useCallback } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi, fetchPaginated } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Item, ItemType, ItemCategory } from "@/types/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// -- Constants ----------------------------------------------------------------

const ITEM_TYPES: { value: ItemType; label: string }[] = [
  { value: "RAW_MATERIAL", label: "Raw Material" },
  { value: "FINISHED_GOOD", label: "Finished Good" },
  { value: "CONSUMABLE", label: "Consumable" },
  { value: "FEED", label: "Feed" },
  { value: "MEDICINE", label: "Medicine" },
];

const ITEM_TYPE_COLORS: Record<ItemType, string> = {
  RAW_MATERIAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  FINISHED_GOOD: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CONSUMABLE: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  FEED: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  MEDICINE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

function getItemTypeLabel(type: ItemType): string {
  return ITEM_TYPES.find((t) => t.value === type)?.label ?? type;
}

// -- Form state ---------------------------------------------------------------

interface ItemFormData {
  code: string;
  name: string;
  itemType: ItemType;
  baseUom: string;
  categoryId: string;
  description: string;
  isBatchTracked: boolean;
}

const EMPTY_FORM: ItemFormData = {
  code: "",
  name: "",
  itemType: "RAW_MATERIAL",
  baseUom: "",
  categoryId: "",
  description: "",
  isBatchTracked: false,
};

// -- Page component -----------------------------------------------------------

export default function ItemsPage() {
  // URL state via nuqs
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Data fetching
  const { data, meta, isLoading, refetch } = usePaginated<Item>("/items", {
    page,
    limit: 10,
    search: search || undefined,
  });

  // Categories for the dropdown
  const [categories, setCategories] = useState<ItemCategory[]>([]);

  const loadCategories = useCallback(async () => {
    try {
      const result = await fetchPaginated<ItemCategory>("/item-categories", {
        limit: 100,
      });
      setCategories(result.data);
    } catch {
      // Categories are optional; silently ignore errors
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [form, setForm] = useState<ItemFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState(false);

  // -- Handlers ---------------------------------------------------------------

  function openCreateDialog() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(item: Item) {
    setEditingItem(item);
    setForm({
      code: item.code,
      name: item.name,
      itemType: item.itemType,
      baseUom: item.baseUom,
      categoryId: item.categoryId ?? "",
      description: item.description ?? "",
      isBatchTracked: item.isBatchTracked ?? false,
    });
    setDialogOpen(true);
  }

  function openDeleteDialog(item: Item) {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  }

  async function handleSave() {
    if (!form.code.trim() || !form.name.trim() || !form.baseUom.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        itemType: form.itemType,
        baseUom: form.baseUom.trim(),
        ...(form.categoryId ? { categoryId: form.categoryId } : {}),
        ...(form.description.trim()
          ? { description: form.description.trim() }
          : {}),
        isBatchTracked: form.isBatchTracked,
      };

      if (editingItem) {
        await fetchApi(`/items/${editingItem.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Item updated successfully");
      } else {
        await fetchApi("/items", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Item created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save item"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingItem) return;

    setDeleting(true);
    try {
      await fetchApi(`/items/${deletingItem.id}`, { method: "DELETE" });
      toast.success("Item deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete item"
      );
    } finally {
      setDeleting(false);
    }
  }

  // -- Table columns ----------------------------------------------------------

  const columns: Column<Item>[] = [
    {
      header: "Code",
      accessorKey: "code",
      className: "w-[120px] font-mono",
    },
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Type",
      cell: (row) => (
        <Badge variant="outline" className={ITEM_TYPE_COLORS[row.itemType]}>
          {getItemTypeLabel(row.itemType)}
        </Badge>
      ),
    },
    {
      header: "Base UOM",
      accessorKey: "baseUom",
      className: "w-[100px]",
    },
    {
      header: "Category",
      cell: (row) => row.category?.name ?? "-",
    },
    {
      header: "Created",
      cell: (row) => formatDate(row.createdAt),
      className: "w-[130px]",
    },
    {
      header: "Actions",
      className: "w-[100px] text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(row);
            }}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteDialog(row);
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      ),
    },
  ];

  // -- Render -----------------------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title="Items"
        description="Manage inventory items, raw materials, and products"
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Item
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value || null);
          setPage(1);
        }}
        searchPlaceholder="Search items by code or name..."
        page={page}
        totalPages={meta?.totalPages ?? 1}
        total={meta?.total}
        onPageChange={setPage}
        emptyTitle="No items found"
        emptyDescription="Get started by creating your first item."
        emptyAction={
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Item
          </Button>
        }
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Item" : "Create New Item"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Code */}
            <div className="grid gap-2">
              <Label htmlFor="item-code">
                Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="item-code"
                placeholder="e.g. ITM-001"
                value={form.code}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, code: e.target.value }))
                }
              />
            </div>

            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="item-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="item-name"
                placeholder="Item name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            {/* Item Type */}
            <div className="grid gap-2">
              <Label htmlFor="item-type">
                Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.itemType}
                onValueChange={(value: ItemType) =>
                  setForm((prev) => ({ ...prev, itemType: value }))
                }
              >
                <SelectTrigger id="item-type" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Base UOM */}
            <div className="grid gap-2">
              <Label htmlFor="item-uom">
                Base UOM <span className="text-destructive">*</span>
              </Label>
              <Input
                id="item-uom"
                placeholder="e.g. kg, pcs, liter"
                value={form.baseUom}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, baseUom: e.target.value }))
                }
              />
            </div>

            {/* Category */}
            <div className="grid gap-2">
              <Label htmlFor="item-category">Category</Label>
              <Select
                value={form.categoryId || "none"}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    categoryId: value === "none" ? "" : value,
                  }))
                }
              >
                <SelectTrigger id="item-category" className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                placeholder="Optional description"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            {/* Batch Tracked */}
            <div className="flex items-center gap-2">
              <input
                id="item-batch-tracked"
                type="checkbox"
                checked={form.isBatchTracked}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isBatchTracked: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="item-batch-tracked" className="font-normal">
                Batch tracked
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? "Saving..."
                : editingItem
                  ? "Update Item"
                  : "Create Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!deleting) {
            setDeleteDialogOpen(open);
            if (!open) setDeletingItem(null);
          }
        }}
        title="Delete Item"
        description={`Are you sure you want to delete "${deletingItem?.name ?? ""}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={deleting ? "Deleting..." : "Delete"}
      />
    </div>
  );
}
