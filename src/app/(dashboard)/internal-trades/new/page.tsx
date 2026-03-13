"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function NewInternalTradePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    branchId: "",
    fromWarehouseId: "",
    toWarehouseId: "",
    notes: "",
  });
  const [lines, setLines] = useState<LineItem[]>([
    { productId: "", uomId: "", quantity: "", unitPrice: "" },
  ]);

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
        branchId: form.branchId,
        fromWarehouseId: form.fromWarehouseId,
        toWarehouseId: form.toWarehouseId,
        notes: form.notes || undefined,
        lines: validLines.map((l) => ({
          productId: l.productId,
          uomId: l.uomId || undefined,
          quantity: l.quantity,
          unitPrice: l.unitPrice || undefined,
        })),
      };

      const result = await fetchApi<{ id: string }>("/internal-trades", {
        method: "POST",
        body: JSON.stringify(body),
      });

      toast.success("Internal Trade created successfully");
      router.push(`/internal-trades/${result.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create internal trade"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Internal Trade"
        actions={
          <Button variant="outline" asChild>
            <Link href="/internal-trades">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Trade Details</CardTitle>
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
              <Label>From Warehouse *</Label>
              <WarehouseCombobox
                value={form.fromWarehouseId}
                onChange={(v) => setForm({ ...form, fromWarehouseId: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>To Warehouse *</Label>
              <WarehouseCombobox
                value={form.toWarehouseId}
                onChange={(v) => setForm({ ...form, toWarehouseId: v })}
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
              showPrice
              priceLabel="Unit Price"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/internal-trades">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Internal Trade"}
          </Button>
        </div>
      </form>
    </div>
  );
}
