"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SalesInvoiceCombobox } from "@/components/forms/sales-invoice-combobox";
import { usePaginated, useApi } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { fetchApi, ApiError } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { PaginatedResponse, PaymentMethod, SalesInvoice, SalesPayment } from "@/types/api";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CashAccount { id: string; name: string }
interface BankAccount { id: string; bankName: string; accountNumber: string }

const METHODS: PaymentMethod[] = ["CASH", "TRANSFER", "CHECK", "GIRO"];

/** Tunai masuk ke akun kas; sisanya masuk ke rekening bank. */
function landsInCash(method: PaymentMethod) {
  return method === "CASH";
}

export default function SalesPaymentsPage() {
  const t = useTranslations("salesPayments");
  const tc = useTranslations("common");
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const { data, meta, isLoading, refetch } = usePaginated<SalesPayment>("/sales-payments", { page, limit: 10, search });

  // Tombol yang pasti ditolak backend hanya menukar penjelasan dengan 403.
  const { user } = useAuth();
  const canVerify = ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER"].includes(user?.role ?? "");

  const { data: cashAccounts } = useApi<PaginatedResponse<CashAccount>>("/cash-accounts?limit=100");
  const { data: bankAccounts } = useApi<PaginatedResponse<BankAccount>>("/bank-accounts?limit=100");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SalesPayment | null>(null);
  const [formInvoice, setFormInvoice] = useState<SalesInvoice | null>(null);
  const [formInvoiceId, setFormInvoiceId] = useState("");
  const [formBranchId, setFormBranchId] = useState("");
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formMethod, setFormMethod] = useState<PaymentMethod>("CASH");
  const [formAmount, setFormAmount] = useState("");
  const [formPaymentDate, setFormPaymentDate] = useState("");
  const [formCashAccountId, setFormCashAccountId] = useState("");
  const [formBankAccountId, setFormBankAccountId] = useState("");
  const [formProof, setFormProof] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<SalesPayment | null>(null);
  const [rejecting, setRejecting] = useState<SalesPayment | null>(null);

  const columns: Column<SalesPayment>[] = [
    { header: t("invoice"), cell: (row) => row.salesInvoice?.invoiceNumber ?? "—" },
    { header: t("payer"), cell: (row) => row.customer?.name ?? row.breeder?.name ?? "—" },
    { header: t("amount"), cell: (row) => formatCurrency(Number(row.amount)) },
    { header: t("date"), cell: (row) => formatDate(row.paymentDate) },
    { header: t("method"), cell: (row) => row.paymentMethod ?? "—" },
    { header: tc("status"), cell: (row) => <StatusBadge status={row.status} /> },
    {
      header: tc("actions"),
      cell: (row) => (
        <div className="flex items-center gap-1">
          {canVerify && row.status === "PENDING" && (
            <Button variant="ghost" size="sm" title={t("verify")} onClick={(e) => { e.stopPropagation(); handleVerify(row); }}>
              <Check className="h-4 w-4 text-[var(--primary)]" />
            </Button>
          )}
          {canVerify && row.status !== "REJECTED" && (
            <Button variant="ghost" size="sm" title={t("reject")} onClick={(e) => { e.stopPropagation(); setRejecting(row); }}>
              <X className="h-4 w-4 text-destructive" />
            </Button>
          )}
          {row.status !== "VERIFIED" && (
            <>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleting(row); setDeleteOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </>
          )}
        </div>
      ),
      className: "w-[160px]",
    },
  ];

  function resetForm() {
    setFormInvoice(null);
    setFormInvoiceId("");
    setFormBranchId("");
    setFormCustomerId("");
    setFormMethod("CASH");
    setFormAmount("");
    setFormPaymentDate("");
    setFormCashAccountId("");
    setFormBankAccountId("");
    setFormProof("");
  }

  function handleCreate() { setEditing(null); resetForm(); setDialogOpen(true); }

  function handleEdit(p: SalesPayment) {
    setEditing(p);
    setFormInvoice(p.salesInvoice ? (p.salesInvoice as SalesInvoice) : null);
    setFormInvoiceId(p.salesInvoiceId);
    setFormBranchId(p.branchId);
    setFormCustomerId(p.customerId ?? "");
    setFormMethod(p.paymentMethod);
    setFormAmount(p.amount);
    setFormPaymentDate(p.paymentDate.slice(0, 10));
    setFormCashAccountId(p.cashAccountId ?? "");
    setFormBankAccountId(p.bankAccountId ?? "");
    setFormProof(p.proofOfPayment ?? "");
    setDialogOpen(true);
  }

  function pickInvoice(invoice: SalesInvoice | null) {
    setFormInvoice(invoice);
    setFormInvoiceId(invoice?.id ?? "");
    // Cabang dan pelanggan mengikuti fakturnya — pembayaran tidak boleh
    // mendarat di cabang lain daripada tagihannya.
    setFormBranchId(invoice?.branchId ?? "");
    setFormCustomerId(invoice?.customerId ?? "");
  }

  async function handleSubmit() {
    if (!formInvoiceId || !formAmount || !formPaymentDate) { toast.error(t("fieldsRequired")); return; }
    setIsSubmitting(true);
    try {
      const body = {
        branchId: formBranchId,
        salesInvoiceId: formInvoiceId,
        ...(formCustomerId ? { customerId: formCustomerId } : {}),
        paymentMethod: formMethod,
        paymentDate: formPaymentDate,
        amount: formAmount,
        ...(landsInCash(formMethod)
          ? formCashAccountId ? { cashAccountId: formCashAccountId } : {}
          : formBankAccountId ? { bankAccountId: formBankAccountId } : {}),
        ...(formProof ? { proofOfPayment: formProof } : {}),
      };
      if (editing) { await fetchApi(`/sales-payments/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) }); toast.success(t("paymentUpdated")); }
      else { await fetchApi("/sales-payments", { method: "POST", body: JSON.stringify(body) }); toast.success(t("paymentCreated")); }
      setDialogOpen(false); refetch();
    } catch (err) { toast.error(err instanceof ApiError ? err.message : t("saveFailed")); }
    finally { setIsSubmitting(false); }
  }

  async function handleVerify(p: SalesPayment) {
    try {
      await fetchApi(`/sales-payments/${p.id}/verify`, { method: "PATCH" });
      toast.success(t("paymentVerified"));
      refetch();
    } catch (err) { toast.error(err instanceof ApiError ? err.message : t("verifyFailed")); }
  }

  async function handleReject() {
    if (!rejecting) return;
    try {
      await fetchApi(`/sales-payments/${rejecting.id}/reject`, { method: "PATCH" });
      toast.success(t("paymentRejected"));
      setRejecting(null);
      refetch();
    } catch (err) { toast.error(err instanceof ApiError ? err.message : t("rejectFailed")); }
  }

  async function handleDelete() {
    if (!deleting) return;
    try { await fetchApi(`/sales-payments/${deleting.id}`, { method: "DELETE" }); toast.success(tc("entityDeleted", { entity: t("entity") })); setDeleteOpen(false); setDeleting(null); refetch(); }
    catch (err) { toast.error(err instanceof ApiError ? err.message : t("deleteFailed")); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} actions={<Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" />{t("newPayment")}</Button>} />
      <DataTable columns={columns} data={data} isLoading={isLoading} search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} searchPlaceholder={t("searchPlaceholder")} page={page} totalPages={meta?.totalPages || 1} onPageChange={setPage} total={meta?.total} emptyTitle={t("emptyTitle")} emptyDescription={t("emptyDescription")} />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? t("editPayment") : t("newPayment")}</DialogTitle><DialogDescription>{editing ? t("updatePaymentDesc") : t("createPaymentDesc")}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("invoice")}</Label>
              <SalesInvoiceCombobox value={formInvoiceId} onChange={pickInvoice} />
              {formInvoice && (
                <p className="text-xs text-[var(--muted-foreground)]">
                  {t("remaining")}: {formatCurrency(Number(formInvoice.remainingAmount))}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("method")}</Label>
              <Select value={formMethod} onValueChange={(v) => setFormMethod(v as PaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>{t("amount")}</Label><Input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0" /></div>
            <div className="space-y-2"><Label>{t("paymentDate")}</Label><Input type="date" value={formPaymentDate} onChange={(e) => setFormPaymentDate(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>{landsInCash(formMethod) ? t("cashAccount") : t("bankAccount")}</Label>
              {landsInCash(formMethod) ? (
                <Select value={formCashAccountId} onValueChange={setFormCashAccountId}>
                  <SelectTrigger><SelectValue placeholder={t("cashAccount")} /></SelectTrigger>
                  <SelectContent>
                    {(cashAccounts?.data ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={formBankAccountId} onValueChange={setFormBankAccountId}>
                  <SelectTrigger><SelectValue placeholder={t("bankAccount")} /></SelectTrigger>
                  <SelectContent>
                    {(bankAccounts?.data ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{a.bankName} — {a.accountNumber}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-[var(--muted-foreground)]">{t("accountNeededToVerify")}</p>
            </div>
            <div className="space-y-2"><Label>{t("proofOfPayment")}</Label><Input value={formProof} onChange={(e) => setFormProof(e.target.value)} placeholder={t("proofPlaceholder")} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>{tc("cancel")}</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? tc("saving") : editing ? tc("update") : tc("create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title={t("deleteTitle")} description={t("deleteDescription")} onConfirm={handleDelete} variant="destructive" confirmLabel={tc("delete")} />
      <ConfirmDialog open={!!rejecting} onOpenChange={(open) => { if (!open) setRejecting(null); }} title={t("rejectTitle")} description={t("rejectDescription")} onConfirm={handleReject} variant="destructive" confirmLabel={t("reject")} />
    </div>
  );
}
