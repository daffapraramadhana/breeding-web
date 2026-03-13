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
import { WarehouseCombobox } from "@/components/forms/warehouse-combobox";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function NewGoodsConsumptionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    branchId: "",
    warehouseId: "",
    purpose: "",
    consumptionDate: "",
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
        warehouseId: form.warehouseId,
        purpose: form.purpose || undefined,
        consumptionDate: form.consumptionDate || undefined,
        notes: form.notes || undefined,
        lines: validLines.map((l) => ({
          productId: l.productId,
          uomId: l.uomId || undefined,
          quantity: l.quantity,
          unitCost: l.unitPrice || undefined,
        })),
      };

      const result = await fetchApi<{ id: string }>("/goods-consumptions", {
        method: "POST",
        body: JSON.stringify(body),
      });

      toast.success("Goods Consumption created successfully");
      router.push(`/goods-consumptions/${result.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create goods consumption"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Goods Consumption"
        actions={
          <Button variant="outline" asChild>
            <Link href="/goods-consumptions">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Consumption Details</CardTitle>
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
              <Label>Warehouse *</Label>
              <WarehouseCombobox
                value={form.warehouseId}
                onChange={(v) => setForm({ ...form, warehouseId: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>Purpose</Label>
              <Select
                value={form.purpose}
                onValueChange={(v) => setForm({ ...form, purpose: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRODUCTION">Production</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="consumptionDate">Consumption Date</Label>
              <Input
                id="consumptionDate"
                type="date"
                value={form.consumptionDate}
                onChange={(e) =>
                  setForm({ ...form, consumptionDate: e.target.value })
                }
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
              showPrice
              priceLabel="Unit Cost"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/goods-consumptions">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Goods Consumption"}
          </Button>
        </div>
      </form>
    </div>
  );
}
