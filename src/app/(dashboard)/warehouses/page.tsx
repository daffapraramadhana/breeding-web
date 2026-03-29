"use client";

import { useState } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Warehouse, WarehouseOwnerType } from "@/types/api";

const LIMIT = 10;

export default function WarehousesPage() {
  const t = useTranslations("warehouses");
  const tc = useTranslations("common");

  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  const { data, meta, isLoading, refetch } = usePaginated<Warehouse>(
    "/warehouses",
    { page, limit: LIMIT, search }
  );

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const ownerTypeLabels: Record<WarehouseOwnerType, string> = {
    BRANCH: t("branch"),
    FARM: t("farm"),
    COOP: "Coop",
  };

  async function handleDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await fetchApi(`/warehouses/${deleteTarget.id}`, {
        method: "DELETE",
      });
      toast.success(tc("entityDeleted", { entity: t("entity") }));
      setDeleteTarget(null);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tc("entityDeleteFailed", { entity: t("entity") })
      );
    } finally {
      setDeleting(false);
    }
  }

  const columns: Column<Warehouse>[] = [
    { header: tc("code"), accessorKey: "code" },
    { header: tc("name"), accessorKey: "name" },
    {
      header: tc("address"),
      cell: (row) => row.address || "—",
    },
    {
      header: t("branch"),
      cell: (row) => row.branch?.name || "—",
    },
    {
      header: t("ownerType"),
      cell: (row) =>
        row.ownerType
          ? ownerTypeLabels[row.ownerType] || row.ownerType
          : "—",
    },
    {
      header: tc("created"),
      cell: (row) => formatDate(row.createdAt),
    },
    {
      header: tc("actions"),
      className: "w-[100px]",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/warehouses/${row.id}`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button asChild>
            <Link href="/warehouses/new">
              <Plus className="mr-2 h-4 w-4" />
              {tc("addEntity", { entity: t("entity") })}
            </Link>
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder={tc("searchField", { field: t("title") })}
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle={tc("noResults", { entity: t("entity") })}
        emptyDescription={tc("getStarted", { entity: t("entity") })}
        emptyAction={
          <Button asChild>
            <Link href="/warehouses/new">
              <Plus className="mr-2 h-4 w-4" />
              {tc("addEntity", { entity: t("entity") })}
            </Link>
          </Button>
        }
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={tc("deleteEntity", { entity: t("entity") })}
        description={tc("confirmDelete", {
          name: deleteTarget?.name || "",
        })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel={deleting ? tc("saving") : tc("delete")}
      />
    </div>
  );
}
