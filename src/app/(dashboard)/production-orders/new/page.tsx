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

export default function NewProductionOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [form, setForm] = useState({
    warehouseId: "",
    productionDate: "",
    notes: "",
  });
  const [inputs, setInputs] = useState<LineItem[]>([
    { itemId: "", quantity: "", uomName: "", unitPrice: "" },
  ]);
  const [outputs, setOutputs] = useState<LineItem[]>([
    { itemId: "", quantity: "", uomName: "", unitPrice: "" },
  ]);

  useEffect(() => {
    fetchPaginated<Warehouse>("/warehouses", { limit: 100 })
      .then((res) => setWarehouses(res.data))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validInputs = inputs.filter((l) => l.itemId && l.quantity);
    const validOutputs = outputs.filter((l) => l.itemId && l.quantity);

    if (validInputs.length === 0) {
      toast.error("Please add at least one input item");
      return;
    }
    if (validOutputs.length === 0) {
      toast.error("Please add at least one output item");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        warehouseId: form.warehouseId,
        productionDate: form.productionDate,
        notes: form.notes || undefined,
        inputs: validInputs.map((l) => ({
          itemId: l.itemId,
          quantity: l.quantity,
          uomName: l.uomName,
          ...(l.batchId && { batchId: l.batchId }),
        })),
        outputs: validOutputs.map((l) => ({
          itemId: l.itemId,
          quantity: l.quantity,
          uomName: l.uomName,
          ...(l.batchId && { batchId: l.batchId }),
        })),
      };

      const result = await fetchApi<{ id: string }>("/production-orders", {
        method: "POST",
        body: JSON.stringify(body),
      });

      toast.success("Production Order created successfully");
      router.push(`/production-orders/${result.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create production order"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Production Order"
        actions={
          <Button variant="outline" asChild>
            <Link href="/production-orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Production Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
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
              <Label htmlFor="productionDate">Production Date *</Label>
              <Input
                id="productionDate"
                type="date"
                value={form.productionDate}
                onChange={(e) =>
                  setForm({ ...form, productionDate: e.target.value })
                }
                required
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
            <CardTitle>Input Materials (Consumed)</CardTitle>
          </CardHeader>
          <CardContent>
            <LineItemsField
              lines={inputs}
              onChange={setInputs}
              showPrice={false}
              showBatch
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Output Products (Produced)</CardTitle>
          </CardHeader>
          <CardContent>
            <LineItemsField
              lines={outputs}
              onChange={setOutputs}
              showPrice={false}
              showBatch
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/production-orders">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Production Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}
