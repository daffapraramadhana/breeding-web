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
import { Coop } from "@/types/api";

interface CoopComboboxProps {
  value: string;
  onChange: (id: string) => void;
  onCoopSelect?: (coop: Coop | null) => void;
  disabled?: boolean;
}

export function CoopCombobox({ value, onChange, onCoopSelect, disabled }: CoopComboboxProps) {
  const [open, setOpen] = useState(false);
  const [coops, setCoops] = useState<Coop[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchPaginated<Coop>("/coops", { limit: 50, search })
      .then((res) => setCoops(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [search]);

  const selected = coops.find((c) => c.id === value);

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
            : "Select coop..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search coops..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : coops.length === 0 ? (
              <CommandEmpty>No coops found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {coops.map((coop) => (
                  <CommandItem
                    key={coop.id}
                    value={coop.id}
                    onSelect={() => {
                      onChange(coop.id);
                      onCoopSelect?.(coop);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === coop.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>
                      {coop.code} - {coop.name}
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
