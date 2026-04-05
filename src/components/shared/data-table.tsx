"use client";

import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { EmptyState } from "./empty-state";
import { TableSkeleton } from "./loading-skeleton";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  total?: number;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading,
  search,
  onSearchChange,
  searchPlaceholder,
  page = 1,
  totalPages = 1,
  onPageChange,
  total,
  onRowClick,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: DataTableProps<T>) {
  const tc = useTranslations('common');
  const resolvedSearchPlaceholder = searchPlaceholder ?? tc('search');
  return (
    <div className="space-y-4">
      {onSearchChange && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            placeholder={resolvedSearchPlaceholder}
            value={search || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {isLoading ? (
        <TableSkeleton cols={columns.length} />
      ) : data.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      ) : (
        <div className="rounded-[18px] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)] shadow-[var(--glass-shadow)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col.header}
                    className={cn(
                      "text-[10px] uppercase tracking-[1.2px] text-[var(--muted-foreground)] font-medium py-3 px-5",
                      col.className
                    )}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow
                  key={idx}
                  className={cn(
                    "border-b border-[rgba(0,0,0,0.03)] dark:border-[rgba(255,255,255,0.03)]",
                    onRowClick ? "cursor-pointer" : ""
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.header}
                      className={cn("py-3.5 px-5 text-[13px]", col.className)}
                    >
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                          ? String(row[col.accessorKey] ?? "")
                          : ""}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] text-[var(--muted-foreground)]">
            {total !== undefined ? tc('totalRecords', { total }) : tc('pageOf', { page, totalPages })}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded-[8px]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    "h-8 w-8 rounded-[8px] text-[11px] font-medium transition-colors",
                    pageNum === page
                      ? "bg-[var(--foreground)] text-[var(--background)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded-[8px]"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
