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
import { BranchCombobox } from "@/components/forms/branch-combobox";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Employee, EmployeeStatus } from "@/types/api";

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

export default function EmployeesPage() {
  const t = useTranslations('employees');
  const tc = useTranslations('common');

  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch employees
  const { data: employees, meta, isLoading, refetch } = usePaginated<Employee>(
    "/employees",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmployeeNumber, setFormEmployeeNumber] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPosition, setFormPosition] = useState("");
  const [formStatus, setFormStatus] = useState<EmployeeStatus>("ACTIVE");
  const [formBranchId, setFormBranchId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  // Table columns
  const columns: Column<Employee>[] = [
    {
      header: tc('name'),
      accessorKey: "name",
    },
    {
      header: t('employeeNumber'),
      cell: (row) => row.employeeNumber || "-",
    },
    {
      header: t('position'),
      cell: (row) => row.position || "-",
    },
    {
      header: tc('status'),
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: t('branch'),
      cell: (row) => row.branch?.name || "-",
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
    setEditingEmployee(null);
    setFormName("");
    setFormEmployeeNumber("");
    setFormPhone("");
    setFormPosition("");
    setFormStatus("ACTIVE");
    setFormBranchId("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(employee: Employee) {
    setEditingEmployee(employee);
    setFormName(employee.name);
    setFormEmployeeNumber(employee.employeeNumber || "");
    setFormPhone(employee.phone || "");
    setFormPosition(employee.position || "");
    setFormStatus(employee.status);
    setFormBranchId(employee.branchId || "");
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(employee: Employee) {
    setDeletingEmployee(employee);
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
        status: formStatus,
        ...(formEmployeeNumber.trim() && { employeeNumber: formEmployeeNumber.trim() }),
        ...(formPhone.trim() && { phone: formPhone.trim() }),
        ...(formPosition.trim() && { position: formPosition.trim() }),
        ...(formBranchId.trim() && { branchId: formBranchId.trim() }),
      };

      if (editingEmployee) {
        await fetchApi(`/employees/${editingEmployee.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success(tc('entityUpdated', { entity: t('entity') }));
      } else {
        await fetchApi("/employees", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success(tc('entityCreated', { entity: t('entity') }));
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingEmployee ? tc('entityUpdateFailed', { entity: t('entity') }) : tc('entityCreateFailed', { entity: t('entity') })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingEmployee) return;

    try {
      await fetchApi(`/employees/${deletingEmployee.id}`, {
        method: "DELETE",
      });
      toast.success(tc('entityDeleted', { entity: t('entity') }));
      setDeleteDialogOpen(false);
      setDeletingEmployee(null);
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
        data={employees}
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
              {editingEmployee ? tc('editEntity', { entity: t('entity') }) : tc('newEntity', { entity: t('entity') })}
            </DialogTitle>
            <DialogDescription>
              {editingEmployee
                ? tc('updateDetails', { entity: t('entity') })
                : tc('fillDetailsAlt', { entity: t('entity') })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee-name">{tc('name')}</Label>
              <Input
                id="employee-name"
                placeholder={tc('enterField', { field: tc('name') })}
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-number">{t('employeeNumber')}</Label>
              <Input
                id="employee-number"
                placeholder={tc('enterFieldOptional', { field: t('employeeNumber') })}
                value={formEmployeeNumber}
                onChange={(e) => setFormEmployeeNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-phone">{tc('phone')}</Label>
              <Input
                id="employee-phone"
                placeholder={tc('enterFieldOptional', { field: tc('phone') })}
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-position">{t('position')}</Label>
              <Input
                id="employee-position"
                placeholder={tc('enterFieldOptional', { field: t('position') })}
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-status">{tc('status')}</Label>
              <Select
                value={formStatus}
                onValueChange={(value) => setFormStatus(value as EmployeeStatus)}
              >
                <SelectTrigger id="employee-status">
                  <SelectValue placeholder={tc('selectField', { field: tc('status') })} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">{tc('active')}</SelectItem>
                  <SelectItem value="INACTIVE">{tc('inactive')}</SelectItem>
                  <SelectItem value="ON_LEAVE">{t('onLeave')}</SelectItem>
                  <SelectItem value="TERMINATED">{t('terminated')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('branch')}</Label>
              <BranchCombobox
                value={formBranchId}
                onChange={setFormBranchId}
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
                : editingEmployee
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
        description={tc('confirmDelete', { name: deletingEmployee?.name ?? '' })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={tc('delete')}
      />
    </div>
  );
}
