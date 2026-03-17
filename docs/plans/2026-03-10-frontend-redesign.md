# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full rebuild of the breeding-web dashboard to align with the new unified poultry ERP backend (74 models, 53 controllers, 350+ endpoints).

**Architecture:** Next.js 16 App Router with Shadcn/ui. Pages follow two patterns: Simple CRUD (modal-based, ~27 pages) and Enhanced Transactional (dedicated create/detail pages with line items, ~12 pages). All state via URL params (nuqs) + custom hooks.

**Tech Stack:** Next.js 16, React 19, Shadcn/ui, Tailwind CSS v4, React Hook Form + Zod, Recharts, nuqs, Sonner

**Spec:** `docs/specs/2026-03-10-frontend-redesign.md`

**Project Root:** `/Users/alva.e202511001/Desktop/project/breeding-web/breeding-dashboard`

---

## Chunk 1: Foundation (Types, Constants, Shared Components)

### Task 1: Rewrite Type Definitions

**Files:**
- Rewrite: `src/types/api.ts`

- [ ] **Step 1: Replace all types in `src/types/api.ts`**

Keep `ApiResponse<T>`, `PaginatedResponse<T>`, `LoginRequest`, `LoginResponse`, `User` unchanged. Delete all other types and replace with:

```typescript
// --- Status Enums ---
export type FarmStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";
export type CoopStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";
export type EmployeeStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";
export type PurchaseStatus = "ORDERED" | "RECEIVED" | "PROCESSING" | "VERIFIED" | "REJECTED";
export type ReceiptStatus = "PROCESSING" | "PARTIAL" | "COMPLETE" | "PENDING_VERIFICATION" | "REJECTED";
export type TransferStatus = "IN_TRANSIT" | "RECEIVED" | "PARTIAL" | "DAMAGED_IN_TRANSIT" | "CANCELLED";
export type ConsumptionStatus = "PROCESSING" | "APPROVED" | "CONSUMED" | "REJECTED" | "CANCELLED";
export type ReturnStatus = "PROCESSING" | "SUPPLIER_APPROVED" | "SUPPLIER_REJECTED" | "RETURNED" | "CANCELLED";
export type InternalTradeStatus = "PROCESSING" | "IN_TRANSIT" | "PARTIAL" | "RECEIVED" | "REJECTED";
export type SalesStatus = "PENDING_APPROVAL" | "APPROVED" | "REALIZATION_APPROVAL" | "REALIZING" | "REALIZING_DO_LIMIT" | "CREDIT_LIMIT_PROCESSING" | "CREDIT_LIMIT_APPROVED" | "CREDIT_LIMIT_REJECTED" | "REJECTED" | "CANCELLED";
export type DeliveryStatus = "PREPARING" | "IN_DELIVERY" | "PARTIAL_RECEIVED" | "FULLY_RECEIVED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "VERIFIED" | "REJECTED";
export type InvoicePaymentStatus = "UNPAID" | "PARTIAL" | "PAID" | "OVERPAID";
export type DriverBonusPaymentStatus = "PENDING" | "PAID";
export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";
export type BonusStatus = "ACTIVE" | "INACTIVE";
export type StockStatus = "NORMAL" | "LOW" | "OUT_OF_STOCK" | "OVER_STOCK";
export type WarehouseOwnerType = "BRANCH" | "FARM" | "COOP";
export type PurchaseDestinationType = "WAREHOUSE" | "COOP";
export type PurchaseSalesTarget = "INTERNAL" | "EXTERNAL";
export type RecipientType = "CUSTOMER" | "BREEDER";
export type ConsumptionPurpose = "PRODUCTION" | "MAINTENANCE" | "OTHER";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CHECK" | "GIRO";
export type BonusUnitOption = "PER_KG" | "PER_BIRD" | "FLAT";

// --- Organization ---
export interface Branch {
  id: string;
  code: string;
  name: string;
  region?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Farm {
  id: string;
  branchId: string;
  branch?: Branch;
  name: string;
  address?: string;
  farmType?: string;
  status?: FarmStatus;
  coops?: Coop[];
  createdAt: string;
  updatedAt: string;
}

export interface Coop {
  id: string;
  farmId: string;
  farm?: Farm;
  branchId: string;
  code: string;
  name: string;
  description?: string;
  capacity: number;
  status: CoopStatus;
  isOwnFarm?: boolean;
  floors?: CoopFloor[];
  createdAt: string;
  updatedAt: string;
}

export interface CoopFloor {
  id: string;
  coopId: string;
  coop?: Coop;
  floorNumber: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Master Data ---
export interface ProductCategory {
  id: string;
  name: string;
  purchasePurpose?: string;
  overheadCategory?: string;
  priceType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  baseUom: string;
  categoryId?: string;
  category?: ProductCategory;
  minStock?: number;
  vendor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnitOfMeasure {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Breeder {
  id: string;
  name: string;
  cardTypeId?: string;
  cardType?: BreederCardType;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BreederCardType {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  name: string;
  employeeNumber?: string;
  phone?: string;
  position?: string;
  status: EmployeeStatus;
  branchId?: string;
  branch?: Branch;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  type?: string;
  capacity?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatureBirdType {
  id: string;
  type: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Inventory ---
export interface Warehouse {
  id: string;
  branchId: string;
  branch?: Branch;
  code: string;
  name: string;
  ownerType: WarehouseOwnerType;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryStock {
  id: string;
  warehouseId: string;
  warehouse?: Warehouse;
  productId: string;
  product?: Product;
  uomId: string;
  uom?: UnitOfMeasure;
  quantityOnHand: string;
  quantityAllocated: string;
  quantityAvailable: string;
  quantityMin?: string;
  quantityMax?: string;
  stockStatus: StockStatus;
  lastUpdatedAt: string;
}

// --- Purchasing ---
export interface PurchaseOrderLine {
  id: string;
  productId: string;
  product?: Product;
  uomId: string;
  uom?: UnitOfMeasure;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  branchId: string;
  branch?: Branch;
  supplierId: string;
  supplier?: Supplier;
  productCategoryId?: string;
  destinationType?: PurchaseDestinationType;
  destinationWarehouseId?: string;
  salesTarget?: PurchaseSalesTarget;
  orderDate: string;
  expectedArrivalDate?: string;
  notes?: string;
  status: PurchaseStatus;
  totalAmount: string;
  lines: PurchaseOrderLine[];
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceiptLine {
  id: string;
  purchaseOrderLineId?: string;
  productId: string;
  product?: Product;
  uomId: string;
  uom?: UnitOfMeasure;
  quantitySent: string;
  quantityReceived: string;
  quantityDamaged: string;
  receiptDate?: string;
  notes?: string;
}

export interface GoodsReceipt {
  id: string;
  receiptNumber: string;
  purchaseOrderId: string;
  purchaseOrder?: PurchaseOrder;
  branchId: string;
  supplierId?: string;
  supplier?: Supplier;
  warehouseId: string;
  warehouse?: Warehouse;
  notes?: string;
  status: ReceiptStatus;
  lines: GoodsReceiptLine[];
  createdAt: string;
  updatedAt: string;
}

// --- Sales & Marketing ---
export interface SalesOrderLine {
  id: string;
  productCode?: string;
  productDescription?: string;
  birdCount?: number;
  totalWeightKg?: string;
  unitPrice?: string;
  totalPrice?: string;
}

export interface SalesOrder {
  id: string;
  doNumber?: string;
  branchId: string;
  branch?: Branch;
  projectId?: string;
  customerId?: string;
  customer?: Customer;
  breederId?: string;
  breeder?: Breeder;
  recipientType?: RecipientType;
  contractPrice?: string;
  marketPrice?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  status: SalesStatus;
  lines: SalesOrderLine[];
  deliveries?: Delivery[];
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryLine {
  id: string;
  salesOrderLineId?: string;
  customerDoNumber?: string;
  birdCount?: number;
  weightKg?: string;
  deliveryNotes?: string;
}

export interface Delivery {
  id: string;
  branchId: string;
  salesOrderId: string;
  salesOrder?: SalesOrder;
  customerId?: string;
  customer?: Customer;
  breederId?: string;
  vehicleId?: string;
  vehicle?: Vehicle;
  driverEmployeeId?: string;
  driver?: Employee;
  helperEmployeeId?: string;
  deliveryDate?: string;
  destinationCity?: string;
  driverBonus?: string;
  helperBonus?: string;
  totalBirdCount?: number;
  totalWeightKg?: string;
  deliveryRoute?: string;
  status: DeliveryStatus;
  notes?: string;
  lines: DeliveryLine[];
  createdAt: string;
  updatedAt: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  salesOrderId?: string;
  deliveryId?: string;
  customerId?: string;
  customer?: Customer;
  breederId?: string;
  invoiceDate: string;
  dueDate?: string;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
  paymentStatus: InvoicePaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesPayment {
  id: string;
  invoiceId: string;
  invoice?: SalesInvoice;
  amount: string;
  paymentDate: string;
  paymentMethod?: PaymentMethod;
  reference?: string;
  status: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryShippingCost {
  id: string;
  deliveryId: string;
  delivery?: Delivery;
  fuelCost?: string;
  tollCost?: string;
  otherCost?: string;
  totalCost: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriverBonus {
  id: string;
  deliveryId: string;
  delivery?: Delivery;
  employeeId: string;
  employee?: Employee;
  amount: string;
  paymentStatus: DriverBonusPaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Logistics ---
export interface GoodsTransferLine {
  id: string;
  productId: string;
  product?: Product;
  uomId: string;
  uom?: UnitOfMeasure;
  quantitySent: string;
  quantityReceived?: string;
  quantityDamaged?: string;
  valueAmount?: string;
  notes?: string;
}

export interface GoodsTransfer {
  id: string;
  transferNumber: string;
  branchId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  fromWarehouse?: Warehouse;
  toWarehouse?: Warehouse;
  transferDate?: string;
  estimatedReceiptDate?: string;
  actualReceiptDate?: string;
  reason?: string;
  status: TransferStatus;
  notes?: string;
  lines: GoodsTransferLine[];
  createdAt: string;
  updatedAt: string;
}

export interface GoodsConsumptionLine {
  id: string;
  productId: string;
  product?: Product;
  uomId: string;
  uom?: UnitOfMeasure;
  quantity: string;
  unitCost?: string;
  totalCost?: string;
  notes?: string;
}

export interface GoodsConsumption {
  id: string;
  consumptionNumber: string;
  branchId: string;
  warehouseId: string;
  warehouse?: Warehouse;
  purpose?: ConsumptionPurpose;
  consumptionDate?: string;
  status: ConsumptionStatus;
  notes?: string;
  lines: GoodsConsumptionLine[];
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReturnLine {
  id: string;
  productId: string;
  product?: Product;
  uomId: string;
  uom?: UnitOfMeasure;
  quantity: string;
  unitCost?: string;
  totalCost?: string;
  reason?: string;
}

export interface GoodsReturn {
  id: string;
  returnNumber: string;
  branchId: string;
  purchaseOrderId?: string;
  supplierId?: string;
  supplier?: Supplier;
  warehouseId: string;
  warehouse?: Warehouse;
  status: ReturnStatus;
  totalReturnValue?: string;
  notes?: string;
  lines: GoodsReturnLine[];
  createdAt: string;
  updatedAt: string;
}

export interface InternalTradeLine {
  id: string;
  productId: string;
  product?: Product;
  uomId: string;
  uom?: UnitOfMeasure;
  quantity: string;
  unitPrice?: string;
  totalValue?: string;
}

export interface InternalTrade {
  id: string;
  tradeNumber: string;
  branchId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  fromWarehouse?: Warehouse;
  toWarehouse?: Warehouse;
  status: InternalTradeStatus;
  totalTradeValue?: string;
  notes?: string;
  lines: InternalTradeLine[];
  createdAt: string;
  updatedAt: string;
}

export interface LogisticsShippingCost {
  id: string;
  referenceType: string;
  referenceId: string;
  fuelCost?: string;
  tollCost?: string;
  otherCost?: string;
  totalCost: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogisticsVerification {
  id: string;
  referenceType: string;
  referenceId: string;
  verificationType?: string;
  status: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Projects ---
export interface Project {
  id: string;
  branchId: string;
  branch?: Branch;
  farmId: string;
  farm?: Farm;
  startDate?: string;
  isOwnFarm?: boolean;
  contractCategoryId?: string;
  status?: string;
  projectCoops?: ProjectCoop[];
  bonusFcrDeff?: ProjectBonusFcrDeff[];
  bonusIp?: ProjectBonusIp[];
  bonusMortality?: ProjectBonusMortality[];
  budgets?: ProjectBudget[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCoop {
  id: string;
  projectId: string;
  coopId: string;
  coop?: Coop;
  pplId?: string;
  ppl?: Employee;
  coopName?: string;
  description?: string;
  chickIns?: ProjectChickIn[];
  workers?: ProjectWorker[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectChickIn {
  id: string;
  projectCoopId: string;
  population: number;
  chickInDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWorker {
  id: string;
  projectCoopId: string;
  employeeId: string;
  employee?: Employee;
  createdAt: string;
}

export interface ProjectBonusFcrDeff {
  id: string;
  projectId: string;
  bonusUnitOption?: BonusUnitOption;
  details?: { minFcr: string; maxFcr: string; bonus: string }[];
}

export interface ProjectBonusIp {
  id: string;
  projectId: string;
  bonusUnitOption?: BonusUnitOption;
  details?: { minIp: string; maxIp: string; bonus: string }[];
}

export interface ProjectBonusMortality {
  id: string;
  projectId: string;
  bonusUnitOption?: BonusUnitOption;
  details?: { minMortality: string; maxMortality: string; bonus: string }[];
}

export interface ProjectBudget {
  id: string;
  projectId: string;
  description: string;
  amount: string;
  createdAt: string;
  updatedAt: string;
}

// --- Standards ---
export interface ContractCategory {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FcrStandardDetail {
  day: number;
  fcr: string;
}

export interface FcrStandard {
  id: string;
  name: string;
  description?: string;
  details?: FcrStandardDetail[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductionDayEstimate {
  id: string;
  name: string;
  days: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordingDeviation {
  id: string;
  maxDeviationDays: number;
  description?: string;
  updatedAt: string;
}

export interface CoopReadiness {
  id: string;
  daysBefore: number;
  description?: string;
  updatedAt: string;
}

export interface ChickInPlan {
  id: string;
  name: string;
  plannedDate: string;
  coopId?: string;
  coop?: Coop;
  population?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetStandardDetail {
  category: string;
  amount: string;
}

export interface BudgetStandard {
  id: string;
  name: string;
  description?: string;
  details?: BudgetStandardDetail[];
  createdAt: string;
  updatedAt: string;
}

// --- Bonus ---
export interface BonusFcrDeff {
  id: string;
  name: string;
  bonusUnitOption?: BonusUnitOption;
  status: BonusStatus;
  details?: { minFcr: string; maxFcr: string; bonus: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface BonusIp {
  id: string;
  name: string;
  bonusUnitOption?: BonusUnitOption;
  status: BonusStatus;
  details?: { minIp: string; maxIp: string; bonus: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface BonusMortality {
  id: string;
  name: string;
  bonusUnitOption?: BonusUnitOption;
  status: BonusStatus;
  details?: { minMortality: string; maxMortality: string; bonus: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface TsIncentive {
  id: string;
  name: string;
  amount: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Finance ---
export interface BankAccount {
  id: string;
  branchId: string;
  branch?: Branch;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  createdAt: string;
  updatedAt: string;
}

export interface CashAccount {
  id: string;
  branchId: string;
  branch?: Branch;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// --- AI Insights (updated) ---
export interface AiInsightResponse<T> {
  insight: T;
  cached: boolean;
  generatedAt: string;
  expiresAt?: string;
}

export interface ProjectPnlAnalysis {
  ringkasan: string;
  metrik_utama: {
    total_pendapatan: string;
    total_biaya: string;
    total_laba_kotor: string;
    margin_rata_rata: string;
  };
  analisis_proyek: Array<{
    project_id: string;
    penilaian: "BAIK" | "CUKUP" | "BURUK";
    catatan: string;
  }>;
  tren: string[];
  rekomendasi: string[];
  peringatan: string[];
}

export interface ProductionForecast {
  ringkasan: string;
  jadwal_produksi: Array<{
    bulan: number;
    jumlah_proyek: number;
    estimasi_populasi: number;
    coop_rekomendasi: string;
    estimasi_biaya: string;
    estimasi_pendapatan: string;
    catatan: string;
  }>;
  proyeksi_tahunan: {
    total_estimasi_pendapatan: string;
    total_estimasi_biaya: string;
    estimasi_laba_kotor: string;
    estimasi_margin: string;
  };
  pertimbangan_musiman: string[];
  risiko: string[];
  rekomendasi_tambahan: string[];
}

export interface DashboardSummary {
  ringkasan_eksekutif: string;
  metrik_kunci: {
    pendapatan: string;
    biaya: string;
    laba_kotor: string;
    margin: string;
    proyek_aktif: number;
    proyek_selesai_periode: number;
  };
  highlights: string[];
  perhatian: string[];
  cash_flow_insight: string;
  aksi_prioritas: Array<{
    prioritas: "TINGGI" | "SEDANG" | "RENDAH";
    aksi: string;
    alasan: string;
  }>;
}

export interface ProjectAnalysisRequest {
  projectId?: string;
  startDateFrom?: string;
  startDateTo?: string;
  farmId?: string;
}

export interface ProductionForecastRequest {
  forecastYear: number;
  farmId?: string;
}

export interface DashboardSummaryRequest {
  periodStart?: string;
  periodEnd?: string;
}
```

