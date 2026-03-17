# Frontend Redesign for Unified Poultry ERP

**Date:** 2026-03-10
**Status:** Approved

## Context

The backend (`breeding-app`) was restructured with a unified ERD containing 74 Prisma models and 53 controllers (350+ endpoints). The frontend (`breeding-web`) still references deleted models (Batch, Kandang, Item, ItemCategory, ProductionOrder, ChartOfAccount, JournalEntry, Payment) and is missing pages for all new modules.

This spec defines a full rebuild of the dashboard frontend to align with the new backend.

## Tech Stack (Unchanged)

- Next.js 16 (App Router)
- Shadcn/ui + Radix UI
- Tailwind CSS v4
- React Hook Form + Zod
- Recharts
- nuqs (URL search params)

## 1. Navigation Structure

Sidebar organized by Business Domain — 12 groups:

| Group | Route Prefix | Pages |
|---|---|---|
| Dashboard | `/` | Main KPI dashboard |
| Organization | `/branches`, `/farms`, `/coops`, `/coop-floors` | 4 list pages, each with detail |
| Master Data | `/products`, `/product-categories`, `/suppliers`, `/customers`, `/breeders`, `/breeder-card-types`, `/employees`, `/vehicles`, `/unit-of-measures`, `/mature-bird-types` | 10 list pages |
| Projects | `/projects` | List + dashboard-style detail with tabbed sub-sections |
| Inventory | `/warehouses`, `/inventory` | 2 pages (warehouses list, stock summary) |
| Purchasing | `/purchase-orders`, `/goods-receipts` | 2 list pages + create/detail pages |
| Logistics | `/goods-transfers`, `/goods-consumptions`, `/goods-returns`, `/internal-trades`, `/logistics-shipping-costs`, `/logistics-verifications` | 6 list pages + create/detail for transactional ones |
| Sales & Marketing | `/sales-orders`, `/deliveries`, `/sales-invoices`, `/sales-payments`, `/delivery-shipping-costs`, `/driver-bonuses` | 6 list pages + create/detail for transactional ones |
| Standards | `/contract-categories`, `/fcr-standards`, `/production-day-estimates`, `/recording-deviation`, `/coop-readiness`, `/chick-in-plans`, `/budget-standards` | 7 pages (5 CRUD lists + 2 singleton settings) |
| Bonus | `/bonus-fcr-deff`, `/bonus-ip`, `/bonus-mortality`, `/ts-incentives` | 4 list pages |
| Finance | `/bank-accounts`, `/cash-accounts` | 2 list pages |
| Analytics | `/ai-insights` | 1 page (3 tabs) + Chat widget |

**Deleted pages:** `/batches`, `/kandangs`, `/items`, `/item-categories`, `/production-orders`, `/delivery-orders`, `/finance/chart-of-accounts`, `/finance/journal-entries`, `/finance/payments`, `/reports/batch-pnl`

## 2. Dashboard Layout — Hero Banner + Grid

### Hero Banner (full-width)
4 poultry-focused KPIs in a gradient banner:
- Active Projects (count)
- Bird Population (sum across active projects)
- Avg FCR (average across active projects)
- Mortality Rate % (average across active projects)

### Operational Cards (3-column grid)
- Open POs (count where status not terminal)
- Pending Sales (count where status not terminal)
- Stock Alerts (count where stockStatus = LOW or OUT_OF_STOCK)

### Charts (2-column grid)
- Project P&L Trend — bar chart showing revenue vs cost per recent project
- Purchase vs Sales — grouped bar chart comparing monthly totals

## 3. Page Patterns

### Pattern A: Simple DataTable
Used for: Master Data (10), Standards (7), Bonus (4), Finance (2), Organization (4) = ~27 pages

- `DataTable` with search input + pagination
- Create/Edit via modal dialog (no separate page)
- Delete with confirmation dialog
- Status badge where applicable
- Columns defined per page

### Pattern B: Enhanced DataTable
Used for: POs, Goods Receipts, Sales Orders, Deliveries, Goods Transfers, Goods Consumption, Goods Returns, Internal Trade, Sales Invoices, Sales Payments = ~10 pages

- Filter bar above table: status dropdown, date range picker, branch selector
- Summary stat cards above table (total count, total value, pending count)
- Create via dedicated `/new` page with line items form
- Detail via dedicated `/[id]` page
- Status transition buttons on detail page
- Line items sub-table on detail/create pages

### Pattern C: Singleton Settings
Used for: Recording Deviation, Coop Readiness = 2 pages

- Single form (GET loads current, PUT saves)
- No list/table needed

## 4. Project Detail — Dashboard-style

### Header
- Project code, farm name, branch, date range
- Status badge + action buttons (edit, transition)

