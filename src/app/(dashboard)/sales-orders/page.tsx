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
import { SalesOrder } from "@/types/api";
import { formatDate } from "@/lib/utils";

export default function SalesOrdersPage() {
  const t = useTranslations('salesOrders');
  const tc = useTranslations('common');
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const columns: Column<SalesOrder>[] = [
    {
      header: t('doNumber'),
      cell: (row) => (
        <span className="font-medium">{row.doNumber || "—"}</span>
      ),
    },
    {
      header: t('branch'),
      cell: (row) => row.branch?.name || "—",
    },
    {
      header: t('customerBreeder'),
      cell: (row) => {
        if (row.recipientType === "BREEDER") return row.breeder?.name || "—";
        return row.customer?.name || "—";
      },
    },
    {
      header: t('recipientType'),
      cell: (row) => row.recipientType || "—",
    },
    {
      header: tc('status'),
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: tc('created'),
      cell: (row) => formatDate(row.createdAt),
    },
  ];

  const { data, meta, isLoading } = usePaginated<SalesOrder>(
    "/sales-orders",
    { page, limit: 20, search }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button asChild>
            <Link href="/sales-orders/new">
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
        onRowClick={(row) =>
          router.push(`/sales-orders/${row.id}`)
        }
      />
    </div>
  );
}
