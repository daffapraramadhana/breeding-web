# Project Create/Edit Form Enhancement

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the project create page with full 3-section form (Informasi Project, Setting Project, Bonus) and add edit support, plus a step progress indicator on the detail page.

**Architecture:** The create page (`/projects/new`) is expanded from 4 fields to ~12 fields across 3 Card sections. A shared form component handles both create and edit modes. The FarmCombobox gains a `branchId` filter prop. New comboboxes are created for FCR standards, production day estimates, contract categories, and bonus standards. The detail page gets a progress indicator component showing completion of each project setup phase (coops, chick-ins, workers, budgets). A RadioGroup UI component is added via shadcn pattern.

**Tech Stack:** Next.js 16 (App Router), React, TypeScript, shadcn/ui + Radix UI, Tailwind CSS v4, sonner (toast)

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/ui/radio-group.tsx` | Create | shadcn RadioGroup component wrapping Radix UI |
| `src/components/forms/farm-combobox.tsx` | Modify | Add optional `branchId` prop to filter farms by branch |
| `src/components/forms/fcr-standard-combobox.tsx` | Create | Searchable combobox for FCR standards |
| `src/components/forms/production-day-estimate-combobox.tsx` | Create | Searchable combobox for production day estimates |
| `src/components/forms/contract-category-combobox.tsx` | Create | Searchable combobox for contract categories |
| `src/components/forms/bonus-fcr-deff-combobox.tsx` | Create | Searchable combobox for Bonus FCR Deff standards |
| `src/components/forms/bonus-ip-combobox.tsx` | Create | Searchable combobox for Bonus IP standards |
| `src/components/forms/bonus-mortality-combobox.tsx` | Create | Searchable combobox for Bonus Mortality standards |
| `src/app/(dashboard)/projects/new/page.tsx` | Rewrite | Full 3-section project create form |
| `src/app/(dashboard)/projects/[id]/edit/page.tsx` | Create | Edit form pre-populated with existing project data |
| `src/app/(dashboard)/projects/[id]/page.tsx` | Modify | Add step progress indicator + edit button |
| `src/types/api.ts` | Modify | Add missing fields to Project interface |

---

## Chunk 1: Foundation (UI component + type updates + FarmCombobox filter)

### Task 1: Add RadioGroup UI component

**Files:**
- Create: `src/components/ui/radio-group.tsx`

- [ ] **Step 1: Create RadioGroup component**

Create the shadcn-style RadioGroup component using Radix UI (already included in `radix-ui` package v1.4):

```tsx
"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-2", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
```

- [ ] **Step 2: Verify import works**

Run: `npx tsc --noEmit --pretty 2>&1 | grep radio-group || echo "No errors"`

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/radio-group.tsx
git commit -m "feat: add RadioGroup UI component"
```

---

### Task 2: Update Project type with new fields

**Files:**
- Modify: `src/types/api.ts:581-598` (Project interface)

- [ ] **Step 1: Add new fields to Project interface**

In `src/types/api.ts`, update the `Project` interface to include the new backend fields:

```ts
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
  projectType?: number;
  status?: string;
  projectCoops?: ProjectCoop[];
  bonusFcrDeff?: ProjectBonusFcrDeff[];
  bonusIp?: ProjectBonusIp[];
  bonusMortality?: ProjectBonusMortality[];
  budgets?: ProjectBudget[];
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to Project

- [ ] **Step 3: Commit**

```bash
git add src/types/api.ts
git commit -m "feat: add new fields to Project interface"
```

---

### Task 3: Add branchId filter to FarmCombobox

**Files:**
- Modify: `src/components/forms/farm-combobox.tsx`

- [ ] **Step 1: Add branchId prop and filter**

Update FarmCombobox to accept an optional `branchId` prop. When provided, pass it as an extra param to filter farms by branch. Also reset selection when branchId changes.

```tsx
"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchPaginated } from "@/lib/api";
import { Farm } from "@/types/api";

