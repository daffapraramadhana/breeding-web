"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { BranchCombobox } from "@/components/forms/branch-combobox";
import { CustomerCombobox } from "@/components/forms/customer-combobox";
import { ProductCombobox } from "@/components/forms/product-combobox";
import { ProjectCoopCombobox } from "@/components/forms/project-coop-combobox";
import { MatureBirdStandardCombobox } from "@/components/forms/mature-bird-standard-combobox";
import { fetchApi } from "@/lib/api";
import { Customer, RecommendedPrice } from "@/types/api";

interface SalesLine {
  productId: string;
  sourceProjectCoopId: string;
  birdCount: string;
  avgWeightKg: string;
  isCulled: boolean;
  standardId: string;
  minimumWeightKg: number | null;
  unitPrice: string;
  savingsPerKg: string;
  lineNotes: string;
  recommended: RecommendedPrice | null;
}

const EMPTY_LINE: SalesLine = {
  productId: "", sourceProjectCoopId: "", birdCount: "", avgWeightKg: "",
  isCulled: false, standardId: "", minimumWeightKg: null,
  unitPrice: "", savingsPerKg: "", lineNotes: "", recommended: null,
};

function plusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Tonase selalu turunan, sama seperti backend: birdCount x avgWeightKg. */
function tonnage(line: SalesLine) {
  if (!line.birdCount || !line.avgWeightKg) return "";
  return (Number(line.birdCount) * Number(line.avgWeightKg)).toFixed(2);
}

