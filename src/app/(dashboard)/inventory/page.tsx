"use client";

import { useQueryState, parseAsInteger } from "nuqs";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { usePaginated } from "@/hooks/use-api";
import { InventoryStock } from "@/types/api";
import { formatQuantity } from "@/lib/utils";

const columns: Column<InventoryStock>[] = [
  {
    header: "Product",
    cell: (row) => (
      <span className="font-medium">
        {row.product?.code || "—"} - {row.product?.name || "—"}
      </span>
    ),
  },
  {
    header: "Warehouse",
    cell: (row) => row.warehouse?.name || "—",
  },
  {
    header: "UOM",
    cell: (row) => row.uom?.name || "—",
  },
  {
    header: "On Hand",
    cell: (row) => formatQuantity(row.quantityOnHand),
    className: "text-right",
  },
  {
    header: "Available",
    cell: (row) => formatQuantity(row.quantityAvailable),
    className: "text-right",
  },
  {
    header: "Allocated",
    cell: (row) => formatQuantity(row.quantityAllocated),
    className: "text-right",
  },
  {
    header: "Status",
    cell: (row) => <StatusBadge status={row.stockStatus} />,
  },
];

export default function InventoryPage() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data, meta, isLoading } = usePaginated<InventoryStock>(
    "/inventory-stocks",
    { page, limit: 20, search }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Summary"
        description="Inventory stock overview"
      />
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by product..."
        page={page}
        totalPages={meta?.totalPages || 1}
        total={meta?.total}
        onPageChange={setPage}
        emptyTitle="No inventory data"
        emptyDescription="Stock data will appear after processing goods receipts."
      />
    </div>
  );
}
