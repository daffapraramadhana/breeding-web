import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  ClipboardList,
  CreditCard,
  Factory,
  FileText,
  FolderTree,
  Home,
  Layers,
  LineChart,
  Package,
  Receipt,
  ShoppingCart,
  Truck,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { DocumentStatus, AccountType } from "@/types/api";

type NavLink = { title: string; url: string; icon: LucideIcon };
type NavGroup = { title: string; items: NavLink[] };
export type NavItem = NavLink | NavGroup;

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Farm Management",
    items: [
      { title: "Farms", url: "/farms", icon: Building2 },
      { title: "Kandangs", url: "/kandangs", icon: Layers },
      { title: "Batches", url: "/batches", icon: ClipboardList },
    ],
  },
  {
    title: "Inventory",
    items: [
      { title: "Items", url: "/items", icon: Package },
      { title: "Categories", url: "/item-categories", icon: FolderTree },
      { title: "Warehouses", url: "/warehouses", icon: Warehouse },
      { title: "Stock Summary", url: "/inventory", icon: BarChart3 },
      { title: "Goods Transfers", url: "/goods-transfers", icon: ArrowLeftRight },
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
    title: "Sales",
    items: [
      { title: "Sales Orders", url: "/sales-orders", icon: FileText },
      { title: "Delivery Orders", url: "/delivery-orders", icon: Truck },
    ],
  },
  {
    title: "Production",
    items: [
      { title: "Production Orders", url: "/production-orders", icon: Factory },
    ],
  },
  {
    title: "Reports",
    items: [
      { title: "Batch P&L", url: "/reports/batch-pnl", icon: LineChart },
    ],
  },
  {
    title: "Finance",
    items: [
      { title: "Chart of Accounts", url: "/finance/chart-of-accounts", icon: FolderTree },
      { title: "Journal Entries", url: "/finance/journal-entries", icon: FileText },
      { title: "Payments", url: "/finance/payments", icon: CreditCard },
    ],
  },
];

export const STATUS_COLORS: Record<DocumentStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800 border-gray-200",
  SUBMITTED: "bg-blue-100 text-blue-800 border-blue-200",
  APPROVED: "bg-amber-100 text-amber-800 border-amber-200",
  PROCESSED: "bg-green-100 text-green-800 border-green-200",
  CLOSED: "bg-slate-100 text-slate-800 border-slate-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
};

export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  ASSET: "bg-blue-100 text-blue-800",
  LIABILITY: "bg-red-100 text-red-800",
  EQUITY: "bg-purple-100 text-purple-800",
  REVENUE: "bg-green-100 text-green-800",
  EXPENSE: "bg-amber-100 text-amber-800",
};

export const STATUS_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["APPROVED", "CANCELLED"],
  APPROVED: ["PROCESSED", "CANCELLED"],
  PROCESSED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};
