# Breeding Dashboard — Next.js Frontend

## Routing

- App Router with two route groups: `(auth)` for login, `(dashboard)` for protected pages
- All dashboard pages use `"use client"` directive

## Data Fetching

- `useApi<T>(endpoint)` — single endpoint fetch with loading/error states
- `usePaginated<T>(endpoint)` — paginated fetch with search and filtering
- `fetchApi(endpoint, options)` — manual API calls with Bearer token injection
- Hooks are in `src/hooks/`

## Forms

- React Hook Form + Zod validation schemas
- Follow existing form patterns in similar pages (e.g., create/edit pages for any module)
- Use combobox components from `src/components/forms/` for entity selection (customer, supplier, product, warehouse, farm, coop, etc.)
- Dynamic line items: use `LineItemsField` component for table rows

## UI Components

- **Primitives:** shadcn/ui in `src/components/ui/` (30+ components)
- **Shared:** `src/components/shared/` — `DataTable`, `PageHeader`, `StatusBadge`, `CurrencyFormatter`
- **Layout:** `src/components/layout/` — sidebar, header, breadcrumbs

## Styling

- Tailwind CSS only — no CSS modules
- Use `cn()` utility from `src/lib/utils.ts` for conditional classes
- oklch CSS variables for theming (light/dark/emerald)
- Theme toggle via `next-themes`

## i18n

- `next-intl` with `useTranslations()` hook
- Locale files: `messages/en.json` and `messages/id.json`
- Add keys to both files when adding user-facing text

## API Types

- All TypeScript types for API responses/requests in `src/types/api.ts`
- Keep in sync with backend DTOs

## Commands

```bash
npm run dev    # Dev server
npm run build  # Production build
npm run lint   # ESLint
```
