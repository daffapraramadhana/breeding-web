"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatusAction } from "@/components/shared/status-action";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { useApi } from "@/hooks/use-api";
import { SalesOrder } from "@/types/api";
import { SALES_STATUS_TRANSITIONS } from "@/lib/constants";
import { fetchApi } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function SalesOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: so, isLoading, refetch } = useApi<SalesOrder>(
    `/sales-orders/${id}`
  );
  const [showDelete, setShowDelete] = useState(false);

  if (isLoading) return <PageSkeleton />;
  if (!so) return <div>Sales Order not found</div>;

  async function handleDelete() {
    try {
      await fetchApi(`/sales-orders/${id}`, { method: "DELETE" });
      toast.success("Sales Order deleted");
      router.push("/sales-orders");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const recipientName =
    so.recipientType === "BREEDER"
      ? so.breeder?.name
      : so.customer?.name;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`SO: ${so.doNumber || so.id.slice(0, 8)}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/sales-orders">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            {so.status === "PENDING_APPROVAL" && (
              <Button
                variant="destructive"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            <StatusAction
              currentStatus={so.status}
              transitions={SALES_STATUS_TRANSITIONS}
              endpoint={`/sales-orders/${id}/status`}
              onSuccess={refetch}
            />
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={so.status} />
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">DO Number</span>
              <span className="font-medium">{so.doNumber || "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Branch</span>
              <span className="font-medium">{so.branch?.name || "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recipient Type</span>
              <span>{so.recipientType || "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {so.recipientType === "BREEDER" ? "Breeder" : "Customer"}
              </span>
              <span className="font-medium">{recipientName || "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contract Price</span>
              <span>{so.contractPrice ? formatCurrency(so.contractPrice) : "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Market Price</span>
              <span>{so.marketPrice ? formatCurrency(so.marketPrice) : "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method</span>
              <span>{so.paymentMethod || "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(so.createdAt)}</span>
            </div>
            {so.notes && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground">Notes</span>
                  <p className="mt-1">{so.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Product Description</TableHead>
                  <TableHead className="text-right">Bird Count</TableHead>
                  <TableHead className="text-right">Weight (kg)</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {so.lines?.map((line, idx) => (
                  <TableRow key={line.id || idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      {line.productDescription || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {line.birdCount ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {line.totalWeightKg || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {line.unitPrice ? formatCurrency(line.unitPrice) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {line.totalPrice ? formatCurrency(line.totalPrice) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Sales Order"
        description="Are you sure you want to delete this sales order?"
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
