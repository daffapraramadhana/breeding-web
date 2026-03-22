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

interface EntityComboboxProps {
  endpoint: string;
  value: string;
  onChange: (value: string) => void;
  valueField?: string;
  displayField?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

export function EntityCombobox({
  endpoint,
  value,
  onChange,
  valueField = "id",
  displayField = "name",
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled,
}: EntityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Record<string, string>[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchPaginated<Record<string, string>>(endpoint, { limit: 50, search })
      .then((res) => setItems(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [endpoint, search]);

  const selected = items.find((item) => item[valueField] === value);

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
          {selected ? selected[displayField] : placeholder}
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
            ) : items.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => {
                      onChange(item[valueField]);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === item[valueField] ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{item[displayField]}</span>
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
