"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryState, parseAsInteger } from "nuqs";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { usePaginated } from "@/hooks/use-api";
import { SalesOrder } from "@/types/api";
import { formatDate } from "@/lib/utils";
import { SALES_STATUSES } from "@/lib/constants";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import { BranchCombobox } from "@/components/forms/branch-combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function SalesOrdersPage() {
  const t = useTranslations('salesOrders');
  const tc = useTranslations('common');
  const router = useRouter();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [isExpiring, setIsExpiring] = useState(false);
  const [branchId, setBranchId] = useQueryState("branchId", { defaultValue: "" });
  const [statusFilter, setStatusFilter] = useQueryState("status", { defaultValue: "" });
  const [dateFrom, setDateFrom] = useQueryState("dateFrom", { defaultValue: "" });
  const [dateTo, setDateTo] = useQueryState("dateTo", { defaultValue: "" });

  const columns: Column<SalesOrder>[] = [
    {
      header: t('doNumber'),
      cell: (row) => (
        <span className="font-medium">{row.doNumber || "—"}</span>
      ),
    },
    {
      header: t('branch'),
      cell: (row) => row.branch?.name || "—",
    },
    {
      header: t('customerBreeder'),
      cell: (row) => {
        if (row.recipientType === "BREEDER") return row.breeder?.name || "—";
        return row.customer?.name || "—";
      },
    },
    {
      header: t('recipientType'),
      cell: (row) => row.recipientType || "—",
    },
    {
      header: tc('status'),
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: t('orderDate'),
      cell: (row) =>
        row.orderDate
          ? `${formatDate(row.orderDate)}${row.validUntil ? ` s/d ${formatDate(row.validUntil)}` : ''}`
          : '—',
    },
    {
      header: tc('created'),
      cell: (row) => formatDate(row.createdAt),
    },
  ];

  const { data, meta, isLoading, refetch } = usePaginated<SalesOrder>(
    "/sales-orders",
    {
      page,
      limit: 20,
      search,
      extra: {
        ...(branchId && { branchId }),
        ...(statusFilter && { status: statusFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      },
    }
  );

  async function handleExpireOverdue() {
    setIsExpiring(true);
    try {
      const res = await fetchApi<{ expired: number; failed: number }>(
        "/sales-orders/expire-overdue",
        { method: "POST", body: JSON.stringify({}) }
      );
      toast.success(`${t('expireOverdue')}: ${res.expired}`);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('expireOverdue'));
    } finally {
      setIsExpiring(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExpireOverdue} disabled={isExpiring}>
              {isExpiring ? tc('saving') : t('expireOverdue')}
            </Button>
            <Button asChild>
              <Link href="/sales-orders/new">
                <Plus className="mr-2 h-4 w-4" />
                {tc('newEntity', { entity: t('entity') })}
              </Link>
            </Button>
          </div>
        }
      />
      <div className="grid gap-3 rounded-md border p-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>{t('branch')}</Label>
          <BranchCombobox
            value={branchId}
            onChange={(v) => { setBranchId(v); setPage(1); }}
          />
        </div>
        <div className="space-y-2">
          <Label>{tc('status')}</Label>
          <Select
            value={statusFilter || "ALL"}
            onValueChange={(v) => { setStatusFilter(v === "ALL" ? "" : v); setPage(1); }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('allStatuses')}</SelectItem>
              {SALES_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="so-date-from">{t('dateFrom')}</Label>
          <Input id="so-date-from" type="date" value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="so-date-to">{t('dateTo')}</Label>
          <Input id="so-date-to" type="date" value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={tc('search')}
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
