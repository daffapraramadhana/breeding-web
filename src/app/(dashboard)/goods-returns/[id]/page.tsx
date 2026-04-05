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
import { GoodsReturn } from "@/types/api";
import { fetchApi } from "@/lib/api";
import { formatDate, formatCurrency, formatQuantity, parseDecimal } from "@/lib/utils";
import { RETURN_STATUS_TRANSITIONS } from "@/lib/constants";
import { useTranslations } from "next-intl";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function GoodsReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations('goodsReturns');
  const tc = useTranslations('common');
  const { id } = use(params);
  const router = useRouter();
  const { data: gr, isLoading, refetch } = useApi<GoodsReturn>(
    `/goods-returns/${id}`
  );
  const [showDelete, setShowDelete] = useState(false);

  if (isLoading) return <PageSkeleton />;
  if (!gr) return <div>{t('notFound')}</div>;

  async function handleDelete() {
    try {
      await fetchApi(`/goods-returns/${id}`, { method: "DELETE" });
      toast.success(tc('entityDeleted', { entity: t('entity') }));
      router.push("/goods-returns");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tc('entityDeleteFailed', { entity: t('entity') }));
    }
  }

  const grandTotal = gr.lines?.reduce(
    (sum, line) => sum + parseDecimal(line.totalCost || "0"),
    0
  ) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Return: ${gr.returnNumber}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/goods-returns">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {tc('back')}
              </Link>
            </Button>
            {gr.status === "PROCESSING" && (
              <Button
                variant="destructive"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {tc('delete')}
              </Button>
            )}
            <StatusAction
              currentStatus={gr.status}
              transitions={RETURN_STATUS_TRANSITIONS}
              endpoint={`/goods-returns/${id}/status`}
              onSuccess={refetch}
            />
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('returnInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tc('status')}</span>
              <StatusBadge status={gr.status} />
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('supplier')}</span>
              <span className="font-medium">{gr.supplier?.name || "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('warehouse')}</span>
              <span className="font-medium">{gr.warehouse?.name || "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('totalReturnValue')}</span>
              <span className="text-lg font-bold">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('additionalInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tc('created')}</span>
              <span>{formatDate(gr.createdAt)}</span>
            </div>
            {gr.purchaseOrderId && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('purchaseOrderId')}</span>
                  <span>{gr.purchaseOrderId}</span>
                </div>
              </>
            )}
            {gr.notes && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground">{t('notes')}</span>
                  <p className="mt-1">{gr.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('lineItems')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>{t('product')}</TableHead>
                  <TableHead className="text-right">{t('qty')}</TableHead>
                  <TableHead>{t('uom')}</TableHead>
                  <TableHead>{t('reason')}</TableHead>
                  <TableHead className="text-right">{t('unitCost')}</TableHead>
                  <TableHead className="text-right">{t('total')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gr.lines?.map((line, idx) => (
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
                    <TableCell>{line.reason || "—"}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(line.unitCost || "0")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(line.totalCost || "0")}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-right font-medium"
                  >
                    {t('grandTotal')}
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
        title={t('deleteTitle')}
        description={t('deleteDescription')}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={tc('delete')}
      />
    </div>
  );
}
