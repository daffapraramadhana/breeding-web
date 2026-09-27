"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
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
import { MatureBirdStandard } from "@/types/api";

interface MatureBirdStandardComboboxProps {
  value: string;
  /** Mengembalikan standar terpilih beserta bobot minimumnya, untuk disalin ke baris. */
  onChange: (standardId: string, minimumWeightKg: number | null) => void;
  disabled?: boolean;
}

/** Bobot minimum = batas bawah terendah dari range standar itu. */
function minimumOf(row: MatureBirdStandard): number | null {
  if (row.ranges.length === 0) return null;
  return Math.min(...row.ranges.map((r) => Number(r.valueFrom)));
}

export function MatureBirdStandardCombobox({
  value,
  onChange,
  disabled,
}: MatureBirdStandardComboboxProps) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<MatureBirdStandard[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchPaginated<MatureBirdStandard>("/mature-bird-standards", { limit: 50, search })
      .then((res) => setRows(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [search]);

  const selected = rows.find((r) => r.id === value);

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={disabled}
          >
            {selected ? selected.name : "Select standard..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[360px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search standards..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {isLoading ? (
                <CommandEmpty>Loading...</CommandEmpty>
              ) : rows.length === 0 ? (
                <CommandEmpty>No standards found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {rows.map((row) => (
                    <CommandItem
                      key={row.id}
                      value={row.id}
                      onSelect={() => {
                        onChange(row.id, minimumOf(row));
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === row.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-1 items-center justify-between gap-2">
                        <span>{row.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {minimumOf(row) ?? "-"}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onChange("", null)}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
