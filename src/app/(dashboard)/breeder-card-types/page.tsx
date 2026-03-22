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
import { BreederCardType } from "@/types/api";

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

export default function BreederCardTypesPage() {
  const t = useTranslations('breederCardTypes');
  const tc = useTranslations('common');

  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch breeder card types
  const { data: cardTypes, meta, isLoading, refetch } = usePaginated<BreederCardType>(
    "/breeder-card-types",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCardType, setEditingCardType] = useState<BreederCardType | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCardType, setDeletingCardType] = useState<BreederCardType | null>(null);

  // Table columns
  const columns: Column<BreederCardType>[] = [
    {
      header: tc('name'),
      accessorKey: "name",
    },
    {
      header: tc('description'),
      cell: (row) => row.description || "-",
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
    setEditingCardType(null);
    setFormName("");
    setFormDescription("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(cardType: BreederCardType) {
    setEditingCardType(cardType);
    setFormName(cardType.name);
    setFormDescription(cardType.description || "");
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(cardType: BreederCardType) {
    setDeletingCardType(cardType);
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
        ...(formDescription.trim() && { description: formDescription.trim() }),
      };

      if (editingCardType) {
        await fetchApi(`/breeder-card-types/${editingCardType.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success(tc('entityUpdated', { entity: t('entity') }));
      } else {
        await fetchApi("/breeder-card-types", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success(tc('entityCreated', { entity: t('entity') }));
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingCardType ? tc('entityUpdateFailed', { entity: t('entity') }) : tc('entityCreateFailed', { entity: t('entity') })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingCardType) return;

    try {
      await fetchApi(`/breeder-card-types/${deletingCardType.id}`, {
        method: "DELETE",
      });
      toast.success(tc('entityDeleted', { entity: t('entity') }));
      setDeleteDialogOpen(false);
      setDeletingCardType(null);
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
        data={cardTypes}
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
              {editingCardType ? tc('editEntity', { entity: t('entity') }) : tc('newEntity', { entity: t('entity') })}
            </DialogTitle>
            <DialogDescription>
              {editingCardType
                ? tc('updateDetails', { entity: t('entity') })
                : tc('fillDetailsAlt', { entity: t('entity') })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-type-name">{tc('name')}</Label>
              <Input
                id="card-type-name"
                placeholder={tc('enterField', { field: tc('name') })}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-type-description">{tc('description')}</Label>
              <Input
                id="card-type-description"
                placeholder={tc('enterFieldOptional', { field: tc('description') })}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
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
                : editingCardType
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
        description={tc('confirmDelete', { name: deletingCardType?.name ?? '' })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={tc('delete')}
      />
    </div>
  );
}
