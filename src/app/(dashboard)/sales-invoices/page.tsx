"use client";

import { useRouter } from "next/navigation";
import { useQueryState, parseAsInteger } from "nuqs";
import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { usePaginated } from "@/hooks/use-api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { SalesInvoice } from "@/types/api";

export default function SalesInvoicesPage() {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const { data, meta, isLoading } = usePaginated<SalesInvoice>("/sales-invoices", { page, limit: 10, search });

  const columns: Column<SalesInvoice>[] = [
    { header: "Invoice Number", accessorKey: "invoiceNumber" },
    { header: "Customer", cell: (row) => row.customer?.name || "—" },
    { header: "Invoice Date", cell: (row) => formatDate(row.invoiceDate) },
    { header: "Total", cell: (row) => formatCurrency(Number(row.totalAmount)) },
    { header: "Paid", cell: (row) => formatCurrency(Number(row.paidAmount)) },
    { header: "Remaining", cell: (row) => formatCurrency(Number(row.remainingAmount)) },
    { header: "Status", cell: (row) => <StatusBadge status={row.paymentStatus} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Sales Invoices" description="Manage sales invoices" />
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search invoices..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        onRowClick={(inv) => router.push(`/sales-invoices/${inv.id}`)}
        emptyTitle="No invoices found"
        emptyDescription="No sales invoices yet."
      />
    </div>
  );
}
