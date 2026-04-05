"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryState, parseAsInteger } from "nuqs";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { usePaginated } from "@/hooks/use-api";
import { PurchaseOrder } from "@/types/api";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function PurchaseOrdersPage() {
  const t = useTranslations('purchaseOrders');
  const tc = useTranslations('common');
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const columns: Column<PurchaseOrder>[] = [
    {
      header: t('poNumber'),
      cell: (row) => <span className="font-medium">{row.poNumber}</span>,
    },
    {
      header: t('supplier'),
      cell: (row) => row.supplier?.name || "—",
    },
    {
      header: t('branch'),
      cell: (row) => row.branch?.name || "—",
    },
    {
      header: t('orderDate'),
      cell: (row) => formatDate(row.orderDate),
    },
    {
      header: tc('status'),
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: t('total'),
      cell: (row) => formatCurrency(row.totalAmount),
      className: "text-right",
    },
  ];

  const { data, meta, isLoading } = usePaginated<PurchaseOrder>(
    "/purchase-orders",
    { page, limit: 20, search }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button asChild>
            <Link href="/purchase-orders/new">
              <Plus className="mr-2 h-4 w-4" />
              {tc('newEntity', { entity: t('entity') })}
            </Link>
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={tc('search')}
        page={page}
        totalPages={meta?.totalPages || 1}
        total={meta?.total}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/purchase-orders/${row.id}`)}
      />
    </div>
  );
}
