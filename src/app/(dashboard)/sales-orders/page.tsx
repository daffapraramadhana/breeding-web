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
import { SalesOrder } from "@/types/api";
import { formatDate, formatCurrency } from "@/lib/utils";

const columns: Column<SalesOrder>[] = [
  {
    header: "SO Number",
    cell: (row) => <span className="font-medium">{row.soNumber}</span>,
  },
  { header: "Customer", accessorKey: "customerName" as keyof SalesOrder },
  {
    header: "Order Date",
    cell: (row) => formatDate(row.orderDate),
  },
  {
    header: "Expected Date",
    cell: (row) => formatDate(row.expectedDate),
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

export default function SalesOrdersPage() {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data, meta, isLoading } = usePaginated<SalesOrder>(
    "/sales-orders",
    { page, limit: 20, search }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Orders"
        description="Manage sales orders to customers"
        actions={
          <Button asChild>
            <Link href="/sales-orders/new">
              <Plus className="mr-2 h-4 w-4" />
              New SO
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
        searchPlaceholder="Search by SO number or customer..."
        page={page}
        totalPages={meta?.totalPages || 1}
        total={meta?.total}
        onPageChange={setPage}
        onRowClick={(row) =>
          router.push(`/sales-orders/${row.id}`)
        }
      />
    </div>
  );
}
