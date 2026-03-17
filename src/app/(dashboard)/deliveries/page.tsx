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
import { Delivery } from "@/types/api";
import { formatDate } from "@/lib/utils";

const columns: Column<Delivery>[] = [
  {
    header: "Sales Order",
    cell: (row) => (
      <span className="font-medium">
        {row.salesOrder?.doNumber || row.salesOrderId?.slice(0, 8) || "—"}
      </span>
    ),
  },
  {
    header: "Customer / Breeder",
    cell: (row) => row.customer?.name || "—",
  },
  {
    header: "Vehicle",
    cell: (row) => row.vehicle?.plateNumber || "—",
  },
  {
    header: "Driver",
    cell: (row) => row.driver?.name || "—",
  },
  {
    header: "Delivery Date",
    cell: (row) => row.deliveryDate ? formatDate(row.deliveryDate) : "—",
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

export default function DeliveriesPage() {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data, meta, isLoading } = usePaginated<Delivery>(
    "/deliveries",
    { page, limit: 20, search }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deliveries"
        description="Manage delivery orders"
        actions={
          <Button asChild>
            <Link href="/deliveries/new">
              <Plus className="mr-2 h-4 w-4" />
              New Delivery
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
        searchPlaceholder="Search deliveries..."
        page={page}
        totalPages={meta?.totalPages || 1}
        total={meta?.total}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/deliveries/${row.id}`)}
      />
    </div>
  );
}
