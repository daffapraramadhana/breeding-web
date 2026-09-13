"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { Supplier } from "@/types/api";

interface SupplierComboboxProps {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  /** Only list suppliers classified under an expedition category. */
  expeditionOnly?: boolean;
}

export function SupplierCombobox({ value, onChange, disabled, expeditionOnly = false }: SupplierComboboxProps) {
  const t = useTranslations("suppliers");
  const [open, setOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchPaginated<Supplier>("/suppliers", {
      limit: 50,
      search,
      ...(expeditionOnly && { extra: { expedition: "true" } }),
    })
      .then((res) => setSuppliers(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [search, expeditionOnly]);

  const selected = suppliers.find((s) => s.id === value);
  const placeholder = expeditionOnly ? t("selectExpedition") : "Select supplier...";
  const emptyText = expeditionOnly ? t("noExpeditionFound") : "No suppliers found.";

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
            placeholder="Search suppliers..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : suppliers.length === 0 ? (
              <CommandEmpty>{emptyText}</CommandEmpty>
            ) : (
              <CommandGroup>
                {suppliers.map((supplier) => (
                  <CommandItem
                    key={supplier.id}
                    value={supplier.id}
                    onSelect={() => {
                      onChange(supplier.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === supplier.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{supplier.name}</span>
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
