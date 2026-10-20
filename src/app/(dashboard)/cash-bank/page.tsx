"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { ArrowLeftRight, Plus, RotateCcw, Scale } from "lucide-react";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Currency } from "@/components/shared/currency";
import { useApi, usePaginated } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { fetchApi, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type {
  CashBankAccountBalance,
  CashBankMovement,
  CashBankSource,
  MoneyDirection,
} from "@/types/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SOURCES: CashBankSource[] = [
  "OPENING_BALANCE",
  "EXPENSE_PAYMENT",
  "SALES_PAYMENT",
  "CUSTOMER_REFUND",
  "INTERNAL_TRANSFER",
  "REVERSAL",
  "MANUAL_ADJUSTMENT",
];

/**
 * Hanya mutasi yang tidak lahir dari dokumen boleh dibalik dari buku; yang
 * lain dibatalkan lewat dokumennya. Ditulis sebagai daftar-boleh supaya sumber
 * baru aman secara bawaan.
 */
const REVERSIBLE_HERE: CashBankSource[] = [
  "OPENING_BALANCE",
  "INTERNAL_TRANSFER",
  "MANUAL_ADJUSTMENT",
];

/**
 * Tanggal hari ini menurut kalender setempat. `toISOString()` memberi tanggal
 * UTC, yang di WIB berarti kemarin sepanjang 00:00–07:00.
 */
function today() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Rekening dipilih sebagai "CASH:<id>" / "BANK:<id>" dan dipecah saat dikirim. */
function accountPayload(value: string, prefix: "" | "from" | "to" = "") {
  const [type, id] = value.split(":");
  const key =
    prefix === ""
      ? type === "CASH"
        ? "cashAccountId"
        : "bankAccountId"
      : type === "CASH"
        ? `${prefix}CashAccountId`
        : `${prefix}BankAccountId`;
  return { [key]: id };
}

