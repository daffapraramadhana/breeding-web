"use client";

import { formatCurrency } from "@/lib/utils";

interface CurrencyProps {
  value: string | number;
  className?: string;
}

export function Currency({ value, className }: CurrencyProps) {
  return <span className={className}>{formatCurrency(value)}</span>;
}
