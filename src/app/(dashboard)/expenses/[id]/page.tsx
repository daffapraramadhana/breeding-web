"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Currency } from "@/components/shared/currency";
import { SupplierCombobox } from "@/components/forms/supplier-combobox";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { fetchApi, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type {
  BudgetType,
  Expense,
  ExpenseStatus,
  PaginatedResponse,
  ProjectBudgetRow,
} from "@/types/api";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NON_BUDGETING = "NON_BUDGETING";

/** Tombol yang masuk akal dari setiap status. */
const NEXT: Record<ExpenseStatus, ExpenseStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["APPROVED", "REJECTED"],
  APPROVED: ["PAID", "CANCELLED"],
  REJECTED: ["DRAFT"],
  PAID: ["CANCELLED"],
  CANCELLED: [],
};

export default function ExpenseDetailPage() {
  const t = useTranslations("expenses");
  const tc = useTranslations("common");
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  // Tombol yang pasti ditolak backend hanya menukar penjelasan dengan 403.
  const { user } = useAuth();
  const role = user?.role ?? "";
  const canApprove = ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER"].includes(role);
  const canCancelPaid = ["SUPER_ADMIN", "TENANT_ADMIN"].includes(role);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const { data: expense, isLoading, refetch } = useApi<Expense>(`/expenses/${id}`);
  const editable = expense?.status === "DRAFT" || expense?.status === "REJECTED";

  const { data: budgetTypes } = useApi<BudgetType[]>(
    expense?.projectId ? `/projects/${expense.projectId}/budget-types` : null,
  );

  const [budgetType, setBudgetType] = useState("");
  const [budgetRows, setBudgetRows] = useState<ProjectBudgetRow[]>([]);
  const [projectBudgetId, setProjectBudgetId] = useState("");
  const [description, setDescription] = useState("");
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isExpedition, setIsExpedition] = useState(false);
  const [expeditionSupplierId, setExpeditionSupplierId] = useState("");
  const [isCoopRepair, setIsCoopRepair] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Header dokumen yang ditolak harus bisa diperbaiki; tanpa ini jalur
  // REJECTED → DRAFT tidak ada gunanya.
  const [headerEdit, setHeaderEdit] = useState(false);
  const [expenseDate, setExpenseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [destinationBank, setDestinationBank] = useState("");
  const [destinationAccountNumber, setDestinationAccountNumber] = useState("");
  const [senderName, setSenderName] = useState("");

  useEffect(() => {
    if (!expense) return;
    setExpenseDate(expense.expenseDate.slice(0, 10));
    setNotes(expense.notes ?? "");
    setDestinationBank(expense.destinationBank ?? "");
    setDestinationAccountNumber(expense.destinationAccountNumber ?? "");
    setSenderName(expense.senderName ?? "");
  }, [expense]);

  async function saveHeader() {
    setIsSubmitting(true);
    try {
      await fetchApi(`/expenses/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          expenseDate,
          notes,
          ...(expense?.paymentType === "TRANSFER"
            ? { destinationBank, destinationAccountNumber, senderName }
            : {}),
        }),
      });
      toast.success(t("saved"));
      setHeaderEdit(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tc("noResults"));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Detail baris ikut jenis yang dipilih, persis seperti form acuan.
  useEffect(() => {
    setProjectBudgetId("");
    if (!expense?.projectId || !budgetType || budgetType === NON_BUDGETING) {
      setBudgetRows([]);
      return;
    }
    fetchApi<PaginatedResponse<ProjectBudgetRow>>(
      `/projects/${expense.projectId}/budgets?limit=100&type=${encodeURIComponent(budgetType)}`,
    )
      .then((res) => setBudgetRows(res.data))
      .catch(() => setBudgetRows([]));
  }, [expense?.projectId, budgetType]);

  const chosenBudget = budgetRows.find((b) => b.id === projectBudgetId);

  async function addLine() {
    setIsSubmitting(true);
    try {
      await fetchApi(`/expenses/${id}/lines`, {
        method: "POST",
        body: JSON.stringify({
          ...(projectBudgetId ? { projectBudgetId } : {}),
          ...(description ? { description } : {}),
          pricePerUnit,
          quantity,
          isExpedition,
          ...(isExpedition && expeditionSupplierId ? { expeditionSupplierId } : {}),
          isCoopRepair,
        }),
      });
      toast.success(t("saved"));
      setDescription("");
      setPricePerUnit("");
      setQuantity("1");
      setIsExpedition(false);
      setExpeditionSupplierId("");
      setIsCoopRepair(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tc("noResults"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeLine(lineId: string) {
    try {
      await fetchApi(`/expenses/${id}/lines/${lineId}`, { method: "DELETE" });
      toast.success(t("deleted"));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tc("noResults"));
    }
  }

  async function move(target: ExpenseStatus) {
    try {
      await fetchApi(`/expenses/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ targetStatus: target }),
      });
      toast.success(t(`statuses.${target}`));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tc("noResults"));
    }
  }

  if (isLoading || !expense) {
    return <p className="text-sm text-[var(--muted-foreground)]">{tc("search")}…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={expense.expenseNumber ?? t("notYetSubmitted")}
        sectionLabel={t("sectionLabel")}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/expenses")}>
              {tc("cancel")}
            </Button>
            {editable && !headerEdit && (
              <Button variant="outline" onClick={() => setHeaderEdit(true)}>
                {tc("update")}
              </Button>
            )}
            {headerEdit && (
              <Button disabled={isSubmitting} onClick={saveHeader}>
                {isSubmitting ? tc("saving") : tc("update")}
              </Button>
            )}
            {NEXT[expense.status]
              .filter((target) => {
                if (target === "CANCELLED" && expense.status === "PAID") return canCancelPaid;
                if (["APPROVED", "PAID", "REJECTED", "CANCELLED"].includes(target))
                  return canApprove;
                return true;
              })
              .map((target) => (
              <Button
                key={target}
                variant={target === "CANCELLED" || target === "REJECTED" ? "outline" : "default"}
                onClick={() =>
                  // Membatalkan dokumen yang sudah dibayar menarik uang kembali;
                  // itu pantas ditanya dulu.
                  target === "CANCELLED" && expense.status === "PAID"
                    ? setConfirmCancel(true)
                    : move(target)
                }
              >
                {target === "SUBMITTED" && t("submit")}
                {target === "APPROVED" && t("approve")}
                {target === "PAID" && t("markPaid")}
                {target === "REJECTED" && t("reject")}
                {target === "CANCELLED" && t("cancel")}
                {target === "DRAFT" && tc("update")}
              </Button>
            ))}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 space-y-2 text-sm">
          <h2 className="text-sm font-medium">{t("projectPanel")}</h2>
          <div className="flex justify-between"><span>{tc("status")}</span><StatusBadge status={expense.status} /></div>
          <div className="flex justify-between"><span>{t("branch")}</span><span>{expense.branch?.name ?? "—"}</span></div>
          <div className="flex justify-between"><span>{t("farm")}</span><span>{expense.farm?.name ?? "—"}</span></div>
          <div className="flex items-center justify-between gap-3">
            <span>{t("expenseDate")}</span>
            {headerEdit ? (
              <Input
                type="date"
                className="w-[180px]"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            ) : (
              <span>{formatDate(expense.expenseDate)}</span>
            )}
          </div>
          <div className="flex justify-between"><span>{t("category")}</span><span>{t(`categories.${expense.category}`)}</span></div>
          <div className="flex items-center justify-between gap-3">
            <span>{t("notes")}</span>
            {headerEdit ? (
              <Input
                className="w-[220px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            ) : (
              <span>{expense.notes ?? "—"}</span>
            )}
          </div>
        </Card>
        <Card className="p-4 space-y-2 text-sm">
          <h2 className="text-sm font-medium">{t("typePanel")}</h2>
          <div className="flex justify-between"><span>{t("paymentType")}</span><span>{t(`paymentTypes.${expense.paymentType}`)}</span></div>
          <div className="flex justify-between">
            <span>{t("account")}</span>
            <span>{expense.chartOfAccount ? `${expense.chartOfAccount.code} — ${expense.chartOfAccount.name}` : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>{expense.paymentType === "TRANSFER" ? t("bankAccount") : t("cashAccount")}</span>
            <span>
              {expense.bankAccount
                ? `${expense.bankAccount.bankName} — ${expense.bankAccount.accountNumber}`
                : (expense.cashAccount?.name ?? "—")}
            </span>
          </div>
          {headerEdit && expense.paymentType === "TRANSFER" && (
            <div className="space-y-2 pt-2">
              <Input
                placeholder={t("destinationBank")}
                value={destinationBank}
                onChange={(e) => setDestinationBank(e.target.value)}
              />
              <Input
                placeholder={t("destinationAccountNumber")}
                value={destinationAccountNumber}
                onChange={(e) => setDestinationAccountNumber(e.target.value)}
              />
              <Input
                placeholder={t("senderName")}
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>
          )}
          {expense.paymentType !== "CASH" && expense.paymentType !== "TRANSFER" && (
            <p className="text-xs text-[var(--muted-foreground)]">{t("noMoneyLeaves")}</p>
          )}
        </Card>
      </div>

      {editable && (
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-medium">{t("lines")}</h2>
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <Label>{t("budgetType")}</Label>
              <Select value={budgetType} onValueChange={setBudgetType}>
                <SelectTrigger><SelectValue placeholder={t("budgetType")} /></SelectTrigger>
                <SelectContent>
                  {(budgetTypes ?? []).map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("budgetRow")}</Label>
              {budgetType && budgetType !== NON_BUDGETING ? (
                <Select value={projectBudgetId} onValueChange={setProjectBudgetId}>
                  <SelectTrigger><SelectValue placeholder={t("budgetRow")} /></SelectTrigger>
                  <SelectContent>
                    {budgetRows.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.description ?? b.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder={t("freeDescription")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              )}
            </div>
            <div>
              <Label>{t("price")}</Label>
              <Input type="number" value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} />
              {chosenBudget && (
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {t("stdPrice")}: <Currency value={chosenBudget.stdPricePerUnit ?? "0"} />
                </p>
              )}
            </div>
            <div>
              <Label>{t("quantity")}</Label>
              <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              {chosenBudget && (
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {t("stdQuantity")}: {chosenBudget.stdRequirement ?? "0"}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isExpedition} onCheckedChange={(v) => setIsExpedition(!!v)} />
              {t("isExpedition")}
            </label>
            {isExpedition && (
              <div className="w-[260px]">
                <SupplierCombobox value={expeditionSupplierId} onChange={setExpeditionSupplierId} />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isCoopRepair} onCheckedChange={(v) => setIsCoopRepair(!!v)} />
              {t("isCoopRepair")}
            </label>
            <Button
              className="ml-auto"
              disabled={
                isSubmitting ||
                !pricePerUnit ||
                !quantity ||
                (!projectBudgetId && !description) ||
                (isExpedition && !expeditionSupplierId)
              }
              onClick={addLine}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("addLine")}
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("budgetType")}</TableHead>
              <TableHead>{t("budgetRow")}</TableHead>
              <TableHead className="text-right">{t("stdPrice")}</TableHead>
              <TableHead className="text-right">{t("stdQuantity")}</TableHead>
              <TableHead className="text-right">{t("stdTotal")}</TableHead>
              <TableHead className="text-right">{t("price")}</TableHead>
              <TableHead className="text-right">{t("quantity")}</TableHead>
              <TableHead className="text-right">{t("total")}</TableHead>
              {editable && <TableHead className="w-[60px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {expense.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell>{line.budgetTypeName ?? "—"}</TableCell>
                <TableCell>{line.projectBudget?.description ?? line.description ?? "—"}</TableCell>
                <TableCell className="text-right text-[var(--muted-foreground)]">
                  {line.stdPricePerUnit ? <Currency value={line.stdPricePerUnit} /> : "—"}
                </TableCell>
                <TableCell className="text-right text-[var(--muted-foreground)]">
                  {line.stdQuantity ?? "—"}
                </TableCell>
                <TableCell className="text-right text-[var(--muted-foreground)]">
                  {line.stdTotal ? <Currency value={line.stdTotal} /> : "—"}
                </TableCell>
                <TableCell className="text-right"><Currency value={line.pricePerUnit} /></TableCell>
                <TableCell className="text-right">{line.quantity}</TableCell>
                <TableCell className="text-right"><Currency value={line.total} /></TableCell>
                {editable && (
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => removeLine(line.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={7} className="text-right font-medium">
                {t("grandTotal")}
              </TableCell>
              <TableCell className="text-right font-medium">
                <Currency value={expense.totalAmount} />
              </TableCell>
              {editable && <TableCell />}
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={t("cancel")}
        description={t("cancelPaidWarning")}
        onConfirm={() => {
          setConfirmCancel(false);
          move("CANCELLED");
        }}
        variant="destructive"
      />
    </div>
  );
}
