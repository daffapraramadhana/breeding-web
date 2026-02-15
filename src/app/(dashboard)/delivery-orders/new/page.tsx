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
import { fetchApi, fetchPaginated } from "@/lib/api";
import { SalesOrder, Warehouse } from "@/types/api";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function NewDeliveryOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [form, setForm] = useState({
    salesOrderId: "",
    warehouseId: "",
    deliveryDate: "",
    notes: "",
  });
  const [lines, setLines] = useState<LineItem[]>([]);

  useEffect(() => {
    fetchPaginated<SalesOrder>("/sales-orders", { limit: 100 })
      .then((res) =>
        setSalesOrders(
          res.data.filter(
            (so) => so.status === "APPROVED" || so.status === "PROCESSED"
          )
        )
      )
      .catch(() => {});
    fetchPaginated<Warehouse>("/warehouses", { limit: 100 })
      .then((res) => setWarehouses(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.salesOrderId) return;
    fetchApi<SalesOrder>(`/sales-orders/${form.salesOrderId}`)
      .then((so) => {
        if (so.lines) {
          setLines(
            so.lines.map((line) => ({
              itemId: line.itemId,
              itemCode: line.item?.code,
              itemName: line.item?.name,
              quantity: line.quantity,
              uomName: line.uomName,
              unitPrice: "",
            }))
          );
        }
      })
      .catch(() => {});
  }, [form.salesOrderId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validLines = lines.filter((l) => l.itemId && l.quantity);
    if (validLines.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        salesOrderId: form.salesOrderId,
        warehouseId: form.warehouseId,
        deliveryDate: form.deliveryDate,
        notes: form.notes || undefined,
        lines: validLines.map((l) => ({
          itemId: l.itemId,
          quantity: l.quantity,
          uomName: l.uomName,
          ...(l.batchId && { batchId: l.batchId }),
        })),
      };

      const result = await fetchApi<{ id: string }>("/delivery-orders", {
        method: "POST",
        body: JSON.stringify(body),
      });

      toast.success("Delivery Order created successfully");
      router.push(`/delivery-orders/${result.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create DO");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Delivery Order"
        actions={
          <Button variant="outline" asChild>
            <Link href="/delivery-orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Sales Order *</Label>
              <Select
                value={form.salesOrderId}
                onValueChange={(v) =>
                  setForm({ ...form, salesOrderId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select SO..." />
                </SelectTrigger>
                <SelectContent>
                  {salesOrders.map((so) => (
                    <SelectItem key={so.id} value={so.id}>
                      {so.soNumber} - {so.customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Warehouse *</Label>
              <Select
                value={form.warehouseId}
                onValueChange={(v) => setForm({ ...form, warehouseId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse..." />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.code} - {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Delivery Date *</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={form.deliveryDate}
                onChange={(e) =>
                  setForm({ ...form, deliveryDate: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
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
              showBatch
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/delivery-orders">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Delivery Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}
