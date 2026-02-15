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
import { PurchaseOrder } from "@/types/api";
import { formatDate, formatCurrency } from "@/lib/utils";

const columns: Column<PurchaseOrder>[] = [
  {
    header: "PO Number",
    cell: (row) => <span className="font-medium">{row.poNumber}</span>,
  },
  { header: "Supplier", accessorKey: "supplierName" as keyof PurchaseOrder },
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

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data, meta, isLoading } = usePaginated<PurchaseOrder>(
    "/purchase-orders",
    { page, limit: 20, search }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Manage purchase orders from suppliers"
        actions={
          <Button asChild>
            <Link href="/purchase-orders/new">
              <Plus className="mr-2 h-4 w-4" />
              New PO
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
        searchPlaceholder="Search by PO number or supplier..."
        page={page}
        totalPages={meta?.totalPages || 1}
        total={meta?.total}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/purchase-orders/${row.id}`)}
      />
    </div>
  );
}