export default function CashBankPage() {
  const t = useTranslations("cashBank");
  const tc = useTranslations("common");

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [accountFilter, setAccountFilter] = useQueryState("account", {
    defaultValue: "ALL",
  });
  const [directionFilter, setDirectionFilter] = useQueryState("direction", {
    defaultValue: "ALL",
  });
  const [sourceFilter, setSourceFilter] = useQueryState("source", {
    defaultValue: "ALL",
  });
  const [dateFrom, setDateFrom] = useQueryState("from", { defaultValue: "" });
  const [dateTo, setDateTo] = useQueryState("to", { defaultValue: "" });

  // Saldo awal, penyesuaian dan pembalikan milik TENANT_ADMIN; pindah uang
  // sampai MANAGER. Menampilkan tombol yang pasti ditolak backend hanya
  // menukar penjelasan dengan 403.
  const { user } = useAuth();
  const canAdmin = ["SUPER_ADMIN", "TENANT_ADMIN"].includes(user?.role ?? "");
  const canTransfer =
    canAdmin || ["MANAGER"].includes(user?.role ?? "");

  const {
    data: balances,
    isLoading: balancesLoading,
    refetch: refetchBalances,
  } = useApi<CashBankAccountBalance[]>("/cash-bank/accounts");

  const extra = useMemo(() => {
    const params: Record<string, string> = {};
    if (accountFilter !== "ALL") {
      const [type, id] = accountFilter.split(":");
      params[type === "CASH" ? "cashAccountId" : "bankAccountId"] = id;
    }
    if (directionFilter !== "ALL") params.direction = directionFilter;
    if (sourceFilter !== "ALL") params.source = sourceFilter;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    return params;
  }, [accountFilter, directionFilter, sourceFilter, dateFrom, dateTo]);

  const {
    data: movements,
    meta,
    isLoading,
    refetch,
  } = usePaginated<CashBankMovement>("/cash-bank/movements", {
    page,
    limit: 10,
    extra,
  });

  const accounts = balances ?? [];

  const [openingOpen, setOpeningOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [reversing, setReversing] = useState<CashBankMovement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    account: "",
    fromAccount: "",
    toAccount: "",
    direction: "IN" as MoneyDirection,
    amount: "",
    movementDate: today(),
    description: "",
  });

  function resetForm() {
    setForm({
      account: "",
      fromAccount: "",
      toAccount: "",
      direction: "IN",
      amount: "",
      movementDate: today(),
      description: "",
    });
  }

  function refreshAll() {
    refetch();
    refetchBalances();
  }

  async function submit(endpoint: string, body: Record<string, unknown>, close: () => void) {
    setIsSubmitting(true);
    try {
      await fetchApi(endpoint, { method: "POST", body: JSON.stringify(body) });
      toast.success(t("saved"));
      close();
      resetForm();
      refreshAll();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tc("noResults"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmReverse() {
    if (!reversing) return;
    try {
      await fetchApi(`/cash-bank/movements/${reversing.id}/reverse`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      toast.success(t("reversed"));
      refreshAll();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tc("noResults"));
    } finally {
      setReversing(null);
    }
  }

  const accountName = (row: CashBankMovement) =>
    row.cashAccount?.name ??
    (row.bankAccount
      ? `${row.bankAccount.bankName} — ${row.bankAccount.accountNumber}`
      : "—");

  const columns: Column<CashBankMovement>[] = [
    {
      header: t("movementDate"),
      cell: (row) => formatDate(row.movementDate),
      className: "w-[120px]",
    },
    { header: t("account"), cell: accountName },
    {
      header: t("direction"),
      cell: (row) => (
        <span
          className={
            row.direction === "IN" ? "text-emerald-600" : "text-destructive"
          }
        >
          {t(`directions.${row.direction}`)}
        </span>
      ),
      className: "w-[90px]",
    },
    {
      header: t("source"),
      cell: (row) => t(`sources.${row.source}`),
      className: "w-[160px]",
    },
    {
      header: t("amount"),
      cell: (row) => <Currency value={row.amount} />,
      className: "w-[140px] text-right",
    },
    {
      header: t("note"),
      cell: (row) => row.description ?? row.referenceNumber ?? "—",
    },
    {
      header: tc("actions"),
      cell: (row) =>
        !canAdmin ||
        !REVERSIBLE_HERE.includes(row.source) ||
        row.reversedBy ? null : (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setReversing(row);
            }}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        ),
      className: "w-[80px]",
    },
  ];

  const accountOptions = accounts.map((a) => (
    <SelectItem key={a.accountId} value={`${a.accountType}:${a.accountId}`}>
      {a.name} · {a.branchName}
    </SelectItem>
  ));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        sectionLabel={t("sectionLabel")}
        actions={
          <>
            {canAdmin && (
              <Button variant="outline" onClick={() => setOpeningOpen(true)}>
                <Scale className="h-4 w-4 mr-2" />
                {t("openingBalance")}
              </Button>
            )}
            {canAdmin && (
              <Button variant="outline" onClick={() => setAdjustmentOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("adjustment")}
              </Button>
            )}
            {canTransfer && (
              <Button onClick={() => setTransferOpen(true)}>
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                {t("transfer")}
              </Button>
            )}
          </>
        }
      />

      <p className="text-xs text-[var(--muted-foreground)]">{t("bookNote")}</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {balancesLoading && (
          <p className="text-sm text-[var(--muted-foreground)]">{tc("search")}…</p>
        )}
        {accounts.map((a) => {
          const negative = parseFloat(a.balance) < 0;
          return (
            <Card key={a.accountId} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {a.accountType === "CASH" ? t("cash") : t("bank")} · {a.branchName}
                  </p>
                </div>
              </div>
              <p
                className={`mt-3 text-xl font-light ${
                  negative ? "text-destructive" : ""
                }`}
              >
                <Currency value={a.balance} />
              </p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {t("totalIn")} <Currency value={a.totalIn} /> · {t("totalOut")}{" "}
                <Currency value={a.totalOut} />
              </p>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={accountFilter}
          onValueChange={(v) => {
            setAccountFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder={t("allAccounts")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("allAccounts")}</SelectItem>
            {accountOptions}
          </SelectContent>
        </Select>

        <Select
          value={directionFilter}
          onValueChange={(v) => {
            setDirectionFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("allDirections")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("allDirections")}</SelectItem>
            <SelectItem value="IN">{t("directions.IN")}</SelectItem>
            <SelectItem value="OUT">{t("directions.OUT")}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sourceFilter}
          onValueChange={(v) => {
            setSourceFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t("allSources")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("allSources")}</SelectItem>
            {SOURCES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`sources.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          aria-label={t("dateFrom")}
          className="w-[160px]"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
        />
        <Input
          type="date"
          aria-label={t("dateTo")}
          className="w-[160px]"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <DataTable
        columns={columns}
        data={movements}
        isLoading={isLoading}
        page={page}
        totalPages={meta?.totalPages}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
      />

      {/* Saldo awal */}
      <Dialog open={openingOpen} onOpenChange={setOpeningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("openingBalance")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("account")}</Label>
              <Select
                value={form.account}
                onValueChange={(v) => setForm({ ...form, account: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("account")} />
                </SelectTrigger>
                <SelectContent>{accountOptions}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("direction")}</Label>
              <Select
                value={form.direction}
                onValueChange={(v) =>
                  setForm({ ...form, direction: v as MoneyDirection })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">{t("directions.IN")}</SelectItem>
                  <SelectItem value="OUT">{t("directions.OUT")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("amount")}</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("movementDate")}</Label>
              <Input
                type="date"
                value={form.movementDate}
                onChange={(e) =>
                  setForm({ ...form, movementDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label>
                {t("note")} ({tc("optional")})
              </Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpeningOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button
              disabled={isSubmitting || !form.account || !form.amount}
              onClick={() =>
                submit(
                  "/cash-bank/opening-balance",
                  {
                    ...accountPayload(form.account),
                    direction: form.direction,
                    amount: form.amount,
                    movementDate: form.movementDate,
                    ...(form.description ? { description: form.description } : {}),
                  },
                  () => setOpeningOpen(false),
                )
              }
            >
              {isSubmitting ? tc("saving") : tc("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pindah uang */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("transfer")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("fromAccount")}</Label>
              <Select
                value={form.fromAccount}
                onValueChange={(v) => setForm({ ...form, fromAccount: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("fromAccount")} />
                </SelectTrigger>
                <SelectContent>{accountOptions}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("toAccount")}</Label>
              <Select
                value={form.toAccount}
                onValueChange={(v) => setForm({ ...form, toAccount: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("toAccount")} />
                </SelectTrigger>
                <SelectContent>{accountOptions}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("amount")}</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("movementDate")}</Label>
              <Input
                type="date"
                value={form.movementDate}
                onChange={(e) =>
                  setForm({ ...form, movementDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label>
                {t("note")} ({tc("optional")})
              </Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button
              disabled={
                isSubmitting ||
                !form.fromAccount ||
                !form.toAccount ||
                !form.amount
              }
              onClick={() =>
                submit(
                  "/cash-bank/transfers",
                  {
                    ...accountPayload(form.fromAccount, "from"),
                    ...accountPayload(form.toAccount, "to"),
                    amount: form.amount,
                    movementDate: form.movementDate,
                    ...(form.description ? { description: form.description } : {}),
                  },
                  () => setTransferOpen(false),
                )
              }
            >
              {isSubmitting ? tc("saving") : tc("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Penyesuaian */}
      <Dialog open={adjustmentOpen} onOpenChange={setAdjustmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adjustment")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("account")}</Label>
              <Select
                value={form.account}
                onValueChange={(v) => setForm({ ...form, account: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("account")} />
                </SelectTrigger>
                <SelectContent>{accountOptions}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("direction")}</Label>
              <Select
                value={form.direction}
                onValueChange={(v) =>
                  setForm({ ...form, direction: v as MoneyDirection })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">{t("directions.IN")}</SelectItem>
                  <SelectItem value="OUT">{t("directions.OUT")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("amount")}</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("movementDate")}</Label>
              <Input
                type="date"
                value={form.movementDate}
                onChange={(e) =>
                  setForm({ ...form, movementDate: e.target.value })
                }
              />
            </div>
            <div>
              <Label>{t("reason")}</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {t("reasonRequired")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustmentOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button
              disabled={
                isSubmitting ||
                !form.account ||
                !form.amount ||
                !form.description.trim()
              }
              onClick={() =>
                submit(
                  "/cash-bank/adjustments",
                  {
                    ...accountPayload(form.account),
                    direction: form.direction,
                    amount: form.amount,
                    movementDate: form.movementDate,
                    description: form.description,
                  },
                  () => setAdjustmentOpen(false),
                )
              }
            >
              {isSubmitting ? tc("saving") : tc("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!reversing}
        onOpenChange={(open) => !open && setReversing(null)}
        title={t("reverseTitle")}
        description={t("reverseDescription")}
        onConfirm={confirmReverse}
        confirmLabel={t("reverse")}
      />
    </div>
  );
}
