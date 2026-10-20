"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQueryState, parseAsInteger } from "nuqs";
import { Plus } from "lucide-react";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Currency } from "@/components/shared/currency";
import { usePaginated } from "@/hooks/use-api";
import { formatDate } from "@/lib/utils";
import type { Expense, ExpenseCategory, ExpensePaymentType, ExpenseStatus } from "@/types/api";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES: ExpenseStatus[] = [
  "DRAFT", "SUBMITTED", "APPROVED", "PAID", "REJECTED", "CANCELLED",
];
const CATEGORIES: ExpenseCategory[] = ["HPP", "BEBAN"];
const PAYMENT_TYPES: ExpensePaymentType[] = ["CASH", "TRANSFER", "PAYABLE", "OTHER_EXPENSE"];

export default function ExpensesPage() {
  const t = useTranslations("expenses");
  const tc = useTranslations("common");
  const router = useRouter();

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [status, setStatus] = useQueryState("status", { defaultValue: "ALL" });
  const [category, setCategory] = useQueryState("category", { defaultValue: "ALL" });
  const [paymentType, setPaymentType] = useQueryState("paymentType", { defaultValue: "ALL" });

  const extra = useMemo(() => {
    const p: Record<string, string> = {};
    if (status !== "ALL") p.status = status;
    if (category !== "ALL") p.category = category;
    if (paymentType !== "ALL") p.paymentType = paymentType;
    return p;
  }, [status, category, paymentType]);

  const { data, meta, isLoading } = usePaginated<Expense>("/expenses", {
    page,
    limit: 10,
    search,
    extra,
  });

  const columns: Column<Expense>[] = [
    {
      header: t("number"),
      cell: (row) =>
        row.expenseNumber ?? (
          <span className="text-[var(--muted-foreground)]">{t("notYetSubmitted")}</span>
        ),
      className: "w-[220px] font-mono text-xs",
    },
    { header: t("expenseDate"), cell: (row) => formatDate(row.expenseDate), className: "w-[120px]" },
    { header: t("branch"), cell: (row) => row.branch?.name ?? "—" },
    { header: t("category"), cell: (row) => t(`categories.${row.category}`), className: "w-[140px]" },
    {
      header: t("paymentType"),
      cell: (row) => t(`paymentTypes.${row.paymentType}`),
      className: "w-[180px]",
    },
    {
      header: t("total"),
      cell: (row) => <Currency value={row.totalAmount} />,
      className: "w-[150px] text-right",
    },
    {
      header: tc("status"),
      cell: (row) => <StatusBadge status={row.status} />,
      className: "w-[130px]",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        sectionLabel={t("sectionLabel")}
        actions={
          <Button onClick={() => router.push("/expenses/new")}>
            <Plus className="h-4 w-4 mr-2" />
            {t("newExpense")}
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{t(`statuses.${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("allCategories")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("allCategories")}</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{t(`categories.${c}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={paymentType} onValueChange={(v) => { setPaymentType(v); setPage(1); }}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder={t("allPaymentTypes")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("allPaymentTypes")}</SelectItem>
            {PAYMENT_TYPES.map((p) => (
              <SelectItem key={p} value={p}>{t(`paymentTypes.${p}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchPlaceholder")}
        page={page}
        totalPages={meta?.totalPages}
        onPageChange={setPage}
        total={meta?.total}
        onRowClick={(row) => router.push(`/expenses/${row.id}`)}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
      />
    </div>
  );
}
