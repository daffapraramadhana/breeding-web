"use client";

import { useQueryState, parseAsInteger } from "nuqs";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, Column } from "@/components/shared/data-table";
import { usePaginated } from "@/hooks/use-api";
import { InventoryStock } from "@/types/api";
import { formatQuantity } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const columns: Column<InventoryStock>[] = [
  {
    header: "Item Code",
    cell: (row) => <span className="font-medium">{row.itemCode}</span>,
  },
  {
    header: "Item Name",
    accessorKey: "itemName" as keyof InventoryStock,
  },
  {
    header: "Category",
    cell: (row) =>
      row.category ? <Badge variant="outline">{row.category.name}</Badge> : "—",
  },
  {
    header: "Base UOM",
    accessorKey: "baseUom" as keyof InventoryStock,
  },
  {
    header: "Total Quantity",
    cell: (row) => (
      <span className="font-medium">{formatQuantity(row.totalQuantity)}</span>
    ),
    className: "text-right",
  },
  {
    header: "Warehouses",
    cell: (row) =>
      row.warehouses?.length > 0 ? (
        <div className="space-y-1">
          {row.warehouses.map((wh) => (
            <div key={wh.warehouseId} className="text-xs">
              <span className="text-muted-foreground">
                {wh.warehouseName}:
              </span>{" "}
              <span className="font-medium">{formatQuantity(wh.quantity)}</span>
            </div>
          ))}
        </div>
      ) : (
        "—"
      ),
  },
];

export default function InventoryPage() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data, meta, isLoading } = usePaginated<InventoryStock>(
    "/inventory-stocks/summary",
    { page, limit: 20, search }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Summary"
        description="Cross-warehouse inventory stock overview"
      />
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by item code or name..."
        page={page}
        totalPages={meta?.totalPages || 1}
        total={meta?.total}
        onPageChange={setPage}
        emptyTitle="No inventory data"
        emptyDescription="Stock data will appear after processing goods receipts or production orders."
      />
    </div>
  );
}
