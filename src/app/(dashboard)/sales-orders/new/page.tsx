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
import { BranchCombobox } from "@/components/forms/branch-combobox";
import { ProjectCombobox } from "@/components/forms/project-combobox";
import { CustomerCombobox } from "@/components/forms/customer-combobox";
import { BreederCombobox } from "@/components/forms/breeder-combobox";
import { fetchApi } from "@/lib/api";
import { RecipientType } from "@/types/api";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface SalesLine {
  productDescription: string;
  birdCount: string;
  totalWeightKg: string;
  unitPrice: string;
  totalPrice: string;
}

export default function NewSalesOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    branchId: "",
    projectId: "",
    recipientType: "" as RecipientType | "",
    customerId: "",
    breederId: "",
    contractPrice: "",
    marketPrice: "",
    paymentMethod: "",
    notes: "",
  });
  const [lines, setLines] = useState<SalesLine[]>([
    { productDescription: "", birdCount: "", totalWeightKg: "", unitPrice: "", totalPrice: "" },
  ]);

  function addLine() {
    setLines([...lines, { productDescription: "", birdCount: "", totalWeightKg: "", unitPrice: "", totalPrice: "" }]);
  }

  function removeLine(index: number) {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof SalesLine, value: string) {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.branchId) {
      toast.error("Please select a branch");
      return;
    }
    if (!form.recipientType) {
      toast.error("Please select a recipient type");
      return;
    }
    if (form.recipientType === "CUSTOMER" && !form.customerId) {
      toast.error("Please select a customer");
      return;
    }
    if (form.recipientType === "BREEDER" && !form.breederId) {
      toast.error("Please select a breeder");
      return;
    }

    const validLines = lines.filter((l) => l.productDescription);
    if (validLines.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        branchId: form.branchId,
        projectId: form.projectId || undefined,
        recipientType: form.recipientType,
        customerId: form.recipientType === "CUSTOMER" ? form.customerId : undefined,
        breederId: form.recipientType === "BREEDER" ? form.breederId : undefined,
        contractPrice: form.contractPrice || undefined,
        marketPrice: form.marketPrice || undefined,
        paymentMethod: form.paymentMethod || undefined,
        notes: form.notes || undefined,
        lines: validLines.map((l) => ({
          productDescription: l.productDescription,
          birdCount: l.birdCount ? Number(l.birdCount) : undefined,
          totalWeightKg: l.totalWeightKg || undefined,
          unitPrice: l.unitPrice || undefined,
          totalPrice: l.totalPrice || undefined,
        })),
      };

      const result = await fetchApi<{ id: string }>("/sales-orders", {
        method: "POST",
        body: JSON.stringify(body),
      });

      toast.success("Sales Order created successfully");
      router.push(`/sales-orders/${result.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create SO");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Sales Order"
        actions={
          <Button variant="outline" asChild>
            <Link href="/sales-orders">
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
              <Label>Branch *</Label>
              <BranchCombobox
                value={form.branchId}
                onChange={(id) => setForm({ ...form, branchId: id })}
              />
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <ProjectCombobox
                value={form.projectId}
                onChange={(id) => setForm({ ...form, projectId: id })}
              />
            </div>
            <div className="space-y-2">
              <Label>Recipient Type *</Label>
              <Select
                value={form.recipientType}
                onValueChange={(v) =>
                  setForm({ ...form, recipientType: v as RecipientType, customerId: "", breederId: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUSTOMER">Customer</SelectItem>
                  <SelectItem value="BREEDER">Breeder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.recipientType === "CUSTOMER" && (
              <div className="space-y-2">
                <Label>Customer *</Label>
                <CustomerCombobox
                  value={form.customerId}
                  onChange={(id) => setForm({ ...form, customerId: id })}
                />
              </div>
            )}
            {form.recipientType === "BREEDER" && (
              <div className="space-y-2">
                <Label>Breeder *</Label>
                <BreederCombobox
                  value={form.breederId}
                  onChange={(id) => setForm({ ...form, breederId: id })}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="contractPrice">Contract Price</Label>
              <Input
                id="contractPrice"
                type="number"
                step="0.01"
                value={form.contractPrice}
                onChange={(e) => setForm({ ...form, contractPrice: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marketPrice">Market Price</Label>
              <Input
                id="marketPrice"
                type="number"
                step="0.01"
                value={form.marketPrice}
                onChange={(e) => setForm({ ...form, marketPrice: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={form.paymentMethod}
                onValueChange={(v) => setForm({ ...form, paymentMethod: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CHECK">Check</SelectItem>
                  <SelectItem value="GIRO">Giro</SelectItem>
                </SelectContent>
              </Select>
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
            <div className="flex items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="mr-2 h-4 w-4" />
                Add Line
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lines.map((line, idx) => (
                <div key={idx} className="grid gap-3 md:grid-cols-6 items-end border-b pb-4 last:border-0">
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs">Product Description</Label>
                    <Input
                      value={line.productDescription}
                      onChange={(e) => updateLine(idx, "productDescription", e.target.value)}
                      placeholder="Product description"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Bird Count</Label>
                    <Input
                      type="number"
                      value={line.birdCount}
                      onChange={(e) => updateLine(idx, "birdCount", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Total Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.totalWeightKg}
                      onChange={(e) => updateLine(idx, "totalWeightKg", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unit Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) => updateLine(idx, "unitPrice", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Total Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={line.totalPrice}
                        onChange={(e) => updateLine(idx, "totalPrice", e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    {lines.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(idx)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/sales-orders">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Sales Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}
