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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatusAction } from "@/components/shared/status-action";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageSkeleton } from "@/components/shared/loading-skeleton";
import { useApi } from "@/hooks/use-api";
import { SalesOrder } from "@/types/api";
import { fetchApi } from "@/lib/api";
import {
  formatDate,
  formatCurrency,
  formatQuantity,
  parseDecimal,
} from "@/lib/utils";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={`SO: ${so.soNumber}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/sales-orders">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            {so.status === "DRAFT" && (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/sales-orders/${id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDelete(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
            <StatusAction
              currentStatus={so.status}
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
              <span className="text-muted-foreground">Customer</span>
              <span className="font-medium">{so.customerName}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Date</span>
              <span>{formatDate(so.orderDate)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expected Date</span>
              <span>{formatDate(so.expectedDate)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="text-lg font-bold">
                {formatCurrency(so.totalAmount)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Delivered</TableHead>
                  <TableHead>Fulfillment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {so.lines?.map((line, idx) => {
                  const qty = parseDecimal(line.quantity);
                  const delivered = parseDecimal(line.deliveredQty);
                  const pct =
                    qty > 0 ? Math.round((delivered / qty) * 100) : 0;
                  return (
                    <TableRow key={line.id || idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {line.item?.code || "—"}
                        </span>
                        <span className="ml-2 text-muted-foreground">
                          {line.item?.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatQuantity(line.quantity)}
                      </TableCell>
                      <TableCell>{line.uomName}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(line.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(line.totalPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatQuantity(line.deliveredQty)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            pct >= 100
                              ? "default"
                              : pct > 0
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {pct}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex justify-end">
            <div className="text-right">
              <span className="text-muted-foreground mr-2">Grand Total:</span>
              <span className="text-xl font-bold">
                {formatCurrency(so.totalAmount)}
              </span>
            </div>
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
