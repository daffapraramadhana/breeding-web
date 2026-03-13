"use client";

import { useState } from "react";
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
    { header: "Invoice", cell: (row) => row.invoice?.invoiceNumber || row.invoiceId.slice(0, 8) },
    { header: "Amount", cell: (row) => formatCurrency(Number(row.amount)) },
    { header: "Date", cell: (row) => formatDate(row.paymentDate) },
    { header: "Method", cell: (row) => row.paymentMethod || "—" },
    { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    {
      header: "Actions",
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
    if (!formInvoiceId || !formAmount || !formPaymentDate) { toast.error("Invoice, amount, and date are required"); return; }
    setIsSubmitting(true);
    try {
      const body = { invoiceId: formInvoiceId, amount: formAmount, paymentDate: formPaymentDate, reference: formReference || undefined, notes: formNotes || undefined };
      if (editing) { await fetchApi(`/sales-payments/${editing.id}`, { method: "PATCH", body: JSON.stringify(body) }); toast.success("Payment updated"); }
      else { await fetchApi("/sales-payments", { method: "POST", body: JSON.stringify(body) }); toast.success("Payment created"); }
      setDialogOpen(false); refetch();
    } catch { toast.error("Failed to save payment"); }
    finally { setIsSubmitting(false); }
  }

  async function handleDelete() {
    if (!deleting) return;
    try { await fetchApi(`/sales-payments/${deleting.id}`, { method: "DELETE" }); toast.success("Payment deleted"); setDeleteOpen(false); setDeleting(null); refetch(); }
    catch { toast.error("Failed to delete"); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Sales Payments" description="Manage sales payments" actions={<Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" />New Payment</Button>} />
      <DataTable columns={columns} data={data} isLoading={isLoading} search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Search payments..." page={page} totalPages={meta?.totalPages || 1} onPageChange={setPage} total={meta?.total} emptyTitle="No payments found" emptyDescription="No sales payments yet." />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Payment" : "New Payment"}</DialogTitle><DialogDescription>{editing ? "Update payment details." : "Create a new payment."}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Invoice ID</Label><Input value={formInvoiceId} onChange={(e) => setFormInvoiceId(e.target.value)} placeholder="Invoice ID" /></div>
            <div className="space-y-2"><Label>Amount</Label><Input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0" /></div>
            <div className="space-y-2"><Label>Payment Date</Label><Input type="date" value={formPaymentDate} onChange={(e) => setFormPaymentDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Reference</Label><Input value={formReference} onChange={(e) => setFormReference(e.target.value)} placeholder="Reference (optional)" /></div>
            <div className="space-y-2"><Label>Notes</Label><Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Notes (optional)" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Saving..." : editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Payment" description="Are you sure? This cannot be undone." onConfirm={handleDelete} variant="destructive" confirmLabel="Delete" />
    </div>
  );
}
