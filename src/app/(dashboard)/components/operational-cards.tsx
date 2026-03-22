"use client";

import { useTranslations } from "next-intl";
import { ShoppingCart, Package, FileWarning } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "@/types/api";

interface OperationalCardsProps {
  stats: DashboardStats;
}

export function OperationalCards({ stats }: OperationalCardsProps) {
  const t = useTranslations("dashboard");

  const cards = [
    {
      label: t("openPOs"),
      value: stats.openPurchaseOrders,
      subtitle: null as string | null,
      icon: ShoppingCart,
      color: "text-blue-500",
    },
    {
      label: t("pendingSales"),
      value: stats.pendingSalesOrders,
      subtitle: null as string | null,
      icon: Package,
      color: "text-green-500",
    },
    {
      label: t("invoiceAging"),
      value: stats.overdueInvoiceCount,
      subtitle: `${t("pendingAmount")}: Rp ${Number(stats.pendingInvoiceAmount).toLocaleString()}`,
      icon: FileWarning,
      color: stats.overdueInvoiceCount > 0 ? "text-red-500" : "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{card.value}</p>
            {card.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