export default function NewSalesOrderPage() {
  const router = useRouter();
  const t = useTranslations("salesOrders");
  const tc = useTranslations("common");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [orderDate, setOrderDate] = useState(plusDays(0));
  const [validUntil, setValidUntil] = useState(plusDays(2));
  const [vatPercent, setVatPercent] = useState("0");
  const [notes, setNotes] = useState("");
  const [creditLimit, setCreditLimit] = useState<string | null>(null);
  const [topDays, setTopDays] = useState<number | null>(null);
  const [lines, setLines] = useState<SalesLine[]>([{ ...EMPTY_LINE }]);

  // Ganti area → customer yang terpilih bisa jadi tidak lagi sah di area baru.
  useEffect(() => {
    setCustomerId("");
    setRecipientName("");
    setRecipientAddress("");
    setCreditLimit(null);
    setTopDays(null);
  }, [branchId]);

  useEffect(() => {
    if (!customerId) return;
    fetchApi<Customer>(`/customers/${customerId}`)
      .then((c) => {
        setRecipientName(c.contactPerson || c.name);
        setRecipientAddress(c.address ?? "");
        setCreditLimit(c.creditLimitEnabled ? (c.creditLimit ?? null) : null);
        setTopDays(c.topDays ?? null);
      })
      .catch(() => {});
  }, [customerId]);

  function updateLine(index: number, patch: Partial<SalesLine>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  // Harga rekomendasi dimuat saat produk dan customer dua-duanya ada.
  useEffect(() => {
    lines.forEach((line, index) => {
      if (!customerId || !line.productId) {
        if (line.recommended !== null) updateLine(index, { recommended: null });
        return;
      }
      fetchApi<RecommendedPrice>(
        `/sales-orders/recommended-price?productId=${line.productId}&customerId=${customerId}`
      )
        .then((r) => updateLine(index, { recommended: r }))
        .catch(() => updateLine(index, { recommended: null }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, lines.map((l) => l.productId).join(",")]);

  async function handleSubmit() {
    if (!branchId) {
      toast.error(tc("required", { field: t("branch") }));
      return;
    }
    if (!customerId) {
      toast.error(tc("required", { field: t("customerBreeder") }));
      return;
    }
    const touched = lines.filter(
      (l) => l.productId || l.sourceProjectCoopId || l.birdCount || l.avgWeightKg
    );
    const filled = touched.filter(
      (l) => l.productId && l.sourceProjectCoopId && Number(l.birdCount) > 0 && Number(l.avgWeightKg) > 0
    );
    if (filled.length === 0 || filled.length !== touched.length) {
      toast.error(t("lineRequired"));
      return;
    }
    if (new Date(validUntil) < new Date(orderDate)) {
      toast.error(tc("required", { field: t("validUntil") }));
      return;
    }

    setIsSubmitting(true);
    try {
      // totalWeightKg dan totalPrice sengaja tidak dikirim — backend yang
      // menghitungnya, dan forbidNonWhitelisted menolak 400 kalau ikut terkirim.
      const created = await fetchApi<{ id: string }>("/sales-orders", {
        method: "POST",
        body: JSON.stringify({
          branchId,
          customerId,
          recipientType: "CUSTOMER",
          recipientName: recipientName.trim() || undefined,
          recipientAddress: recipientAddress.trim() || undefined,
          orderDate,
          validUntil,
          vatPercent: Number(vatPercent || 0),
          notes: notes.trim() || undefined,
          lines: filled.map((l) => ({
            productId: l.productId,
            sourceProjectCoopId: l.sourceProjectCoopId,
            birdCount: Number(l.birdCount),
            avgWeightKg: Number(l.avgWeightKg),
            isCulled: l.isCulled,
            minimumWeightKg: l.minimumWeightKg ?? undefined,
            savingsPerKg: l.savingsPerKg ? Number(l.savingsPerKg) : undefined,
            unitPrice: l.unitPrice ? Number(l.unitPrice) : undefined,
            lineNotes: l.lineNotes.trim() || undefined,
          })),
        }),
      });
      toast.success(tc("entityCreated", { entity: t("entity") }));
      router.push(`/sales-orders/${created.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tc("entityCreateFailed", { entity: t("entity") })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tc("newEntity", { entity: t("entity") })}
        description={t("description")}
        actions={
          <Button variant="outline" asChild>
            <Link href="/sales-orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tc("cancel")}
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("branch")}</Label>
            <BranchCombobox value={branchId} onChange={setBranchId} />
          </div>

          <div className="space-y-2">
            <Label>{t("customerBreeder")}</Label>
            <CustomerCombobox
              value={customerId}
              onChange={setCustomerId}
              branchId={branchId || undefined}
              disabled={!branchId}
            />
            <p className="text-xs text-muted-foreground">{t("customerAreaHint")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="so-recipient">{t("recipientName")}</Label>
            <Input id="so-recipient" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="so-address">{t("recipientAddress")}</Label>
            <Input id="so-address" value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="so-order-date">{t("orderDate")}</Label>
            <Input id="so-order-date" type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="so-valid-until">{t("validUntil")}</Label>
            <Input id="so-valid-until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="so-vat">{t("vatPercent")}</Label>
            <Input id="so-vat" type="number" min={0} max={100} step="0.01"
              value={vatPercent} onChange={(e) => setVatPercent(e.target.value)} />
          </div>

          <div className="space-y-2 rounded-md border p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("creditLimit")}</span>
              <span>{creditLimit ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("topDays")}</span>
              <span>{topDays ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("balance")}</span>
              <span>-</span>
            </div>
            <p className="text-xs text-muted-foreground">{t("balanceNotBuilt")}</p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="so-notes">{t("notes")}</Label>
            <Textarea id="so-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("lines")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {lines.map((line, i) => (
            <div key={i} className="space-y-3 rounded-md border p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("product")}</Label>
                  <ProductCombobox value={line.productId} onChange={(v) => updateLine(i, { productId: v })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("sourceCoop")}</Label>
                  <ProjectCoopCombobox
                    value={line.sourceProjectCoopId}
                    onChange={(v) => updateLine(i, { sourceProjectCoopId: v })}
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor={`line-birds-${i}`}>{t("birdCount")}</Label>
                  <Input id={`line-birds-${i}`} type="number" min={1} step="1"
                    value={line.birdCount} onChange={(e) => updateLine(i, { birdCount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`line-avg-${i}`}>{t("avgWeight")}</Label>
                  <Input id={`line-avg-${i}`} type="number" min={0} step="0.0001"
                    value={line.avgWeightKg} onChange={(e) => updateLine(i, { avgWeightKg: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`line-tonnage-${i}`}>{t("totalWeight")}</Label>
                  <Input id={`line-tonnage-${i}`} value={tonnage(line)} readOnly disabled />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t("minimumWeight")}</Label>
                  <MatureBirdStandardCombobox
                    value={line.standardId}
                    onChange={(id, minimum) => updateLine(i, { standardId: id, minimumWeightKg: minimum })}
                  />
                  <p className="text-xs text-muted-foreground">{line.minimumWeightKg ?? "-"}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`line-price-${i}`}>{t("unitPrice")}</Label>
                  <Input id={`line-price-${i}`} type="number" min={0} step="0.0001"
                    value={line.unitPrice} onChange={(e) => updateLine(i, { unitPrice: e.target.value })} />
                  <p className="text-xs text-muted-foreground">
                    {t("recommendedPrice")}:{" "}
                    {line.recommended?.unitPrice ?? t("noRecommendation")}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`line-savings-${i}`}>{t("savingsPerKg")}</Label>
                  <Input id={`line-savings-${i}`} type="number" min={0} step="0.01"
                    value={line.savingsPerKg} onChange={(e) => updateLine(i, { savingsPerKg: e.target.value })} />
                </div>
              </div>

              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`line-notes-${i}`}>{t("lineNotes")}</Label>
                  <Input id={`line-notes-${i}`} value={line.lineNotes}
                    onChange={(e) => updateLine(i, { lineNotes: e.target.value })} />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Checkbox
                    id={`line-culled-${i}`}
                    checked={line.isCulled}
                    onCheckedChange={(checked) => updateLine(i, { isCulled: checked === true })}
                  />
                  <Label htmlFor={`line-culled-${i}`}>{t("culled")}</Label>
                </div>
                <Button variant="ghost" size="sm" disabled={lines.length === 1}
                  onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={() => setLines((prev) => [...prev, { ...EMPTY_LINE }])}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addLine")}
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild disabled={isSubmitting}>
          <Link href="/sales-orders">{tc("cancel")}</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? tc("saving") : tc("createEntity", { entity: t("entity") })}
        </Button>
      </div>
    </div>
  );
}
