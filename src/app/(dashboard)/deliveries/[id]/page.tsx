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
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function DeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: delivery, isLoading, refetch } = useApi<Delivery>(`/deliveries/${id}`);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!delivery) return <div className="p-6">Delivery not found</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Delivery ${id.slice(0, 8)}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/deliveries")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
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
          <CardHeader><CardTitle className="text-sm">Delivery Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={delivery.status} /></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery Date</span><span>{delivery.deliveryDate ? formatDate(delivery.deliveryDate) : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Destination</span><span>{delivery.destinationCity || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Route</span><span>{delivery.deliveryRoute || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Birds</span><span>{delivery.totalBirdCount ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Weight</span><span>{delivery.totalWeightKg ? `${delivery.totalWeightKg} kg` : "—"}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">People & Vehicle</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{delivery.customer?.name || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Vehicle</span><span>{delivery.vehicle?.plateNumber || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Driver</span><span>{delivery.driver?.name || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Notes</span><span>{delivery.notes || "—"}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Line Items</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Customer DO Number</TableHead>
                <TableHead>Bird Count</TableHead>
                <TableHead>Weight (kg)</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {delivery.lines?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No lines</TableCell></TableRow>
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
