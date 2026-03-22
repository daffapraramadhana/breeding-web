"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ROUTE_LABELS: Record<string, string> = {
  branches: "Branches",
  farms: "Farms",
  coops: "Coops",
  "coop-floors": "Coop Floors",
  products: "Products",
  "product-categories": "Product Categories",
  suppliers: "Suppliers",
  customers: "Customers",
  breeders: "Breeders",
  "breeder-card-types": "Breeder Card Types",
  employees: "Employees",
  vehicles: "Vehicles",
  "unit-of-measures": "Units of Measure",
  "mature-bird-types": "Mature Bird Types",
  projects: "Projects",
  warehouses: "Warehouses",
  inventory: "Stock Summary",
  "purchase-orders": "Purchase Orders",
  "goods-receipts": "Goods Receipts",
  "goods-transfers": "Goods Transfers",
  "goods-consumptions": "Goods Consumption",
  "goods-returns": "Goods Returns",
  "internal-trades": "Internal Trade",
  "logistics-shipping-costs": "Shipping Costs",
  "logistics-verifications": "Verifications",
  "sales-orders": "Sales Orders",
  deliveries: "Deliveries",
  "sales-invoices": "Sales Invoices",
  "sales-payments": "Sales Payments",
  "delivery-shipping-costs": "Delivery Shipping",
  "driver-bonuses": "Driver Bonuses",
  "contract-categories": "Contract Categories",
  "fcr-standards": "FCR Standards",
  "production-day-estimates": "Production Days",
  "recording-deviation": "Recording Deviation",
  "coop-readiness": "Coop Readiness",
  "chick-in-plans": "Chick-In Plans",
  "budget-standards": "Budget Standards",
  "bonus-fcr-deff": "FCR Deff",
  "bonus-ip": "IP",
  "bonus-mortality": "Mortality",
  "ts-incentives": "TS Incentives",
  "bank-accounts": "Bank Accounts",
  "cash-accounts": "Cash Accounts",
  "ai-insights": "AI Insights",
  new: "Create",
};

export function DashboardBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const parentSegment = segments[0];
  const parentLabel =
    ROUTE_LABELS[parentSegment] ||
    parentSegment.replace(/-/g, " ");

  return (
    <nav className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)] mb-1">
      <Link
        href={`/${parentSegment}`}
        className="hover:text-[var(--foreground)] transition-colors capitalize"
      >
        {parentLabel}
      </Link>
      <span>/</span>
      <span className="text-[var(--foreground)] capitalize">
        {ROUTE_LABELS[segments[segments.length - 1]] ||
          segments[segments.length - 1].replace(/-/g, " ")}
      </span>
    </nav>
  );
}
