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
type NavGroup = { title: string; items: NavLink[] };
export type NavItem = NavLink | NavGroup;

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", url: "/", icon: Home },
  {
    title: "Organization",
    items: [
      { title: "Branches", url: "/branches", icon: Building2 },
      { title: "Farms", url: "/farms", icon: Building2 },
      { title: "Coops", url: "/coops", icon: Layers },
      { title: "Coop Floors", url: "/coop-floors", icon: Layers },
    ],
  },
  {
    title: "Master Data",
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
    items: [
      { title: "Projects", url: "/projects", icon: ClipboardList },
    ],
  },
  {
    title: "Inventory",
    items: [
      { title: "Warehouses", url: "/warehouses", icon: Warehouse },
      { title: "Stock Summary", url: "/inventory", icon: BarChart3 },
    ],
  },
  {
    title: "Purchasing",
    items: [
      { title: "Purchase Orders", url: "/purchase-orders", icon: ShoppingCart },
      { title: "Goods Receipts", url: "/goods-receipts", icon: Receipt },
    ],
  },
  {
    title: "Logistics",
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
    items: [
      { title: "FCR Deff", url: "/bonus-fcr-deff", icon: Award },
      { title: "IP", url: "/bonus-ip", icon: Award },
      { title: "Mortality", url: "/bonus-mortality", icon: Award },
      { title: "TS Incentives", url: "/ts-incentives", icon: Award },
    ],
  },
  {
    title: "Finance",
    items: [
      { title: "Bank Accounts", url: "/bank-accounts", icon: CreditCard },
      { title: "Cash Accounts", url: "/cash-accounts", icon: DollarSign },
    ],
  },
  {
    title: "Analytics",
    items: [
      { title: "AI Insights", url: "/ai-insights", icon: BrainCircuit },
    ],
  },
];

// Generic status color mapping — covers all domain-specific status enums
export const STATUS_COLORS: Record<string, string> = {
  // Common positive
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  APPROVED: "bg-amber-100 text-amber-800 border-amber-200",
  VERIFIED: "bg-green-100 text-green-800 border-green-200",
  COMPLETE: "bg-green-100 text-green-800 border-green-200",
  RECEIVED: "bg-green-100 text-green-800 border-green-200",
  CONSUMED: "bg-green-100 text-green-800 border-green-200",
  RETURNED: "bg-green-100 text-green-800 border-green-200",
  PAID: "bg-green-100 text-green-800 border-green-200",
  FULLY_RECEIVED: "bg-green-100 text-green-800 border-green-200",
  CREDIT_LIMIT_APPROVED: "bg-green-100 text-green-800 border-green-200",
  SUPPLIER_APPROVED: "bg-green-100 text-green-800 border-green-200",
  // In-progress
  PROCESSING: "bg-blue-100 text-blue-800 border-blue-200",
  IN_TRANSIT: "bg-blue-100 text-blue-800 border-blue-200",
  IN_DELIVERY: "bg-blue-100 text-blue-800 border-blue-200",
  PREPARING: "bg-blue-100 text-blue-800 border-blue-200",
  ORDERED: "bg-blue-100 text-blue-800 border-blue-200",
  PENDING: "bg-blue-100 text-blue-800 border-blue-200",
  PENDING_APPROVAL: "bg-blue-100 text-blue-800 border-blue-200",
  PENDING_VERIFICATION: "bg-blue-100 text-blue-800 border-blue-200",
  REALIZING: "bg-blue-100 text-blue-800 border-blue-200",
  REALIZING_DO_LIMIT: "bg-blue-100 text-blue-800 border-blue-200",
  REALIZATION_APPROVAL: "bg-blue-100 text-blue-800 border-blue-200",
  CREDIT_LIMIT_PROCESSING: "bg-blue-100 text-blue-800 border-blue-200",
  UNPAID: "bg-amber-100 text-amber-800 border-amber-200",
  // Partial
  PARTIAL: "bg-amber-100 text-amber-800 border-amber-200",
  PARTIAL_RECEIVED: "bg-amber-100 text-amber-800 border-amber-200",
  OVERPAID: "bg-amber-100 text-amber-800 border-amber-200",
  // Warning/Damage
  DAMAGED_IN_TRANSIT: "bg-orange-100 text-orange-800 border-orange-200",
  LOW: "bg-orange-100 text-orange-800 border-orange-200",
  OVER_STOCK: "bg-orange-100 text-orange-800 border-orange-200",
  ON_LEAVE: "bg-amber-100 text-amber-800 border-amber-200",
  // Inactive/Closed
  INACTIVE: "bg-slate-100 text-slate-800 border-slate-200",
  MAINTENANCE: "bg-slate-100 text-slate-800 border-slate-200",
  NORMAL: "bg-slate-100 text-slate-800 border-slate-200",
  TERMINATED: "bg-slate-100 text-slate-800 border-slate-200",
  // Negative
  REJECTED: "bg-red-100 text-red-800 border-red-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  SUPPLIER_REJECTED: "bg-red-100 text-red-800 border-red-200",
  CREDIT_LIMIT_REJECTED: "bg-red-100 text-red-800 border-red-200",
  OUT_OF_STOCK: "bg-red-100 text-red-800 border-red-200",
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
