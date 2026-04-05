"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { WarehouseGroupedCombobox } from "@/components/forms/warehouse-grouped-combobox";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

function useGroupLabels() {
  const t = useTranslations("goodsTransferNew");
  return {
    BRANCH: t("ownerBranch"),
    FARM_OWN: t("ownerFarm"),
    FARM_COOP: t("ownerCoop"),
  };
}

export default function NewGoodsTransferPage() {
  const t = useTranslations("goodsTransferNew");
  const tc = useTranslations("common");
  const groupLabels = useGroupLabels();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fromWarehouseId: "",
    toWarehouseId: "",
    transferDate: "",
    notes: "",
  });
  const [lines, setLines] = useState<LineItem[]>([
    { productId: "", uomId: "", quantity: "", unitPrice: "" },
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.fromWarehouseId || !form.toWarehouseId) {
      toast.error(t("selectBothWarehouses"));
      return;
    }

    if (form.fromWarehouseId === form.toWarehouseId) {
      toast.error(t("warehouseMustDiffer"));
      return;
    }

    const validLines = lines.filter((l) => l.productId && l.quantity);
    if (validLines.length === 0) {
      toast.error(t("addLineItem"));
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        fromWarehouseId: form.fromWarehouseId,
        toWarehouseId: form.toWarehouseId,
        transferDate: form.transferDate,
        notes: form.notes || undefined,
        lines: validLines.map((l) => ({
          productId: l.productId,
          quantitySent: String(l.quantity),
          uomId: l.uomId,
        })),
      };

      const result = await fetchApi<{ id: string }>("/goods-transfers", {
        method: "POST",
        body: JSON.stringify(body),
      });

      toast.success(t("createdSuccess"));
      router.push(`/goods-transfers/${result.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("createFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <Button variant="outline" asChild>
            <Link href="/goods-transfers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("back")}
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("transferDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("fromWarehouse")} *</Label>
                <WarehouseGroupedCombobox
                  value={form.fromWarehouseId}
                  onChange={(id) =>
                    setForm((prev) => ({ ...prev, fromWarehouseId: id }))
                  }
                  groupLabels={groupLabels}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("toWarehouse")} *</Label>
                <WarehouseGroupedCombobox
                  value={form.toWarehouseId}
                  onChange={(id) =>
                    setForm((prev) => ({ ...prev, toWarehouseId: id }))
                  }
                  groupLabels={groupLabels}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="transferDate">{t("transferDate")} *</Label>
                <Input
                  id="transferDate"
                  type="date"
                  value={form.transferDate}
                  onChange={(e) =>
                    setForm({ ...form, transferDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{t("notes")}</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  placeholder={t("notesPlaceholder")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("lineItems")}</CardTitle>
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
            <Link href="/goods-transfers">{tc("cancel")}</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("creating") : t("createGoodsTransfer")}
          </Button>
        </div>
      </form>
    </div>
  );
}
