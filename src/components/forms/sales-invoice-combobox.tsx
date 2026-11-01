"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
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
import { SalesInvoice } from "@/types/api";

interface SalesInvoiceComboboxProps {
  value: string;
  onChange: (invoice: SalesInvoice | null) => void;
  disabled?: boolean;
}

export function SalesInvoiceCombobox({ value, onChange, disabled }: SalesInvoiceComboboxProps) {
  const [open, setOpen] = useState(false);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchPaginated<SalesInvoice>("/sales-invoices", { limit: 50, search })
      .then((res) => setInvoices(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [search]);

  const selected = invoices.find((i) => i.id === value);

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
          {selected ? selected.invoiceNumber : "Select invoice..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search invoices..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : invoices.length === 0 ? (
              <CommandEmpty>No invoices found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {invoices.map((invoice) => (
                  <CommandItem
                    key={invoice.id}
                    value={invoice.id}
                    onSelect={() => {
                      onChange(invoice);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === invoice.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1">{invoice.invoiceNumber}</span>
                    <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                      {formatCurrency(Number(invoice.remainingAmount))}
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
