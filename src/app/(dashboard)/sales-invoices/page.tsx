"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQueryState, parseAsInteger } from "nuqs";
import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { usePaginated } from "@/hooks/use-api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { SalesInvoice } from "@/types/api";

export default function SalesInvoicesPage() {
  const t = useTranslations("salesInvoices");
  const tc = useTranslations("common");
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const { data, meta, isLoading } = usePaginated<SalesInvoice>("/sales-invoices", { page, limit: 10, search });

  const columns: Column<SalesInvoice>[] = [
    { header: t("invoiceNumber"), accessorKey: "invoiceNumber" },
    { header: t("customer"), cell: (row) => row.customer?.name || "—" },
    { header: t("invoiceDate"), cell: (row) => formatDate(row.invoiceDate) },
    { header: t("total"), cell: (row) => formatCurrency(Number(row.totalAmount)) },
    { header: t("paid"), cell: (row) => formatCurrency(Number(row.paidAmount)) },
    { header: t("remaining"), cell: (row) => formatCurrency(Number(row.remainingAmount)) },
    { header: tc("status"), cell: (row) => <StatusBadge status={row.paymentStatus} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder={t("searchPlaceholder")}
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        onRowClick={(inv) => router.push(`/sales-invoices/${inv.id}`)}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
      />
    </div>
  );
}
