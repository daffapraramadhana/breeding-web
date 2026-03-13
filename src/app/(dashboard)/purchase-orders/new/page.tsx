"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { SupplierCombobox } from "@/components/forms/supplier-combobox";
import { BranchCombobox } from "@/components/forms/branch-combobox";
import { WarehouseCombobox } from "@/components/forms/warehouse-combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    supplierId: "",
    branchId: "",
    destinationType: "" as string,
    destinationWarehouseId: "",
    orderDate: "",
    expectedArrivalDate: "",
    notes: "",
  });
  const [lines, setLines] = useState<LineItem[]>([
    { productId: "", uomId: "", quantity: "", unitPrice: "" },
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.supplierId) {
      toast.error("Please select a supplier");
      return;
    }
    if (!form.branchId) {
      toast.error("Please select a branch");
      return;
    }
    if (!form.destinationType) {
      toast.error("Please select a destination type");
      return;
    }
    if (!form.destinationWarehouseId) {
      toast.error("Please select a destination warehouse");
      return;
    }

    const validLines = lines.filter((l) => l.productId && l.quantity);
    if (validLines.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        supplierId: form.supplierId,
        branchId: form.branchId,
        destinationType: form.destinationType || undefined,
        destinationWarehouseId: form.destinationWarehouseId || undefined,
        orderDate: form.orderDate,
        expectedArrivalDate: form.expectedArrivalDate || undefined,
        notes: form.notes || undefined,
        lines: validLines.map((l) => ({
          productId: l.productId,
          uomId: l.uomId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      };

      const result = await fetchApi<{ id: string }>("/purchase-orders", {
        method: "POST",
        body: JSON.stringify(body),
      });

      toast.success("Purchase Order created successfully");
      router.push(`/purchase-orders/${result.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create PO");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Purchase Order"
        actions={
          <Button variant="outline" asChild>
            <Link href="/purchase-orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <SupplierCombobox
                value={form.supplierId}
                onChange={(id) => setForm({ ...form, supplierId: id })}
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
              <Label>Destination Type *</Label>
              <Select
                value={form.destinationType}
                onValueChange={(val) =>
                  setForm({ ...form, destinationType: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRANCH">Branch</SelectItem>
                  <SelectItem value="FARM">Farm</SelectItem>
                  <SelectItem value="COOP">Coop</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Destination Warehouse *</Label>
              <WarehouseCombobox
                value={form.destinationWarehouseId}
                onChange={(id) =>
                  setForm({ ...form, destinationWarehouseId: id })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderDate">Order Date *</Label>
              <Input
                id="orderDate"
                type="date"
                value={form.orderDate}
                onChange={(e) =>
                  setForm({ ...form, orderDate: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedArrivalDate">Expected Arrival Date</Label>
              <Input
                id="expectedArrivalDate"
                type="date"
                value={form.expectedArrivalDate}
                onChange={(e) =>
                  setForm({ ...form, expectedArrivalDate: e.target.value })
                }
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
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
              priceLabel="Unit Price"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/purchase-orders">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Purchase Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}
