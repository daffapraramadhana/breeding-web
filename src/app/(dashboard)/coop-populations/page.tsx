"use client";

import { useState } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi, fetchPaginated } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { CoopPopulationRow, CoopPopulationMovement } from "@/types/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const TODAY = new Date().toISOString().slice(0, 10);

export default function CoopPopulationsPage() {
  const t = useTranslations("coopPopulations");
  const tc = useTranslations("common");

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data: rows, meta, isLoading, refetch } = usePaginated<CoopPopulationRow>(
    "/coop-populations",
    { page, limit: 10, search }
  );

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRow, setHistoryRow] = useState<CoopPopulationRow | null>(null);
  const [movements, setMovements] = useState<CoopPopulationMovement[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustRow, setAdjustRow] = useState<CoopPopulationRow | null>(null);
  const [direction, setDirection] = useState<"IN" | "OUT">("IN");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [movementDate, setMovementDate] = useState(TODAY);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const columns: Column<CoopPopulationRow>[] = [
    { header: t("coop"), cell: (row) => `${row.coop.code} — ${row.coop.name}` },
    {
      header: t("cycleStart"),
      cell: (row) => formatDate(row.project.startDate),
      className: "w-[140px]",
    },
    {
      header: t("onHand"),
      cell: (row) => row.population.quantityOnHand.toLocaleString(),
      className: "w-[110px]",
    },
    {
      header: t("allocated"),
      cell: (row) => row.population.quantityAllocated.toLocaleString(),
      className: "w-[110px]",
    },
    {
      header: t("available"),
      cell: (row) => (
        <Badge variant="secondary">{row.population.quantityAvailable.toLocaleString()}</Badge>
      ),
      className: "w-[110px]",
    },
    {
      header: tc("actions"),
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            openAdjust(row);
          }}
        >
          <Pencil className="mr-2 h-4 w-4" />
          {t("adjust")}
        </Button>
      ),
      className: "w-[130px]",
    },
  ];

  async function openHistory(row: CoopPopulationRow) {
    setHistoryRow(row);
    setHistoryOpen(true);
    setIsLoadingMovements(true);
    try {
      const res = await fetchPaginated<CoopPopulationMovement>(
        `/coop-populations/${row.id}/movements`,
        { limit: 50 }
      );
      setMovements(res.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("movementsLoadFailed"));
      setMovements([]);
    } finally {
      setIsLoadingMovements(false);
    }
  }

  function openAdjust(row: CoopPopulationRow) {
    setAdjustRow(row);
    setDirection("IN");
    setQuantity("");
    setReason("");
    setMovementDate(TODAY);
    setAdjustOpen(true);
  }

  async function handleAdjust() {
    if (!adjustRow) return;

    // Tanpa dua penjagaan ini backend menolak dengan 400 dan pengguna tidak
    // tahu bidang mana yang salah.
    if (!reason.trim()) {
      toast.error(t("reasonRequired"));
      return;
    }
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      toast.error(tc("required", { field: t("quantity") }));
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchApi(`/coop-populations/${adjustRow.id}/adjustments`, {
        method: "POST",
        body: JSON.stringify({ quantity: qty, direction, reason: reason.trim(), movementDate }),
      });
      toast.success(tc("entityUpdated", { entity: t("entity") }));
      setAdjustOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tc("entityUpdateFailed", { entity: t("entity") })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder={t("searchPlaceholder")}
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        onRowClick={openHistory}
        emptyTitle={tc("noResults", { entity: t("title") })}
      />

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("movements")}</DialogTitle>
            <DialogDescription>
              {historyRow ? `${historyRow.coop.code} — ${historyRow.coop.name}` : ""}
            </DialogDescription>
          </DialogHeader>

          {isLoadingMovements ? (
            <p className="text-sm text-muted-foreground">{tc("loading")}</p>
          ) : movements.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noMovements")}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2">{t("movementDate")}</th>
                  <th className="py-2">{t("movementSource")}</th>
                  <th className="py-2 text-right">{t("quantity")}</th>
                  <th className="py-2 text-right">{t("quantityAfter")}</th>
                  <th className="py-2">{t("reason")}</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="py-2">{formatDate(m.movementDate)}</td>
                    <td className="py-2">
                      <Badge variant="outline">{m.movementSource}</Badge>
                    </td>
                    <td className="py-2 text-right">
                      {m.movementType === "IN" ? "+" : "−"}
                      {m.quantity.toLocaleString()}
                    </td>
                    <td className="py-2 text-right">{m.quantityAfter.toLocaleString()}</td>
                    <td className="py-2 text-muted-foreground">{m.notes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adjustTitle")}</DialogTitle>
            <DialogDescription>
              {adjustRow ? `${adjustRow.coop.code} — ${adjustRow.coop.name}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("direction")}</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as "IN" | "OUT")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">{t("directionIn")}</SelectItem>
                  <SelectItem value="OUT">{t("directionOut")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjust-quantity">{t("quantity")}</Label>
              <Input
                id="adjust-quantity"
                type="number"
                min={1}
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjust-date">{t("movementDate")}</Label>
              <Input
                id="adjust-date"
                type="date"
                value={movementDate}
                onChange={(e) => setMovementDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjust-reason">{t("reason")}</Label>
              <Input
                id="adjust-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)} disabled={isSubmitting}>
              {tc("cancel")}
            </Button>
            <Button onClick={handleAdjust} disabled={isSubmitting}>
              {isSubmitting ? tc("saving") : t("adjust")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