### KPI Cards (4-column grid)
- Population (from chick-in records)
- FCR (from project data)
- Mortality % (computed)
- Budget Usage % (spent / total budget)

### Tabbed Sections
Each tab contains a sub-table with CRUD actions:
- **Coops** — assigned coops with capacity, PPL, status
- **Chick-Ins** — chick-in records per coop with dates and population
- **Workers** — assigned employees (add/remove only)
- **Bonuses** — FCR Deff, IP, Mortality sub-sections with detail rows
- **Budgets** — budget line items with amounts

## 5. Type System Rewrite

Replace all interfaces in `types/api.ts` with new schema types:

### Removed Types
`Batch`, `Kandang`, `Item`, `ItemCategory`, `ItemUom`, `ProductionOrder`, `ProductionOrderInput`, `ProductionOrderOutput`, `ChartOfAccount`, `JournalEntry`, `JournalEntryLine`, `Payment`, `DeliveryOrder`, `DeliveryOrderLine`, `BatchPnlDetail`, `BatchPnlSummary`, `BatchPnlMovement`, `BatchPnlRevenueItem`

### New/Updated Types
- Organization: `Branch`, `Farm` (updated), `Coop`, `CoopFloor`
- Master Data: `Product`, `ProductCategory`, `Supplier`, `Customer`, `Breeder`, `BreederCardType`, `Employee`, `Vehicle`, `UnitOfMeasure`, `MatureBirdType`
- Project: `Project`, `ProjectCoop`, `ProjectChickIn`, `ProjectWorker`, `ProjectBonusFcrDeff`, `ProjectBonusIp`, `ProjectBonusMortality`, `ProjectBudget`
- Inventory: `Warehouse` (updated), `InventoryStock` (updated), `InventoryMovement` (updated)
- Purchasing: `PurchaseOrder` (updated), `PurchaseOrderLine` (updated), `GoodsReceipt` (updated), `GoodsReceiptLine` (updated)
- Logistics: `GoodsTransfer` (updated), `GoodsTransferLine` (updated), `GoodsConsumption`, `GoodsConsumptionLine`, `GoodsReturn`, `GoodsReturnLine`, `InternalTrade`, `InternalTradeLine`, `LogisticsShippingCost`, `LogisticsVerification`
- Sales & Marketing: `SalesOrder` (updated), `SalesOrderLine` (updated), `Delivery`, `DeliveryLine`, `SalesInvoice`, `SalesPayment`, `DeliveryShippingCost`, `DriverBonus`
- Standards: `ContractCategory`, `FcrStandard`, `FcrStandardDetail`, `ProductionDayEstimate`, `RecordingDeviation`, `CoopReadiness`, `ChickInPlan`, `BudgetStandard`, `BudgetStandardDetail`
- Bonus: `BonusFcrDeff`, `BonusIp`, `BonusMortality`, `TsIncentive`
- Finance: `BankAccount`, `CashAccount`

### Status Enums
Replace `DocumentStatus` with domain-specific enums:
`FarmStatus`, `CoopStatus`, `EmployeeStatus`, `PurchaseStatus`, `ReceiptStatus`, `TransferStatus`, `ConsumptionStatus`, `ReturnStatus`, `InternalTradeStatus`, `SalesStatus`, `DeliveryStatus`, `PaymentStatus`, `InvoicePaymentStatus`, `DriverBonusPaymentStatus`, `VerificationStatus`, `BonusStatus`, `StockStatus`

## 6. Shared Component Updates

- `StatusBadge` — extend color map for all new status enums
- `ItemCombobox` → `ProductCombobox` — search products endpoint
- `BatchCombobox` → `ProjectCombobox` — search projects endpoint
- New: `BranchCombobox`, `SupplierCombobox`, `CustomerCombobox`, `BreederCombobox`, `EmployeeCombobox`, `WarehouseCombobox`, `CoopCombobox`
- `LineItemsField` — update field names (productId, uomId, etc.)
- `constants.ts` — rewrite sidebar navigation config

## 7. Chat Context Updates

Replace old context types with new ones:
- Remove: `batch`, `batch_pnl`, `production_order`, `item`, `journal_entry`, `account_payable`, `account_receivable`, `payment`
- Keep: `purchase_order`, `sales_order`, `goods_receipt`, `inventory_stock`
- Add: `project`, `coop`, `product`, `delivery`, `goods_transfer`, `goods_consumption`, `goods_return`, `internal_trade`

## 8. AI Insights Updates

- Rename "Analisis P&L Batch" → "Analisis P&L Proyek" (project-based)
- Update request params: remove batchId/batchStatus, add projectId
- Update response types to match new backend prompt data structures
- Production Forecast: use project/coop data instead of batch/kandang
- Dashboard Summary: use project counts, product data instead of batch/item
