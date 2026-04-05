"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Farm, FarmStatus } from "@/types/api";
import { BranchCombobox } from "@/components/forms/branch-combobox";
import { CreateFarmWizard } from "@/components/farms/create-farm-wizard";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function FarmsPage() {
  const t = useTranslations('farms');
  const tc = useTranslations('common');
  const router = useRouter();

  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch farms
  const { data: farms, meta, isLoading, refetch } = usePaginated<Farm>(
    "/farms",
    { page, limit: 10, search }
  );

  // Wizard state (create)
  const [wizardOpen, setWizardOpen] = useState(false);

  // Dialog state (edit only)
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formBranchId, setFormBranchId] = useState("");
  const [formFarmType, setFormFarmType] = useState("");
  const [formStatus, setFormStatus] = useState<FarmStatus | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFarm, setDeletingFarm] = useState<Farm | null>(null);

  // Table columns
  const columns: Column<Farm>[] = [
    {
      header: tc('name'),
      accessorKey: "name",
    },
    {
      header: t('branch'),
      cell: (row) => row.branch?.name || "-",
    },
    {
      header: tc('address'),
      accessorKey: "address",
    },
    {
      header: t('farmType'),
      cell: (row) => row.farmType || "-",
    },
    {
      header: tc('status'),
      cell: (row) =>
        row.status ? <StatusBadge status={row.status} /> : "-",
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

  // Open create wizard
  function handleCreate() {
    setWizardOpen(true);
  }

  // Open edit dialog
  function handleEdit(farm: Farm) {
    setEditingFarm(farm);
    setFormName(farm.name);
    setFormAddress(farm.address || "");
    setFormBranchId(farm.branchId || "");
    setFormFarmType(farm.farmType || "");
    setFormStatus(farm.status || "");
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(farm: Farm) {
    setDeletingFarm(farm);
    setDeleteDialogOpen(true);
  }

  // Submit create/edit
  async function handleSubmit() {
    if (!formName.trim()) {
      toast.error(tc('required', { field: tc('name') }));
      return;
    }

    if (!formBranchId) {
      toast.error(tc('required', { field: t('branch') }));
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        name: formName.trim(),
        branchId: formBranchId,
        ...(formAddress.trim() && { address: formAddress.trim() }),
        ...(formFarmType.trim() && { farmType: formFarmType.trim() }),
        ...(formStatus && { status: formStatus }),
      };

      if (editingFarm) {
        await fetchApi(`/farms/${editingFarm.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success(tc('entityUpdated', { entity: t('entity') }));
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingFarm ? tc('entityUpdateFailed', { entity: t('entity') }) : tc('entityCreateFailed', { entity: t('entity') })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingFarm) return;

    try {
      await fetchApi(`/farms/${deletingFarm.id}`, {
        method: "DELETE",
      });
      toast.success(tc('entityDeleted', { entity: t('entity') }));
      setDeleteDialogOpen(false);
      setDeletingFarm(null);
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
        data={farms}
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
        onRowClick={(farm) => router.push(`/farms/${farm.id}`)}
        emptyTitle={tc('noResults')}
        emptyDescription={tc('getStarted', { entity: t('entity') })}
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {tc('newEntity', { entity: t('entity') })}
          </Button>
        }
      />

      {/* Create Wizard */}
      <CreateFarmWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSuccess={refetch}
      />

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tc('editEntity', { entity: t('entity') })}</DialogTitle>
            <DialogDescription>{tc('updateDetails', { entity: t('entity') })}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="farm-branch">{t('branch')}</Label>
              <BranchCombobox
                value={formBranchId}
                onChange={setFormBranchId}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm-name">{tc('name')}</Label>
              <Input
                id="farm-name"
                placeholder={tc('enterField', { field: tc('name') })}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm-address">{tc('address')}</Label>
              <Input
                id="farm-address"
                placeholder={tc('enterFieldOptional', { field: tc('address') })}
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm-type">{t('farmType')}</Label>
              <Input
                id="farm-type"
                placeholder={tc('enterFieldOptional', { field: t('farmType') })}
                value={formFarmType}
                onChange={(e) => setFormFarmType(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm-status">{tc('status')}</Label>
              <Select
                value={formStatus}
                onValueChange={(val) => setFormStatus(val as FarmStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tc('selectField', { field: tc('status') })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWN">{t('statusOwn')}</SelectItem>
                  <SelectItem value="COOP">{t('statusCoop')}</SelectItem>
                </SelectContent>
              </Select>
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
              {isSubmitting ? tc('saving') : tc('updateEntity', { entity: t('entity') })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={tc('deleteEntity', { entity: t('entity') })}
        description={tc('confirmDelete', { name: deletingFarm?.name || '' })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={tc('delete')}
      />
    </div>
  );
}
