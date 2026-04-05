"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { LineItemsField, LineItem } from "@/components/forms/line-items-field";
import { BranchCombobox } from "@/components/forms/branch-combobox";
import { WarehouseCombobox } from "@/components/forms/warehouse-combobox";
import { SupplierCombobox } from "@/components/forms/supplier-combobox";
import { fetchApi } from "@/lib/api";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function NewGoodsReturnPage() {
  const t = useTranslations('goodsReturns');
  const tc = useTranslations('common');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    branchId: "",
    supplierId: "",
    warehouseId: "",
    purchaseOrderId: "",
    notes: "",
  });
  const [lines, setLines] = useState<LineItem[]>([
    { productId: "", uomId: "", quantity: "", unitPrice: "" },
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validLines = lines.filter((l) => l.productId && l.quantity);
    if (validLines.length === 0) {
      toast.error(t('addLineItem'));
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        branchId: form.branchId,
        supplierId: form.supplierId || undefined,
        warehouseId: form.warehouseId,
        purchaseOrderId: form.purchaseOrderId || undefined,
        notes: form.notes || undefined,
        lines: validLines.map((l) => ({
          productId: l.productId,
          uomId: l.uomId || undefined,
          quantity: l.quantity,
          reason: l.unitPrice || undefined,
        })),
      };

      const result = await fetchApi<{ id: string }>("/goods-returns", {
        method: "POST",
        body: JSON.stringify(body),
      });

      toast.success(tc('entityCreated', { entity: t('entity') }));
      router.push(`/goods-returns/${result.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : tc('entityCreateFailed', { entity: t('entity') })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tc('createEntity', { entity: t('entity') })}
        actions={
          <Button variant="outline" asChild>
            <Link href="/goods-returns">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tc('back')}
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('returnDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('branch')} *</Label>
              <BranchCombobox
                value={form.branchId}
                onChange={(v) => setForm({ ...form, branchId: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('supplier')}</Label>
              <SupplierCombobox
                value={form.supplierId}
                onChange={(v) => setForm({ ...form, supplierId: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('warehouse')} *</Label>
              <WarehouseCombobox
                value={form.warehouseId}
                onChange={(v) => setForm({ ...form, warehouseId: v })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseOrderId">{t('purchaseOrderId')}</Label>
              <Input
                id="purchaseOrderId"
                value={form.purchaseOrderId}
                onChange={(e) =>
                  setForm({ ...form, purchaseOrderId: e.target.value })
                }
                placeholder={t('referencePo')}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={t('additionalNotes')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('lineItems')}</CardTitle>
          </CardHeader>
          <CardContent>
            <LineItemsField
              lines={lines}
              onChange={setLines}
              showPrice={false}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/goods-returns">{tc('cancel')}</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? tc('saving') : tc('createEntity', { entity: t('entity') })}
          </Button>
        </div>
      </form>
    </div>
  );
}
