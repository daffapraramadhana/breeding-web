// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Farm
export interface Farm {
  id: string;
  name: string;
  address?: string;
  kandangs?: Kandang[];
  createdAt: string;
  updatedAt: string;
}

// Kandang
export type KandangStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export interface Kandang {
  id: string;
  farmId: string;
  farm?: Farm;
  name: string;
  capacity: number;
  status: KandangStatus;
  createdAt: string;
  updatedAt: string;
}

// Batch
export type BatchStatus = "ACTIVE" | "CLOSED";

export interface Batch {
  id: string;
  kandangId: string;
  kandang?: Kandang;
  batchNumber: string;
  species: string;
  initialQty: number;
  startDate: string;
  notes?: string;
  status: BatchStatus;
  createdAt: string;
  updatedAt: string;
}

// Item Category
export interface ItemCategory {
  id: string;
  code: string;
  name: string;
  parentId?: string;
  parent?: ItemCategory;
  children?: ItemCategory[];
  createdAt: string;
  updatedAt: string;
}

// Item
export type ItemType = "RAW_MATERIAL" | "FINISHED_GOOD" | "CONSUMABLE" | "FEED" | "MEDICINE";

export interface ItemUom {
  id: string;
  uomName: string;
  conversionFactor: string;
}

export interface Item {
  id: string;
  code: string;
  name: string;
  itemType: ItemType;
  baseUom: string;
  categoryId?: string;
  category?: ItemCategory;
  description?: string;
  isBatchTracked?: boolean;
  uoms?: ItemUom[];
  createdAt: string;
  updatedAt: string;
}

// Warehouse
export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

// Inventory
export interface InventoryStock {
  itemId: string;
  itemCode: string;
  itemName: string;
  baseUom: string;
  category?: ItemCategory;
  totalQuantity: string;
  warehouses: {
    warehouseId: string;
    warehouseName: string;
    quantity: string;
  }[];
}

// Document Status
export type DocumentStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "PROCESSED" | "CLOSED" | "CANCELLED";

// Purchase Order
export interface PurchaseOrderLine {
  id: string;
  itemId: string;
  item?: Item;
  quantity: string;
  uomName: string;
  unitPrice: string;
  totalPrice: string;
  receivedQty: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  orderDate: string;
  expectedDate: string;
  notes?: string;
  status: DocumentStatus;
  totalAmount: string;
  lines: PurchaseOrderLine[];
  createdAt: string;
  updatedAt: string;
}

// Goods Receipt
export interface GoodsReceiptLine {
  id: string;
  itemId: string;
  item?: Item;
  quantity: string;
  uomName: string;
  unitCost: string;
  totalCost: string;
}

export interface GoodsReceipt {
  id: string;
  grNumber: string;
  purchaseOrderId: string;
  purchaseOrder?: PurchaseOrder;
  warehouseId: string;
  warehouse?: Warehouse;
  receiptDate: string;
  notes?: string;
  status: DocumentStatus;
  totalAmount: string;
  lines: GoodsReceiptLine[];
  createdAt: string;
  updatedAt: string;
}

// Sales Order
export interface SalesOrderLine {
  id: string;
  itemId: string;
  item?: Item;
  quantity: string;
  uomName: string;
  unitPrice: string;
  totalPrice: string;
  deliveredQty: string;
}

export interface SalesOrder {
  id: string;
  soNumber: string;
  customerName: string;
  orderDate: string;
  expectedDate: string;
  notes?: string;
  status: DocumentStatus;
  totalAmount: string;
  lines: SalesOrderLine[];
  createdAt: string;
  updatedAt: string;
}

// Delivery Order
export interface DeliveryOrderLine {
  id: string;
  itemId: string;
  item?: Item;
  quantity: string;
  uomName: string;
}

export interface DeliveryOrder {
  id: string;
  doNumber: string;
  salesOrderId: string;
  salesOrder?: SalesOrder;
  warehouseId: string;
  warehouse?: Warehouse;
  deliveryDate: string;
  notes?: string;
  status: DocumentStatus;
  totalAmount: string;
  lines: DeliveryOrderLine[];
  createdAt: string;
  updatedAt: string;
}

