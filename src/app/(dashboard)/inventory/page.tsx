"use client";

import { useTranslations } from "next-intl";
import { useQueryState, parseAsInteger } from "nuqs";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { usePaginated } from "@/hooks/use-api";
import { InventoryStock } from "@/types/api";
import { formatQuantity } from "@/lib/utils";

export default function InventoryPage() {
  const t = useTranslations("stockSummary");
  const tc = useTranslations("common");
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data, meta, isLoading } = usePaginated<InventoryStock>(
    "/inventory-stocks",
    { page, limit: 20, search }
  );

  const columns: Column<InventoryStock>[] = [
    {
      header: t("product"),
      cell: (row) => (
        <span className="font-medium">
          {row.product?.code || "—"} - {row.product?.name || "—"}
        </span>
      ),
    },
    {
      header: t("warehouse"),
      cell: (row) => row.warehouse?.name || "—",
    },
    {
      header: t("uom"),
      cell: (row) => row.uom?.name || "—",
    },
    {
      header: t("onHand"),
      cell: (row) => formatQuantity(row.quantityOnHand),
      className: "text-right",
    },
    {
      header: t("available"),
      cell: (row) => formatQuantity(row.quantityAvailable),
      className: "text-right",
    },
    {
      header: t("allocated"),
      cell: (row) => formatQuantity(row.quantityAllocated),
      className: "text-right",
    },
    {
      header: tc("status"),
      cell: (row) => <StatusBadge status={row.stockStatus} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
      />
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchPlaceholder")}
        page={page}
        totalPages={meta?.totalPages || 1}
        total={meta?.total}
        onPageChange={setPage}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
      />
    </div>
  );
}
