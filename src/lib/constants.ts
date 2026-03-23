import {
  ArrowLeftRight,
  Award,
  BarChart3,
  BrainCircuit,
  Building2,
  Calculator,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileText,
  FolderTree,
  Home,
  Layers,
  Package,
  Receipt,
  Repeat,
  RotateCcw,
  Ruler,
  Settings,
  ShoppingCart,
  Target,
  Truck,
  UserCheck,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

type NavLink = { title: string; url: string; icon: LucideIcon };
type NavGroup = { title: string; icon: LucideIcon; items: NavLink[] };
export type NavItem = NavLink | NavGroup;

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", url: "/", icon: Home },
  {
    title: "Organization",
    icon: Building2,
    items: [
      { title: "Branches", url: "/branches", icon: Building2 },
      { title: "Farms", url: "/farms", icon: Building2 },
      { title: "Coops", url: "/coops", icon: Layers },
      { title: "Coop Floors", url: "/coop-floors", icon: Layers },
    ],
  },
  {
    title: "Master Data",
    icon: Package,
    items: [
      { title: "Products", url: "/products", icon: Package },
      { title: "Product Categories", url: "/product-categories", icon: FolderTree },
      { title: "Suppliers", url: "/suppliers", icon: Users },
      { title: "Customers", url: "/customers", icon: Users },
      { title: "Breeders", url: "/breeders", icon: UserCheck },
      { title: "Breeder Card Types", url: "/breeder-card-types", icon: CreditCard },
      { title: "Employees", url: "/employees", icon: Users },
      { title: "Vehicles", url: "/vehicles", icon: Truck },
      { title: "Units of Measure", url: "/unit-of-measures", icon: Ruler },
      { title: "Mature Bird Types", url: "/mature-bird-types", icon: Target },
    ],
  },
  {
    title: "Projects",
    icon: ClipboardList,
    items: [
      { title: "Projects", url: "/projects", icon: ClipboardList },
    ],
  },
  {
    title: "Inventory",
    icon: Warehouse,
    items: [
      { title: "Warehouses", url: "/warehouses", icon: Warehouse },
      { title: "Stock Summary", url: "/inventory", icon: BarChart3 },
    ],
  },
  {
    title: "Purchasing",
    icon: ShoppingCart,
    items: [
      { title: "Purchase Orders", url: "/purchase-orders", icon: ShoppingCart },
      { title: "Goods Receipts", url: "/goods-receipts", icon: Receipt },
    ],
  },
  {
    title: "Logistics",
    icon: Truck,
    items: [
      { title: "Goods Transfers", url: "/goods-transfers", icon: ArrowLeftRight },
      { title: "Goods Consumption", url: "/goods-consumptions", icon: Package },
      { title: "Goods Returns", url: "/goods-returns", icon: RotateCcw },
      { title: "Internal Trade", url: "/internal-trades", icon: Repeat },
      { title: "Shipping Costs", url: "/logistics-shipping-costs", icon: DollarSign },
      { title: "Verifications", url: "/logistics-verifications", icon: ClipboardCheck },
    ],
  },
  {
    title: "Sales & Marketing",
    icon: FileText,
    items: [
      { title: "Sales Orders", url: "/sales-orders", icon: FileText },
      { title: "Deliveries", url: "/deliveries", icon: Truck },
      { title: "Sales Invoices", url: "/sales-invoices", icon: Receipt },
      { title: "Sales Payments", url: "/sales-payments", icon: CreditCard },
      { title: "Delivery Shipping", url: "/delivery-shipping-costs", icon: DollarSign },
      { title: "Driver Bonuses", url: "/driver-bonuses", icon: Award },
    ],
  },
  {
    title: "Standards",
    icon: Settings,
    items: [
      { title: "Contract Categories", url: "/contract-categories", icon: FolderTree },
      { title: "FCR Standards", url: "/fcr-standards", icon: Calculator },
      { title: "Production Days", url: "/production-day-estimates", icon: Calculator },
      { title: "Recording Deviation", url: "/recording-deviation", icon: Settings },
      { title: "Coop Readiness", url: "/coop-readiness", icon: Settings },
      { title: "Chick-In Plans", url: "/chick-in-plans", icon: ClipboardList },
      { title: "Budget Standards", url: "/budget-standards", icon: Calculator },
    ],
  },
  {
    title: "Bonus",
    icon: Award,
    items: [
      { title: "FCR Deff", url: "/bonus-fcr-deff", icon: Award },
      { title: "IP", url: "/bonus-ip", icon: Award },
      { title: "Mortality", url: "/bonus-mortality", icon: Award },
      { title: "TS Incentives", url: "/ts-incentives", icon: Award },
    ],
  },
  {
    title: "Finance",
    icon: CreditCard,
    items: [
      { title: "Bank Accounts", url: "/bank-accounts", icon: CreditCard },
      { title: "Cash Accounts", url: "/cash-accounts", icon: DollarSign },
    ],
  },
  {
    title: "Analytics",
    icon: BrainCircuit,
    items: [
      { title: "AI Insights", url: "/ai-insights", icon: BrainCircuit },
    ],
  },
];

