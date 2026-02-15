"use client";

import { Fragment, useState } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { usePaginated } from "@/hooks/use-api";
import { JournalEntry } from "@/types/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";

export default function JournalEntriesPage() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const { data, meta, isLoading } = usePaginated<JournalEntry>(
    "/journal-entries",
    { page, limit: 20 }
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal Entries"
        description="Auto-generated accounting journal entries from inventory movements"
      />

      {isLoading ? (
        <TableSkeleton cols={5} />
      ) : data.length === 0 ? (
        <EmptyState
          title="No journal entries"
          description="Journal entries will be auto-created when goods receipts, delivery orders, or production orders are processed."
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Entry Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((entry) => (
                  <Fragment key={entry.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() =>
                        setExpandedId(
                          expandedId === entry.id ? null : entry.id
                        )
                      }
                    >
                      <TableCell>
                        {expandedId === entry.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {entry.entryNumber}
                      </TableCell>
                      <TableCell>{formatDate(entry.entryDate)}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {entry.sourceType || "—"}
                      </TableCell>
                    </TableRow>
                    {expandedId === entry.id && entry.lines && (
                      <TableRow key={`${entry.id}-lines`}>
                        <TableCell colSpan={5} className="bg-muted/50 p-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Account</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">
                                  Debit
                                </TableHead>
                                <TableHead className="text-right">
                                  Credit
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {entry.lines.map((line) => (
                                <TableRow key={line.id}>
                                  <TableCell>
                                    <span className="font-mono text-sm">
                                      {line.account?.code}
                                    </span>{" "}
                                    {line.account?.name}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {line.description || "—"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {parseFloat(line.debit) > 0
                                      ? formatCurrency(line.debit)
                                      : "—"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {parseFloat(line.credit) > 0
                                      ? formatCurrency(line.credit)
                                      : "—"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          {(meta?.totalPages || 1) > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {meta?.total} total entries
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {meta?.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= (meta?.totalPages || 1)}
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
