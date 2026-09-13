"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SupplierCombobox } from "@/components/forms/supplier-combobox";
import { fetchApi } from "@/lib/api";
import { GoodsTransfer } from "@/types/api";

interface DispatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: GoodsTransfer;
  onSuccess: () => void;
}

export function DispatchDialog({ open, onOpenChange, transfer, onSuccess }: DispatchDialogProps) {
  const t = useTranslations("goodsTransfers");
  const tc = useTranslations("common");
  const [carrierSupplierId, setCarrierSupplierId] = useState(transfer.carrierSupplierId ?? "");
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState(transfer.deliveryNoteNumber ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Re-prefill every time the dialog opens (transfer may have been edited meanwhile).
  useEffect(() => {
    if (open) {
      setCarrierSupplierId(transfer.carrierSupplierId ?? "");
      setDeliveryNoteNumber(transfer.deliveryNoteNumber ?? "");
    }
  }, [open, transfer.carrierSupplierId, transfer.deliveryNoteNumber]);

  async function handleDispatch() {
    if (!carrierSupplierId) {
      toast.error(t("carrierRequired"));
      return;
    }
    setIsSubmitting(true);
    try {
      await fetchApi(`/goods-transfers/${transfer.id}/dispatch`, {
        method: "POST",
        body: JSON.stringify({
          carrierSupplierId,
          deliveryNoteNumber: deliveryNoteNumber.trim() || undefined,
        }),
      });
      toast.success(t("dispatchSuccess"));
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc("entityUpdateFailed", { entity: t("entity") }));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dispatchTitle")}</DialogTitle>
          <DialogDescription>{t("dispatchDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("carrier")} *</Label>
            <SupplierCombobox value={carrierSupplierId} onChange={setCarrierSupplierId} expeditionOnly />
            {transfer.carrierSupplier && carrierSupplierId === transfer.carrierSupplierId && (
              <p className="text-xs text-muted-foreground">{transfer.carrierSupplier.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dispatch-delivery-note">{t("deliveryNoteNumber")}</Label>
            <Input
              id="dispatch-delivery-note"
              maxLength={100}
              value={deliveryNoteNumber}
              onChange={(e) => setDeliveryNoteNumber(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {tc("cancel")}
          </Button>
          <Button onClick={handleDispatch} disabled={isSubmitting}>
            {isSubmitting ? t("dispatching") : t("dispatch")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
