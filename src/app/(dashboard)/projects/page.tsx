"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsInteger } from "nuqs";
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
      header: "ID",
      cell: (row) => (
        <span className="font-mono text-xs">{row.id.slice(0, 8)}</span>
      ),
      className: "w-[100px]",
    },
    {
      header: "Branch",
      cell: (row) => row.branch?.name || "-",
    },
    {
      header: "Farm",
      cell: (row) => row.farm?.name || "-",
    },
    {
      header: "Start Date",
      cell: (row) => (row.startDate ? formatDate(row.startDate) : "-"),
      className: "w-[140px]",
    },
    {
      header: "Status",
      cell: (row) =>
        row.status ? <StatusBadge status={row.status} /> : "-",
      className: "w-[120px]",
    },
    {
      header: "Created",
      cell: (row) => formatDate(row.createdAt),
      className: "w-[140px]",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage poultry production projects"
        actions={
          <Button onClick={() => router.push("/projects/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex items-end gap-4">
        <div className="w-[280px] space-y-2">
          <Label>Branch</Label>
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
            Clear filter
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
        searchPlaceholder="Search projects..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        onRowClick={(project) => router.push(`/projects/${project.id}`)}
        emptyTitle="No projects found"
        emptyDescription="Get started by creating your first project."
        emptyAction={
          <Button onClick={() => router.push("/projects/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        }
      />
    </div>
  );
}
