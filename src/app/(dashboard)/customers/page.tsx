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
import { Branch, Customer } from "@/types/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { BranchCombobox } from "@/components/forms/branch-combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CustomersPage() {
  const t = useTranslations('customers');
  const tc = useTranslations('common');

  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch customers
  const { data: customers, meta, isLoading, refetch } = usePaginated<Customer>(
    "/customers",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formRegistrationBranchId, setFormRegistrationBranchId] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formIdCardNumber, setFormIdCardNumber] = useState("");
  const [formTaxNumber, setFormTaxNumber] = useState("");
  const [formVehiclePlate, setFormVehiclePlate] = useState("");
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCreditLimitEnabled, setFormCreditLimitEnabled] = useState(false);
  const [formCreditLimit, setFormCreditLimit] = useState("");
  const [formTopDays, setFormTopDays] = useState("");
  const [formSavingsPerKg, setFormSavingsPerKg] = useState("");
  const [formInstallmentPerKg, setFormInstallmentPerKg] = useState("");
  const [formOperatingBranchIds, setFormOperatingBranchIds] = useState<string[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!dialogOpen) return;
    fetchPaginated<Branch>("/branches", { limit: 100 })
      .then((res) => setBranches(res.data))
      .catch(() => setBranches([]));
  }, [dialogOpen]);

  function toggleBranch(id: string, checked: boolean) {
    setFormOperatingBranchIds((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((b) => b !== id)
    );
  }

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  // Table columns
  const columns: Column<Customer>[] = [
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
      header: t('registrationBranch'),
      cell: (row) => row.registrationBranch?.name || "-",
    },
    {
      header: t('operatingBranches'),
      cell: (row) =>
        row.operatingBranches && row.operatingBranches.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.operatingBranches.map((b) => (
              <Badge key={b.branchId} variant="secondary">{b.branch.name}</Badge>
            ))}
          </div>
        ) : (
          "-"
        ),
    },
    {
      header: t('contactPerson'),
      cell: (row) => row.contactPerson || "-",
    },
    {
      header: tc('phone'),
      cell: (row) => row.phone || "-",
    },
    {
      header: t('creditLimit'),
      cell: (row) =>
        row.creditLimitEnabled && row.creditLimit
          ? Number(row.creditLimit).toLocaleString()
          : "-",
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
    setEditingCustomer(null);
    setFormCode(""); setFormName(""); setFormRegistrationBranchId("");
    setFormAddress(""); setFormCity("");
    setFormIdCardNumber(""); setFormTaxNumber(""); setFormVehiclePlate("");
    setFormContactPerson(""); setFormPhone(""); setFormEmail("");
    setFormCreditLimitEnabled(false); setFormCreditLimit("");
    setFormTopDays(""); setFormSavingsPerKg(""); setFormInstallmentPerKg("");
    setFormOperatingBranchIds([]);
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(customer: Customer) {
    setEditingCustomer(customer);
    setFormCode(customer.code ?? "");
    setFormName(customer.name);
    setFormRegistrationBranchId(customer.registrationBranchId ?? "");
    setFormAddress(customer.address ?? "");
    setFormCity(customer.city ?? "");
    setFormIdCardNumber(customer.idCardNumber ?? "");
    setFormTaxNumber(customer.taxNumber ?? "");
    setFormVehiclePlate(customer.vehiclePlate ?? "");
    setFormContactPerson(customer.contactPerson ?? "");
    setFormPhone(customer.phone ?? "");
    setFormEmail(customer.email ?? "");
    setFormCreditLimitEnabled(customer.creditLimitEnabled ?? false);
    setFormCreditLimit(customer.creditLimit ?? "");
    setFormTopDays(customer.topDays != null ? String(customer.topDays) : "");
    setFormSavingsPerKg(customer.savingsPerKg ?? "");
    setFormInstallmentPerKg(customer.installmentPerKg ?? "");
    setFormOperatingBranchIds((customer.operatingBranches ?? []).map((b) => b.branchId));
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(customer: Customer) {
    setDeletingCustomer(customer);
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
        ...(formCode.trim() && { code: formCode.trim() }),
        ...(formRegistrationBranchId && { registrationBranchId: formRegistrationBranchId }),
        ...(formAddress.trim() && { address: formAddress.trim() }),
        ...(formCity.trim() && { city: formCity.trim() }),
        ...(formIdCardNumber.trim() && { idCardNumber: formIdCardNumber.trim() }),
        ...(formTaxNumber.trim() && { taxNumber: formTaxNumber.trim() }),
        ...(formVehiclePlate.trim() && { vehiclePlate: formVehiclePlate.trim() }),
        ...(formContactPerson.trim() && { contactPerson: formContactPerson.trim() }),
        ...(formPhone.trim() && { phone: formPhone.trim() }),
        ...(formEmail.trim() && { email: formEmail.trim() }),
        creditLimitEnabled: formCreditLimitEnabled,
        ...(formCreditLimit.trim() && { creditLimit: formCreditLimit.trim() }),
        ...(formTopDays.trim() && { topDays: Number(formTopDays) }),
        ...(formSavingsPerKg.trim() && { savingsPerKg: Number(formSavingsPerKg) }),
        ...(formInstallmentPerKg.trim() && { installmentPerKg: Number(formInstallmentPerKg) }),
        operatingBranchIds: formOperatingBranchIds,
      };

      if (editingCustomer) {
        await fetchApi(`/customers/${editingCustomer.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success(tc('entityUpdated', { entity: t('entity') }));
      } else {
        await fetchApi("/customers", {
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
          : editingCustomer
            ? tc('entityUpdateFailed', { entity: t('entity') })
            : tc('entityCreateFailed', { entity: t('entity') })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingCustomer) return;

    try {
      await fetchApi(`/customers/${deletingCustomer.id}`, {
        method: "DELETE",
      });
      toast.success(tc('entityDeleted', { entity: t('entity') }));
      setDeleteDialogOpen(false);
      setDeletingCustomer(null);
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
        data={customers}
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? tc('editEntity', { entity: t('entity') }) : tc('newEntity', { entity: t('entity') })}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? tc('updateDetails', { entity: t('entity') })
                : tc('fillDetailsAlt', { entity: t('entity') })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">{t('groupIdentity')}</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer-code">{t('code')}</Label>
                  <Input id="customer-code" placeholder={tc('enterFieldOptional', { field: t('code') })}
                    value={formCode} onChange={(e) => setFormCode(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-name">{tc('name')}</Label>
                  <Input id="customer-name" placeholder={tc('enterField', { field: tc('name') })}
                    value={formName} onChange={(e) => setFormName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('registrationBranch')}</Label>
                  <BranchCombobox value={formRegistrationBranchId} onChange={setFormRegistrationBranchId} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-city">{t('city')}</Label>
                  <Input id="customer-city" placeholder={tc('enterFieldOptional', { field: t('city') })}
                    value={formCity} onChange={(e) => setFormCity(e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="customer-address">{tc('address')}</Label>
                  <Input id="customer-address" placeholder={tc('enterFieldOptional', { field: tc('address') })}
                    value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">{t('groupDocuments')}</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="customer-ktp">{t('idCardNumber')}</Label>
                  <Input id="customer-ktp" value={formIdCardNumber} onChange={(e) => setFormIdCardNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-npwp">{t('taxNumber')}</Label>
                  <Input id="customer-npwp" value={formTaxNumber} onChange={(e) => setFormTaxNumber(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-plate">{t('vehiclePlate')}</Label>
                  <Input id="customer-plate" value={formVehiclePlate} onChange={(e) => setFormVehiclePlate(e.target.value)} />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">{t('groupContact')}</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="customer-contact">{t('contactPerson')}</Label>
                  <Input id="customer-contact" value={formContactPerson} onChange={(e) => setFormContactPerson(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-phone">{tc('phone')}</Label>
                  <Input id="customer-phone" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-email">{tc('email')}</Label>
                  <Input id="customer-email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">{t('groupTerms')}</h4>
              <div className="flex items-center gap-2">
                <Checkbox id="customer-plafon" checked={formCreditLimitEnabled}
                  onCheckedChange={(v) => setFormCreditLimitEnabled(v === true)} />
                <Label htmlFor="customer-plafon" className="font-normal">{t('creditLimitEnabled')}</Label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer-credit-limit">{t('creditLimit')}</Label>
                  <Input id="customer-credit-limit" type="number" min={0} disabled={!formCreditLimitEnabled}
                    value={formCreditLimit} onChange={(e) => setFormCreditLimit(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-top">{t('topDays')}</Label>
                  <Input id="customer-top" type="number" min={0}
                    value={formTopDays} onChange={(e) => setFormTopDays(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-savings">{t('savingsPerKg')}</Label>
                  <Input id="customer-savings" type="number" min={0}
                    value={formSavingsPerKg} onChange={(e) => setFormSavingsPerKg(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer-installment">{t('installmentPerKg')}</Label>
                  <Input id="customer-installment" type="number" min={0}
                    value={formInstallmentPerKg} onChange={(e) => setFormInstallmentPerKg(e.target.value)} />
                  <p className="text-xs text-muted-foreground">{t('installmentHint')}</p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">{t('groupOperations')}</h4>
              <Label>{t('operatingBranches')}</Label>
              {branches.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('noBranches')}</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 rounded-md border p-3">
                  {branches.map((b) => (
                    <div key={b.id} className="flex items-center gap-2">
                      <Checkbox id={`customer-branch-${b.id}`}
                        checked={formOperatingBranchIds.includes(b.id)}
                        onCheckedChange={(v) => toggleBranch(b.id, v === true)} />
                      <Label htmlFor={`customer-branch-${b.id}`} className="font-normal">{b.name}</Label>
                    </div>
                  ))}
                </div>
              )}
            </section>
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
                : editingCustomer
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
        description={tc('confirmDelete', { name: deletingCustomer?.name ?? '' })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={tc('delete')}
      />
    </div>
  );
}
