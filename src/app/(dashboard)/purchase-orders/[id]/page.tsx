"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { PurchaseOrder } from "@/types/api";
import { PURCHASE_STATUS_TRANSITIONS } from "@/lib/constants";
import { fetchApi } from "@/lib/api";
import { formatDate, formatCurrency, formatQuantity } from "@/lib/utils";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations("purchaseOrderDetail");
  const tc = useTranslations("common");
  const { id } = use(params);
  const router = useRouter();
  const { data: po, isLoading, refetch } = useApi<PurchaseOrder>(
    `/purchase-orders/${id}`
  );
  const [showDelete, setShowDelete] = useState(false);

  if (isLoading) return <PageSkeleton />;
  if (!po) return <div>{t("notFound")}</div>;

  async function handleDelete() {
    try {
      await fetchApi(`/purchase-orders/${id}`, { method: "DELETE" });
      toast.success(t("deleted"));
      router.push("/purchase-orders");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("deleteFailed"));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`PO: ${po.poNumber}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/purchase-orders">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("back")}
              </Link>
            </Button>
            {po.status === "ORDERED" && (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/purchase-orders/${id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    {t("edit")}
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowDelete(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {tc("delete")}
                </Button>
              </>
            )}
            <StatusAction
              currentStatus={po.status}
              transitions={PURCHASE_STATUS_TRANSITIONS}
              endpoint={`/purchase-orders/${id}/status`}
              onSuccess={refetch}
            />
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("orderInformation")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tc("status")}</span>
              <StatusBadge status={po.status} />
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("supplier")}</span>
              <span className="font-medium">{po.supplier?.name || "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("branch")}</span>
              <span className="font-medium">{po.branch?.name || "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("orderDate")}</span>
              <span>{formatDate(po.orderDate)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("expectedArrival")}</span>
              <span>{po.expectedArrivalDate ? formatDate(po.expectedArrivalDate) : "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("totalAmount")}</span>
              <span className="text-lg font-bold">
                {formatCurrency(po.totalAmount)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("additionalInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tc("created")}</span>
              <span>{formatDate(po.createdAt)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("updated")}</span>
              <span>{formatDate(po.updatedAt)}</span>
            </div>
            {po.notes && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground">{t("notes")}</span>
                  <p className="mt-1">{po.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("lineItems")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>{t("product")}</TableHead>
                  <TableHead className="text-right">{t("qty")}</TableHead>
                  <TableHead>{t("uom")}</TableHead>
                  <TableHead className="text-right">{t("unitPrice")}</TableHead>
                  <TableHead className="text-right">{t("total")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {po.lines?.map((line, idx) => (
                  <TableRow key={line.id || idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">
                          {line.product?.code || "—"}
                        </span>
                        <span className="ml-2 text-muted-foreground">
                          {line.product?.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatQuantity(line.quantity)}
                    </TableCell>
                    <TableCell>{line.uom?.name || "—"}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(line.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(line.totalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="text-right">
              <span className="text-muted-foreground mr-2">{t("grandTotal")}</span>
              <span className="text-xl font-bold">
                {formatCurrency(po.totalAmount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={tc("delete")}
      />
    </div>
  );
}
