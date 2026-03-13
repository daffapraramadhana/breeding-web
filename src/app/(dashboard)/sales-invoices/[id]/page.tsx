"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { SalesInvoice } from "@/types/api";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function SalesInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: invoice, isLoading } = useApi<SalesInvoice>(`/sales-invoices/${id}`);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!invoice) return <div className="p-6">Invoice not found</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        actions={
          <Button variant="outline" onClick={() => router.push("/sales-invoices")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Invoice Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Invoice Number</span><span>{invoice.invoiceNumber}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{invoice.customer?.name || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Invoice Date</span><span>{formatDate(invoice.invoiceDate)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Due Date</span><span>{invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={invoice.paymentStatus} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Payment Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Amount</span><span className="font-medium">{formatCurrency(Number(invoice.totalAmount))}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Paid Amount</span><span className="font-medium text-green-600">{formatCurrency(Number(invoice.paidAmount))}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Remaining</span><span className="font-medium text-red-600">{formatCurrency(Number(invoice.remainingAmount))}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Notes</span><span>{invoice.notes || "—"}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
