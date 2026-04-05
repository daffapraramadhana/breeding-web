"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { Delivery } from "@/types/api";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatusAction } from "@/components/shared/status-action";
import { DELIVERY_STATUS_TRANSITIONS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function DeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('deliveries');
  const tc = useTranslations('common');
  const { id } = use(params);
  const router = useRouter();
  const { data: delivery, isLoading, refetch } = useApi<Delivery>(`/deliveries/${id}`);

  if (isLoading) return <div className="p-6">{t('loading')}</div>;
  if (!delivery) return <div className="p-6">{t('notFound')}</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Delivery ${id.slice(0, 8)}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/deliveries")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tc('back')}
            </Button>
            <StatusAction
              currentStatus={delivery.status}
              transitions={DELIVERY_STATUS_TRANSITIONS}
              endpoint={`/deliveries/${id}/status`}
              onSuccess={refetch}
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">{t('deliveryInfo')}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{tc('status')}</span><StatusBadge status={delivery.status} /></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t('deliveryDate')}</span><span>{delivery.deliveryDate ? formatDate(delivery.deliveryDate) : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t('destination')}</span><span>{delivery.destinationCity || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t('route')}</span><span>{delivery.deliveryRoute || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t('totalBirds')}</span><span>{delivery.totalBirdCount ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t('totalWeight')}</span><span>{delivery.totalWeightKg ? `${delivery.totalWeightKg} kg` : "—"}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">{t('peopleVehicle')}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{t('customer')}</span><span>{delivery.customer?.name || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t('vehicle')}</span><span>{delivery.vehicle?.plateNumber || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t('driver')}</span><span>{delivery.driver?.name || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t('notes')}</span><span>{delivery.notes || "—"}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">{t('lineItems')}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t('customerDoNumber')}</TableHead>
                <TableHead>{t('birdCount')}</TableHead>
                <TableHead>{t('weightKg')}</TableHead>
                <TableHead>{t('notes')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {delivery.lines?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t('noLines')}</TableCell></TableRow>
              ) : (
                delivery.lines?.map((line, idx) => (
                  <TableRow key={line.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{line.customerDoNumber || "—"}</TableCell>
                    <TableCell>{line.birdCount ?? "—"}</TableCell>
                    <TableCell>{line.weightKg || "—"}</TableCell>
                    <TableCell>{line.deliveryNotes || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
