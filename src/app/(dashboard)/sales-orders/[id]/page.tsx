"use client";

import { use, useState } from "react";
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
  const t = useTranslations("salesOrderDetail");
  const tc = useTranslations("common");
  const { id } = use(params);
  const router = useRouter();
  const { data: so, isLoading, refetch } = useApi<SalesOrder>(
    `/sales-orders/${id}`
  );
  const [showDelete, setShowDelete] = useState(false);

  if (isLoading) return <PageSkeleton />;
  if (!so) return <div>{t("notFound")}</div>;

  async function handleDelete() {
    try {
      await fetchApi(`/sales-orders/${id}`, { method: "DELETE" });
      toast.success(t("deleted"));
      router.push("/sales-orders");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("deleteFailed"));
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
                {t("back")}
              </Link>
            </Button>
            {so.status === "PENDING_APPROVAL" && (
              <Button
                variant="destructive"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {tc("delete")}
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
            <CardTitle>{t("orderInformation")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tc("status")}</span>
              <StatusBadge status={so.status} />
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("doNumber")}</span>
              <span className="font-medium">{so.doNumber || "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("branch")}</span>
              <span className="font-medium">{so.branch?.name || "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("recipientType")}</span>
              <span>{so.recipientType || "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {so.recipientType === "BREEDER" ? t("breeder") : t("customer")}
              </span>
              <span className="font-medium">{recipientName || "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("additionalInfo")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("contractPrice")}</span>
              <span>{so.contractPrice ? formatCurrency(so.contractPrice) : "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("marketPrice")}</span>
              <span>{so.marketPrice ? formatCurrency(so.marketPrice) : "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("paymentMethod")}</span>
              <span>{so.paymentMethod || "—"}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{tc("created")}</span>
              <span>{formatDate(so.createdAt)}</span>
            </div>
            {so.notes && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground">{t("notes")}</span>
                  <p className="mt-1">{so.notes}</p>
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
                  <TableHead>{t("productDescription")}</TableHead>
                  <TableHead className="text-right">{t("birdCount")}</TableHead>
                  <TableHead className="text-right">{t("weightKg")}</TableHead>
                  <TableHead className="text-right">{t("unitPrice")}</TableHead>
                  <TableHead className="text-right">{t("totalPrice")}</TableHead>
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
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={tc("delete")}
      />
    </div>
  );
}
