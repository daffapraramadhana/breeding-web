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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageHeader } from "@/components/shared/page-header";
import { LineItemsField, LineItem } from "@/components/forms/line-items-field";
import { WarehouseCombobox } from "@/components/forms/warehouse-combobox";
import { fetchApi } from "@/lib/api";
import { WarehouseOwnerType } from "@/types/api";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const OWNER_TYPE_LABELS: Record<WarehouseOwnerType, string> = {
  BRANCH: "Cabang",
  FARM: "Farm",
  COOP: "Kandang Ownfarm",
};

export default function NewGoodsTransferPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    fromOwnerType: "" as WarehouseOwnerType | "",
    fromWarehouseId: "",
    toOwnerType: "" as WarehouseOwnerType | "",
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
      toast.error("Please select both source and destination warehouse");
      return;
    }

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
          quantitySent: String(l.quantity),
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
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <Label>From Warehouse *</Label>
                <RadioGroup
                  value={form.fromOwnerType}
                  onValueChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      fromOwnerType: v as WarehouseOwnerType,
                      fromWarehouseId: "",
                    }))
                  }
                  className="flex gap-4"
                >
                  {(Object.keys(OWNER_TYPE_LABELS) as WarehouseOwnerType[]).map(
                    (type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <RadioGroupItem value={type} id={`from-${type}`} />
                        <Label
                          htmlFor={`from-${type}`}
                          className="cursor-pointer font-normal"
                        >
                          {OWNER_TYPE_LABELS[type]}
                        </Label>
                      </div>
                    )
                  )}
                </RadioGroup>
                {form.fromOwnerType && (
                  <WarehouseCombobox
                    value={form.fromWarehouseId}
                    onChange={(id) =>
                      setForm((prev) => ({ ...prev, fromWarehouseId: id }))
                    }
                    ownerType={form.fromOwnerType}
                  />
                )}
              </div>

              <div className="space-y-3">
                <Label>To Warehouse *</Label>
                <RadioGroup
                  value={form.toOwnerType}
                  onValueChange={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      toOwnerType: v as WarehouseOwnerType,
                      toWarehouseId: "",
                    }))
                  }
                  className="flex gap-4"
                >
                  {(Object.keys(OWNER_TYPE_LABELS) as WarehouseOwnerType[]).map(
                    (type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <RadioGroupItem value={type} id={`to-${type}`} />
                        <Label
                          htmlFor={`to-${type}`}
                          className="cursor-pointer font-normal"
                        >
                          {OWNER_TYPE_LABELS[type]}
                        </Label>
                      </div>
                    )
                  )}
                </RadioGroup>
                {form.toOwnerType && (
                  <WarehouseCombobox
                    value={form.toWarehouseId}
                    onChange={(id) =>
                      setForm((prev) => ({ ...prev, toWarehouseId: id }))
                    }
                    ownerType={form.toOwnerType}
                  />
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
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
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  placeholder="Additional notes..."
                />
              </div>
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
