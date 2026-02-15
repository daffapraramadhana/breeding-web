"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";
import { ItemCombobox } from "@/components/shared/item-combobox";
import { BatchCombobox } from "@/components/shared/batch-combobox";
import { formatCurrency, parseDecimal } from "@/lib/utils";
import { Item } from "@/types/api";

export interface LineItem {
  itemId: string;
  itemCode?: string;
  itemName?: string;
  quantity: string;
  uomName: string;
  unitPrice: string;
  batchId?: string;
}

interface LineItemsFieldProps {
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
  showPrice?: boolean;
  priceLabel?: string;
  showBatch?: boolean;
  disabled?: boolean;
}

export function LineItemsField({
  lines,
  onChange,
  showPrice = true,
  priceLabel = "Unit Price",
  showBatch = false,
  disabled = false,
}: LineItemsFieldProps) {
  function addLine() {
    onChange([
      ...lines,
      { itemId: "", quantity: "", uomName: "", unitPrice: "", batchId: "" },
    ]);
  }

  function removeLine(index: number) {
    onChange(lines.filter((_, i) => i !== index));
  }

  function updateLine(index: number, field: keyof LineItem, value: string) {
    const updated = lines.map((line, i) =>
      i === index ? { ...line, [field]: value } : line
    );
    onChange(updated);
  }

  function handleItemSelect(index: number, itemId: string, item: Item) {
    const updated = lines.map((line, i) =>
      i === index
        ? {
            ...line,
            itemId,
            itemCode: item.code,
            itemName: item.name,
            uomName: item.baseUom,
          }
        : line
    );
    onChange(updated);
  }

  const grandTotal = lines.reduce((sum, line) => {
    return sum + parseDecimal(line.quantity) * parseDecimal(line.unitPrice);
  }, 0);

  function getColSpan() {
    let cols = 5; // #, item, qty, uom, actions
    if (showPrice) cols += 2;
    if (showBatch) cols += 1;
    return cols;
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">#</TableHead>
              <TableHead className="min-w-[250px]">Item</TableHead>
              <TableHead className="w-[120px]">Qty</TableHead>
              <TableHead className="w-[100px]">UOM</TableHead>
              {showPrice && (
                <>
                  <TableHead className="w-[150px]">{priceLabel}</TableHead>
                  <TableHead className="w-[150px]">Total</TableHead>
                </>
              )}
              {showBatch && (
                <TableHead className="min-w-[200px]">Batch</TableHead>
              )}
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={getColSpan()}
                  className="text-center text-muted-foreground py-8"
                >
                  No items added. Click &quot;Add Item&quot; to add a line.
                </TableCell>
              </TableRow>
            ) : (
              lines.map((line, idx) => {
                const lineTotal =
                  parseDecimal(line.quantity) * parseDecimal(line.unitPrice);
                return (
                  <TableRow key={idx}>
                    <TableCell className="text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <ItemCombobox
                        value={line.itemId}
                        onChange={(itemId, item) =>
                          handleItemSelect(idx, itemId, item)
                        }
                        disabled={disabled}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.0001"
                        min="0"
                        placeholder="0"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(idx, "quantity", e.target.value)
                        }
                        disabled={disabled}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={line.uomName}
                        onChange={(e) =>
                          updateLine(idx, "uomName", e.target.value)
                        }
                        disabled={disabled}
                        placeholder="KG"
                      />
                    </TableCell>
                    {showPrice && (
                      <>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0"
                            value={line.unitPrice}
                            onChange={(e) =>
                              updateLine(idx, "unitPrice", e.target.value)
                            }
                            disabled={disabled}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(lineTotal)}
                        </TableCell>
                      </>
                    )}
                    {showBatch && (
                      <TableCell>
                        <BatchCombobox
                          value={line.batchId || ""}
                          onChange={(batchId) =>
                            updateLine(idx, "batchId", batchId)
                          }
                          disabled={disabled}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      {!disabled && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLine(idx)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        {!disabled && (
          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        )}
        {showPrice && (
          <div className="text-right">
            <span className="text-sm text-muted-foreground mr-2">
              Grand Total:
            </span>
            <span className="text-lg font-bold">{formatCurrency(grandTotal)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
