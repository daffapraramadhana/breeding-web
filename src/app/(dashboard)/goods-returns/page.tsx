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
import { GoodsReturn } from "@/types/api";
import { formatDate } from "@/lib/utils";

const columns: Column<GoodsReturn>[] = [
  {
    header: "Number",
    cell: (row) => <span className="font-medium">{row.returnNumber}</span>,
  },
  {
    header: "Supplier",
    cell: (row) => row.supplier?.name || "—",
  },
  {
    header: "Warehouse",
    cell: (row) => row.warehouse?.name || "—",
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

export default function GoodsReturnsPage() {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data, meta, isLoading } = usePaginated<GoodsReturn>(
    "/goods-returns",
    { page, limit: 20, search }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goods Returns"
        description="Manage goods return records"
        actions={
          <Button asChild>
            <Link href="/goods-returns/new">
              <Plus className="mr-2 h-4 w-4" />
              New Return
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
        searchPlaceholder="Search by return number..."
        page={page}
        totalPages={meta?.totalPages || 1}
        total={meta?.total}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/goods-returns/${row.id}`)}
      />
    </div>
  );
}
