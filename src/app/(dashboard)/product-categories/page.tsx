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
  const t = useTranslations('productCategories');
  const tc = useTranslations('common');

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
      header: tc('name'),
      accessorKey: "name",
    },
    {
      header: t('purchasePurpose'),
      cell: (row) => row.purchasePurpose || "-",
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
      toast.error(tc('required', { field: tc('name') }));
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
        toast.success(tc('entityUpdated', { entity: t('entity') }));
      } else {
        await fetchApi("/product-categories", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success(tc('entityCreated', { entity: t('entity') }));
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingCategory ? tc('entityUpdateFailed', { entity: t('entity') }) : tc('entityCreateFailed', { entity: t('entity') })
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
      toast.success(tc('entityDeleted', { entity: t('entity') }));
      setDeleteDialogOpen(false);
      setDeletingCategory(null);
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
        data={categories}
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
              {editingCategory ? tc('editEntity', { entity: t('entity') }) : tc('newEntity', { entity: t('entity') })}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? tc('updateDetails', { entity: t('entity') })
                : tc('fillDetails', { entity: t('entity') })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">{tc('name')}</Label>
              <Input
                id="category-name"
                placeholder={tc('enterField', { field: tc('name') })}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-purchase-purpose">{t('purchasePurpose')}</Label>
              <Input
                id="category-purchase-purpose"
                placeholder={tc('enterFieldOptional', { field: t('purchasePurpose') })}
                value={formPurchasePurpose}
                onChange={(e) => setFormPurchasePurpose(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-overhead">{t('overheadCategory')}</Label>
              <Input
                id="category-overhead"
                placeholder={tc('enterFieldOptional', { field: t('overheadCategory') })}
                value={formOverheadCategory}
                onChange={(e) => setFormOverheadCategory(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-price-type">{t('priceType')}</Label>
              <Input
                id="category-price-type"
                placeholder={tc('enterFieldOptional', { field: t('priceType') })}
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
              {tc('cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? tc('saving')
                : editingCategory
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
        description={tc('confirmDelete', { name: deletingCategory?.name ?? '' })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={tc('delete')}
      />
    </div>
  );
}