// Generic status color mapping — covers all domain-specific status enums
export const STATUS_COLORS: Record<string, string> = {
  // Positive
  ACTIVE: "bg-[var(--accent-green)]/10 text-[var(--accent-green)]",
  APPROVED: "bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]",
  VERIFIED: "bg-[var(--accent-green)]/10 text-[var(--accent-green)]",
  COMPLETE: "bg-[var(--accent-green)]/10 text-[var(--accent-green)]",
  RECEIVED: "bg-[var(--accent-green)]/10 text-[var(--accent-green)]",
  CONSUMED: "bg-[var(--accent-green)]/10 text-[var(--accent-green)]",
  RETURNED: "bg-[var(--accent-green)]/10 text-[var(--accent-green)]",
  PAID: "bg-[var(--accent-green)]/10 text-[var(--accent-green)]",
  FULLY_RECEIVED: "bg-[var(--accent-green)]/10 text-[var(--accent-green)]",
  CREDIT_LIMIT_APPROVED: "bg-[var(--accent-green)]/10 text-[var(--accent-green)]",
  SUPPLIER_APPROVED: "bg-[var(--accent-green)]/10 text-[var(--accent-green)]",
  // In-progress
  PROCESSING: "bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]",
  IN_TRANSIT: "bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]",
  IN_DELIVERY: "bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]",
  PREPARING: "bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]",
  ORDERED: "bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]",
  PENDING: "bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]",
  PENDING_APPROVAL: "bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]",
  PENDING_VERIFICATION: "bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]",
  REALIZING: "bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]",
  REALIZING_DO_LIMIT: "bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]",
  REALIZATION_APPROVAL: "bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]",
  CREDIT_LIMIT_PROCESSING: "bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]",
  UNPAID: "bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]",
  // Partial
  PARTIAL: "bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]",
  PARTIAL_RECEIVED: "bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]",
  OVERPAID: "bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]",
  // Warning
  DAMAGED_IN_TRANSIT: "bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]",
  LOW: "bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]",
  OVER_STOCK: "bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]",
  ON_LEAVE: "bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]",
  // Inactive
  INACTIVE: "bg-[var(--muted-foreground)]/10 text-[var(--muted-foreground)]",
  MAINTENANCE: "bg-[var(--muted-foreground)]/10 text-[var(--muted-foreground)]",
  NORMAL: "bg-[var(--muted-foreground)]/10 text-[var(--muted-foreground)]",
  TERMINATED: "bg-[var(--muted-foreground)]/10 text-[var(--muted-foreground)]",
  // Negative
  REJECTED: "bg-[var(--accent-red)]/10 text-[var(--accent-red)]",
  CANCELLED: "bg-[var(--accent-red)]/10 text-[var(--accent-red)]",
  SUPPLIER_REJECTED: "bg-[var(--accent-red)]/10 text-[var(--accent-red)]",
  CREDIT_LIMIT_REJECTED: "bg-[var(--accent-red)]/10 text-[var(--accent-red)]",
  OUT_OF_STOCK: "bg-[var(--accent-red)]/10 text-[var(--accent-red)]",
  CRITICAL: "bg-[var(--accent-red)]/10 text-[var(--accent-red)]",
};

// Domain-specific status transition maps
export const PURCHASE_STATUS_TRANSITIONS: Record<string, string[]> = {
  ORDERED: ["RECEIVED", "REJECTED"],
  RECEIVED: ["PROCESSING"],
  PROCESSING: ["VERIFIED"],
};

export const RECEIPT_STATUS_TRANSITIONS: Record<string, string[]> = {
  PROCESSING: ["PARTIAL", "COMPLETE", "REJECTED"],
  PARTIAL: ["COMPLETE", "PENDING_VERIFICATION"],
  COMPLETE: ["PENDING_VERIFICATION"],
};

export const TRANSFER_STATUS_TRANSITIONS: Record<string, string[]> = {
  IN_TRANSIT: ["RECEIVED", "PARTIAL", "DAMAGED_IN_TRANSIT", "CANCELLED"],
  PARTIAL: ["RECEIVED"],
};

export const CONSUMPTION_STATUS_TRANSITIONS: Record<string, string[]> = {
  PROCESSING: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["CONSUMED"],
};

export const RETURN_STATUS_TRANSITIONS: Record<string, string[]> = {
  PROCESSING: ["SUPPLIER_APPROVED", "SUPPLIER_REJECTED", "CANCELLED"],
  SUPPLIER_APPROVED: ["RETURNED"],
};

export const INTERNAL_TRADE_STATUS_TRANSITIONS: Record<string, string[]> = {
  PROCESSING: ["IN_TRANSIT", "REJECTED"],
  IN_TRANSIT: ["RECEIVED", "PARTIAL"],
  PARTIAL: ["RECEIVED"],
};

export const SALES_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING_APPROVAL: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["REALIZATION_APPROVAL"],
  REALIZATION_APPROVAL: ["REALIZING", "REJECTED"],
  REALIZING: ["REALIZING_DO_LIMIT"],
  REALIZING_DO_LIMIT: ["CREDIT_LIMIT_PROCESSING"],
  CREDIT_LIMIT_PROCESSING: ["CREDIT_LIMIT_APPROVED", "CREDIT_LIMIT_REJECTED"],
};

export const DELIVERY_STATUS_TRANSITIONS: Record<string, string[]> = {
  PREPARING: ["IN_DELIVERY", "CANCELLED"],
  IN_DELIVERY: ["PARTIAL_RECEIVED", "FULLY_RECEIVED"],
  PARTIAL_RECEIVED: ["FULLY_RECEIVED"],
};
