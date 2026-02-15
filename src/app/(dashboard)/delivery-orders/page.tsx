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
import { DeliveryOrder } from "@/types/api";
import { formatDate } from "@/lib/utils";

const columns: Column<DeliveryOrder>[] = [
  {
    header: "DO Number",
    cell: (row) => <span className="font-medium">{row.doNumber}</span>,
  },
  {
    header: "SO Number",
    cell: (row) => row.salesOrder?.soNumber || "—",
  },
  {
    header: "Warehouse",
    cell: (row) => row.warehouse?.name || "—",
  },
  {
    header: "Delivery Date",
    cell: (row) => formatDate(row.deliveryDate),
  },
  {
    header: "Status",
    cell: (row) => <StatusBadge status={row.status} />,
  },
];

export default function DeliveryOrdersPage() {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data, meta, isLoading } = usePaginated<DeliveryOrder>(
    "/delivery-orders",
    { page, limit: 20, search }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Orders"
        description="Manage deliveries for sales orders"
        actions={
          <Button asChild>
            <Link href="/delivery-orders/new">
              <Plus className="mr-2 h-4 w-4" />
              New DO
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
        searchPlaceholder="Search by DO number..."
        page={page}
        totalPages={meta?.totalPages || 1}
        total={meta?.total}
        onPageChange={setPage}
        onRowClick={(row) =>
          router.push(
            `/delivery-orders/${row.id}`
          )
        }
      />
    </div>
  );
}
