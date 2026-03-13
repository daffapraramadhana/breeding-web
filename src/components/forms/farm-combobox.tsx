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
  disabled?: boolean;
  branchId?: string;
  placeholder?: string;
}

export function FarmCombobox({ value, onChange, disabled, branchId, placeholder }: FarmComboboxProps) {
  const [open, setOpen] = useState(false);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchPaginated<Farm>("/farms", { limit: 100, search, extra: branchId ? { branchId } : undefined })
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
          {selected ? selected.name : (placeholder ?? "Select farm...")}
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
