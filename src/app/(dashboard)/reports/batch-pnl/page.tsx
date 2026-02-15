"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsInteger } from "nuqs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { usePaginated } from "@/hooks/use-api";
import { formatCurrency, parseDecimal } from "@/lib/utils";
import { BatchPnlSummary } from "@/types/api";

const LIMIT = 20;

export default function BatchPnlPage() {
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [status, setStatus] = useQueryState("status", { defaultValue: "" });

  const extra = useMemo(
    () => (status ? { status } : undefined),
    [status]
  );

  const { data, meta, isLoading } = usePaginated<BatchPnlSummary>(
    "/reports/batch-pnl",
    { page, limit: LIMIT, extra }
  );

  const columns: Column<BatchPnlSummary>[] = [
    {
      header: "Batch",
      cell: (row) => (
        <div>
          <span className="font-medium">{row.batch.batchNumber}</span>
          <p className="text-xs text-muted-foreground">{row.batch.species}</p>
        </div>
      ),
    },
    {
      header: "Farm / Kandang",
      cell: (row) => (
        <div>
          <span>{row.batch.farm.name}</span>
          <p className="text-xs text-muted-foreground">
            {row.batch.kandang.name}
          </p>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge
          variant="outline"
          className={
            row.batch.status === "ACTIVE"
              ? "bg-green-100 text-green-800 border-green-200"
              : "bg-slate-100 text-slate-800 border-slate-200"
          }
        >
          {row.batch.status}
        </Badge>
      ),
    },
    {
      header: "Revenue",
      cell: (row) => (
        <span className="text-green-600 font-medium">
          {formatCurrency(row.revenue)}
        </span>
      ),
    },
    {
      header: "Total Cost",
      cell: (row) => (
        <span className="text-red-600 font-medium">
          {formatCurrency(row.costs.totalCost)}
        </span>
      ),
    },
    {
      header: "Gross Profit",
      cell: (row) => {
        const profit = parseDecimal(row.grossProfit);
        return (
          <span
            className={`font-medium ${profit >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {formatCurrency(row.grossProfit)}
          </span>
        );
      },
    },
    {
      header: "Margin",
      cell: (row) => {
        const margin = parseDecimal(row.margin);
        return (
          <span
            className={`font-medium ${margin >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {margin.toFixed(1)}%
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batch P&L Report"
        description="Profit & Loss analysis per animal batch"
      />

      <div className="flex items-center gap-3">
        <Select
          value={status || "ALL"}
          onValueChange={(v) => {
            setStatus(v === "ALL" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        onRowClick={(row) => router.push(`/reports/batch-pnl/${row.batch.id}`)}
        emptyTitle="No batch P&L data found"
        emptyDescription="Batch P&L data will appear once transactions are linked to batches."
      />
    </div>
  );
}
