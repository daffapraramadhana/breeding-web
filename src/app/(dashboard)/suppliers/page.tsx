"use client";

import { useState, useEffect } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi, fetchPaginated } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { ProductCategory, Supplier } from "@/types/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SuppliersPage() {
  const t = useTranslations('suppliers');
  const tc = useTranslations('common');

  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch suppliers
  const { data: suppliers, meta, isLoading, refetch } = usePaginated<Supplier>(
    "/suppliers",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCategoryIds, setFormCategoryIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    if (!dialogOpen) return;
    fetchPaginated<ProductCategory>("/product-categories", { limit: 100 })
      .then((res) => setCategories(res.data))
      .catch(() => setCategories([]));
  }, [dialogOpen]);

  function toggleCategory(id: string, checked: boolean) {
    setFormCategoryIds((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((c) => c !== id)
    );
  }

  // Table columns
  const columns: Column<Supplier>[] = [
    {
      header: t('code'),
      cell: (row) => <span className="font-mono text-xs">{row.code}</span>,
      className: "w-[120px]",
    },
    {
      header: tc('name'),
      accessorKey: "name",
    },
    {
      header: t('categories'),
      cell: (row) =>
        row.categories && row.categories.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.categories.map((c) => (
              <Badge key={c.categoryId} variant={c.category.isExpedition ? "default" : "secondary"}>
                {c.category.name}
              </Badge>
            ))}
          </div>
        ) : (
          "-"
        ),
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
    setEditingSupplier(null);
    setFormCode("");
    setFormName("");
    setFormAddress("");
    setFormCategoryIds([]);
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(supplier: Supplier) {
    setEditingSupplier(supplier);
    setFormCode(supplier.code);
    setFormName(supplier.name);
    setFormAddress(supplier.address || "");
    setFormCategoryIds((supplier.categories ?? []).map((c) => c.categoryId));
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(supplier: Supplier) {
    setDeletingSupplier(supplier);
    setDeleteDialogOpen(true);
  }

  // Submit create/edit
  async function handleSubmit() {
    if (!formCode.trim()) {
      toast.error(tc('required', { field: t('code') }));
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
        ...(formAddress.trim() && { address: formAddress.trim() }),
        categoryIds: formCategoryIds,
      };

      if (editingSupplier) {
        await fetchApi(`/suppliers/${editingSupplier.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success(tc('entityUpdated', { entity: t('entity') }));
      } else {
        await fetchApi("/suppliers", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success(tc('entityCreated', { entity: t('entity') }));
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : editingSupplier
            ? tc('entityUpdateFailed', { entity: t('entity') })
            : tc('entityCreateFailed', { entity: t('entity') })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingSupplier) return;

    try {
      await fetchApi(`/suppliers/${deletingSupplier.id}`, {
        method: "DELETE",
      });
      toast.success(tc('entityDeleted', { entity: t('entity') }));
      setDeleteDialogOpen(false);
      setDeletingSupplier(null);
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
        data={suppliers}
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
        emptyDescription={tc('getStartedAlt', { entity: t('entity') })}
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
              {editingSupplier ? tc('editEntity', { entity: t('entity') }) : tc('newEntity', { entity: t('entity') })}
            </DialogTitle>
            <DialogDescription>
              {editingSupplier
                ? tc('updateDetails', { entity: t('entity') })
                : tc('fillDetailsAlt', { entity: t('entity') })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-code">{t('code')}</Label>
              <Input
                id="supplier-code"
                placeholder={tc('enterField', { field: t('code') })}
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-name">{tc('name')}</Label>
              <Input
                id="supplier-name"
                placeholder={tc('enterField', { field: tc('name') })}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-address">{tc('address')}</Label>
              <Input
                id="supplier-address"
                placeholder={tc('enterFieldOptional', { field: tc('address') })}
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('categories')}</Label>
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noCategories')}</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`supplier-cat-${cat.id}`}
                        checked={formCategoryIds.includes(cat.id)}
                        onCheckedChange={(v) => toggleCategory(cat.id, v === true)}
                      />
                      <Label htmlFor={`supplier-cat-${cat.id}`} className="font-normal">
                        {cat.name}
                        {cat.isExpedition && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({tc('expedition')})
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
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
                : editingSupplier
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
        description={tc('confirmDelete', { name: deletingSupplier?.name ?? '' })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={tc('delete')}
      />
    </div>
  );
}
