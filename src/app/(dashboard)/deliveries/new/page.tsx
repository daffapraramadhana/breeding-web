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
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

interface DeliveryLine {
  customerDoNumber: string;
  birdCount: string;
  weightKg: string;
  deliveryNotes: string;
}

export default function NewDeliveryPage() {
  const t = useTranslations('deliveries');
  const tc = useTranslations('common');
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
      toast.error(t('pleaseFillSalesOrder'));
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

      toast.success(tc('entityCreated', { entity: t('entity') }));
      router.push(`/deliveries/${result.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc('entityCreateFailed', { entity: t('entity') }));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={tc('createEntity', { entity: t('entity') })}
        actions={
          <Button variant="outline" asChild>
            <Link href="/deliveries">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tc('back')}
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('deliveryDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="salesOrderId">{t('salesOrderId')} *</Label>
              <Input
                id="salesOrderId"
                value={form.salesOrderId}
                onChange={(e) => setForm({ ...form, salesOrderId: e.target.value })}
                placeholder={t('enterSalesOrderId')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('customer')}</Label>
              <CustomerCombobox
                value={form.customerId}
                onChange={(id) => setForm({ ...form, customerId: id })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleId">{t('vehicleId')}</Label>
              <Input
                id="vehicleId"
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                placeholder={t('enterVehicleId')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('driver')}</Label>
              <EmployeeCombobox
                value={form.driverEmployeeId}
                onChange={(id) => setForm({ ...form, driverEmployeeId: id })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('helper')}</Label>
              <EmployeeCombobox
                value={form.helperEmployeeId}
                onChange={(id) => setForm({ ...form, helperEmployeeId: id })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryDate">{t('deliveryDate')}</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={form.deliveryDate}
                onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destinationCity">{t('destinationCity')}</Label>
              <Input
                id="destinationCity"
                value={form.destinationCity}
                onChange={(e) => setForm({ ...form, destinationCity: e.target.value })}
                placeholder={t('enterDestinationCity')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('notes')}</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={t('additionalNotes')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('lineItems')}</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="mr-2 h-4 w-4" />
                {t('addLine')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lines.map((line, idx) => (
                <div key={idx} className="grid gap-3 md:grid-cols-5 items-end border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <Label className="text-xs">{t('customerDoNumber')}</Label>
                    <Input
                      value={line.customerDoNumber}
                      onChange={(e) => updateLine(idx, "customerDoNumber", e.target.value)}
                      placeholder={t('doNumber')}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('birdCount')}</Label>
                    <Input
                      type="number"
                      value={line.birdCount}
                      onChange={(e) => updateLine(idx, "birdCount", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('weightKg')}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={line.weightKg}
                      onChange={(e) => updateLine(idx, "weightKg", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('deliveryNotes')}</Label>
                    <Input
                      value={line.deliveryNotes}
                      onChange={(e) => updateLine(idx, "deliveryNotes", e.target.value)}
                      placeholder={t('notes')}
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
            <Link href="/deliveries">{tc('cancel')}</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? tc('saving') : tc('createEntity', { entity: t('entity') })}
          </Button>
        </div>
      </form>
    </div>
  );
}
