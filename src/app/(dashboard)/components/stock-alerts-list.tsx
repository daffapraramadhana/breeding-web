"use client";

import { useTranslations } from "next-intl";
import { usePaginated } from "@/hooks/use-api";
import { InventoryStock } from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
    <div className="rounded-[18px] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] shadow-[var(--glass-shadow)] p-5">
      <div className="flex justify-between items-center mb-4">
        <p className="text-[10px] uppercase tracking-[1.5px] text-[var(--muted-foreground)]">
          {t("stockAlerts")}
        </p>
        <span className="text-[10px] text-[var(--accent-green)] cursor-pointer">
          {t("viewAll")}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : stocks.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-sm text-[var(--muted-foreground)]">
          {t("noData")}
        </div>
      ) : (
        <div className="space-y-2">
          {stocks.map((stock) => (
            <div
              key={stock.id}
              className={cn(
                "flex items-center gap-3 rounded-[14px] p-3",
                stock.stockStatus === "CRITICAL"
                  ? "bg-[var(--accent-red)]/[0.04]"
                  : "bg-[var(--accent-amber)]/[0.04]"
              )}
            >
              <div
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  stock.stockStatus === "CRITICAL"
                    ? "bg-[var(--accent-red)]"
                    : "bg-[var(--accent-amber)]"
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] truncate">
                  {stock.product?.name ?? stock.productId}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  {stock.warehouse?.name ?? stock.warehouseId}
                </p>
              </div>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-[6px] text-[9px] uppercase tracking-[0.3px] font-medium text-white",
                  stock.stockStatus === "CRITICAL"
                    ? "bg-[var(--accent-red)]"
                    : "bg-[var(--accent-amber)]"
                )}
              >
                {stock.stockStatus === "CRITICAL" ? t("critical") : t("low")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
