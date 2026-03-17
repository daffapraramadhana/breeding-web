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
import { ProductCategory } from "@/types/api";

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

export default function ProductCategoriesPage() {
  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch product categories
  const { data: categories, meta, isLoading, refetch } = usePaginated<ProductCategory>(
    "/product-categories",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [formName, setFormName] = useState("");
  const [formPurchasePurpose, setFormPurchasePurpose] = useState("");
  const [formOverheadCategory, setFormOverheadCategory] = useState("");
  const [formPriceType, setFormPriceType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<ProductCategory | null>(null);

  // Table columns
  const columns: Column<ProductCategory>[] = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Purchase Purpose",
      cell: (row) => row.purchasePurpose || "-",
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
    setEditingCategory(null);
    setFormName("");
    setFormPurchasePurpose("");
    setFormOverheadCategory("");
    setFormPriceType("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(category: ProductCategory) {
    setEditingCategory(category);
    setFormName(category.name);
    setFormPurchasePurpose(category.purchasePurpose || "");
    setFormOverheadCategory(category.overheadCategory || "");
    setFormPriceType(category.priceType || "");
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(category: ProductCategory) {
    setDeletingCategory(category);
    setDeleteDialogOpen(true);
  }

  // Submit create/edit
  async function handleSubmit() {
    if (!formName.trim()) {
      toast.error("Category name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        name: formName.trim(),
        ...(formPurchasePurpose.trim() && { purchasePurpose: formPurchasePurpose.trim() }),
        ...(formOverheadCategory.trim() && { overheadCategory: formOverheadCategory.trim() }),
        ...(formPriceType.trim() && { priceType: formPriceType.trim() }),
      };

      if (editingCategory) {
        await fetchApi(`/product-categories/${editingCategory.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Category updated successfully");
      } else {
        await fetchApi("/product-categories", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Category created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingCategory ? "Failed to update category" : "Failed to create category"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingCategory) return;

    try {
      await fetchApi(`/product-categories/${deletingCategory.id}`, {
        method: "DELETE",
      });
      toast.success("Category deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingCategory(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete category");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Categories"
        description="Manage product categories and classifications"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Category
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={categories}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search categories..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No categories found"
        emptyDescription="Get started by creating your first product category."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Category
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the category details below."
                : "Fill in the details to create a new product category."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                placeholder="Enter category name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-purchase-purpose">Purchase Purpose</Label>
              <Input
                id="category-purchase-purpose"
                placeholder="Enter purchase purpose (optional)"
                value={formPurchasePurpose}
                onChange={(e) => setFormPurchasePurpose(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-overhead">Overhead Category</Label>
              <Input
                id="category-overhead"
                placeholder="Enter overhead category (optional)"
                value={formOverheadCategory}
                onChange={(e) => setFormOverheadCategory(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-price-type">Price Type</Label>
              <Input
                id="category-price-type"
                placeholder="Enter price type (optional)"
                value={formPriceType}
                onChange={(e) => setFormPriceType(e.target.value)}
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
                : editingCategory
                  ? "Update Category"
                  : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Category"
        description={`Are you sure you want to delete "${deletingCategory?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
