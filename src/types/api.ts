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
export type StockStatus = "NORMAL" | "LOW" | "CRITICAL" | "OVERSTOCK";
export type WarehouseOwnerType = "BRANCH" | "FARM" | "COOP";
export type PurchaseDestinationType = "BRANCH" | "FARM" | "COOP";
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
  baseUomId?: string;
  baseUom?: UnitOfMeasure;
  categoryId?: string;
  category?: ProductCategory;
  supplierId?: string;
  supplier?: Supplier;
  minStock?: number;
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
  contractCategory?: ContractCategory;
  fcrStandardId?: string;
  fcrStandard?: FcrStandard;
  productionDayEstimateId?: string;
  productionDayEstimate?: ProductionDayEstimate;
  supervisorIncentive?: string;
  isActive?: boolean;
  checkCulling?: boolean;
  checkMortality?: boolean;
  coopTypePercentage?: string;
  cumulativeMultiplier?: string;
  coopMultiplier?: string;
  projectType?: number;
  status?: string;
  projectCoops?: ProjectCoop[];
  projectBonusFcrDeffs?: ProjectBonusFcrDeff[];
  projectBonusIps?: ProjectBonusIp[];
  projectBonusMortalities?: ProjectBonusMortality[];
  projectBudgets?: ProjectBudget[];
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
  rearingStartDate?: string;
  rearingEndDate?: string;
  harvestStartDate?: string;
  harvestEndDate?: string;
  cleaningStartDate?: string;
  cleaningEndDate?: string;
  prepStartDate?: string;
  prepEndDate?: string;
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

// Dashboard Analytics
export interface DashboardStats {
  activeProjects: number;
  birdPopulation: number;
  avgFcr: number | null;
  mortalityRate: number | null;
  openPurchaseOrders: number;
  pendingSalesOrders: number;
  criticalStockAlerts: number;
  pendingInvoiceAmount: string;
  overdueInvoiceCount: number;
  projectsByPhase: {
    rearing: number;
    harvest: number;
    cleaning: number;
    preparation: number;
  };
}

export interface DashboardTrends {
  mortalityTrend: Array<{
    date: string;
    rate: number;
  }>;
  fcrTrend: Array<{
    date: string;
    value: number;
    standard: number;
  }>;
  salesTrend: Array<{
    week: string;
    revenue: number;
    orderCount: number;
  }>;
}
