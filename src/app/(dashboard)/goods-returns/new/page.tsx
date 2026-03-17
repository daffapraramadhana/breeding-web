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
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function NewGoodsReturnPage() {
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
      toast.error("Please add at least one line item");
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

      toast.success("Goods Return created successfully");
      router.push(`/goods-returns/${result.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create goods return"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Goods Return"
        actions={
          <Button variant="outline" asChild>
            <Link href="/goods-returns">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Return Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Branch *</Label>
              <BranchCombobox
                value={form.branchId}
                onChange={(v) => setForm({ ...form, branchId: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>Supplier</Label>
              <SupplierCombobox
                value={form.supplierId}
                onChange={(v) => setForm({ ...form, supplierId: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>Warehouse *</Label>
              <WarehouseCombobox
                value={form.warehouseId}
                onChange={(v) => setForm({ ...form, warehouseId: v })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseOrderId">Purchase Order ID</Label>
              <Input
                id="purchaseOrderId"
                value={form.purchaseOrderId}
                onChange={(e) =>
                  setForm({ ...form, purchaseOrderId: e.target.value })
                }
                placeholder="Reference PO ID..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
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
            <Link href="/goods-returns">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Goods Return"}
          </Button>
        </div>
      </form>
    </div>
  );
}
