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
import { Warehouse } from "@/types/api";

type GroupKey = "BRANCH" | "FARM_OWN" | "FARM_COOP";

interface WarehouseGroupedComboboxProps {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  groupLabels?: Record<GroupKey, string>;
}

const DEFAULT_GROUP_LABELS: Record<GroupKey, string> = {
  BRANCH: "Cabang",
  FARM_OWN: "Farm",
  FARM_COOP: "Kandang Ownfarm",
};

function getGroupKey(wh: Warehouse): GroupKey {
  if (wh.ownerType === "BRANCH") return "BRANCH";
  if (wh.farmStatus === "COOP") return "FARM_COOP";
  return "FARM_OWN";
}

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
    const groups: Partial<Record<GroupKey, Warehouse[]>> = {};
    for (const wh of warehouses) {
      const key = getGroupKey(wh);
      if (!groups[key]) groups[key] = [];
      groups[key]!.push(wh);
    }
    return groups;
  }, [warehouses]);

  const selected = warehouses.find((w) => w.id === value);

  const groupOrder: GroupKey[] = ["BRANCH", "FARM_OWN", "FARM_COOP"];

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
              groupOrder.map((key) => {
                const items = grouped[key];
                if (!items || items.length === 0) return null;
                return (
                  <CommandGroup key={key} heading={groupLabels[key]}>
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
