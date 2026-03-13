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
import { GoodsTransfer } from "@/types/api";
import { formatDate } from "@/lib/utils";

const columns: Column<GoodsTransfer>[] = [
  {
    header: "Transfer Number",
    cell: (row) => <span className="font-medium">{row.transferNumber}</span>,
  },
  {
    header: "From Warehouse",
    cell: (row) => row.fromWarehouse?.name || "—",
  },
  {
    header: "To Warehouse",
    cell: (row) => row.toWarehouse?.name || "—",
  },
  {
    header: "Transfer Date",
    cell: (row) => row.transferDate ? formatDate(row.transferDate) : "—",
  },
  {
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} />,
  },
  {
    header: "Created",
    cell: (row) => formatDate(row.createdAt),
  },
];

export default function GoodsTransfersPage() {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data, meta, isLoading } = usePaginated<GoodsTransfer>(
    "/goods-transfers",
    { page, limit: 20, search }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goods Transfers"
        description="Transfer inventory between warehouses"
        actions={
          <Button asChild>
            <Link href="/goods-transfers/new">
              <Plus className="mr-2 h-4 w-4" />
              New Transfer
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
        searchPlaceholder="Search transfers..."
        page={page}
        totalPages={meta?.totalPages || 1}
        total={meta?.total}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/goods-transfers/${row.id}`)}
      />
    </div>
  );
}
