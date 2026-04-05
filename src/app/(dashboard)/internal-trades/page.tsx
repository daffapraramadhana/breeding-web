"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryState, parseAsInteger } from "nuqs";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { usePaginated } from "@/hooks/use-api";
import { InternalTrade } from "@/types/api";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/utils";

export default function InternalTradesPage() {
  const t = useTranslations('internalTrades');
  const tc = useTranslations('common');
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const columns: Column<InternalTrade>[] = [
    {
      header: t('tradeNumber'),
      cell: (row) => <span className="font-medium">{row.tradeNumber}</span>,
    },
    {
      header: t('fromWarehouse'),
      cell: (row) => row.fromWarehouse?.name || "—",
    },
    {
      header: t('toWarehouse'),
      cell: (row) => row.toWarehouse?.name || "—",
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

  const { data, meta, isLoading } = usePaginated<InternalTrade>(
    "/internal-trades",
    { page, limit: 20, search }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button asChild>
            <Link href="/internal-trades/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('newTrade')}
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
        searchPlaceholder={t('searchPlaceholder')}
        page={page}
        totalPages={meta?.totalPages || 1}
        total={meta?.total}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/internal-trades/${row.id}`)}
      />
    </div>
  );
}