// Production Order
export interface ProductionOrderInput {
  id: string;
  itemId: string;
  item?: Item;
  quantity: string;
  uomName: string;
}

export interface ProductionOrderOutput {
  id: string;
  itemId: string;
  item?: Item;
  quantity: string;
  uomName: string;
  unitCost?: string;
}

export interface ProductionOrder {
  id: string;
  prodNumber: string;
  warehouseId: string;
  warehouse?: Warehouse;
  productionDate: string;
  notes?: string;
  status: DocumentStatus;
  inputs: ProductionOrderInput[];
  outputs: ProductionOrderOutput[];
  createdAt: string;
  updatedAt: string;
}

// Chart of Accounts
export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  accountType: AccountType;
  parentId?: string;
  parent?: ChartOfAccount;
  children?: ChartOfAccount[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Journal Entry
export interface JournalEntryLine {
  id: string;
  accountId: string;
  account?: ChartOfAccount;
  debit: string;
  credit: string;
  description?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  sourceType?: string;
  sourceId?: string;
  lines: JournalEntryLine[];
  createdAt: string;
  updatedAt: string;
}

// Batch P&L Report
export interface BatchPnlSummary {
  batch: {
    id: string;
    batchNumber: string;
    species: string;
    initialQty: number;
    currentQty: number;
    startDate: string;
    endDate: string | null;
    status: "ACTIVE" | "CLOSED";
    kandang: { id: string; name: string };
    farm: { id: string; name: string };
  };
  revenue: string;
  costs: {
    purchase: string;
    productionConsume: string;
    totalCost: string;
  };
  cogs: string;
  grossProfit: string;
  margin: string;
}

export interface BatchPnlMovement {
  id: string;
  movementNumber: string;
  movementType: "IN" | "OUT";
  movementSource: "PURCHASE" | "SALES" | "PRODUCTION_CONSUME" | "PRODUCTION_OUTPUT";
  itemName: string;
  quantity: string;
  unitCost: string;
  totalCost: string;
  createdAt: string;
}

export interface BatchPnlRevenueItem {
  deliveryOrderId: string;
  itemId: string;
  itemName: string;
  quantity: string;
  unitPrice: string;
  revenue: string;
  unitCost: string;
  totalCost: string;
}

export interface BatchPnlDetail extends BatchPnlSummary {
  movements: BatchPnlMovement[];
  revenueBreakdown: BatchPnlRevenueItem[];
}

// Goods Transfer
export interface GoodsTransferLine {
  id: string;
  itemId: string;
  batchId: string | null;
  quantity: string;
  uomName: string;
  unitCost: string;
  totalCost: string;
  item: Item;
  batch: Batch | null;
}

export interface GoodsTransfer {
  id: string;
  gtNumber: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  transferDate: string;
  status: DocumentStatus;
  notes: string | null;
  createdAt: string;
  fromWarehouse: Warehouse;
  toWarehouse: Warehouse;
  lines: GoodsTransferLine[];
}

// AI Insights
export interface AiInsightResponse<T> {
  insight: T;
  cached: boolean;
  generatedAt: string;
  expiresAt?: string;
}

export interface BatchPnlAnalysis {
  ringkasan: string;
  metrik_utama: {
    total_pendapatan: string;
    total_biaya: string;
    total_laba_kotor: string;
    margin_rata_rata: string;
  };
  analisis_batch: Array<{
    batch_number: string;
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
    spesies: string;
    jumlah_batch: number;
    estimasi_qty_per_batch: number;
    kandang_rekomendasi: string;
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
    batch_aktif: number;
    batch_selesai_periode: number;
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

export interface BatchAnalysisRequest {
  status?: "ACTIVE" | "CLOSED";
  startDateFrom?: string;
  startDateTo?: string;
  farmId?: string;
}

export interface ProductionForecastRequest {
  forecastYear: number;
  species?: string;
  farmId?: string;
}

export interface DashboardSummaryRequest {
  periodStart?: string;
  periodEnd?: string;
}

// Payment
export type PaymentType = "INCOMING" | "OUTGOING";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CHECK";

export interface Payment {
  id: string;
  paymentNumber: string;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  accountPayableId?: string;
  accountReceivableId?: string;
  amount: string;
  paymentDate: string;
  reference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
