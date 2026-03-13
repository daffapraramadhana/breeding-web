"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

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

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = ROUTE_LABELS[seg] || seg;
    const isLast = i === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((crumb) => (
          <Fragment key={crumb.href}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
