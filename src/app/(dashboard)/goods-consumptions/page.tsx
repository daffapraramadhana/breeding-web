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
import { formatDate } from "@/lib/utils";

const columns: Column<GoodsConsumption>[] = [
  {
    header: "Number",
    cell: (row) => <span className="font-medium">{row.consumptionNumber}</span>,
  },
  {
    header: "Warehouse",
    cell: (row) => row.warehouse?.name || "—",
  },
  {
    header: "Purpose",
    cell: (row) => row.purpose || "—",
  },
  {
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} />,
  },
  {
    header: "Date",
    cell: (row) => row.consumptionDate ? formatDate(row.consumptionDate) : "—",
  },
  {
    header: "Created",
    cell: (row) => formatDate(row.createdAt),
  },
];

export default function GoodsConsumptionsPage() {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data, meta, isLoading } = usePaginated<GoodsConsumption>(
    "/goods-consumptions",
    { page, limit: 20, search }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goods Consumptions"
        description="Manage inventory consumption records"
        actions={
          <Button asChild>
            <Link href="/goods-consumptions/new">
              <Plus className="mr-2 h-4 w-4" />
              New Consumption
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
        searchPlaceholder="Search by consumption number..."
        page={page}
        totalPages={meta?.totalPages || 1}
        total={meta?.total}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/goods-consumptions/${row.id}`)}
      />
    </div>
  );
}