interface FarmComboboxProps {
  value: string;
  onChange: (id: string) => void;
  branchId?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function FarmCombobox({
  value,
  onChange,
  branchId,
  disabled,
  placeholder = "Select farm...",
}: FarmComboboxProps) {
  const [open, setOpen] = useState(false);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchPaginated<Farm>("/farms", {
      limit: 100,
      search,
      extra: branchId ? { branchId } : undefined,
    })
      .then((res) => setFarms(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [search, branchId]);

  const selected = farms.find((f) => f.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selected ? selected.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search farms..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : farms.length === 0 ? (
              <CommandEmpty>No farms found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {farms.map((farm) => (
                  <CommandItem
                    key={farm.id}
                    value={farm.id}
                    onSelect={() => {
                      onChange(farm.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === farm.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{farm.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

Key changes:
- Added `branchId?: string` prop
- Added `placeholder?: string` prop
- Pass `branchId` as `extra` param to `fetchPaginated`
- Added `branchId` to `useEffect` dependency array
- Increased limit to 100 for farms

- [ ] **Step 2: Verify existing usages still work**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors — existing FarmCombobox usages don't pass branchId so they work unchanged.

- [ ] **Step 3: Commit**

```bash
git add src/components/forms/farm-combobox.tsx
git commit -m "feat: add branchId filter to FarmCombobox"
```

---

## Chunk 2: New Combobox Components

### Task 4: Create FCR Standard combobox

**Files:**
- Create: `src/components/forms/fcr-standard-combobox.tsx`

- [ ] **Step 1: Create component**

Follow the exact same pattern as `BranchCombobox` but for FCR standards:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchPaginated } from "@/lib/api";
import { FcrStandard } from "@/types/api";

interface FcrStandardComboboxProps {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function FcrStandardCombobox({
  value,
  onChange,
  disabled,
}: FcrStandardComboboxProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<FcrStandard[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchPaginated<FcrStandard>("/fcr-standards", { limit: 50, search })
      .then((res) => setItems(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [search]);

  const selected = items.find((i) => i.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selected ? selected.name : "Pilih Standarisasi FCR"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search FCR standards..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : items.length === 0 ? (
              <CommandEmpty>No FCR standards found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => {
                      onChange(item.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{item.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/forms/fcr-standard-combobox.tsx
git commit -m "feat: add FcrStandardCombobox component"
```

---

### Task 5: Create Production Day Estimate combobox

**Files:**
- Create: `src/components/forms/production-day-estimate-combobox.tsx`

- [ ] **Step 1: Create component**

Same pattern, endpoint `/production-day-estimates`, type `ProductionDayEstimate`, placeholder "Pilih Standarisasi":

```tsx
"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchPaginated } from "@/lib/api";
import { ProductionDayEstimate } from "@/types/api";

interface ProductionDayEstimateComboboxProps {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function ProductionDayEstimateCombobox({
  value,
  onChange,
  disabled,
}: ProductionDayEstimateComboboxProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ProductionDayEstimate[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchPaginated<ProductionDayEstimate>("/production-day-estimates", {
      limit: 50,
      search,
    })
      .then((res) => setItems(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [search]);

  const selected = items.find((i) => i.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selected ? selected.name : "Pilih Standarisasi"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search standards..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : items.length === 0 ? (
              <CommandEmpty>No standards found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => {
                      onChange(item.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{item.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/forms/production-day-estimate-combobox.tsx
git commit -m "feat: add ProductionDayEstimateCombobox component"
```

---

### Task 6: Create Contract Category combobox

**Files:**
- Create: `src/components/forms/contract-category-combobox.tsx`

- [ ] **Step 1: Create component**

Same pattern, endpoint `/contract-categories`, type `ContractCategory`, placeholder "Pilih Kategori":

```tsx
"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchPaginated } from "@/lib/api";
import { ContractCategory } from "@/types/api";

interface ContractCategoryComboboxProps {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function ContractCategoryCombobox({
  value,
  onChange,
  disabled,
}: ContractCategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ContractCategory[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchPaginated<ContractCategory>("/contract-categories", {
      limit: 50,
      search,
    })
      .then((res) => setItems(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [search]);

  const selected = items.find((i) => i.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selected ? selected.name : "Pilih Kategori"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search categories..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : items.length === 0 ? (
              <CommandEmpty>No categories found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => {
                      onChange(item.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{item.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/forms/contract-category-combobox.tsx
git commit -m "feat: add ContractCategoryCombobox component"
```

---

### Task 7: Create Bonus comboboxes (FCR Deff, IP, Mortality)

**Files:**
- Create: `src/components/forms/bonus-fcr-deff-combobox.tsx`
- Create: `src/components/forms/bonus-ip-combobox.tsx`
- Create: `src/components/forms/bonus-mortality-combobox.tsx`

- [ ] **Step 1: Create BonusFcrDeffCombobox**

Same pattern, endpoint `/bonus-fcr-deff`, type `BonusFcrDeff`, placeholder "Pilih Bonus FCR":

```tsx
"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchPaginated } from "@/lib/api";
import { BonusFcrDeff } from "@/types/api";

interface BonusFcrDeffComboboxProps {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function BonusFcrDeffCombobox({
  value,
  onChange,
  disabled,
}: BonusFcrDeffComboboxProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BonusFcrDeff[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchPaginated<BonusFcrDeff>("/bonus-fcr-deff", { limit: 50, search })
      .then((res) => setItems(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [search]);

  const selected = items.find((i) => i.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selected ? selected.name : "Pilih Bonus FCR"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search bonus FCR..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : items.length === 0 ? (
              <CommandEmpty>No bonus standards found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => {
                      onChange(item.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{item.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Create BonusIpCombobox**

Same pattern but endpoint `/bonus-ip`, type `BonusIp`, placeholder "Pilih Bonus IP":

```tsx
"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchPaginated } from "@/lib/api";
import { BonusIp } from "@/types/api";

interface BonusIpComboboxProps {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function BonusIpCombobox({
  value,
  onChange,
  disabled,
}: BonusIpComboboxProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BonusIp[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchPaginated<BonusIp>("/bonus-ip", { limit: 50, search })
      .then((res) => setItems(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [search]);

  const selected = items.find((i) => i.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selected ? selected.name : "Pilih Bonus IP"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search bonus IP..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : items.length === 0 ? (
              <CommandEmpty>No bonus standards found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => {
                      onChange(item.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{item.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 3: Create BonusMortalityCombobox**

Same pattern but endpoint `/bonus-mortality`, type `BonusMortality`, placeholder "Pilih Bonus Mortality":

```tsx
"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchPaginated } from "@/lib/api";
import { BonusMortality } from "@/types/api";

interface BonusMortalityComboboxProps {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function BonusMortalityCombobox({
  value,
  onChange,
  disabled,
}: BonusMortalityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BonusMortality[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchPaginated<BonusMortality>("/bonus-mortality", { limit: 50, search })
      .then((res) => setItems(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [search]);

  const selected = items.find((i) => i.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selected ? selected.name : "Pilih Bonus Mortality"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search bonus mortality..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : items.length === 0 ? (
              <CommandEmpty>No bonus standards found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => {
                      onChange(item.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{item.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 4: Verify all compile**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 5: Commit**

```bash
git add src/components/forms/bonus-fcr-deff-combobox.tsx src/components/forms/bonus-ip-combobox.tsx src/components/forms/bonus-mortality-combobox.tsx
git commit -m "feat: add bonus combobox components (FCR Deff, IP, Mortality)"
```

---

## Chunk 3: Enhanced Project Create Page

### Task 8: Rewrite project create page with 3 sections

**Files:**
- Rewrite: `src/app/(dashboard)/projects/new/page.tsx`

- [ ] **Step 1: Implement the full create form**

Rewrite the create page with 3 Card sections: Informasi Project, Setting Project, Bonus.

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

import { fetchApi } from "@/lib/api";
import { useApi } from "@/hooks/use-api";
import { Farm, Coop } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageHeader } from "@/components/shared/page-header";
import { BranchCombobox } from "@/components/forms/branch-combobox";
import { FarmCombobox } from "@/components/forms/farm-combobox";
import { ContractCategoryCombobox } from "@/components/forms/contract-category-combobox";
import { FcrStandardCombobox } from "@/components/forms/fcr-standard-combobox";
import { ProductionDayEstimateCombobox } from "@/components/forms/production-day-estimate-combobox";
import { BonusFcrDeffCombobox } from "@/components/forms/bonus-fcr-deff-combobox";
import { BonusIpCombobox } from "@/components/forms/bonus-ip-combobox";
import { BonusMortalityCombobox } from "@/components/forms/bonus-mortality-combobox";

interface BonusRow {
  type: "fcr-deff" | "ip" | "mortality";
  bonusId: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Section 1: Informasi Project ---
  const [branchId, setBranchId] = useState("");
  const [farmId, setFarmId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [contractCategoryId, setContractCategoryId] = useState("");
  const [supervisorIncentive, setSupervisorIncentive] = useState("10");
  const [isActive, setIsActive] = useState(true);

  // --- Section 2: Setting Project ---
  const [fcrStandardId, setFcrStandardId] = useState("");
  const [productionDayEstimateId, setProductionDayEstimateId] = useState("");
  const [cullingType, setCullingType] = useState<"culling" | "culling-mortality">("culling");

  // --- Section 3: Bonus ---
  const [bonusRows, setBonusRows] = useState<BonusRow[]>([]);

  // --- Derived: Fetch coops when farm is selected ---
  const { data: farmDetail } = useApi<Farm>(farmId ? `/farms/${farmId}` : "");
  const coops: Coop[] = farmDetail?.coops || [];

  // Reset farmId when branchId changes
  useEffect(() => {
    setFarmId("");
  }, [branchId]);

  function addBonusRow() {
    setBonusRows([...bonusRows, { type: "fcr-deff", bonusId: "" }]);
  }

  function removeBonusRow(index: number) {
    setBonusRows(bonusRows.filter((_, i) => i !== index));
  }

  function updateBonusRow(index: number, field: keyof BonusRow, value: string) {
    const updated = [...bonusRows];
    if (field === "type") {
      updated[index] = { type: value as BonusRow["type"], bonusId: "" };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setBonusRows(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!branchId) {
      toast.error("Area (Branch) wajib dipilih");
      return;
    }
    if (!farmId) {
      toast.error("Farm wajib dipilih");
      return;
    }
    if (!startDate) {
      toast.error("Tanggal mulai wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Create the project
      const body: Record<string, unknown> = {
        branchId,
        farmId,
        startDate,
        checkCulling: cullingType === "culling" || cullingType === "culling-mortality",
        checkMortality: cullingType === "culling-mortality",
        isActive,
      };

      if (contractCategoryId) body.contractCategoryId = contractCategoryId;
      if (fcrStandardId) body.fcrStandardId = fcrStandardId;
      if (productionDayEstimateId) body.productionDayEstimateId = productionDayEstimateId;
      if (supervisorIncentive) body.supervisorIncentive = parseFloat(supervisorIncentive);

      const result = await fetchApi<{ id: string }>("/projects", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const projectId = result.id;

      // Step 2: Attach bonuses (if any selected)
      const bonusPromises = bonusRows
        .filter((row) => row.bonusId)
        .map((row) => {
          const endpoint =
            row.type === "fcr-deff"
              ? `/projects/${projectId}/bonus-fcr-deff`
              : row.type === "ip"
                ? `/projects/${projectId}/bonus-ip`
                : `/projects/${projectId}/bonus-mortality`;

          const bonusIdField =
            row.type === "fcr-deff"
              ? "bonusFcrDeffId"
              : row.type === "ip"
                ? "bonusIpId"
                : "bonusMortalityId";

          return fetchApi(endpoint, {
            method: "POST",
            body: JSON.stringify({ [bonusIdField]: row.bonusId }),
          });
        });

      if (bonusPromises.length > 0) {
        await Promise.allSettled(bonusPromises);
      }

      toast.success("Project berhasil dibuat");
      router.push(`/projects/${projectId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal membuat project"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Project Baru"
        actions={
          <Button variant="outline" asChild>
            <Link href="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── Section 1: Informasi Project ──────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Project</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tanggal Mulai *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Kategori Proyek</Label>
              <ContractCategoryCombobox
                value={contractCategoryId}
                onChange={setContractCategoryId}
              />
            </div>

            <div className="space-y-2">
              <Label>Nama Area (Branch) *</Label>
              <BranchCombobox
                value={branchId}
                onChange={setBranchId}
              />
            </div>

            <div className="space-y-2">
              <Label>Nama Farm *</Label>
              <FarmCombobox
                value={farmId}
                onChange={setFarmId}
                branchId={branchId || undefined}
                disabled={!branchId}
                placeholder={
                  branchId ? "Pilih Farm" : "Pilih Area Terlebih Dahulu"
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Insentif SPV</Label>
              <div className="flex items-center gap-3">
                <Select
                  value={supervisorIncentive}
                  onValueChange={setSupervisorIncentive}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="10.5">10.5%</SelectItem>
                    <SelectItem value="11">11%</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="nonAktif"
                    checked={!isActive}
                    onCheckedChange={(checked) => setIsActive(!checked)}
                  />
                  <Label htmlFor="nonAktif" className="text-sm font-normal">
                    Non Aktif
                  </Label>
                </div>
              </div>
            </div>

            {/* Nama Kandang — auto-populated read-only */}
            <div className="space-y-2">
              <Label>Nama Kandang</Label>
              {!farmId ? (
                <p className="text-sm text-muted-foreground py-2">
                  Pilih Farm Terlebih Dahulu
                </p>
              ) : coops.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Tidak ada kandang di farm ini
                </p>
              ) : (
                <div className="space-y-1">
                  {coops.map((coop) => (
                    <div
                      key={coop.id}
                      className="text-sm py-1 px-3 bg-muted rounded"
                    >
                      {coop.code} - {coop.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ─── Section 2: Setting Project ────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Setting Project</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Standarisasi FCR</Label>
              <FcrStandardCombobox
                value={fcrStandardId}
                onChange={setFcrStandardId}
              />
            </div>

            <div className="space-y-2">
              <Label>Standarisasi Data Harian</Label>
              <ProductionDayEstimateCombobox
                value={productionDayEstimateId}
                onChange={setProductionDayEstimateId}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Pengakuan Jumlah Culling</Label>
              <RadioGroup
                value={cullingType}
                onValueChange={(val) =>
                  setCullingType(val as "culling" | "culling-mortality")
                }
                className="flex flex-col gap-2 mt-1"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="culling" id="culling" />
                  <Label htmlFor="culling" className="font-normal">
                    Jumlah Culling
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="culling-mortality"
                    id="culling-mortality"
                  />
                  <Label htmlFor="culling-mortality" className="font-normal">
                    Jumlah Culling + Jumlah Pemusnahan Data Harian
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* ─── Section 3: Bonus ──────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Bonus</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={addBonusRow}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Bonus
            </Button>
          </CardHeader>
          <CardContent>
            {bonusRows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada bonus. Klik &quot;Tambah Bonus&quot; untuk menambahkan.
              </p>
            ) : (
              <div className="space-y-4">
                {bonusRows.map((row, index) => (
                  <div key={index} className="flex items-end gap-3">
                    <div className="space-y-2 w-[200px]">
                      {index === 0 && <Label>Tipe Bonus</Label>}
                      <Select
                        value={row.type}
                        onValueChange={(val) =>
                          updateBonusRow(index, "type", val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fcr-deff">Bonus FCR</SelectItem>
                          <SelectItem value="ip">Bonus IP</SelectItem>
                          <SelectItem value="mortality">
                            Bonus Mortality
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 flex-1">
                      {index === 0 && <Label>Pilih Bonus</Label>}
                      {row.type === "fcr-deff" && (
                        <BonusFcrDeffCombobox
                          value={row.bonusId}
                          onChange={(val) =>
                            updateBonusRow(index, "bonusId", val)
                          }
                        />
                      )}
                      {row.type === "ip" && (
                        <BonusIpCombobox
                          value={row.bonusId}
                          onChange={(val) =>
                            updateBonusRow(index, "bonusId", val)
                          }
                        />
                      )}
                      {row.type === "mortality" && (
                        <BonusMortalityCombobox
                          value={row.bonusId}
                          onChange={(val) =>
                            updateBonusRow(index, "bonusId", val)
                          }
                        />
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeBonusRow(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Actions ───────────────────────────────────────── */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/projects">Kembali</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
```

Key behaviors:
- Selecting a branch resets the farm selection
- Farm dropdown is disabled until branch is selected
- Selecting a farm fetches farm detail (with coops) and displays coop names read-only
- Culling radio maps to `checkCulling`/`checkMortality` booleans
- Bonus rows are dynamic — add/remove with type selector and corresponding combobox
- On submit: creates project first, then attaches bonuses via separate API calls
- Redirects to detail page on success

- [ ] **Step 2: Verify the page compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 3: Manually test in browser**

1. Navigate to `/projects/new`
2. Verify all 3 sections render
3. Select a branch → verify farm dropdown enables and filters
4. Select a farm → verify coops appear
5. Add a bonus row → verify type/bonus selection works
6. Submit the form → verify project is created

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/projects/new/page.tsx
git commit -m "feat: enhance project create form with 3 sections"
```

---

## Chunk 4: Edit Page + Detail Page Progress Indicator

### Task 9: Create project edit page

**Files:**
- Create: `src/app/(dashboard)/projects/[id]/edit/page.tsx`

- [ ] **Step 1: Create edit page**

This page fetches the existing project data and pre-populates the same form. It uses `PATCH /projects/:id` instead of `POST /projects`.

```tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

import { fetchApi } from "@/lib/api";
import { useApi } from "@/hooks/use-api";
import { Project, Farm, Coop } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageHeader } from "@/components/shared/page-header";
import { BranchCombobox } from "@/components/forms/branch-combobox";
import { FarmCombobox } from "@/components/forms/farm-combobox";
import { ContractCategoryCombobox } from "@/components/forms/contract-category-combobox";
import { FcrStandardCombobox } from "@/components/forms/fcr-standard-combobox";
import { ProductionDayEstimateCombobox } from "@/components/forms/production-day-estimate-combobox";

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: project, isLoading } = useApi<Project>(`/projects/${id}`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // --- Form state ---
  const [branchId, setBranchId] = useState("");
  const [farmId, setFarmId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [contractCategoryId, setContractCategoryId] = useState("");
  const [supervisorIncentive, setSupervisorIncentive] = useState("10");
  const [isActive, setIsActive] = useState(true);
  const [fcrStandardId, setFcrStandardId] = useState("");
  const [productionDayEstimateId, setProductionDayEstimateId] = useState("");
  const [cullingType, setCullingType] = useState<"culling" | "culling-mortality">("culling");

  // --- Derived: Fetch coops when farm is selected ---
  const { data: farmDetail } = useApi<Farm>(farmId ? `/farms/${farmId}` : "");
  const coops: Coop[] = farmDetail?.coops || [];

  // Pre-populate form when project loads
  useEffect(() => {
    if (project && !initialized) {
      setBranchId(project.branchId || "");
      setFarmId(project.farmId || "");
      setStartDate(project.startDate ? project.startDate.split("T")[0] : "");
      setContractCategoryId(project.contractCategoryId || "");
      setSupervisorIncentive(project.supervisorIncentive || "10");
      setIsActive(project.isActive !== false);
      setFcrStandardId(project.fcrStandardId || "");
      setProductionDayEstimateId(project.productionDayEstimateId || "");
      if (project.checkMortality) {
        setCullingType("culling-mortality");
      } else {
        setCullingType("culling");
      }
      setInitialized(true);
    }
  }, [project, initialized]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!branchId) {
      toast.error("Area (Branch) wajib dipilih");
      return;
    }
    if (!farmId) {
      toast.error("Farm wajib dipilih");
      return;
    }
    if (!startDate) {
      toast.error("Tanggal mulai wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        branchId,
        farmId,
        startDate,
        checkCulling: cullingType === "culling" || cullingType === "culling-mortality",
        checkMortality: cullingType === "culling-mortality",
        isActive,
      };

      if (contractCategoryId) body.contractCategoryId = contractCategoryId;
      if (fcrStandardId) body.fcrStandardId = fcrStandardId;
      if (productionDayEstimateId) body.productionDayEstimateId = productionDayEstimateId;
      if (supervisorIncentive) body.supervisorIncentive = parseFloat(supervisorIncentive);

      await fetchApi(`/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      toast.success("Project berhasil diperbarui");
      router.push(`/projects/${id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memperbarui project"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading..." />
        <Card>
          <CardContent className="py-8">
            <div className="h-8 w-48 animate-pulse rounded bg-muted mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Project tidak ditemukan"
          actions={
            <Button variant="outline" asChild>
              <Link href="/projects">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Project"
        actions={
          <Button variant="outline" asChild>
            <Link href={`/projects/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ─── Section 1: Informasi Project ──────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Project</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tanggal Mulai *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Kategori Proyek</Label>
              <ContractCategoryCombobox
                value={contractCategoryId}
                onChange={setContractCategoryId}
              />
            </div>

            <div className="space-y-2">
              <Label>Nama Area (Branch) *</Label>
              <BranchCombobox value={branchId} onChange={setBranchId} />
            </div>

            <div className="space-y-2">
              <Label>Nama Farm *</Label>
              <FarmCombobox
                value={farmId}
                onChange={setFarmId}
                branchId={branchId || undefined}
                disabled={!branchId}
                placeholder={
                  branchId ? "Pilih Farm" : "Pilih Area Terlebih Dahulu"
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Insentif SPV</Label>
              <div className="flex items-center gap-3">
                <Select
                  value={supervisorIncentive}
                  onValueChange={setSupervisorIncentive}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="10.5">10.5%</SelectItem>
                    <SelectItem value="11">11%</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="nonAktif"
                    checked={!isActive}
                    onCheckedChange={(checked) => setIsActive(!checked)}
                  />
                  <Label htmlFor="nonAktif" className="text-sm font-normal">
                    Non Aktif
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nama Kandang</Label>
              {!farmId ? (
                <p className="text-sm text-muted-foreground py-2">
                  Pilih Farm Terlebih Dahulu
                </p>
              ) : coops.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Tidak ada kandang di farm ini
                </p>
              ) : (
                <div className="space-y-1">
                  {coops.map((coop) => (
                    <div
                      key={coop.id}
                      className="text-sm py-1 px-3 bg-muted rounded"
                    >
                      {coop.code} - {coop.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ─── Section 2: Setting Project ────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Setting Project</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Standarisasi FCR</Label>
              <FcrStandardCombobox
                value={fcrStandardId}
                onChange={setFcrStandardId}
              />
            </div>

            <div className="space-y-2">
              <Label>Standarisasi Data Harian</Label>
              <ProductionDayEstimateCombobox
                value={productionDayEstimateId}
                onChange={setProductionDayEstimateId}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Pengakuan Jumlah Culling</Label>
              <RadioGroup
                value={cullingType}
                onValueChange={(val) =>
                  setCullingType(val as "culling" | "culling-mortality")
                }
                className="flex flex-col gap-2 mt-1"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="culling" id="edit-culling" />
                  <Label htmlFor="edit-culling" className="font-normal">
                    Jumlah Culling
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value="culling-mortality"
                    id="edit-culling-mortality"
                  />
                  <Label htmlFor="edit-culling-mortality" className="font-normal">
                    Jumlah Culling + Jumlah Pemusnahan Data Harian
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* ─── Actions ───────────────────────────────────────── */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href={`/projects/${id}`}>Batal</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
```

Note: The edit page does NOT include the bonus section — bonuses are managed on the detail page's Bonuses tab since they're sub-resources with their own CRUD lifecycle.

- [ ] **Step 2: Verify compile**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/projects/\[id\]/edit/page.tsx
git commit -m "feat: add project edit page"
```

---

### Task 10: Add progress indicator and edit button to detail page

**Files:**
- Modify: `src/app/(dashboard)/projects/[id]/page.tsx`

- [ ] **Step 1: Add progress indicator below the KPI cards**

In `src/app/(dashboard)/projects/[id]/page.tsx`, add two things:

1. An "Edit" button in the header actions
2. A progress indicator showing completion of each phase

Add the `Pencil` icon to the existing lucide-react import:

```tsx
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
```

Add an Edit button next to the Back button in the header `actions` prop (inside the existing `<div className="flex items-center gap-2">`):

```tsx
<Button variant="outline" size="sm" asChild>
  <Link href={`/projects/${id}/edit`}>
    <Pencil className="mr-2 h-4 w-4" />
    Edit
  </Link>
</Button>
```

Add the progress indicator between the KPI cards and the Tabs. Insert this JSX block after the closing `</div>` of the KPI cards grid and before the `<Tabs>`:

```tsx
{/* ─── Step Progress ───────────────────────────────── */}
<Card>
  <CardContent className="py-4">
    <div className="flex items-center justify-between gap-4">
      {[
        {
          label: "Kandang",
          count: projectCoops.length,
          done: projectCoops.length > 0,
          tab: "coops",
        },
        {
          label: "Chick-In",
          count: allChickIns.length,
          done: allChickIns.length > 0,
          tab: "chick-ins",
        },
        {
          label: "Anak Kandang",
          count: allWorkers.length,
          done: allWorkers.length > 0,
          tab: "workers",
        },
        {
          label: "Budgeting",
          count: budgets.length,
          done: budgets.length > 0,
          tab: "budgets",
        },
      ].map((step, i) => (
        <div key={step.tab} className="flex items-center gap-2 flex-1">
          {i > 0 && (
            <div
              className={`h-px flex-1 ${
                step.done ? "bg-primary" : "bg-border"
              }`}
            />
          )}
          <div className="flex flex-col items-center text-center">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step.done
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.done ? "✓" : i + 1}
            </div>
            <span className="text-xs mt-1">{step.label}</span>
            <span className="text-xs text-muted-foreground">
              {step.count > 0 ? `${step.count} items` : "Belum diisi"}
            </span>
          </div>
          {i < 3 && (
            <div
              className={`h-px flex-1 ${
                step.done ? "bg-primary" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

- [ ] **Step 2: Verify compile and test**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

Navigate to a project detail page and verify:
- Progress indicator shows between KPI cards and tabs
- Steps show green circles with checkmarks when data exists
- Edit button appears in header and links to `/projects/[id]/edit`

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/projects/\[id\]/page.tsx
git commit -m "feat: add progress indicator and edit button to project detail"
```

---

## Summary

| Chunk | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-3 | Foundation: RadioGroup component, Project type updates, FarmCombobox branchId filter |
| 2 | 4-7 | New comboboxes: FCR Standard, Production Day Estimate, Contract Category, 3 bonus comboboxes |
| 3 | 8 | Enhanced create page with 3 sections (Informasi, Setting, Bonus) |
| 4 | 9-10 | Edit page + detail page progress indicator with edit button |

**Total: 10 tasks across 4 chunks.**
