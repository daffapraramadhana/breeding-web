# Breeding Dashboard

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)]()
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)]()
[![License](https://img.shields.io/badge/license-Private-red.svg)]()

Farm management ERP dashboard for breeding operations. Tracks the full lifecycle from purchasing feed, producing meat, selling products, and analyzing profitability per animal batch — now with AI-powered insights and conversational assistant.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, TailwindCSS 4, shadcn/ui
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod
- **State:** React Context (auth), nuqs (URL state)
- **AI/Chat:** react-markdown, remark-gfm, SSE streaming
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
│   │   ├── goods-transfers/      # Inter-warehouse transfers
│   │   ├── purchase-orders/      # PO list, create, detail
│   │   ├── goods-receipts/       # GR list, create, detail
│   │   ├── sales-orders/         # SO list, create, detail
│   │   ├── delivery-orders/      # DO list, create, detail
│   │   ├── production-orders/    # Production list, create, detail
│   │   ├── ai-insights/          # AI-powered analytics
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
│   ├── chat/                     # AI chat widget components
│   │   ├── chat-widget.tsx       # Main chat container
│   │   ├── chat-fab.tsx          # Floating action button
│   │   ├── chat-panel.tsx        # Chat panel layout
│   │   ├── chat-input.tsx        # Message input with context
│   │   ├── chat-messages.tsx     # Message list display
│   │   ├── chat-message-bubble.tsx
│   │   ├── conversation-list.tsx # Saved conversations
│   │   ├── context-picker.tsx    # Context type selector
│   │   ├── context-badge.tsx     # Context attachment display
│   │   ├── markdown-renderer.tsx # Markdown in messages
│   │   └── typing-indicator.tsx  # Typing animation
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
│   ├── use-chat.ts               # Chat state management
│   └── use-mobile.ts             # Mobile detection
├── lib/
│   ├── api.ts                    # API client (fetchApi, fetchPaginated)
│   ├── chat-api.ts               # Chat API endpoints
│   ├── auth.ts                   # Token/user storage
│   ├── constants.ts              # Nav items, status colors
│   └── utils.ts                  # Formatters (currency, date, quantity)
└── types/
    ├── api.ts                    # All TypeScript interfaces
    └── chat.ts                   # Chat type definitions
```

## Features

### Dashboard
- KPI cards (active batches, items, POs, SOs)
- Purchasing vs Sales comparison chart
- Document status breakdown pie chart

### Master Data
- **Farms** — CRUD with address, linked kandangs
- **Kandangs** — Animal housing units (Active / Inactive / Maintenance)
- **Batches** — Animal batch tracking (Active / Closed)
- **Items** — Product/material master with types (Raw Material, Finished Good, Feed, Medicine, Consumable)
- **Item Categories** — Hierarchical categorization
- **Warehouses** — Storage locations

### Inventory
- **Stock Summary** — Real-time inventory levels per warehouse
- **Goods Transfers** — Transfer inventory between warehouses with full line item tracking, cost recording, and status workflow

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

### AI Insights
- **Batch P&L Analysis** — AI-generated profitability insights per batch with trend analysis, recommendations, and priority assessment (Baik / Cukup / Buruk)
- **Production Forecast** — AI-powered production scheduling with projected costs and revenue estimates in a tabular format
- **Dashboard Summary** — High-level AI-generated insights on key business metrics and operational trends
- Response caching with cache status indicator
- Rate limiting with countdown timer

### AI Chat Assistant
- Floating chat widget accessible from any page
- Context-aware conversations — attach batches, POs, SOs, DOs, and other documents to messages for contextual queries
- Streaming responses via Server-Sent Events (SSE)
- Markdown rendering with syntax highlighting
- Conversation history with pagination
- Typing indicator for real-time feedback

## Document Status Flow

```
DRAFT → SUBMITTED → APPROVED → PROCESSED → CLOSED
  ↓         ↓          ↓
  └─────── CANCELLED ──┘
```

All transaction documents (PO, GR, SO, DO, Production Order, Goods Transfer) follow this workflow.

## Batch P&L Flow

Batch-level profitability tracking works through execution documents:

```
1. Create batch           → BATCH-2026-001 (500 Broiler Chickens)
2. Purchase feed          → GR with batchId on lines       → tracks purchase cost
3. Produce meat           → Production Order with batchId   → tracks production cost
4. Sell products          → DO with batchId on lines        → tracks revenue
5. View P&L              → /reports/batch-pnl/:batchId     → aggregated report
6. Get AI insights        → /ai-insights                    → AI-powered analysis
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
- `/goods-transfers` — Inter-warehouse transfers
- `/purchase-orders`, `/goods-receipts` — Purchasing
- `/sales-orders`, `/delivery-orders` — Sales
- `/production-orders` — Production
- `/reports/batch-pnl` — Batch P&L reports
- `/finance/chart-of-accounts`, `/finance/journal-entries`, `/finance/payments` — Finance
- `/ai/batch-pnl-analysis`, `/ai/production-forecast`, `/ai/dashboard-summary` — AI Insights
- `/chat/conversations`, `/chat/messages` — Chat conversations

## Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Versioning

This project follows [Semantic Versioning](https://semver.org/). See [CHANGELOG.md](CHANGELOG.md) for release history.
