"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { SalesPayment } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function SalesPaymentsPage() {
  const t = useTranslations("salesPayments");
  const tc = useTranslations("common");
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const { data, meta, isLoading, refetch } = usePaginated<SalesPayment>("/sales-payments", { page, limit: 10, search });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SalesPayment | null>(null);
  const [formInvoiceId, setFormInvoiceId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formPaymentDate, setFormPaymentDate] = useState("");
  const [formReference, setFormReference] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<SalesPayment | null>(null);

  const columns: Column<SalesPayment>[] = [
    { header: t("invoice"), cell: (row) => row.invoice?.invoiceNumber || row.invoiceId.slice(0, 8) },
    { header: t("amount"), cell: (row) => formatCurrency(Number(row.amount)) },
    { header: t("date"), cell: (row) => formatDate(row.paymentDate) },
    { header: t("method"), cell: (row) => row.paymentMethod || "—" },
    { header: tc("status"), cell: (row) => <StatusBadge status={row.status} /> },
    {
      header: tc("actions"),
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleting(row); setDeleteOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ),
      className: "w-[100px]",
    },
  ];

  function handleCreate() { setEditing(null); setFormInvoiceId(""); setFormAmount(""); setFormPaymentDate(""); setFormReference(""); setFormNotes(""); setDialogOpen(true); }
  function handleEdit(p: SalesPayment) { setEditing(p); setFormInvoiceId(p.invoiceId); setFormAmount(p.amount); setFormPaymentDate(p.paymentDate); setFormReference(p.reference || ""); setFormNotes(p.notes || ""); setDialogOpen(true); }

  async function handleSubmit() {
    if (!formInvoiceId || !formAmount || !formPaymentDate) { toast.error(t("fieldsRequired")); return; }
    setIsSubmitting(true);
    try {
      const body = { invoiceId: formInvoiceId, amount: formAmount, paymentDate: formPaymentDate, reference: formReference || undefined, notes: formNotes || undefined };
      if (editing) { await fetchApi(`/sales-payments/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) }); toast.success(t("paymentUpdated")); }
      else { await fetchApi("/sales-payments", { method: "POST", body: JSON.stringify(body) }); toast.success(t("paymentCreated")); }
      setDialogOpen(false); refetch();
    } catch { toast.error(t("saveFailed")); }
    finally { setIsSubmitting(false); }
  }

  async function handleDelete() {
    if (!deleting) return;
    try { await fetchApi(`/sales-payments/${deleting.id}`, { method: "DELETE" }); toast.success(tc("entityDeleted", { entity: t("entity") })); setDeleteOpen(false); setDeleting(null); refetch(); }
    catch { toast.error(t("deleteFailed")); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} actions={<Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" />{t("newPayment")}</Button>} />
      <DataTable columns={columns} data={data} isLoading={isLoading} search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} searchPlaceholder={t("searchPlaceholder")} page={page} totalPages={meta?.totalPages || 1} onPageChange={setPage} total={meta?.total} emptyTitle={t("emptyTitle")} emptyDescription={t("emptyDescription")} />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? t("editPayment") : t("newPayment")}</DialogTitle><DialogDescription>{editing ? t("updatePaymentDesc") : t("createPaymentDesc")}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>{t("invoiceId")}</Label><Input value={formInvoiceId} onChange={(e) => setFormInvoiceId(e.target.value)} placeholder={t("invoiceId")} /></div>
            <div className="space-y-2"><Label>{t("amount")}</Label><Input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0" /></div>
            <div className="space-y-2"><Label>{t("paymentDate")}</Label><Input type="date" value={formPaymentDate} onChange={(e) => setFormPaymentDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>{t("reference")}</Label><Input value={formReference} onChange={(e) => setFormReference(e.target.value)} placeholder={t("referencePlaceholder")} /></div>
            <div className="space-y-2"><Label>{t("notes")}</Label><Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder={t("notesPlaceholder")} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>{tc("cancel")}</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? tc("saving") : editing ? tc("update") : tc("create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title={t("deleteTitle")} description={t("deleteDescription")} onConfirm={handleDelete} variant="destructive" confirmLabel={tc("delete")} />
    </div>
  );
}
