"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi, ApiError } from "@/lib/api";
import type { ChartOfAccount } from "@/types/api";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ChartOfAccountsPage() {
  const t = useTranslations("chartOfAccounts");
  const tc = useTranslations("common");

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  const { data, meta, isLoading, refetch } = usePaginated<ChartOfAccount>(
    "/chart-of-accounts",
    { page, limit: 10, search },
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ChartOfAccount | null>(null);
  const [deleting, setDeleting] = useState<ChartOfAccount | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openCreate() {
    setEditing(null);
    setCode("");
    setName("");
    setIsActive(true);
    setDialogOpen(true);
  }

  function openEdit(row: ChartOfAccount) {
    setEditing(row);
    setCode(row.code);
    setName(row.name);
    setIsActive(row.isActive);
    setDialogOpen(true);
  }

  async function save() {
    setIsSubmitting(true);
    try {
      // Kode akun sistem tidak boleh ikut dikirim — backend menolaknya 409.
      const body = editing?.isSystem ? { name, isActive } : { code, name, isActive };
      await fetchApi(editing ? `/chart-of-accounts/${editing.id}` : "/chart-of-accounts", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      toast.success(tc("create"));
      setDialogOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tc("noResults"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await fetchApi(`/chart-of-accounts/${deleting.id}`, { method: "DELETE" });
      toast.success(tc("delete"));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : tc("noResults"));
    } finally {
      setDeleting(null);
    }
  }

  const columns: Column<ChartOfAccount>[] = [
    { header: t("code"), accessorKey: "code", className: "w-[140px] font-mono" },
    { header: t("name"), accessorKey: "name" },
    {
      header: "",
      cell: (row) => (
        <div className="flex gap-1">
          {row.isSystem && <Badge variant="secondary">{t("system")}</Badge>}
          {!row.isActive && <Badge variant="outline">{t("inactive")}</Badge>}
        </div>
      ),
      className: "w-[140px]",
    },
    {
      header: tc("actions"),
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          {!row.isSystem && (
            <Button variant="ghost" size="sm" onClick={() => setDeleting(row)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      ),
      className: "w-[110px]",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        sectionLabel={t("sectionLabel")}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t("newAccount")}
          </Button>
        }
      />
      <p className="text-xs text-[var(--muted-foreground)]">{t("systemNote")}</p>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("searchPlaceholder")}
        page={page}
        totalPages={meta?.totalPages}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? tc("update") : t("newAccount")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("code")}</Label>
              <Input
                value={code}
                disabled={!!editing?.isSystem}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div>
              <Label>{t("name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isActive} onCheckedChange={(v) => setIsActive(!!v)} />
              {t("active")}
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button disabled={isSubmitting || !name || (!editing && !code)} onClick={save}>
              {isSubmitting ? tc("saving") : tc("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={tc("delete")}
        description={deleting ? `${deleting.code} — ${deleting.name}` : ""}
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
