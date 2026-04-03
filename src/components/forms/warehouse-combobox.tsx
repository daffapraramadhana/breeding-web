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
import { Warehouse } from "@/types/api";

interface WarehouseComboboxProps {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  ownerType?: string;
}

export function WarehouseCombobox({ value, onChange, disabled, ownerType }: WarehouseComboboxProps) {
  const [open, setOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const extra: Record<string, string> = {};
    if (ownerType) extra.ownerType = ownerType;
    fetchPaginated<Warehouse>("/warehouses", { limit: 50, search, extra })
      .then((res) => setWarehouses(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [search, ownerType]);

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
          {selected
            ? `${selected.code} - ${selected.name}`
            : "Select warehouse..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search warehouses..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : warehouses.length === 0 ? (
              <CommandEmpty>No warehouses found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {warehouses.map((warehouse) => (
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
                        value === warehouse.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>
                      {warehouse.code} - {warehouse.name}
                    </span>
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
