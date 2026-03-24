"use client";

import { useState } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

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
import { EntityCombobox } from "@/components/forms/entity-combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ProductsPage() {
  const t = useTranslations('products');
  const tc = useTranslations('common');

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
  const [formBaseUomId, setFormBaseUomId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formSupplierId, setFormSupplierId] = useState("");
  const [formMinStock, setFormMinStock] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Table columns
  const columns: Column<Product>[] = [
    {
      header: tc('code'),
      accessorKey: "code",
    },
    {
      header: tc('name'),
      accessorKey: "name",
    },
    {
      header: t('baseUom'),
      cell: (row) => row.baseUom?.name || "-",
    },
    {
      header: t('category'),
      cell: (row) => row.category?.name || "-",
    },
    {
      header: t('supplier'),
      cell: (row) => row.supplier?.name || "-",
    },
    {
      header: t('minStock'),
      cell: (row) => row.minStock ?? "-",
    },
    {
      header: tc('created'),
      cell: (row) => formatDate(row.createdAt),
      className: "w-[150px]",
    },
    {
      header: tc('actions'),
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
    setFormBaseUomId("");
    setFormCategoryId("");
    setFormSupplierId("");
    setFormMinStock("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(product: Product) {
    setEditingProduct(product);
    setFormCode(product.code);
    setFormName(product.name);
    setFormBaseUomId(product.baseUomId || "");
    setFormCategoryId(product.categoryId || "");
    setFormSupplierId(product.supplierId || "");
    setFormMinStock(product.minStock?.toString() || "");
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
      toast.error(tc('required', { field: tc('code') }));
      return;
    }
    if (!formName.trim()) {
      toast.error(tc('required', { field: tc('name') }));
      return;
    }
    setIsSubmitting(true);
    try {
      const body = {
        code: formCode.trim(),
        name: formName.trim(),
        ...(formBaseUomId && { baseUomId: formBaseUomId }),
        ...(formCategoryId && { categoryId: formCategoryId }),
        ...(formSupplierId && { supplierId: formSupplierId }),
        ...(formMinStock.trim() && { minStock: Number(formMinStock) }),
      };

      if (editingProduct) {
        await fetchApi(`/products/${editingProduct.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success(tc('entityUpdated', { entity: t('entity') }));
      } else {
        await fetchApi("/products", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success(tc('entityCreated', { entity: t('entity') }));
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingProduct ? tc('entityUpdateFailed', { entity: t('entity') }) : tc('entityCreateFailed', { entity: t('entity') })
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
      toast.success(tc('entityDeleted', { entity: t('entity') }));
      setDeleteDialogOpen(false);
      setDeletingProduct(null);
      refetch();
    } catch (error) {
      toast.error(tc('entityDeleteFailed', { entity: t('entity') }));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {tc('newEntity', { entity: t('entity') })}
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
        searchPlaceholder={tc('searchField', { field: t('title') })}
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle={tc('noResults', { entity: t('title') })}
        emptyDescription={tc('getStarted', { entity: t('entity') })}
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {tc('newEntity', { entity: t('entity') })}
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? tc('editEntity', { entity: t('entity') }) : tc('newEntity', { entity: t('entity') })}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? tc('updateDetails', { entity: t('entity') })
                : tc('fillDetails', { entity: t('entity') })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-code">{tc('code')}</Label>
              <Input
                id="product-code"
                placeholder={tc('enterField', { field: tc('code') })}
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-name">{tc('name')}</Label>
              <Input
                id="product-name"
                placeholder={tc('enterField', { field: tc('name') })}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('baseUom')}</Label>
              <EntityCombobox
                endpoint="/unit-of-measures"
                value={formBaseUomId}
                onChange={setFormBaseUomId}
                placeholder={tc('selectField', { field: t('unitOfMeasure') })}
                searchPlaceholder={tc('searchField', { field: t('units') })}
                quickCreate={{
                  title: "Unit of Measure",
                  fields: [
                    { key: "name", label: "Name", required: true },
                    { key: "description", label: "Description" },
                  ],
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('category')}</Label>
              <EntityCombobox
                endpoint="/product-categories"
                value={formCategoryId}
                onChange={setFormCategoryId}
                placeholder={tc('selectField', { field: t('category') })}
                searchPlaceholder={tc('searchField', { field: t('categories') })}
                quickCreate={{
                  title: "Category",
                  fields: [
                    { key: "name", label: "Name", required: true },
                  ],
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('supplier')}</Label>
              <EntityCombobox
                endpoint="/suppliers"
                value={formSupplierId}
                onChange={setFormSupplierId}
                placeholder={tc('selectField', { field: t('supplier') })}
                searchPlaceholder={tc('searchField', { field: t('suppliers') })}
                quickCreate={{
                  title: "Supplier",
                  fields: [
                    { key: "code", label: "Code", required: true },
                    { key: "name", label: "Name", required: true },
                    { key: "address", label: "Address" },
                  ],
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-min-stock">{t('minStock')}</Label>
              <Input
                id="product-min-stock"
                type="number"
                placeholder={tc('enterFieldOptional', { field: t('minimumStock') })}
                value={formMinStock}
                onChange={(e) => setFormMinStock(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              {tc('cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? tc('saving')
                : editingProduct
                  ? tc('updateEntity', { entity: t('entity') })
                  : tc('createEntity', { entity: t('entity') })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={tc('deleteEntity', { entity: t('entity') })}
        description={tc('confirmDelete', { name: deletingProduct?.name ?? '' })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={tc('delete')}
      />
    </div>
  );
}
