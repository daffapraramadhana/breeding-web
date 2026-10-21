"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { ProjectCombobox } from "@/components/forms/project-combobox";
import { BranchCombobox } from "@/components/forms/branch-combobox";
import { FarmCombobox } from "@/components/forms/farm-combobox";
import { useApi } from "@/hooks/use-api";
import { fetchApi, ApiError } from "@/lib/api";
import type {
  ChartOfAccount,
  Expense,
  ExpenseCategory,
  ExpensePaymentType,
  PaginatedResponse,
} from "@/types/api";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CashAccount { id: string; name: string }
interface BankAccount { id: string; bankName: string; accountNumber: string }

/** Dua jenis ini mencatat biaya tanpa uang keluar, jadi tidak menyebut rekening. */
const MOVES_MONEY: ExpensePaymentType[] = ["CASH", "TRANSFER"];

function today() {
  const n = new Date();
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}

export default function NewExpensePage() {
  const t = useTranslations("expenses");
  const tc = useTranslations("common");
  const router = useRouter();

  const { data: accounts } = useApi<PaginatedResponse<ChartOfAccount>>("/chart-of-accounts?limit=100");
  const { data: cashAccounts } = useApi<PaginatedResponse<CashAccount>>("/cash-accounts?limit=100");
  const { data: bankAccounts } = useApi<PaginatedResponse<BankAccount>>("/bank-accounts?limit=100");

  const [projectId, setProjectId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [farmId, setFarmId] = useState("");
  const [expenseDate, setExpenseDate] = useState(today());
  const [category, setCategory] = useState<ExpenseCategory>("HPP");
  const [paymentType, setPaymentType] = useState<ExpensePaymentType>("CASH");
  const [chartOfAccountId, setChartOfAccountId] = useState("");
  const [cashAccountId, setCashAccountId] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [destinationBank, setDestinationBank] = useState("");
  const [destinationAccountNumber, setDestinationAccountNumber] = useState("");
  const [senderName, setSenderName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const movesMoney = MOVES_MONEY.includes(paymentType);
  const needsProject = category === "HPP";

  async function save() {
    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        expenseDate,
        category,
        paymentType,
        chartOfAccountId,
        ...(projectId ? { projectId } : { branchId, ...(farmId ? { farmId } : {}) }),
        ...(paymentType === "CASH" && cashAccountId ? { cashAccountId } : {}),
        ...(paymentType === "TRANSFER" && bankAccountId ? { bankAccountId } : {}),
        ...(destinationBank ? { destinationBank } : {}),
        ...(destinationAccountNumber ? { destinationAccountNumber } : {}),
        ...(senderName ? { senderName } : {}),
        ...(notes ? { notes } : {}),
      };
      const created = await fetchApi<Expense>("/expenses", {
        method: "POST",
        body: JSON.stringify(body),
      });
      toast.success(t("saved"));
      router.push(`/expenses/${created.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tc("noResults"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("newExpense")} sectionLabel={t("sectionLabel")} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-medium">{t("projectPanel")}</h2>
          <div>
            <Label>
              {t("project")} {needsProject && <span className="text-destructive">*</span>}
            </Label>
            <ProjectCombobox value={projectId} onChange={setProjectId} />
            {needsProject && !projectId && (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{t("hppNeedsProject")}</p>
            )}
          </div>
          {!projectId && (
            <div>
              {/* Tanpa project, farm-nya disebut sendiri — boleh juga dikosongkan
                  untuk beban yang memang milik perusahaan. */}
              <Label>
                {t("farm")} ({tc("optional")})
              </Label>
              <FarmCombobox value={farmId} onChange={setFarmId} branchId={branchId || undefined} />
            </div>
          )}
          {!projectId && (
            <div>
              {/* Tanpa project, dokumen tetap harus menyebut area penanggungnya. */}
              <Label>
                {t("branch")} <span className="text-destructive">*</span>
              </Label>
              <BranchCombobox value={branchId} onChange={setBranchId} />
            </div>
          )}
          <div>
            <Label>{t("category")}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="HPP">{t("categories.HPP")}</SelectItem>
                <SelectItem value="BEBAN">{t("categories.BEBAN")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("notes")}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-medium">{t("typePanel")}</h2>
          <div>
            <Label>{t("expenseDate")}</Label>
            <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
          </div>
          <div>
            <Label>{t("paymentType")}</Label>
            <Select value={paymentType} onValueChange={(v) => setPaymentType(v as ExpensePaymentType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">{t("paymentTypes.CASH")}</SelectItem>
                <SelectItem value="TRANSFER">{t("paymentTypes.TRANSFER")}</SelectItem>
                <SelectItem value="PAYABLE">{t("paymentTypes.PAYABLE")}</SelectItem>
                <SelectItem value="OTHER_EXPENSE">{t("paymentTypes.OTHER_EXPENSE")}</SelectItem>
              </SelectContent>
            </Select>
            {!movesMoney && (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{t("noMoneyLeaves")}</p>
            )}
          </div>
          <div>
            <Label>{t("account")}</Label>
            <Select value={chartOfAccountId} onValueChange={setChartOfAccountId}>
              <SelectTrigger><SelectValue placeholder={t("account")} /></SelectTrigger>
              <SelectContent>
                {(accounts?.data ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.code} — {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {paymentType === "CASH" && (
            <div>
              <Label>{t("cashAccount")}</Label>
              <Select value={cashAccountId} onValueChange={setCashAccountId}>
                <SelectTrigger><SelectValue placeholder={t("cashAccount")} /></SelectTrigger>
                <SelectContent>
                  {(cashAccounts?.data ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {paymentType === "TRANSFER" && (
            <>
              <div>
                <Label>{t("bankAccount")}</Label>
                <Select value={bankAccountId} onValueChange={setBankAccountId}>
                  <SelectTrigger><SelectValue placeholder={t("bankAccount")} /></SelectTrigger>
                  <SelectContent>
                    {(bankAccounts?.data ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.bankName} — {a.accountNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("destinationBank")}</Label>
                <Input value={destinationBank} onChange={(e) => setDestinationBank(e.target.value)} />
              </div>
              <div>
                <Label>{t("destinationAccountNumber")}</Label>
                <Input
                  value={destinationAccountNumber}
                  onChange={(e) => setDestinationAccountNumber(e.target.value)}
                />
              </div>
              <div>
                <Label>{t("senderName")}</Label>
                <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} />
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/expenses")}>
          {tc("cancel")}
        </Button>
        <Button
          disabled={
            isSubmitting ||
            !chartOfAccountId ||
            (needsProject && !projectId) ||
            (!projectId && !branchId) ||
            (paymentType === "CASH" && !cashAccountId) ||
            (paymentType === "TRANSFER" && !bankAccountId)
          }
          onClick={save}
        >
          {isSubmitting ? tc("saving") : tc("create")}
        </Button>
      </div>
    </div>
  );
}
