"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/page-header";
import { LineItemsField, LineItem } from "@/components/forms/line-items-field";
import { BranchCombobox } from "@/components/forms/branch-combobox";
import { SupplierCombobox } from "@/components/forms/supplier-combobox";
import { WarehouseCombobox } from "@/components/forms/warehouse-combobox";
import { fetchApi, fetchPaginated } from "@/lib/api";
import { PurchaseOrder } from "@/types/api";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function NewGoodsReceiptPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [form, setForm] = useState({
    purchaseOrderId: "",
    branchId: "",
    supplierId: "",
    warehouseId: "",
    notes: "",
  });
  const [lines, setLines] = useState<LineItem[]>([]);

  useEffect(() => {
    fetchPaginated<PurchaseOrder>("/purchase-orders", { limit: 100 })
      .then((res) => setPurchaseOrders(res.data.filter((po) => po.status === "ORDERED" || po.status === "RECEIVED")))
      .catch(() => {});
  }, []);

  // Auto-fill lines from selected PO
  useEffect(() => {
    if (!form.purchaseOrderId) return;
    fetchApi<PurchaseOrder>(`/purchase-orders/${form.purchaseOrderId}`)
      .then((po) => {
        if (po.lines) {
          setLines(
            po.lines.map((line) => ({
              productId: line.productId,
              productCode: line.product?.code,
              productName: line.product?.name,
              uomId: line.uomId,
              uomName: line.uom?.name,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
            }))
          );
        }
        // Auto-fill supplier and branch from PO
        if (po.supplierId) {
          setForm((prev) => ({ ...prev, supplierId: po.supplierId }));
        }
        if (po.branchId) {
          setForm((prev) => ({ ...prev, branchId: po.branchId }));
        }
      })
      .catch(() => {});
  }, [form.purchaseOrderId]);

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
        purchaseOrderId: form.purchaseOrderId,
        branchId: form.branchId,
        supplierId: form.supplierId || undefined,
        warehouseId: form.warehouseId,
        notes: form.notes || undefined,
        lines: validLines.map((l) => ({
          productId: l.productId,
          uomId: l.uomId,
          quantitySent: l.quantity,
          quantityReceived: l.quantity,
          quantityDamaged: "0",
        })),
      };

      const result = await fetchApi<{ id: string }>("/goods-receipts", {
        method: "POST",
        body: JSON.stringify(body),
      });

      toast.success("Goods Receipt created successfully");
      router.push(`/goods-receipts/${result.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create GR");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Goods Receipt"
        actions={
          <Button variant="outline" asChild>
            <Link href="/goods-receipts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Receipt Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Purchase Order *</Label>
              <Select
                value={form.purchaseOrderId}
                onValueChange={(v) =>
                  setForm({ ...form, purchaseOrderId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select PO..." />
                </SelectTrigger>
                <SelectContent>
                  {purchaseOrders.map((po) => (
                    <SelectItem key={po.id} value={po.id}>
                      {po.poNumber} - {po.supplier?.name || "—"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Warehouse *</Label>
              <WarehouseCombobox
                value={form.warehouseId}
                onChange={(id) => setForm({ ...form, warehouseId: id })}
              />
            </div>
            <div className="space-y-2">
              <Label>Branch *</Label>
              <BranchCombobox
                value={form.branchId}
                onChange={(id) => setForm({ ...form, branchId: id })}
              />
            </div>
            <div className="space-y-2">
              <Label>Supplier</Label>
              <SupplierCombobox
                value={form.supplierId}
                onChange={(id) => setForm({ ...form, supplierId: id })}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
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
              showPrice
              priceLabel="Unit Cost"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/goods-receipts">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Goods Receipt"}
          </Button>
        </div>
      </form>
    </div>
  );
}
