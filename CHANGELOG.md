# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-17

### Added

- **AI Insights page** with three analysis tabs:
  - Batch P&L Analysis — AI-generated profitability insights per batch with trend analysis, recommendations, and priority assessment
  - Production Forecast — AI-powered production scheduling with projected costs and revenue estimates
  - Dashboard Summary — high-level AI-generated insights on key business metrics
  - Response caching with cache status indicator
  - Rate limiting with countdown timer
- **AI Chat Assistant** — floating chat widget accessible from any page:
  - Context-aware conversations with document attachment (batches, POs, SOs, DOs, etc.)
  - Streaming responses via Server-Sent Events (SSE)
  - Markdown rendering for rich message formatting
  - Conversation history with pagination
  - Typing indicator for real-time feedback
- **Goods Transfers** — inter-warehouse inventory transfer management:
  - List page with search and pagination
  - Create new transfers with warehouse-to-warehouse flow
  - Detail page with line items, costs, and status tracking
  - Full document status workflow (Draft → Submitted → Approved → Processed → Closed)
- AI-related API integrations (`/ai/batch-pnl-analysis`, `/ai/production-forecast`, `/ai/dashboard-summary`)
- Chat API integrations (`/chat/conversations`, `/chat/messages`)
- Goods Transfer API integration (`/goods-transfers`)
- New TypeScript types for chat and AI insight responses
- `use-chat` hook for chat state management with `useReducer`
- `chat-api.ts` module for chat-specific API endpoints
- Alert UI component (`alert.tsx`)

### Changed

- Updated dashboard layout to include AI Insights in sidebar navigation
- Improved chart components and data visualization on the Dashboard page
- Updated API client with new endpoint support
- Extended constants with new navigation items

## [0.1.0] - 2026-02-10

### Added

- **Dashboard** — KPI cards (active batches, items, POs, SOs), purchasing vs sales comparison chart, document status breakdown pie chart
- **Authentication** — login page with Bearer token auth, protected route layout
- **Farm Management**:
  - Farms — CRUD with address and linked kandangs
  - Kandangs — animal housing units (Active / Inactive / Maintenance)
  - Batches — animal batch tracking (Active / Closed)
- **Inventory Management**:
  - Items — product/material master with types (Raw Material, Finished Good, Feed, Medicine, Consumable)
  - Item Categories — hierarchical categorization
  - Warehouses — storage location master
  - Inventory — stock summary view
- **Purchasing**:
  - Purchase Orders — create, submit, approve workflow with line items
  - Goods Receipts — receive against POs, track costs, optional batch linking
- **Sales**:
  - Sales Orders — customer orders with line items
  - Delivery Orders — fulfill against SOs, optional batch linking
- **Production**:
  - Production Orders — input materials consumed → output products produced, optional batch linking
- **Reports**:
  - Batch P&L — summary table and detail page with KPI cards, cost breakdown chart, revenue breakdown, movement history
- **Finance**:
  - Chart of Accounts — GL account master (Asset, Liability, Equity, Revenue, Expense)
  - Journal Entries — general ledger with debit/credit lines
  - Payments — incoming/outgoing payment tracking
- **Document Status Workflow** — DRAFT → SUBMITTED → APPROVED → PROCESSED → CLOSED (with CANCELLED branch)
- **Shared Components** — data table with pagination/search, page header, status badge, status action dropdown, item/batch combobox, confirm dialog, loading skeleton, empty state, currency formatter
- **Layout** — collapsible sidebar navigation, top header with user menu, dynamic breadcrumbs
- API client with `fetchApi` and `fetchPaginated` utilities
- `useApi` and `usePaginated` hooks for data fetching
- Auth context with `useAuth` hook
- URL-based state management with `nuqs`
- Full TypeScript type definitions for all API entities

[1.0.0]: https://github.com/user/breeding-dashboard/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/user/breeding-dashboard/releases/tag/v0.1.0
