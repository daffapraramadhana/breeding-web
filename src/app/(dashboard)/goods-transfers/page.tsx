"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryState, parseAsInteger } from "nuqs";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { usePaginated } from "@/hooks/use-api";
import { GoodsTransfer } from "@/types/api";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/utils";

export default function GoodsTransfersPage() {
  const t = useTranslations('goodsTransfers');
  const tc = useTranslations('common');
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [status, setStatus] = useQueryState("status", { defaultValue: "" });

  const columns: Column<GoodsTransfer>[] = [
    {
      header: t('transferNumber'),
      cell: (row) => <span className="font-medium">{row.transferNumber}</span>,
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
      header: t('transferDate'),
      cell: (row) => row.transferDate ? formatDate(row.transferDate) : "—",
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

  const { data, meta, isLoading } = usePaginated<GoodsTransfer>(
    "/goods-transfers",
    { page, limit: 20, search, extra: { status } }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button asChild>
            <Link href="/goods-transfers/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('newTransfer')}
            </Link>
          </Button>
        }
      />
      <div className="flex justify-end">
        <Select
          value={status || "ALL"}
          onValueChange={(v) => {
            setStatus(v === "ALL" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('statusFilterAll')}</SelectItem>
            {["PREPARING", "IN_TRANSIT", "PARTIAL", "RECEIVED", "DAMAGED_IN_TRANSIT", "CANCELLED"].map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
        onRowClick={(row) => router.push(`/goods-transfers/${row.id}`)}
      />
    </div>
  );
}
