"use client";

import { useTranslations } from "next-intl";
import { DashboardStats } from "@/types/api";
import { cn } from "@/lib/utils";

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
      color: "text-[var(--accent-purple)]",
      progressColor: "var(--accent-purple)",
    },
    {
      label: t("pendingSales"),
      value: stats.pendingSalesOrders,
      subtitle: null as string | null,
      color: "text-[var(--accent-green)]",
      progressColor: "var(--accent-green)",
    },
    {
      label: t("invoiceAging"),
      value: stats.overdueInvoiceCount,
      subtitle: `${t("pendingAmount")}: Rp ${Number(stats.pendingInvoiceAmount).toLocaleString()}`,
      color: stats.overdueInvoiceCount > 0 ? "text-[var(--accent-red)]" : "text-[var(--muted-foreground)]",
      progressColor: stats.overdueInvoiceCount > 0 ? "var(--accent-red)" : "var(--muted-foreground)",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[18px] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] shadow-[var(--glass-shadow)] p-[18px]"
        >
          <p className="text-[9px] uppercase tracking-[1.5px] text-[var(--muted-foreground)] mb-2">
            {card.label}
          </p>
          <p className={cn("text-[22px] font-light", card.color)}>{card.value}</p>
          {card.subtitle && (
            <p className="text-[11px] text-[var(--muted-foreground)] mt-1">{card.subtitle}</p>
          )}
          {/* Segmented progress bar */}
          <div className="flex gap-1 mt-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full"
                style={{
                  backgroundColor:
                    i < Math.min(card.value, 4)
                      ? card.progressColor
                      : "var(--muted)",
                  opacity: i < Math.min(card.value, 4) ? 1 - i * 0.15 : 1,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
