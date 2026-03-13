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
import { Breeder } from "@/types/api";

interface BreederComboboxProps {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function BreederCombobox({ value, onChange, disabled }: BreederComboboxProps) {
  const [open, setOpen] = useState(false);
  const [breeders, setBreeders] = useState<Breeder[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchPaginated<Breeder>("/breeders", { limit: 50, search })
      .then((res) => setBreeders(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [search]);

  const selected = breeders.find((b) => b.id === value);

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
          {selected ? selected.name : "Select breeder..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search breeders..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : breeders.length === 0 ? (
              <CommandEmpty>No breeders found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {breeders.map((breeder) => (
                  <CommandItem
                    key={breeder.id}
                    value={breeder.id}
                    onSelect={() => {
                      onChange(breeder.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === breeder.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{breeder.name}</span>
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
