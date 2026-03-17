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
import { Product } from "@/types/api";

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

export default function ProductsPage() {
  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch products
  const { data: products, meta, isLoading, refetch } = usePaginated<Product>(
    "/products",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formBaseUom, setFormBaseUom] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formMinStock, setFormMinStock] = useState("");
  const [formVendor, setFormVendor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Table columns
  const columns: Column<Product>[] = [
    {
      header: "Code",
      accessorKey: "code",
    },
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Base UOM",
      accessorKey: "baseUom",
    },
    {
      header: "Category",
      cell: (row) => row.category?.name || row.categoryId || "-",
    },
    {
      header: "Min Stock",
      cell: (row) => row.minStock ?? "-",
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
    setEditingProduct(null);
    setFormCode("");
    setFormName("");
    setFormBaseUom("");
    setFormCategoryId("");
    setFormMinStock("");
    setFormVendor("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(product: Product) {
    setEditingProduct(product);
    setFormCode(product.code);
    setFormName(product.name);
    setFormBaseUom(product.baseUom);
    setFormCategoryId(product.categoryId || "");
    setFormMinStock(product.minStock?.toString() || "");
    setFormVendor(product.vendor || "");
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(product: Product) {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  }

  // Submit create/edit
  async function handleSubmit() {
    if (!formCode.trim()) {
      toast.error("Product code is required");
      return;
    }
    if (!formName.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!formBaseUom.trim()) {
      toast.error("Base UOM is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        code: formCode.trim(),
        name: formName.trim(),
        baseUom: formBaseUom.trim(),
        ...(formCategoryId.trim() && { categoryId: formCategoryId.trim() }),
        ...(formMinStock.trim() && { minStock: Number(formMinStock) }),
        ...(formVendor.trim() && { vendor: formVendor.trim() }),
      };

      if (editingProduct) {
        await fetchApi(`/products/${editingProduct.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Product updated successfully");
      } else {
        await fetchApi("/products", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Product created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingProduct ? "Failed to update product" : "Failed to create product"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingProduct) return;

    try {
      await fetchApi(`/products/${deletingProduct.id}`, {
        method: "DELETE",
      });
      toast.success("Product deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingProduct(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your products and inventory items"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Product
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={products}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search products..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No products found"
        emptyDescription="Get started by creating your first product."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Product
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "New Product"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Update the product details below."
                : "Fill in the details to create a new product."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-code">Code</Label>
              <Input
                id="product-code"
                placeholder="Enter product code"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                placeholder="Enter product name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-base-uom">Base UOM</Label>
              <Input
                id="product-base-uom"
                placeholder="Enter base unit of measure"
                value={formBaseUom}
                onChange={(e) => setFormBaseUom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-category-id">Category ID</Label>
              <Input
                id="product-category-id"
                placeholder="Enter category ID (optional)"
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-min-stock">Min Stock</Label>
              <Input
                id="product-min-stock"
                type="number"
                placeholder="Enter minimum stock (optional)"
                value={formMinStock}
                onChange={(e) => setFormMinStock(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-vendor">Vendor</Label>
              <Input
                id="product-vendor"
                placeholder="Enter vendor (optional)"
                value={formVendor}
                onChange={(e) => setFormVendor(e.target.value)}
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
                : editingProduct
                  ? "Update Product"
                  : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Product"
        description={`Are you sure you want to delete "${deletingProduct?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
