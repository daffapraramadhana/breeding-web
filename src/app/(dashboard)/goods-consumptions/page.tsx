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
import { GoodsConsumption } from "@/types/api";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/utils";

export default function GoodsConsumptionsPage() {
  const t = useTranslations('goodsConsumptions');
  const tc = useTranslations('common');
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const columns: Column<GoodsConsumption>[] = [
    {
      header: t('consumptionNumber'),
      cell: (row) => <span className="font-medium">{row.consumptionNumber}</span>,
    },
    {
      header: t('warehouse'),
      cell: (row) => row.warehouse?.name || "—",
    },
    {
      header: t('purpose'),
      cell: (row) => row.purpose || "—",
    },
    {
      header: tc('status'),
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: t('date'),
      cell: (row) => row.consumptionDate ? formatDate(row.consumptionDate) : "—",
    },
    {
      header: tc('created'),
      cell: (row) => formatDate(row.createdAt),
    },
  ];

  const { data, meta, isLoading } = usePaginated<GoodsConsumption>(
    "/goods-consumptions",
    { page, limit: 20, search }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button asChild>
            <Link href="/goods-consumptions/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('newConsumption')}
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
        onRowClick={(row) => router.push(`/goods-consumptions/${row.id}`)}
      />
    </div>
  );
}
