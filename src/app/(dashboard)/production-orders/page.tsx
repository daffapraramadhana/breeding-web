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
import { ProductionOrder } from "@/types/api";
import { formatDate } from "@/lib/utils";

const columns: Column<ProductionOrder>[] = [
  {
    header: "Prod Number",
    cell: (row) => <span className="font-medium">{row.prodNumber}</span>,
  },
  {
    header: "Warehouse",
    cell: (row) => row.warehouse?.name || "—",
  },
  {
    header: "Production Date",
    cell: (row) => formatDate(row.productionDate),
  },
  {
    header: "Inputs",
    cell: (row) => `${row.inputs?.length || 0} items`,
  },
  {
    header: "Outputs",
    cell: (row) => `${row.outputs?.length || 0} items`,
  },
  {
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} />,
  },
];

export default function ProductionOrdersPage() {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data, meta, isLoading } = usePaginated<ProductionOrder>(
    "/production-orders",
    { page, limit: 20, search }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production Orders"
        description="Manage production and processing orders"
        actions={
          <Button asChild>
            <Link href="/production-orders/new">
              <Plus className="mr-2 h-4 w-4" />
              New Production
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
        searchPlaceholder="Search production orders..."
        page={page}
        totalPages={meta?.totalPages || 1}
        total={meta?.total}
        onPageChange={setPage}
        onRowClick={(row) =>
          router.push(
            `/production-orders/${row.id}`
          )
        }
      />
    </div>
  );
}
