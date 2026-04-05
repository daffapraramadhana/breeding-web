"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsInteger } from "nuqs";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { usePaginated } from "@/hooks/use-api";
import { formatDate } from "@/lib/utils";
import { Project } from "@/types/api";
import { Button } from "@/components/ui/button";
import { BranchCombobox } from "@/components/forms/branch-combobox";
import { Label } from "@/components/ui/label";

export default function ProjectsPage() {
  const t = useTranslations("projects");
  const tc = useTranslations("common");
  const router = useRouter();

  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Filter state
  const [branchId, setBranchId] = useState("");

  // Fetch projects
  const { data: projects, meta, isLoading } = usePaginated<Project>(
    "/projects",
    {
      page,
      limit: 10,
      search,
      extra: branchId ? { branchId } : undefined,
    }
  );

  // Table columns
  const columns: Column<Project>[] = [
    {
      header: "ID",  // keep as-is, universal
      cell: (row) => (
        <span className="font-mono text-xs">{row.id.slice(0, 8)}</span>
      ),
      className: "w-[100px]",
    },
    {
      header: t("branch"),
      cell: (row) => row.branch?.name || "-",
    },
    {
      header: t("farm"),
      cell: (row) => row.farm?.name || "-",
    },
    {
      header: t("startDate"),
      cell: (row) => (row.startDate ? formatDate(row.startDate) : "-"),
      className: "w-[140px]",
    },
    {
      header: tc("status"),
      cell: (row) =>
        row.status ? <StatusBadge status={row.status} /> : "-",
      className: "w-[120px]",
    },
    {
      header: tc("created"),
      cell: (row) => formatDate(row.createdAt),
      className: "w-[140px]",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button onClick={() => router.push("/projects/new")}>
            <Plus className="mr-2 h-4 w-4" />
            {t("newProject")}
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex items-end gap-4">
        <div className="w-[280px] space-y-2">
          <Label>{t("branch")}</Label>
          <BranchCombobox
            value={branchId}
            onChange={(val) => {
              setBranchId(val);
              setPage(1);
            }}
          />
        </div>
        {branchId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setBranchId("");
              setPage(1);
            }}
          >
            {t("clearFilter")}
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={projects}
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
        onRowClick={(project) => router.push(`/projects/${project.id}`)}
        emptyTitle={t("emptyTitle")}
        emptyDescription={t("emptyDescription")}
        emptyAction={
          <Button onClick={() => router.push("/projects/new")}>
            <Plus className="mr-2 h-4 w-4" />
            {t("newProject")}
          </Button>
        }
      />
    </div>
  );
}
