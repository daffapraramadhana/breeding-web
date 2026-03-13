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
import { Employee } from "@/types/api";

interface EmployeeComboboxProps {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  branchId?: string;
}

export function EmployeeCombobox({ value, onChange, disabled, branchId }: EmployeeComboboxProps) {
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchPaginated<Employee>("/employees", {
      limit: 50,
      search,
      extra: branchId ? { branchId } : undefined,
    })
      .then((res) => setEmployees(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [search, branchId]);

  const selected = employees.find((e) => e.id === value);

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
          {selected ? selected.name : "Select employee..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search employees..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : employees.length === 0 ? (
              <CommandEmpty>No employees found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {employees.map((employee) => (
                  <CommandItem
                    key={employee.id}
                    value={employee.id}
                    onSelect={() => {
                      onChange(employee.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === employee.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{employee.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {employee.position || "—"}
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