- [ ] **Step 2: Verify no import errors**

Run: `npx next build 2>&1 | head -20`
Expected: Build errors for pages referencing deleted types (this is expected — we fix pages later)

- [ ] **Step 3: Commit**

```bash
git add src/types/api.ts
git commit -m "feat: rewrite type definitions for unified ERP schema"
```

---

### Task 2: Rewrite Chat Types

**Files:**
- Modify: `src/types/chat.ts`

- [ ] **Step 1: Update ContextType union**

Replace the `ContextType` type with:

```typescript
export type ContextType =
  | "project"
  | "coop"
  | "product"
  | "purchase_order"
  | "sales_order"
  | "goods_receipt"
  | "delivery"
  | "goods_transfer"
  | "goods_consumption"
  | "goods_return"
  | "internal_trade"
  | "inventory_stock";
```

Keep all other types (`Conversation`, `ChatMessage`, SSE event types) unchanged.

- [ ] **Step 2: Commit**

```bash
git add src/types/chat.ts
git commit -m "feat: update chat context types for new schema"
```

---

### Task 3: Rewrite Navigation & Status Constants

**Files:**
- Rewrite: `src/lib/constants.ts`

- [ ] **Step 1: Replace entire constants file**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat: rewrite navigation and status constants for new schema"
```

---

### Task 4: Update Shared Components

**Files:**
- Modify: `src/components/shared/status-badge.tsx`
- Modify: `src/components/shared/status-action.tsx`
- Rename: `src/components/forms/item-combobox.tsx` → `src/components/forms/product-combobox.tsx`
- Rename: `src/components/forms/batch-combobox.tsx` → `src/components/forms/project-combobox.tsx`
- Modify: `src/components/forms/line-items-field.tsx`

- [ ] **Step 1: Update StatusBadge to use generic string status**

In `status-badge.tsx`, change the prop type from `DocumentStatus` to `string`:

```typescript
import { STATUS_COLORS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status] || "bg-gray-100 text-gray-800 border-gray-200";
  return (
    <Badge variant="outline" className={colorClass}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
```

- [ ] **Step 2: Update StatusAction to accept transition map**

In `status-action.tsx`, change to accept a `transitions` prop instead of importing `STATUS_TRANSITIONS`:

```typescript
interface StatusActionProps {
  currentStatus: string;
  transitions: Record<string, string[]>;
  endpoint: string;
  onSuccess: () => void;
}
```

The component logic stays the same — look up `transitions[currentStatus]` instead of `STATUS_TRANSITIONS[currentStatus]`.

- [ ] **Step 3: Create ProductCombobox (rename from ItemCombobox)**

Copy `item-combobox.tsx` to `product-combobox.tsx`. Replace:
- `Item` type → `Product` type
- `/items` endpoint → `/products` endpoint
- `itemId` → `productId`
- Display: `product.code - product.name`, subtext: `product.baseUom`
- Callback: `onSelect(productId: string, product: Product)`

- [ ] **Step 4: Create ProjectCombobox (rename from BatchCombobox)**

Copy `batch-combobox.tsx` to `project-combobox.tsx`. Replace:
- `Batch` type → `Project` type
- `/batches` endpoint → `/projects` endpoint
- Display: `Project ${project.id.slice(0,8)}`, subtext: `project.farm?.name`
- Callback: `onSelect(projectId: string, project: Project)`

- [ ] **Step 5: Create additional comboboxes**

Create these files in `src/components/forms/`, each following the same Popover+Command pattern as ProductCombobox:
- `branch-combobox.tsx` — endpoint `/branches`, display: `branch.code - branch.name`
- `supplier-combobox.tsx` — endpoint `/suppliers`, display: `supplier.name`
- `customer-combobox.tsx` — endpoint `/customers`, display: `customer.name`
- `breeder-combobox.tsx` — endpoint `/breeders`, display: `breeder.name`
- `employee-combobox.tsx` — endpoint `/employees`, display: `employee.name`
- `warehouse-combobox.tsx` — endpoint `/warehouses`, display: `warehouse.code - warehouse.name`
- `coop-combobox.tsx` — endpoint `/coops`, display: `coop.code - coop.name`

- [ ] **Step 6: Update LineItemsField**

In `line-items-field.tsx`, update the `LineItem` interface:

```typescript
export interface LineItem {
  productId: string;
  productCode?: string;
  productName?: string;
  uomId: string;
  uomName?: string;
  quantity: string;
  unitPrice: string;
}
```

Replace `ItemCombobox` with `ProductCombobox`. On select, populate `productCode`, `productName`, `uomId` (from product.baseUom lookup or separate UoM combobox).

- [ ] **Step 7: Commit**

```bash
git add src/components/shared/ src/components/forms/
git commit -m "feat: update shared components and comboboxes for new schema"
```

---

### Task 5: Delete Old Pages

**Files:**
- Delete: `src/app/(dashboard)/batches/`
- Delete: `src/app/(dashboard)/kandangs/`
- Delete: `src/app/(dashboard)/items/`
- Delete: `src/app/(dashboard)/item-categories/`
- Delete: `src/app/(dashboard)/production-orders/`
- Delete: `src/app/(dashboard)/delivery-orders/`
- Delete: `src/app/(dashboard)/finance/`
- Delete: `src/app/(dashboard)/reports/`
- Delete old combobox files: `src/components/forms/item-combobox.tsx`, `src/components/forms/batch-combobox.tsx`

- [ ] **Step 1: Delete all old page directories and files**

```bash
rm -rf src/app/\(dashboard\)/batches
rm -rf src/app/\(dashboard\)/kandangs
rm -rf src/app/\(dashboard\)/items
rm -rf src/app/\(dashboard\)/item-categories
rm -rf src/app/\(dashboard\)/production-orders
rm -rf src/app/\(dashboard\)/delivery-orders
rm -rf src/app/\(dashboard\)/finance
rm -rf src/app/\(dashboard\)/reports
rm -f src/components/forms/item-combobox.tsx
rm -f src/components/forms/batch-combobox.tsx
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove pages for deleted backend modules"
```

---

## Chunk 2: Dashboard & Core Pages

### Task 6: Rewrite Dashboard Page

**Files:**
- Rewrite: `src/app/(dashboard)/page.tsx`

- [ ] **Step 1: Rewrite with Hero Banner + Grid layout**

The dashboard should:
1. Fetch data via `Promise.all` using `fetchPaginated`:
   - `/projects?limit=1` — total count for Active Projects
   - `/purchase-orders?limit=1` — total count for Open POs
   - `/sales-orders?limit=1` — total count for Pending Sales
   - `/inventory-stocks/summary` — for stock alerts
2. Hero banner: full-width gradient card with 4 KPIs (Active Projects, Bird Population, Avg FCR, Mortality Rate)
3. 3 operational cards: Open POs, Pending Sales, Stock Alerts
4. 2 Recharts charts: Project P&L Trend (BarChart), Purchase vs Sales (BarChart)

Follow the existing pattern: `"use client"`, `useState`/`useEffect` for data loading, `CardSkeleton` for loading states, Recharts `ChartContainer`.

Key code for the hero banner section:

```tsx
{/* Hero Banner */}
<div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white">
  <div className="grid grid-cols-4 gap-6">
    <div className="text-center">
      <p className="text-sm text-slate-300">Active Projects</p>
      <p className="text-3xl font-bold text-green-400">{stats.activeProjects}</p>
    </div>
    <div className="text-center">
      <p className="text-sm text-slate-300">Bird Population</p>
      <p className="text-3xl font-bold text-blue-400">{formatQuantity(stats.birdPopulation)}</p>
    </div>
    <div className="text-center">
      <p className="text-sm text-slate-300">Avg FCR</p>
      <p className="text-3xl font-bold text-amber-400">{stats.avgFcr}</p>
    </div>
    <div className="text-center">
      <p className="text-sm text-slate-300">Mortality Rate</p>
      <p className="text-3xl font-bold text-red-400">{stats.mortalityRate}%</p>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/page.tsx
git commit -m "feat: rewrite dashboard with hero banner + grid layout"
```

---

### Task 7: Update AI Insights Page

**Files:**
- Modify: `src/app/(dashboard)/ai-insights/page.tsx`
- Modify: `src/app/(dashboard)/ai-insights/components/batch-pnl-analysis.tsx` → rename to `project-pnl-analysis.tsx`
- Modify: `src/app/(dashboard)/ai-insights/components/production-forecast.tsx`
- Modify: `src/app/(dashboard)/ai-insights/components/dashboard-summary.tsx`
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Update AI API functions in `src/lib/api.ts`**

Replace `analyzeBatchPnl` with `analyzeProjectPnl`:

```typescript
export async function analyzeProjectPnl(params: ProjectAnalysisRequest) {
  return fetchApi<AiInsightResponse<ProjectPnlAnalysis>>("/ai-insights/batch-pnl-analysis", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
```

Update `getProductionForecast` and `getDashboardSummary` to use new request types.

- [ ] **Step 2: Rename batch-pnl-analysis component to project-pnl-analysis**

- Replace `BatchAnalysisRequest` → `ProjectAnalysisRequest`
- Replace `BatchPnlAnalysis` → `ProjectPnlAnalysis`
- Replace "Batch" references in UI text → "Project"/"Proyek"
- Replace farm filter with project filter
- Replace `analisis_batch` rendering → `analisis_proyek`

- [ ] **Step 3: Update tab label in main page**

Change "Analisis P&L" tab to reference `ProjectPnlAnalysisTab` instead of `BatchPnlAnalysisTab`.

- [ ] **Step 4: Update production-forecast and dashboard-summary components**

Replace batch/kandang references with project/coop in the UI text and response field mappings.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(dashboard\)/ai-insights/ src/lib/api.ts
git commit -m "feat: update AI insights for project-based analysis"
```

---

### Task 8: Update Chat Context

**Files:**
- Modify: `src/components/chat/` — update context type options
- Modify: `src/hooks/use-chat.ts` — update context labels

- [ ] **Step 1: Update context type labels/options in chat components**

In the context attachment UI, replace old context types with new ones. The context selector should offer: project, coop, product, purchase_order, sales_order, goods_receipt, delivery, goods_transfer, inventory_stock.

- [ ] **Step 2: Commit**

```bash
git add src/components/chat/ src/hooks/use-chat.ts
git commit -m "feat: update chat widget context types"
```

---

## Chunk 3: Organization Pages (Pattern A — Simple CRUD)

All pages in this chunk follow the **Farms page pattern**: `useQueryState` + `usePaginated` + `DataTable` + modal dialog for create/edit + `ConfirmDialog` for delete.

### Task 9: Update Farms Page

**Files:**
- Modify: `src/app/(dashboard)/farms/page.tsx`

- [ ] **Step 1: Add branchId field to farm form**

Add a `BranchCombobox` to the create/edit dialog. Update the form body to include `branchId`. Update columns to show Branch name. Update the `Farm` import from new types.

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/farms/
git commit -m "feat: update farms page with branch field"
```

---

### Task 10: Create Branches Page

**Files:**
- Create: `src/app/(dashboard)/branches/page.tsx`

- [ ] **Step 1: Create page following farms pattern**

Columns: Code, Name, Region, Created.
Form fields: `code` (Input), `name` (Input), `region` (Input optional).
Endpoint: `/branches`.

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/branches/
git commit -m "feat: add branches page"
```

---

### Task 11: Create Coops Page

**Files:**
- Create: `src/app/(dashboard)/coops/page.tsx`

- [ ] **Step 1: Create page following farms pattern**

Columns: Code, Name, Farm, Capacity, Status, Created.
Form fields: `farmId` (FarmCombobox — create a simple one or reuse approach), `branchId` (BranchCombobox), `code` (Input), `name` (Input), `capacity` (Input number), `status` (Select: ACTIVE/INACTIVE/MAINTENANCE), `description` (Textarea optional).
Endpoint: `/coops`.

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/coops/
git commit -m "feat: add coops page"
```

---

### Task 12: Create Coop Floors Page

**Files:**
- Create: `src/app/(dashboard)/coop-floors/page.tsx`

- [ ] **Step 1: Create page following farms pattern**

Columns: Coop, Floor Number, Description, Created.
Form fields: `coopId` (CoopCombobox), `floorNumber` (Input number), `description` (Textarea optional).
Endpoint: `/coop-floors`.

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/coop-floors/
git commit -m "feat: add coop floors page"
```

---

## Chunk 4: Master Data Pages (Pattern A — Simple CRUD)

All 10 pages follow the same farms pattern. Each task creates one page.

### Task 13: Create Products Page

**Files:** Create `src/app/(dashboard)/products/page.tsx`

Columns: Code, Name, Base UOM, Category, Min Stock, Created.
Form fields: `code`, `name`, `baseUom`, `categoryId` (select from product-categories), `minStock` (optional number), `vendor` (optional).
Endpoint: `/products`.

- [ ] **Step 1: Create page** | **Step 2: Commit** `git commit -m "feat: add products page"`

### Task 14: Create Product Categories Page

**Files:** Create `src/app/(dashboard)/product-categories/page.tsx`

Columns: Name, Purchase Purpose, Created.
Form fields: `name`, `purchasePurpose` (optional), `overheadCategory` (optional), `priceType` (optional).
Endpoint: `/product-categories`.

- [ ] **Step 1: Create page** | **Step 2: Commit** `git commit -m "feat: add product categories page"`

### Task 15: Create Suppliers Page

**Files:** Create `src/app/(dashboard)/suppliers/page.tsx`

Columns: Name, Contact Person, Phone, Email, Created.
Form fields: `name`, `contactPerson`, `phone`, `email`, `address`.
Endpoint: `/suppliers`.

- [ ] **Step 1: Create page** | **Step 2: Commit** `git commit -m "feat: add suppliers page"`

### Task 16: Create Customers Page

**Files:** Create `src/app/(dashboard)/customers/page.tsx`

Columns: Name, Contact Person, Phone, Credit Limit, Created.
Form fields: `name`, `contactPerson`, `phone`, `email`, `address`, `creditLimit`.
Endpoint: `/customers`.

- [ ] **Step 1: Create page** | **Step 2: Commit** `git commit -m "feat: add customers page"`

### Task 17: Create Breeders Page

**Files:** Create `src/app/(dashboard)/breeders/page.tsx`

Columns: Name, Card Type, Phone, Address, Created.
Form fields: `name`, `cardTypeId` (select from breeder-card-types), `phone`, `address`.
Endpoint: `/breeders`.

- [ ] **Step 1: Create page** | **Step 2: Commit** `git commit -m "feat: add breeders page"`

### Task 18: Create Breeder Card Types Page

**Files:** Create `src/app/(dashboard)/breeder-card-types/page.tsx`

Columns: Name, Description, Created.
Form fields: `name`, `description`.
Endpoint: `/breeder-card-types`.

- [ ] **Step 1: Create page** | **Step 2: Commit** `git commit -m "feat: add breeder card types page"`

### Task 19: Create Employees Page

**Files:** Create `src/app/(dashboard)/employees/page.tsx`

Columns: Name, Employee Number, Position, Status, Branch, Created.
Form fields: `name`, `employeeNumber`, `phone`, `position`, `status` (Select: ACTIVE/INACTIVE/ON_LEAVE/TERMINATED), `branchId` (BranchCombobox).
Endpoint: `/employees`.

- [ ] **Step 1: Create page** | **Step 2: Commit** `git commit -m "feat: add employees page"`

### Task 20: Create Vehicles, UoM, Mature Bird Types Pages

**Files:**
- Create `src/app/(dashboard)/vehicles/page.tsx`
- Create `src/app/(dashboard)/unit-of-measures/page.tsx`
- Create `src/app/(dashboard)/mature-bird-types/page.tsx`

**Vehicles** — Columns: Plate Number, Type, Capacity. Fields: `plateNumber`, `type`, `capacity`, `description`. Endpoint: `/vehicles`.

**UoM** — Columns: Name, Description. Fields: `name`, `description`. Endpoint: `/unit-of-measures`.

**Mature Bird Types** — Columns: Type, Description. Fields: `type`, `description`. Endpoint: `/mature-bird-types`.

- [ ] **Step 1: Create all 3 pages** | **Step 2: Commit** `git commit -m "feat: add vehicles, UoM, mature bird types pages"`

---

## Chunk 5: Projects Module

### Task 21: Create Projects List Page

**Files:** Create `src/app/(dashboard)/projects/page.tsx`

- [ ] **Step 1: Create projects list page**

This is an **Enhanced DataTable** page with filter bar:
- Filters: Branch (BranchCombobox), Farm dropdown, date range
- Columns: ID (truncated), Branch, Farm, Start Date, Coops Count, Created
- Row click navigates to `/projects/[id]`
- "New Project" button navigates to `/projects/new`
Endpoint: `/projects`.

- [ ] **Step 2: Commit** `git commit -m "feat: add projects list page"`

### Task 22: Create Project New Page

**Files:** Create `src/app/(dashboard)/projects/new/page.tsx`

- [ ] **Step 1: Create project creation form**

Form with 2 cards:
- **Project Details**: `branchId` (BranchCombobox), `farmId` (Farm select), `startDate` (date input), `isOwnFarm` (checkbox), `contractCategoryId` (select)
- Submit POSTs to `/projects`, redirects to `/projects/[id]`

- [ ] **Step 2: Commit** `git commit -m "feat: add project creation page"`

### Task 23: Create Project Detail Page (Dashboard-style)

**Files:** Create `src/app/(dashboard)/projects/[id]/page.tsx`

- [ ] **Step 1: Create dashboard-style detail page**

This is the most complex page. Structure:

```tsx
// Header with status
<PageHeader title={`Project ${project.id.slice(0,8)}`} ... />

// 4 KPI Cards
<div className="grid grid-cols-4 gap-4">
  <Card>Population: {totalPopulation}</Card>
  <Card>FCR: {project.fcr || "N/A"}</Card>
  <Card>Mortality: {mortalityRate}%</Card>
  <Card>Budget Used: {budgetUsedPct}%</Card>
</div>

// Tabs
<Tabs defaultValue="coops">
  <TabsList>
    <TabsTrigger value="coops">Coops ({coops.length})</TabsTrigger>
    <TabsTrigger value="chick-ins">Chick-Ins</TabsTrigger>
    <TabsTrigger value="workers">Workers</TabsTrigger>
    <TabsTrigger value="bonuses">Bonuses</TabsTrigger>
    <TabsTrigger value="budgets">Budgets</TabsTrigger>
  </TabsList>
  <TabsContent value="coops"><CoopsTab projectId={id} /></TabsContent>
  <TabsContent value="chick-ins"><ChickInsTab projectId={id} coops={coops} /></TabsContent>
  <TabsContent value="workers"><WorkersTab projectId={id} coops={coops} /></TabsContent>
  <TabsContent value="bonuses"><BonusesTab projectId={id} /></TabsContent>
  <TabsContent value="budgets"><BudgetsTab projectId={id} /></TabsContent>
</Tabs>
```

Each tab component:
- **CoopsTab**: Fetches `GET /projects/:id/coops`, displays table, add coop via modal with CoopCombobox + pplId (EmployeeCombobox)
- **ChickInsTab**: For each project coop, fetches `GET /project-coops/:coopId/chick-ins`, displays table with population + dates, add via modal
- **WorkersTab**: For each project coop, fetches `GET /project-coops/:coopId/workers`, add via EmployeeCombobox, delete button
- **BonusesTab**: 3 sub-sections (FCR Deff, IP, Mortality), each fetches `GET /projects/:id/bonuses/fcr-deff` etc., displays detail rows
- **BudgetsTab**: Fetches `GET /projects/:id/budgets`, table with description + amount, add/edit/delete

- [ ] **Step 2: Commit** `git commit -m "feat: add project dashboard-style detail page"`

---

## Chunk 6: Purchasing & Inventory Pages (Pattern B — Enhanced)

### Task 24: Update Purchase Orders Pages

**Files:**
- Modify: `src/app/(dashboard)/purchase-orders/page.tsx`
- Modify: `src/app/(dashboard)/purchase-orders/new/page.tsx`
- Modify: `src/app/(dashboard)/purchase-orders/[id]/page.tsx`

- [ ] **Step 1: Update list page**

- Import `PurchaseOrder`, `PurchaseStatus` from new types
- Update columns: PO Number, Supplier (from relation), Branch, Order Date, Expected Arrival, Total, Status
- Add filter bar: status select (PurchaseStatus values), BranchCombobox
- Pass `PURCHASE_STATUS_TRANSITIONS` to `StatusAction`

- [ ] **Step 2: Update create page**

- Replace `supplierName` field with `SupplierCombobox` (supplierId)
- Add `BranchCombobox` (branchId)
- Add `destinationType` select, `destinationWarehouseId` (WarehouseCombobox)
- Update `LineItemsField` to use `productId`/`uomId`
- Replace `expectedDate` → `expectedArrivalDate`

- [ ] **Step 3: Update detail page**

- Update field display for new schema fields
- Pass `PURCHASE_STATUS_TRANSITIONS` to `StatusAction`
- Update line items table columns: Product, UOM, Qty, Unit Price, Total

- [ ] **Step 4: Commit** `git commit -m "feat: update purchase orders for new schema"`

### Task 25: Update Goods Receipts Pages

**Files:**
- Modify: `src/app/(dashboard)/goods-receipts/page.tsx`
- Modify: `src/app/(dashboard)/goods-receipts/new/page.tsx`
- Modify: `src/app/(dashboard)/goods-receipts/[id]/page.tsx`

- [ ] **Step 1: Update all 3 pages**

- `grNumber` → `receiptNumber`
- `DocumentStatus` → `ReceiptStatus`
- Lines: `quantitySent`, `quantityReceived`, `quantityDamaged` instead of single `quantity`
- Pass `RECEIPT_STATUS_TRANSITIONS` to `StatusAction`
- Add `BranchCombobox`, `SupplierCombobox` to create form

- [ ] **Step 2: Commit** `git commit -m "feat: update goods receipts for new schema"`

### Task 26: Update Warehouses & Inventory Pages

**Files:**
- Modify: `src/app/(dashboard)/warehouses/page.tsx`
- Modify: `src/app/(dashboard)/inventory/page.tsx`

- [ ] **Step 1: Update warehouses page**

Add fields: `branchId` (BranchCombobox), `ownerType` (Select: BRANCH/FARM/COOP), `ownerId` (dynamic combobox based on ownerType).
Columns: Code, Name, Branch, Owner Type, Created.

- [ ] **Step 2: Update inventory/stock summary page**

Replace `itemId`/`itemName` → `productId`/`product.name`.
Replace `quantity` → `quantityOnHand`, `quantityAvailable`.
Add `stockStatus` badge. Add `StockStatus` filter.

- [ ] **Step 3: Commit** `git commit -m "feat: update warehouses and inventory pages"`

---

## Chunk 7: Sales, Logistics, Marketing Pages

### Task 27: Update Sales Orders Pages

**Files:**
- Modify: `src/app/(dashboard)/sales-orders/page.tsx`
- Modify: `src/app/(dashboard)/sales-orders/new/page.tsx`
- Modify: `src/app/(dashboard)/sales-orders/[id]/page.tsx`

- [ ] **Step 1: Update all 3 pages**

- `soNumber` → `doNumber`
- `customerName` → `CustomerCombobox` (customerId) or `BreederCombobox` (breederId) based on `recipientType`
- `DocumentStatus` → `SalesStatus`
- Lines: `productDescription`, `birdCount`, `totalWeightKg`, `unitPrice`, `totalPrice`
- Pass `SALES_STATUS_TRANSITIONS` to `StatusAction`
- Add `BranchCombobox`, `ProjectCombobox`

- [ ] **Step 2: Commit** `git commit -m "feat: update sales orders for new schema"`

### Task 28: Create Deliveries Pages (replaces Delivery Orders)

**Files:**
- Create: `src/app/(dashboard)/deliveries/page.tsx`
- Create: `src/app/(dashboard)/deliveries/new/page.tsx`
- Create: `src/app/(dashboard)/deliveries/[id]/page.tsx`

- [ ] **Step 1: Create all 3 pages**

List columns: Sales Order, Customer/Breeder, Vehicle, Driver, Delivery Date, Status.
Create form: `salesOrderId` (select), `customerId`/`breederId`, `vehicleId` (VehicleCombobox), `driverEmployeeId`/`helperEmployeeId` (EmployeeCombobox), `deliveryDate`, lines with `birdCount`, `weightKg`.
Detail: info cards, lines table, `DELIVERY_STATUS_TRANSITIONS` for StatusAction.
Endpoint: `/deliveries`.

- [ ] **Step 2: Commit** `git commit -m "feat: add deliveries pages"`

### Task 29: Update Goods Transfers Pages

**Files:**
- Modify: `src/app/(dashboard)/goods-transfers/page.tsx`
- Modify: `src/app/(dashboard)/goods-transfers/new/page.tsx`
- Modify: `src/app/(dashboard)/goods-transfers/[id]/page.tsx`

- [ ] **Step 1: Update all 3 pages**

- `gtNumber` → `transferNumber`
- `DocumentStatus` → `TransferStatus`
- Lines: `productId`, `uomId`, `quantitySent`, `quantityReceived`, `quantityDamaged`
- Pass `TRANSFER_STATUS_TRANSITIONS` to `StatusAction`
- Add `BranchCombobox`

- [ ] **Step 2: Commit** `git commit -m "feat: update goods transfers for new schema"`

### Task 30: Create Logistics Pages

**Files:**
- Create: `src/app/(dashboard)/goods-consumptions/page.tsx`, `new/page.tsx`, `[id]/page.tsx`
- Create: `src/app/(dashboard)/goods-returns/page.tsx`, `new/page.tsx`, `[id]/page.tsx`
- Create: `src/app/(dashboard)/internal-trades/page.tsx`, `new/page.tsx`, `[id]/page.tsx`
- Create: `src/app/(dashboard)/logistics-shipping-costs/page.tsx` (Pattern A)
- Create: `src/app/(dashboard)/logistics-verifications/page.tsx` (Pattern A)

- [ ] **Step 1: Create Goods Consumption pages (Enhanced)**

List + Create + Detail following PO pattern. Status transitions via `CONSUMPTION_STATUS_TRANSITIONS`. Lines: product, uom, qty, unit cost.

- [ ] **Step 2: Create Goods Returns pages (Enhanced)**

Similar pattern. Status transitions via `RETURN_STATUS_TRANSITIONS`. Lines: product, uom, qty, reason.

- [ ] **Step 3: Create Internal Trade pages (Enhanced)**

Similar pattern. Status transitions via `INTERNAL_TRADE_STATUS_TRANSITIONS`. Lines: product, uom, qty, unit price.

- [ ] **Step 4: Create Logistics Shipping Costs page (Simple CRUD)**

Columns: Reference Type, Reference ID, Total Cost, Created. Form: `referenceType`, `referenceId`, `fuelCost`, `tollCost`, `otherCost`.

- [ ] **Step 5: Create Logistics Verifications page (Simple CRUD)**

Columns: Reference Type, Status, Verified By, Created. Form: `referenceType`, `referenceId`, `verificationType`, `notes`.

- [ ] **Step 6: Commit** `git commit -m "feat: add logistics module pages"`

### Task 31: Create Marketing Pages

**Files:**
- Create: `src/app/(dashboard)/sales-invoices/page.tsx` (Enhanced — list + detail)
- Create: `src/app/(dashboard)/sales-payments/page.tsx` (Enhanced — list + detail)
- Create: `src/app/(dashboard)/delivery-shipping-costs/page.tsx` (Simple CRUD)
- Create: `src/app/(dashboard)/driver-bonuses/page.tsx` (Simple CRUD)

- [ ] **Step 1: Create Sales Invoices pages**

List columns: Invoice Number, Customer, Invoice Date, Total, Paid, Remaining, Payment Status.
Detail: Invoice info, payment history, status badge.

- [ ] **Step 2: Create Sales Payments page**

List columns: Invoice, Amount, Date, Method, Status.
Detail: Payment info, verify/reject actions.

- [ ] **Step 3: Create Delivery Shipping Costs page (Simple CRUD)**

Columns: Delivery, Fuel Cost, Toll Cost, Other, Total. Form fields: `deliveryId`, `fuelCost`, `tollCost`, `otherCost`.

- [ ] **Step 4: Create Driver Bonuses page (Simple CRUD)**

Columns: Delivery, Employee, Amount, Payment Status. Form fields: `deliveryId`, `employeeId`, `amount`.

- [ ] **Step 5: Commit** `git commit -m "feat: add marketing module pages"`

---

## Chunk 8: Standards, Bonus, Finance Pages

### Task 32: Create Standards Pages

**Files:**
- Create: `src/app/(dashboard)/contract-categories/page.tsx` (Simple CRUD)
- Create: `src/app/(dashboard)/fcr-standards/page.tsx` (Simple CRUD + nested details)
- Create: `src/app/(dashboard)/production-day-estimates/page.tsx` (Simple CRUD)
- Create: `src/app/(dashboard)/recording-deviation/page.tsx` (Singleton — Pattern C)
- Create: `src/app/(dashboard)/coop-readiness/page.tsx` (Singleton — Pattern C)
- Create: `src/app/(dashboard)/chick-in-plans/page.tsx` (Simple CRUD)
- Create: `src/app/(dashboard)/budget-standards/page.tsx` (Simple CRUD + nested details)

- [ ] **Step 1: Create 5 simple CRUD pages**

Contract Categories, Production Day Estimates, Chick-In Plans follow the standard pattern.
FCR Standards and Budget Standards need nested detail rows in the create/edit modal (add/remove detail rows dynamically).

- [ ] **Step 2: Create 2 singleton settings pages**

Recording Deviation and Coop Readiness use Pattern C:
- `useApi` to GET current value
- Form with fields, PUT on save
- No list/table
- Single card with form fields

```tsx
export default function RecordingDeviationPage() {
  const { data, isLoading, refetch } = useApi<RecordingDeviation>("/recording-deviation");
  const [maxDays, setMaxDays] = useState("");
  // ... on save: fetchApi("/recording-deviation", { method: "PUT", body: ... })
}
```

- [ ] **Step 3: Commit** `git commit -m "feat: add standards module pages"`

### Task 33: Create Bonus Pages

**Files:**
- Create: `src/app/(dashboard)/bonus-fcr-deff/page.tsx`
- Create: `src/app/(dashboard)/bonus-ip/page.tsx`
- Create: `src/app/(dashboard)/bonus-mortality/page.tsx`
- Create: `src/app/(dashboard)/ts-incentives/page.tsx`

- [ ] **Step 1: Create all 4 pages**

FCR Deff, IP, Mortality: Simple CRUD with nested detail rows in modal (min/max/bonus). Show status badge (ACTIVE/INACTIVE).
TS Incentives: Simple CRUD — Columns: Name, Amount, Description.

- [ ] **Step 2: Commit** `git commit -m "feat: add bonus module pages"`

### Task 34: Create Finance Pages

**Files:**
- Create: `src/app/(dashboard)/bank-accounts/page.tsx`
- Create: `src/app/(dashboard)/cash-accounts/page.tsx`

- [ ] **Step 1: Create both pages (Simple CRUD)**

Bank Accounts — Columns: Bank Name, Account Number, Account Holder, Branch. Form: `branchId`, `bankName`, `accountNumber`, `accountHolder`.
Cash Accounts — Columns: Name, Branch. Form: `branchId`, `name`.

- [ ] **Step 2: Commit** `git commit -m "feat: add finance module pages"`

---

## Chunk 9: Build & Verify

### Task 35: Build and Fix Errors

**Files:** Various — fix any remaining import/type errors

- [ ] **Step 1: Run build**

```bash
npx next build
```

Fix any TypeScript errors that appear. Common issues:
- Old type imports not updated
- Missing combobox imports
- Broken imports in chat components

- [ ] **Step 2: Verify all routes render**

Start dev server: `npm run dev`
Manually check:
- Dashboard loads with hero banner
- Sidebar shows all 12 groups
- At least one page per group renders without error
- AI Insights page loads

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "fix: resolve build errors from frontend redesign"
```

---

## Task Dependency Graph

```
Chunk 1 (Foundation):
  Task 1 (Types) → Task 2 (Chat Types) → Task 3 (Constants) → Task 4 (Components) → Task 5 (Delete Old)

Chunk 2 (Dashboard):
  Task 6 (Dashboard) ─┐
  Task 7 (AI Insights) ┼→ depends on Chunk 1
  Task 8 (Chat) ───────┘

Chunks 3-4 (Org + Master Data): depends on Chunk 1
  Tasks 9-20 (all independent, can parallelize)

Chunk 5 (Projects): depends on Chunk 1 + Task 4 (comboboxes)
  Task 21 → Task 22 → Task 23

Chunks 6-7 (Purchasing, Sales, Logistics, Marketing): depends on Chunk 1 + Task 4
  Tasks 24-31 (mostly independent, can parallelize)

Chunk 8 (Standards, Bonus, Finance): depends on Chunk 1
  Tasks 32-34 (independent, can parallelize)

Chunk 9 (Build): depends on all above
  Task 35
```
