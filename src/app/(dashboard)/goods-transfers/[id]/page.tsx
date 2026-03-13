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
import { useApi } from "@/hooks/use-api";
import { GoodsTransfer } from "@/types/api";
import { TRANSFER_STATUS_TRANSITIONS } from "@/lib/constants";
import { fetchApi } from "@/lib/api";
import { formatDate, formatQuantity } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function GoodsTransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: gt, isLoading, refetch } = useApi<GoodsTransfer>(
    `/goods-transfers/${id}`
  );
  const [showDelete, setShowDelete] = useState(false);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!gt) return <div className="p-6">Goods Transfer not found</div>;

  async function handleDelete() {
    try {
      await fetchApi(`/goods-transfers/${id}`, { method: "DELETE" });
      toast.success("Goods Transfer deleted");
      router.push("/goods-transfers");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Transfer: ${gt.transferNumber}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/goods-transfers">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            {gt.status === "IN_TRANSIT" && (
              <Button
                variant="destructive"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            <StatusAction
              currentStatus={gt.status}
              transitions={TRANSFER_STATUS_TRANSITIONS}
              endpoint={`/goods-transfers/${id}/status`}
              onSuccess={refetch}
            />
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Transfer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <StatusBadge status={gt.status} />
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Warehouses</span>
              <span className="font-medium flex items-center gap-2">
                {gt.fromWarehouse?.name || "—"}
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                {gt.toWarehouse?.name || "—"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transfer Date</span>
              <span>{gt.transferDate ? formatDate(gt.transferDate) : "—"}</span>
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
              <span>{formatDate(gt.createdAt)}</span>
            </div>
            {gt.notes && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground">Notes</span>
                  <p className="mt-1">{gt.notes}</p>
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
                  <TableHead className="text-right">Qty Sent</TableHead>
                  <TableHead className="text-right">Qty Received</TableHead>
                  <TableHead className="text-right">Qty Damaged</TableHead>
                  <TableHead>UOM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gt.lines?.map((line, idx) => (
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
                      {formatQuantity(line.quantitySent)}
                    </TableCell>
                    <TableCell className="text-right">
                      {line.quantityReceived ? formatQuantity(line.quantityReceived) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {line.quantityDamaged ? formatQuantity(line.quantityDamaged) : "—"}
                    </TableCell>
                    <TableCell>{line.uom?.name || "—"}</TableCell>
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
        title="Delete Goods Transfer"
        description="Are you sure you want to delete this goods transfer?"
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
