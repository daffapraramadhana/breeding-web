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
import { CustomerCombobox } from "@/components/forms/customer-combobox";
import { EmployeeCombobox } from "@/components/forms/employee-combobox";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface DeliveryLine {
  customerDoNumber: string;
  birdCount: string;
  weightKg: string;
  deliveryNotes: string;
}

export default function NewDeliveryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    salesOrderId: "",
    customerId: "",
    vehicleId: "",
    driverEmployeeId: "",
    helperEmployeeId: "",
    deliveryDate: "",
    destinationCity: "",
    notes: "",
  });
  const [lines, setLines] = useState<DeliveryLine[]>([
    { customerDoNumber: "", birdCount: "", weightKg: "", deliveryNotes: "" },
  ]);

  function addLine() {
    setLines([...lines, { customerDoNumber: "", birdCount: "", weightKg: "", deliveryNotes: "" }]);
  }

  function removeLine(index: number) {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof DeliveryLine, value: string) {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.salesOrderId) {
      toast.error("Please enter a sales order ID");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        salesOrderId: form.salesOrderId,
        customerId: form.customerId || undefined,
        vehicleId: form.vehicleId || undefined,
        driverEmployeeId: form.driverEmployeeId || undefined,
        helperEmployeeId: form.helperEmployeeId || undefined,
        deliveryDate: form.deliveryDate || undefined,
        destinationCity: form.destinationCity || undefined,
        notes: form.notes || undefined,
        lines: lines
          .filter((l) => l.customerDoNumber || l.birdCount || l.weightKg)
          .map((l) => ({
            customerDoNumber: l.customerDoNumber || undefined,
            birdCount: l.birdCount ? Number(l.birdCount) : undefined,
            weightKg: l.weightKg || undefined,
            deliveryNotes: l.deliveryNotes || undefined,
          })),
      };

      const result = await fetchApi<{ id: string }>("/deliveries", {
        method: "POST",
        body: JSON.stringify(body),
      });

      toast.success("Delivery created successfully");
      router.push(`/deliveries/${result.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create delivery");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Delivery"
        actions={
          <Button variant="outline" asChild>
            <Link href="/deliveries">
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
              <Label htmlFor="salesOrderId">Sales Order ID *</Label>
              <Input
                id="salesOrderId"
                value={form.salesOrderId}
                onChange={(e) => setForm({ ...form, salesOrderId: e.target.value })}
                placeholder="Enter sales order ID"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <CustomerCombobox
                value={form.customerId}
                onChange={(id) => setForm({ ...form, customerId: id })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleId">Vehicle ID</Label>
              <Input
                id="vehicleId"
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                placeholder="Enter vehicle ID"
              />
            </div>
            <div className="space-y-2">
              <Label>Driver</Label>
              <EmployeeCombobox
                value={form.driverEmployeeId}
                onChange={(id) => setForm({ ...form, driverEmployeeId: id })}
              />
            </div>
            <div className="space-y-2">
              <Label>Helper</Label>
              <EmployeeCombobox
                value={form.helperEmployeeId}
                onChange={(id) => setForm({ ...form, helperEmployeeId: id })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Delivery Date</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={form.deliveryDate}
                onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destinationCity">Destination City</Label>
              <Input
                id="destinationCity"
                value={form.destinationCity}
                onChange={(e) => setForm({ ...form, destinationCity: e.target.value })}
                placeholder="Enter destination city"
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
                <div key={idx} className="grid gap-3 md:grid-cols-5 items-end border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <Label className="text-xs">Customer DO Number</Label>
                    <Input
                      value={line.customerDoNumber}
                      onChange={(e) => updateLine(idx, "customerDoNumber", e.target.value)}
                      placeholder="DO Number"
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
                    <Label className="text-xs">Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.weightKg}
                      onChange={(e) => updateLine(idx, "weightKg", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Delivery Notes</Label>
                    <Input
                      value={line.deliveryNotes}
                      onChange={(e) => updateLine(idx, "deliveryNotes", e.target.value)}
                      placeholder="Notes"
                    />
                  </div>
                  <div className="flex items-end">
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
            <Link href="/deliveries">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Delivery"}
          </Button>
        </div>
      </form>
    </div>
  );
}
