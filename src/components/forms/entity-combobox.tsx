"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchApi, fetchPaginated } from "@/lib/api";

export interface QuickCreateField {
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: "text" | "number";
}

export interface QuickCreateConfig {
  title: string;
  description?: string;
  fields: QuickCreateField[];
}

interface EntityComboboxProps {
  endpoint: string;
  value: string;
  onChange: (value: string) => void;
  valueField?: string;
  displayField?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  quickCreate?: QuickCreateConfig;
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
  quickCreate,
}: EntityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Record<string, string>[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  // Quick create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);

  const fetchItems = useCallback(() => {
    setIsLoading(true);
    fetchPaginated<Record<string, string>>(endpoint, { limit: 50, search })
      .then((res) => setItems(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [endpoint, search, fetchKey]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const selected = items.find((item) => item[valueField] === value);

  function handleOpenCreate() {
    setOpen(false);
    const initial: Record<string, string> = {};
    quickCreate?.fields.forEach((f) => {
      initial[f.key] = "";
    });
    setCreateForm(initial);
    setCreateOpen(true);
  }

  async function handleCreateSubmit() {
    if (!quickCreate) return;

    for (const field of quickCreate.fields) {
      if (field.required && !createForm[field.key]?.trim()) {
        toast.error(`${field.label} is required`);
        return;
      }
    }

    setIsCreating(true);
    try {
      const body: Record<string, string | number> = {};
      for (const field of quickCreate.fields) {
        const val = createForm[field.key]?.trim();
        if (val) {
          body[field.key] = field.type === "number" ? Number(val) : val;
        }
      }

      const newItem = await fetchApi<Record<string, string>>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      toast.success(`${quickCreate.title} created`);
      setCreateOpen(false);

      // Refetch list and auto-select the new item
      setFetchKey((k) => k + 1);
      if (newItem?.[valueField]) {
        onChange(newItem[valueField]);
      }
    } catch {
      toast.error(`Failed to create ${quickCreate.title.toLowerCase()}`);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <>
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
              {quickCreate && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={handleOpenCreate}
                      className="text-primary"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      <span>Create new {quickCreate.title.toLowerCase()}</span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Quick Create Dialog */}
      {quickCreate && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New {quickCreate.title}</DialogTitle>
              {quickCreate.description && (
                <DialogDescription>{quickCreate.description}</DialogDescription>
              )}
            </DialogHeader>
            <div className="space-y-4">
              {quickCreate.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}{field.required && " *"}</Label>
                  <Input
                    type={field.type || "text"}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    value={createForm[field.key] || ""}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateSubmit();
                    }}
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateSubmit} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
