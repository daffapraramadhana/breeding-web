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
import { Breeder } from "@/types/api";

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

export default function BreedersPage() {
  const t = useTranslations('breeders');
  const tc = useTranslations('common');

  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch breeders
  const { data: breeders, meta, isLoading, refetch } = usePaginated<Breeder>(
    "/breeders",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBreeder, setEditingBreeder] = useState<Breeder | null>(null);
  const [formName, setFormName] = useState("");
  const [formCardTypeId, setFormCardTypeId] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingBreeder, setDeletingBreeder] = useState<Breeder | null>(null);

  // Table columns
  const columns: Column<Breeder>[] = [
    {
      header: tc('name'),
      accessorKey: "name",
    },
    {
      header: t('cardType'),
      cell: (row) => row.cardType?.name || "-",
    },
    {
      header: tc('phone'),
      cell: (row) => row.phone || "-",
    },
    {
      header: tc('address'),
      cell: (row) => row.address || "-",
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
    setEditingBreeder(null);
    setFormName("");
    setFormCardTypeId("");
    setFormPhone("");
    setFormAddress("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(breeder: Breeder) {
    setEditingBreeder(breeder);
    setFormName(breeder.name);
    setFormCardTypeId(breeder.cardTypeId || "");
    setFormPhone(breeder.phone || "");
    setFormAddress(breeder.address || "");
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(breeder: Breeder) {
    setDeletingBreeder(breeder);
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
        ...(formCardTypeId.trim() && { cardTypeId: formCardTypeId.trim() }),
        ...(formPhone.trim() && { phone: formPhone.trim() }),
        ...(formAddress.trim() && { address: formAddress.trim() }),
      };

      if (editingBreeder) {
        await fetchApi(`/breeders/${editingBreeder.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success(tc('entityUpdated', { entity: t('entity') }));
      } else {
        await fetchApi("/breeders", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success(tc('entityCreated', { entity: t('entity') }));
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingBreeder ? tc('entityUpdateFailed', { entity: t('entity') }) : tc('entityCreateFailed', { entity: t('entity') })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingBreeder) return;

    try {
      await fetchApi(`/breeders/${deletingBreeder.id}`, {
        method: "DELETE",
      });
      toast.success(tc('entityDeleted', { entity: t('entity') }));
      setDeleteDialogOpen(false);
      setDeletingBreeder(null);
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
        data={breeders}
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
              {editingBreeder ? tc('editEntity', { entity: t('entity') }) : tc('newEntity', { entity: t('entity') })}
            </DialogTitle>
            <DialogDescription>
              {editingBreeder
                ? tc('updateDetails', { entity: t('entity') })
                : tc('fillDetailsAlt', { entity: t('entity') })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="breeder-name">{tc('name')}</Label>
              <Input
                id="breeder-name"
                placeholder={tc('enterField', { field: tc('name') })}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('cardType')}</Label>
              <EntityCombobox
                endpoint="/breeder-card-types"
                value={formCardTypeId}
                onChange={setFormCardTypeId}
                placeholder={tc('selectField', { field: t('cardType') })}
                searchPlaceholder={tc('searchField', { field: t('cardTypes') })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breeder-phone">{tc('phone')}</Label>
              <Input
                id="breeder-phone"
                placeholder={tc('enterFieldOptional', { field: tc('phone') })}
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breeder-address">{tc('address')}</Label>
              <Input
                id="breeder-address"
                placeholder={tc('enterFieldOptional', { field: tc('address') })}
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
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
                : editingBreeder
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
        description={tc('confirmDelete', { name: deletingBreeder?.name ?? '' })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={tc('delete')}
      />
    </div>
  );
}
