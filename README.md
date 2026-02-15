# Breeding Dashboard

Farm management ERP dashboard for breeding operations. Tracks the full lifecycle from purchasing feed, producing meat, selling products, and analyzing profitability per animal batch.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, TailwindCSS 4, shadcn/ui
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod
- **State:** React Context (auth), nuqs (URL state)
- **Language:** TypeScript 5

## Getting Started

```bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit NEXT_PUBLIC_API_URL to point to your backend

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3000/api` |

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/             # Login page
│   ├── (dashboard)/              # Protected routes (requires auth)
│   │   ├── page.tsx              # Dashboard home (KPIs, charts)
│   │   ├── farms/                # Farm CRUD
│   │   ├── kandangs/             # Animal housing
│   │   ├── batches/              # Animal batch tracking
│   │   ├── items/                # Item master
│   │   ├── item-categories/      # Item categories
│   │   ├── warehouses/           # Warehouse master
│   │   ├── inventory/            # Stock summary
│   │   ├── purchase-orders/      # PO list, create, detail
│   │   ├── goods-receipts/       # GR list, create, detail
│   │   ├── sales-orders/         # SO list, create, detail
│   │   ├── delivery-orders/      # DO list, create, detail
│   │   ├── production-orders/    # Production list, create, detail
│   │   ├── reports/
│   │   │   └── batch-pnl/        # Batch P&L report + detail
│   │   └── finance/
│   │       ├── chart-of-accounts/
│   │       ├── journal-entries/
│   │       └── payments/
│   ├── layout.tsx                # Root layout
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── shared/                   # Reusable app components
│   │   ├── data-table.tsx        # Paginated table with search
│   │   ├── page-header.tsx       # Page title + actions
│   │   ├── status-badge.tsx      # Document status display
│   │   ├── status-action.tsx     # Status transition dropdown
│   │   ├── item-combobox.tsx     # Searchable item selector
│   │   ├── batch-combobox.tsx    # Searchable batch selector
│   │   ├── confirm-dialog.tsx    # Delete confirmation
│   │   ├── loading-skeleton.tsx  # Loading states
│   │   ├── empty-state.tsx       # Empty data display
│   │   └── currency.tsx          # Currency formatter
│   ├── forms/
│   │   └── line-items-field.tsx  # Dynamic line items table
│   ├── layout/
│   │   ├── app-sidebar.tsx       # Navigation sidebar
│   │   ├── header.tsx            # Top header bar
│   │   └── breadcrumbs.tsx       # Dynamic breadcrumbs
│   └── providers.tsx             # Auth + toast providers
├── hooks/
│   ├── use-auth.ts               # Auth context hook
│   ├── use-api.ts                # Data fetching (useApi, usePaginated)
│   └── use-mobile.ts             # Mobile detection
├── lib/
│   ├── api.ts                    # API client (fetchApi, fetchPaginated)
│   ├── auth.ts                   # Token/user storage
│   ├── constants.ts              # Nav items, status colors
│   └── utils.ts                  # Formatters (currency, date, quantity)
└── types/
    └── api.ts                    # All TypeScript interfaces
```

## Features

### Master Data
- **Farms** — CRUD with address, linked kandangs
- **Kandangs** — Animal housing units (Active / Inactive / Maintenance)
- **Batches** — Animal batch tracking (Active / Closed)
- **Items** — Product/material master with types (Raw Material, Finished Good, Feed, Medicine, Consumable)
- **Item Categories** — Hierarchical categorization
- **Warehouses** — Storage locations

### Purchasing
- **Purchase Orders** — Create, submit, approve workflow with line items
- **Goods Receipts** — Receive against POs, track costs, optional batch linking

### Sales
- **Sales Orders** — Customer orders with line items
- **Delivery Orders** — Fulfill against SOs, optional batch linking

### Production
- **Production Orders** — Input materials consumed → Output products produced, optional batch linking on both inputs and outputs

### Reports
- **Batch P&L** — Profit & Loss per animal batch
  - Summary table with revenue, costs, gross profit, margin per batch
  - Detail page with KPI cards, cost breakdown chart, revenue breakdown table, movement history
  - Filter by batch status (Active / Closed)

### Finance
- **Chart of Accounts** — GL account master (Asset, Liability, Equity, Revenue, Expense)
- **Journal Entries** — General ledger entries with debit/credit lines
- **Payments** — Incoming/outgoing payment tracking

### Dashboard
- KPI cards (active batches, items, POs, SOs)
- Purchasing vs Sales comparison chart
- Document status breakdown pie chart

## Document Status Flow

```
DRAFT → SUBMITTED → APPROVED → PROCESSED → CLOSED
  ↓         ↓          ↓
  └─────── CANCELLED ──┘
```

All transaction documents (PO, GR, SO, DO, Production Order) follow this workflow.

## Batch P&L Flow

Batch-level profitability tracking works through execution documents:

```
1. Create batch           → BATCH-2026-001 (500 Broiler Chickens)
2. Purchase feed          → GR with batchId on lines       → tracks purchase cost
3. Produce meat           → Production Order with batchId   → tracks production cost
4. Sell products          → DO with batchId on lines        → tracks revenue
5. View P&L              → /reports/batch-pnl/:batchId     → aggregated report
```

`batchId` is optional on all execution forms — transactions without it still work but won't appear in batch reports.

**Planning documents** (PO, SO) do not carry `batchId` — the batch is assigned at execution time when you know which batch the goods belong to.

## API Integration

The frontend connects to a REST API backend. All endpoints use Bearer token authentication.

Key endpoint groups:
- `POST /auth/login` — Authentication
- `/farms`, `/kandangs`, `/batches` — Farm management
- `/items`, `/item-categories`, `/warehouses` — Inventory master
- `/inventory-stocks/summary` — Stock levels
- `/purchase-orders`, `/goods-receipts` — Purchasing
- `/sales-orders`, `/delivery-orders` — Sales
- `/production-orders` — Production
- `/reports/batch-pnl` — Batch P&L reports
- `/finance/chart-of-accounts`, `/finance/journal-entries`, `/finance/payments` — Finance

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```
