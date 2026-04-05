"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Warehouse, WarehouseOwnerType } from "@/types/api";

interface WarehouseGroupedComboboxProps {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  groupLabels?: Record<WarehouseOwnerType, string>;
}

const DEFAULT_GROUP_LABELS: Record<WarehouseOwnerType, string> = {
  BRANCH: "Cabang",
  FARM: "Farm",
  COOP: "Kandang Ownfarm",
};

export function WarehouseGroupedCombobox({
  value,
  onChange,
  disabled,
  placeholder = "Select warehouse...",
  searchPlaceholder = "Search warehouses...",
  groupLabels = DEFAULT_GROUP_LABELS,
}: WarehouseGroupedComboboxProps) {
  const [open, setOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchPaginated<Warehouse>("/warehouses", { limit: 100, search })
      .then((res) => setWarehouses(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [search]);

  const grouped = useMemo(() => {
    const groups: Partial<Record<WarehouseOwnerType, Warehouse[]>> = {};
    for (const wh of warehouses) {
      if (!groups[wh.ownerType]) groups[wh.ownerType] = [];
      groups[wh.ownerType]!.push(wh);
    }
    return groups;
  }, [warehouses]);

  const selected = warehouses.find((w) => w.id === value);

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
          {selected ? `${selected.code} - ${selected.name}` : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : warehouses.length === 0 ? (
              <CommandEmpty>No warehouses found.</CommandEmpty>
            ) : (
              (Object.keys(groupLabels) as WarehouseOwnerType[]).map((type) => {
                const items = grouped[type];
                if (!items || items.length === 0) return null;
                return (
                  <CommandGroup key={type} heading={groupLabels[type]}>
                    {items.map((warehouse) => (
                      <CommandItem
                        key={warehouse.id}
                        value={warehouse.id}
                        onSelect={() => {
                          onChange(warehouse.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === warehouse.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <span>
                          {warehouse.code} - {warehouse.name}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
