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
import { GoodsReceipt } from "@/types/api";
import { formatDate, formatCurrency } from "@/lib/utils";

const columns: Column<GoodsReceipt>[] = [
  {
    header: "GR Number",
    cell: (row) => <span className="font-medium">{row.grNumber}</span>,
  },
  {
    header: "PO Number",
    cell: (row) => row.purchaseOrder?.poNumber || "—",
  },
  {
    header: "Warehouse",
    cell: (row) => row.warehouse?.name || "—",
  },
  {
    header: "Receipt Date",
    cell: (row) => formatDate(row.receiptDate),
  },
  {
    header: "Total",
    cell: (row) => formatCurrency(row.totalAmount),
    className: "text-right",
  },
  {
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} />,
  },
];

export default function GoodsReceiptsPage() {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data, meta, isLoading } = usePaginated<GoodsReceipt>(
    "/goods-receipts",
    { page, limit: 20, search }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goods Receipts"
        description="Receive goods from purchase orders"
        actions={
          <Button asChild>
            <Link href="/goods-receipts/new">
              <Plus className="mr-2 h-4 w-4" />
              New Receipt
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
        searchPlaceholder="Search by GR number..."
        page={page}
        totalPages={meta?.totalPages || 1}
        total={meta?.total}
        onPageChange={setPage}
        onRowClick={(row) =>
          router.push(`/goods-receipts/${row.id}`)
        }
      />
    </div>
  );
}
