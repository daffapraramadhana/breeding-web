"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPaginated } from "@/lib/api";
import type { ContextType, ContextTypeOption, AttachedContext } from "@/types/chat";

export const CONTEXT_TYPES: ContextTypeOption[] = [
  { type: "project", label: "Proyek", icon: "📋", searchEndpoint: "/projects", displayField: "id" },
  { type: "coop", label: "Kandang", icon: "🏠", searchEndpoint: "/coops", displayField: "name" },
  { type: "product", label: "Produk", icon: "📦", searchEndpoint: "/products", displayField: "name" },
  { type: "purchase_order", label: "Purchase Order", icon: "🛒", searchEndpoint: "/purchase-orders", displayField: "poNumber" },
  { type: "sales_order", label: "Sales Order", icon: "💰", searchEndpoint: "/sales-orders", displayField: "doNumber" },
  { type: "goods_receipt", label: "Goods Receipt", icon: "📥", searchEndpoint: "/goods-receipts", displayField: "receiptNumber" },
  { type: "delivery", label: "Delivery", icon: "🚚", searchEndpoint: "/deliveries", displayField: "id" },
  { type: "goods_transfer", label: "Goods Transfer", icon: "🔄", searchEndpoint: "/goods-transfers", displayField: "transferNumber" },
  { type: "goods_consumption", label: "Goods Consumption", icon: "📉", searchEndpoint: "/goods-consumptions", displayField: "consumptionNumber" },
  { type: "goods_return", label: "Goods Return", icon: "↩️", searchEndpoint: "/goods-returns", displayField: "returnNumber" },
  { type: "internal_trade", label: "Internal Trade", icon: "🔀", searchEndpoint: "/internal-trades", displayField: "tradeNumber" },
  { type: "inventory_stock", label: "Stok Inventori", icon: "📊", searchEndpoint: "/inventory/stocks", displayField: "id" },
];

interface ContextPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (context: AttachedContext) => void;
}

function getDisplayValue(item: Record<string, unknown>, field: string): string {
  const parts = field.split(".");
  let value: unknown = item;
  for (const part of parts) {
    if (value && typeof value === "object") {
      value = (value as Record<string, unknown>)[part];
    } else {
      return String(item.id || "");
    }
  }
  return String(value || item.id || "");
}

function getSubtitle(item: Record<string, unknown>, type: ContextType): string {
  switch (type) {
    case "project":
      return [item.status, (item.farm as Record<string, unknown>)?.name]
        .filter(Boolean)
        .join(" • ");
    case "coop":
      return [item.code, item.status, (item.farm as Record<string, unknown>)?.name]
        .filter(Boolean)
        .join(" • ");
    case "product":
      return [item.code, item.baseUom].filter(Boolean).join(" • ");
    case "purchase_order":
      return [(item.supplier as Record<string, unknown>)?.name, item.status].filter(Boolean).join(" • ");
    case "sales_order":
      return [(item.customer as Record<string, unknown>)?.name, item.status].filter(Boolean).join(" • ");
    case "delivery":
    case "goods_receipt":
    case "goods_transfer":
    case "goods_consumption":
    case "goods_return":
    case "internal_trade":
      return String(item.status || "");
    default:
      return String(item.status || "");
  }
}

export function ContextPicker({
  open,
  onOpenChange,
  onSelect,
}: ContextPickerProps) {
  const [selectedType, setSelectedType] = useState<ContextTypeOption | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Record<string, unknown>[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!selectedType || !open) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await fetchPaginated<Record<string, unknown>>(
          selectedType.searchEndpoint,
          { limit: 10, search: search || undefined }
        );
        setResults(data.data);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedType, search, open]);

  function handleClose() {
    setSelectedType(null);
    setSearch("");
    setResults([]);
    onOpenChange(false);
  }

  function handleSelectEntity(item: Record<string, unknown>) {
    if (!selectedType) return;
    const label = getDisplayValue(item, selectedType.displayField);
    onSelect({
      type: selectedType.type,
      id: String(item.id),
      label,
    });
    handleClose();
  }

  function handleBack() {
    setSelectedType(null);
    setSearch("");
    setResults([]);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {selectedType ? `Pilih ${selectedType.label}` : "Lampirkan Data"}
          </DialogTitle>
        </DialogHeader>

        {!selectedType ? (
          <div className="grid grid-cols-2 gap-2 overflow-y-auto py-2">
            {CONTEXT_TYPES.map((ct) => (
              <button
                key={ct.type}
                type="button"
                onClick={() => setSelectedType(ct)}
                className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-accent transition-colors text-left"
              >
                <span className="text-lg">{ct.icon}</span>
                <span>{ct.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3 overflow-hidden">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                ←
              </Button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={`Cari ${selectedType.label.toLowerCase()}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-[300px] space-y-1">
              {isSearching ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : results.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Tidak ada data ditemukan
                </div>
              ) : (
                results.map((item) => (
                  <button
                    key={String(item.id)}
                    type="button"
                    onClick={() => handleSelectEntity(item)}
                    className="w-full rounded-lg border p-3 text-left hover:bg-accent transition-colors"
                  >
                    <div className="font-medium text-sm">
                      {getDisplayValue(item, selectedType.displayField)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {getSubtitle(item, selectedType.type)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
