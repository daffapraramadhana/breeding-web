"use client";

import { useState } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { useTranslations } from "next-intl";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Coop, CoopStatus } from "@/types/api";
import { FarmCombobox } from "@/components/forms/farm-combobox";
import { BranchCombobox } from "@/components/forms/branch-combobox";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CoopsPage() {
  const t = useTranslations('coops');
  const tc = useTranslations('common');

  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch coops
  const { data: coops, meta, isLoading, refetch } = usePaginated<Coop>(
    "/coops",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoop, setEditingCoop] = useState<Coop | null>(null);
  const [formFarmId, setFormFarmId] = useState("");
  const [formBranchId, setFormBranchId] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formCapacity, setFormCapacity] = useState("");
  const [formStatus, setFormStatus] = useState<CoopStatus>("ACTIVE");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCoop, setDeletingCoop] = useState<Coop | null>(null);

  // Table columns
  const columns: Column<Coop>[] = [
    {
      header: tc('code'),
      accessorKey: "code",
      className: "w-[120px]",
    },
    {
      header: tc('name'),
      accessorKey: "name",
    },
    {
      header: t('farm'),
      cell: (row) => row.farm?.name || "-",
    },
    {
      header: t('capacity'),
      cell: (row) => row.capacity?.toLocaleString() || "-",
      className: "w-[100px]",
    },
    {
      header: tc('status'),
      cell: (row) => <StatusBadge status={row.status} />,
      className: "w-[120px]",
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
    setEditingCoop(null);
    setFormFarmId("");
    setFormBranchId("");
    setFormCode("");
    setFormName("");
    setFormCapacity("");
    setFormStatus("ACTIVE");
    setFormDescription("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(coop: Coop) {
    setEditingCoop(coop);
    setFormFarmId(coop.farmId || "");
    setFormBranchId(coop.branchId || "");
    setFormCode(coop.code);
    setFormName(coop.name);
    setFormCapacity(String(coop.capacity || ""));
    setFormStatus(coop.status || "ACTIVE");
    setFormDescription(coop.description || "");
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(coop: Coop) {
    setDeletingCoop(coop);
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

    if (!formFarmId) {
      toast.error(tc('required', { field: t('farm') }));
      return;
    }

    if (!formBranchId) {
      toast.error(tc('required', { field: t('branch') }));
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        farmId: formFarmId,
        branchId: formBranchId,
        code: formCode.trim(),
        name: formName.trim(),
        capacity: Number(formCapacity) || 0,
        status: formStatus,
        ...(formDescription.trim() && { description: formDescription.trim() }),
      };

      if (editingCoop) {
        await fetchApi(`/coops/${editingCoop.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success(tc('entityUpdated', { entity: t('entity') }));
      } else {
        await fetchApi("/coops", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success(tc('entityCreated', { entity: t('entity') }));
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingCoop ? tc('entityUpdateFailed', { entity: t('entity') }) : tc('entityCreateFailed', { entity: t('entity') })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingCoop) return;

    try {
      await fetchApi(`/coops/${deletingCoop.id}`, {
        method: "DELETE",
      });
      toast.success(tc('entityDeleted', { entity: t('entity') }));
      setDeleteDialogOpen(false);
      setDeletingCoop(null);
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
        data={coops}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder={tc('search')}
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle={tc('noResults')}
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
              {editingCoop ? tc('editEntity', { entity: t('entity') }) : tc('newEntity', { entity: t('entity') })}
            </DialogTitle>
            <DialogDescription>
              {editingCoop
                ? tc('updateDetails', { entity: t('entity') })
                : tc('fillDetails', { entity: t('entity') })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coop-branch">{t('branch')}</Label>
              <BranchCombobox
                value={formBranchId}
                onChange={setFormBranchId}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coop-farm">{t('farm')}</Label>
              <FarmCombobox
                value={formFarmId}
                onChange={setFormFarmId}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coop-code">{tc('code')}</Label>
              <Input
                id="coop-code"
                placeholder={tc('enterField', { field: tc('code') })}
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coop-name">{tc('name')}</Label>
              <Input
                id="coop-name"
                placeholder={tc('enterField', { field: tc('name') })}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coop-capacity">{t('capacity')}</Label>
              <Input
                id="coop-capacity"
                type="number"
                placeholder={tc('enterField', { field: t('capacity') })}
                value={formCapacity}
                onChange={(e) => setFormCapacity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coop-status">{tc('status')}</Label>
              <Select
                value={formStatus}
                onValueChange={(val) => setFormStatus(val as CoopStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tc('selectField', { field: tc('status') })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">{tc('active')}</SelectItem>
                  <SelectItem value="INACTIVE">{tc('inactive')}</SelectItem>
                  <SelectItem value="MAINTENANCE">{t('maintenance')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coop-description">{tc('description')}</Label>
              <Textarea
                id="coop-description"
                placeholder={tc('enterFieldOptional', { field: tc('description') })}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
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
                : editingCoop
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
        description={tc('confirmDelete', { name: deletingCoop?.name || '' })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={tc('delete')}
      />
    </div>
  );
}
