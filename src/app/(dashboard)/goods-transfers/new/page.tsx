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
import { Warehouse } from "@/types/api";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function NewGoodsTransferPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [form, setForm] = useState({
    fromWarehouseId: "",
    toWarehouseId: "",
    transferDate: "",
    notes: "",
  });
  const [lines, setLines] = useState<LineItem[]>([
    { productId: "", uomId: "", quantity: "", unitPrice: "" },
  ]);

  useEffect(() => {
    fetchPaginated<Warehouse>("/warehouses", { limit: 100 })
      .then((res) => setWarehouses(res.data))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.fromWarehouseId === form.toWarehouseId) {
      toast.error("Source and destination warehouse must be different");
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
        fromWarehouseId: form.fromWarehouseId,
        toWarehouseId: form.toWarehouseId,
        transferDate: form.transferDate,
        notes: form.notes || undefined,
        lines: validLines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          uomId: l.uomId,
        })),
      };

      const result = await fetchApi<{ id: string }>("/goods-transfers", {
        method: "POST",
        body: JSON.stringify(body),
      });

      toast.success("Goods Transfer created successfully");
      router.push(`/goods-transfers/${result.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create goods transfer"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Goods Transfer"
        actions={
          <Button variant="outline" asChild>
            <Link href="/goods-transfers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>From Warehouse *</Label>
              <Select
                value={form.fromWarehouseId}
                onValueChange={(v) =>
                  setForm({ ...form, fromWarehouseId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source warehouse..." />
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
              <Label>To Warehouse *</Label>
              <Select
                value={form.toWarehouseId}
                onValueChange={(v) =>
                  setForm({ ...form, toWarehouseId: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination warehouse..." />
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
              <Label htmlFor="transferDate">Transfer Date *</Label>
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
            <Link href="/goods-transfers">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Goods Transfer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
