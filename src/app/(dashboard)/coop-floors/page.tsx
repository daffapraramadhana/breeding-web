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
import { CoopFloor } from "@/types/api";
import { CoopCombobox } from "@/components/forms/coop-combobox";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CoopFloorsPage() {
  const t = useTranslations('coopFloors');
  const tc = useTranslations('common');

  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch coop bloks
  const { data: coopFloors, meta, isLoading, refetch } = usePaginated<CoopFloor>(
    "/coop-floors",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<CoopFloor | null>(null);
  const [formCoopId, setFormCoopId] = useState("");
  const [formFarmId, setFormFarmId] = useState("");
  const [formBranchId, setFormBranchId] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPopulation, setFormPopulation] = useState("");
  const [formArea, setFormArea] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFloor, setDeletingFloor] = useState<CoopFloor | null>(null);

  // Table columns
  const columns: Column<CoopFloor>[] = [
    {
      header: t('coop'),
      cell: (row) =>
        row.coop ? `${row.coop.code} - ${row.coop.name}` : "-",
    },
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
      header: t('area'),
      cell: (row) => row.area?.toLocaleString() || "-",
      className: "w-[100px]",
    },
    {
      header: t('populationPerSqm'),
      cell: (row) => row.population?.toLocaleString() || "-",
      className: "w-[110px]",
    },
    {
      header: t('maxPopulation'),
      cell: (row) => row.maxPopulation?.toLocaleString() || "-",
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
    setEditingFloor(null);
    setFormCoopId("");
    setFormFarmId("");
    setFormBranchId("");
    setFormCode("");
    setFormName("");
    setFormDescription("");
    setFormPopulation("");
    setFormArea("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(floor: CoopFloor) {
    setEditingFloor(floor);
    setFormCoopId(floor.coopId || "");
    setFormFarmId(floor.farmId || "");
    setFormBranchId(floor.branchId || "");
    setFormCode(floor.code || "");
    setFormName(floor.name || "");
    setFormDescription(floor.description || "");
    setFormPopulation(String(floor.population || ""));
    setFormArea(String(floor.area || ""));
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(floor: CoopFloor) {
    setDeletingFloor(floor);
    setDeleteDialogOpen(true);
  }

  // Submit create/edit
  async function handleSubmit() {
    if (!formCoopId) {
      toast.error(tc('required', { field: t('coop') }));
      return;
    }

    if (!formCode.trim()) {
      toast.error(tc('required', { field: tc('code') }));
      return;
    }

    if (!formName.trim()) {
      toast.error(tc('required', { field: tc('name') }));
      return;
    }

    if (!formPopulation || Number(formPopulation) <= 0) {
      toast.error(tc('required', { field: t('populationPerSqm') }));
      return;
    }
    if (!formArea || Number(formArea) <= 0) {
      toast.error(tc('required', { field: t('area') }));
      return;
    }
    const maxPopulation = Number(formPopulation) * Number(formArea);
    if (maxPopulation <= 0) {
      toast.error(t('maxPopulationMustBePositive'));
      return;
    }

    if (!formFarmId || !formBranchId) {
      toast.error(t('selectCoopToAutofill'));
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        coopId: formCoopId,
        farmId: formFarmId,
        branchId: formBranchId,
        code: formCode.trim(),
        name: formName.trim(),
        population: Number(formPopulation),
        area: Number(formArea),
        maxPopulation: Number(formPopulation) * Number(formArea),
        ...(formDescription.trim() && { description: formDescription.trim() }),
      };

      if (editingFloor) {
        await fetchApi(`/coop-floors/${editingFloor.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success(tc('entityUpdated', { entity: t('entity') }));
      } else {
        await fetchApi("/coop-floors", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success(tc('entityCreated', { entity: t('entity') }));
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingFloor
          ? tc('entityUpdateFailed', { entity: t('entity') })
          : tc('entityCreateFailed', { entity: t('entity') })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingFloor) return;

    try {
      await fetchApi(`/coop-floors/${deletingFloor.id}`, {
        method: "DELETE",
      });
      toast.success(tc('entityDeleted', { entity: t('entity') }));
      setDeleteDialogOpen(false);
      setDeletingFloor(null);
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
        data={coopFloors}
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
              {editingFloor ? tc('editEntity', { entity: t('entity') }) : tc('newEntity', { entity: t('entity') })}
            </DialogTitle>
            <DialogDescription>
              {editingFloor
                ? tc('updateDetails', { entity: t('entity') })
                : tc('fillDetails', { entity: t('entity') })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="floor-coop">{t('coop')}</Label>
              <CoopCombobox
                value={formCoopId}
                onChange={setFormCoopId}
                onCoopSelect={(coop) => {
                  if (coop) {
                    setFormFarmId(coop.farmId);
                    setFormBranchId(coop.branchId);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor-code">{tc('code')}</Label>
              <Input
                id="floor-code"
                placeholder={tc('enterField', { field: tc('code') })}
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor-name">{tc('name')}</Label>
              <Input
                id="floor-name"
                placeholder={tc('enterField', { field: tc('name') })}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor-population">{t('populationPerSqm')}</Label>
              <Input
                id="floor-population"
                type="number"
                placeholder={tc('enterField', { field: t('populationPerSqm') })}
                value={formPopulation}
                onChange={(e) => setFormPopulation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor-area">{t('area')}</Label>
              <Input
                id="floor-area"
                type="number"
                placeholder={tc('enterField', { field: t('area') })}
                value={formArea}
                onChange={(e) => setFormArea(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('maxPopulationAuto')}</Label>
              <Input
                type="number"
                readOnly
                disabled
                value={
                  formPopulation && formArea
                    ? Number(formPopulation) * Number(formArea)
                    : ""
                }
                placeholder={t('populationTimesArea')}
                className="bg-muted text-muted-foreground"
              />
              {formPopulation && formArea && (
                <p className="text-xs text-muted-foreground">
                  {formPopulation} × {formArea} = {Number(formPopulation) * Number(formArea)} {t('heads')}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor-description">{tc('description')}</Label>
              <Textarea
                id="floor-description"
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
                : editingFloor
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
        description={tc('confirmDelete', { name: deletingFloor?.name || '' })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={tc('delete')}
      />
    </div>
  );
}
