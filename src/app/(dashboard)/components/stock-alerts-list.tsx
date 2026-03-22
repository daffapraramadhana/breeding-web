"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePaginated } from "@/hooks/use-api";
import { InventoryStock } from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton";

export function StockAlertsList() {
  const t = useTranslations("dashboard");

  const { data: lowStocks, isLoading: lowLoading } = usePaginated<InventoryStock>(
    "/inventory-stocks",
    { limit: 3, extra: { stockStatus: "LOW" } }
  );
  const { data: criticalStocks, isLoading: criticalLoading } = usePaginated<InventoryStock>(
    "/inventory-stocks",
    { limit: 3, extra: { stockStatus: "CRITICAL" } }
  );

  const isLoading = lowLoading || criticalLoading;
  const stocks = [...criticalStocks, ...lowStocks].slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          {t("stockAlerts")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : stocks.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            {t("noData")}
          </div>
        ) : (
          <div className="space-y-3">
            {stocks.map((stock) => (
              <div
                key={stock.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {stock.product?.name ?? stock.productId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stock.warehouse?.name ?? stock.warehouseId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">
                    {Number(stock.quantityOnHand).toLocaleString()}
                  </span>
                  <Badge
                    variant={stock.stockStatus === "CRITICAL" ? "destructive" : "secondary"}
                  >
                    {stock.stockStatus === "CRITICAL" ? t("critical") : t("low")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
