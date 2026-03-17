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
import { InternalTrade } from "@/types/api";
import { fetchApi } from "@/lib/api";
import { formatDate, formatCurrency, formatQuantity, parseDecimal } from "@/lib/utils";
import { INTERNAL_TRADE_STATUS_TRANSITIONS } from "@/lib/constants";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function InternalTradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: trade, isLoading, refetch } = useApi<InternalTrade>(
    `/internal-trades/${id}`
  );
  const [showDelete, setShowDelete] = useState(false);

  if (isLoading) return <PageSkeleton />;
  if (!trade) return <div>Internal Trade not found</div>;

  async function handleDelete() {
    try {
      await fetchApi(`/internal-trades/${id}`, { method: "DELETE" });
      toast.success("Internal Trade deleted");
      router.push("/internal-trades");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const grandTotal = trade.lines?.reduce(
    (sum, line) => sum + parseDecimal(line.totalValue || "0"),
    0
  ) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Trade: ${trade.tradeNumber}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/internal-trades">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            {trade.status === "PROCESSING" && (
              <Button
                variant="destructive"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            <StatusAction
              currentStatus={trade.status}
              transitions={INTERNAL_TRADE_STATUS_TRANSITIONS}
              endpoint={`/internal-trades/${id}/status`}
              onSuccess={refetch}
            />
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trade Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={trade.status} />
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Warehouses</span>
              <span className="font-medium flex items-center gap-2">
                {trade.fromWarehouse?.name || "—"}
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                {trade.toWarehouse?.name || "—"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Trade Value</span>
              <span className="text-lg font-bold">
                {formatCurrency(grandTotal)}
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
              <span>{formatDate(trade.createdAt)}</span>
            </div>
            {trade.notes && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground">Notes</span>
                  <p className="mt-1">{trade.notes}</p>
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
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trade.lines?.map((line, idx) => (
                  <TableRow key={line.id || idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {line.product?.code || "—"}
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        {line.product?.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatQuantity(line.quantity)}
                    </TableCell>
                    <TableCell>{line.uom?.name || "—"}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(line.unitPrice || "0")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(line.totalValue || "0")}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-right font-medium"
                  >
                    Grand Total
                  </TableCell>
                  <TableCell className="text-right text-lg font-bold">
                    {formatCurrency(grandTotal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Internal Trade"
        description="Are you sure you want to delete this internal trade?"
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
