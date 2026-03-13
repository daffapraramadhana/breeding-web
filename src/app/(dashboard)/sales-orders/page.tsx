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
import { formatDate } from "@/lib/utils";

const columns: Column<SalesOrder>[] = [
  {
    header: "DO Number",
    cell: (row) => (
      <span className="font-medium">{row.doNumber || "—"}</span>
    ),
  },
  {
    header: "Branch",
    cell: (row) => row.branch?.name || "—",
  },
  {
    header: "Customer / Breeder",
    cell: (row) => {
      if (row.recipientType === "BREEDER") return row.breeder?.name || "—";
      return row.customer?.name || "—";
    },
  },
  {
    header: "Recipient Type",
    cell: (row) => row.recipientType || "—",
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
        description="Manage sales orders to customers and breeders"
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
        searchPlaceholder="Search by DO number, customer, or breeder..."
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
