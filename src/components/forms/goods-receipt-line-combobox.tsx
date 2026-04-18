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
import { fetchApi } from "@/lib/api";
import { GoodsReceiptLine } from "@/types/api";

interface GoodsReceiptLineComboboxProps {
  value: string;
  onChange: (id: string) => void;
  warehouseId?: string;
  productId?: string;
  disabled?: boolean;
}

export function GoodsReceiptLineCombobox({
  value,
  onChange,
  warehouseId,
  productId,
  disabled,
}: GoodsReceiptLineComboboxProps) {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<GoodsReceiptLine[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const gated = !warehouseId || !productId;

  useEffect(() => {
    if (gated) {
      setLines([]);
      return;
    }
    setIsLoading(true);
    const params = new URLSearchParams({
      warehouseId: warehouseId!,
      productId: productId!,
    });
    fetchApi<GoodsReceiptLine[]>(`/goods-receipts/lines?${params}`)
      .then((res) => setLines(res))
      .catch(() => setLines([]))
      .finally(() => setIsLoading(false));
  }, [gated, warehouseId, productId]);

  const selected = lines.find((l) => l.id === value);
  const filtered = search
    ? lines.filter((l) =>
        (l.goodsReceipt?.receiptNumber || "")
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : lines;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled || gated}
        >
          {selected
            ? selected.goodsReceipt?.receiptNumber || selected.id.slice(0, 8)
            : gated
              ? "Select warehouse & product first"
              : "Select receipt (BPB)..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search receipt number..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : filtered.length === 0 ? (
              <CommandEmpty>No receipts found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((line) => (
                  <CommandItem
                    key={line.id}
                    value={line.id}
                    onSelect={() => {
                      onChange(line.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === line.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {line.goodsReceipt?.receiptNumber || "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Qty received: {line.quantityReceived}
                        {line.goodsReceipt?.receiptDate
                          ? ` • ${line.goodsReceipt.receiptDate.slice(0, 10)}`
                          : ""}
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
  );
}
