"use client";

import { useState } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { Plus, Sparkles } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, Column } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePaginated } from "@/hooks/use-api";
import { ChartOfAccount, AccountType } from "@/types/api";
import { fetchApi, fetchPaginated } from "@/lib/api";
import { ACCOUNT_TYPE_COLORS } from "@/lib/constants";
import { toast } from "sonner";

const columns: Column<ChartOfAccount>[] = [
  {
    header: "Code",
    cell: (row) => <span className="font-mono font-medium">{row.code}</span>,
  },
  { header: "Name", accessorKey: "name" as keyof ChartOfAccount },
  {
    header: "Type",
    cell: (row) => (
      <Badge className={ACCOUNT_TYPE_COLORS[row.accountType]}>
        {row.accountType}
      </Badge>
    ),
  },
  {
    header: "Parent",
    cell: (row) =>
      row.parent ? `${row.parent.code} - ${row.parent.name}` : "—",
  },
  {
    header: "Active",
    cell: (row) => (
      <Badge variant={row.isActive ? "default" : "secondary"}>
        {row.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
];

export default function ChartOfAccountsPage() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const { data, meta, isLoading, refetch } = usePaginated<ChartOfAccount>(
    "/chart-of-accounts",
    { page, limit: 50, search }
  );

  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<ChartOfAccount | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    accountType: "ASSET" as AccountType,
    parentId: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  function openCreate() {
    setFormData({ code: "", name: "", accountType: "ASSET", parentId: "" });
    setEditItem(null);
    setShowCreate(true);
  }

  function openEdit(account: ChartOfAccount) {
    setFormData({
      code: account.code,
      name: account.name,
      accountType: account.accountType,
      parentId: account.parentId || "",
    });
    setEditItem(account);
    setShowCreate(true);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      const body = {
        ...formData,
        parentId: formData.parentId || undefined,
      };

      if (editItem) {
        await fetchApi(`/chart-of-accounts/${editItem.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Account updated");
      } else {
        await fetchApi("/chart-of-accounts", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Account created");
      }
      setShowCreate(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await fetchApi(`/chart-of-accounts/${deleteId}`, { method: "DELETE" });
      toast.success("Account deleted");
      setDeleteId(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function handleSeedDefaults() {
    setIsSeeding(true);
    try {
      await fetchApi("/chart-of-accounts/seed-defaults", { method: "POST" });
      toast.success("Default chart of accounts seeded successfully");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to seed");
    } finally {
      setIsSeeding(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chart of Accounts"
        description="Manage your financial account structure"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSeedDefaults} disabled={isSeeding}>
              <Sparkles className="mr-2 h-4 w-4" />
              {isSeeding ? "Seeding..." : "Seed Defaults"}
            </Button>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New Account
            </Button>
          </div>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search accounts..."
        page={page}
        totalPages={meta?.totalPages || 1}
        total={meta?.total}
        onPageChange={setPage}
        onRowClick={(row) => openEdit(row)}
      />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Account" : "New Account"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code *</Label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="1100"
              />
            </div>
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Cash"
              />
            </div>
            <div className="space-y-2">
              <Label>Account Type *</Label>
              <Select
                value={formData.accountType}
                onValueChange={(v) =>
                  setFormData({ ...formData, accountType: v as AccountType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"] as const
                  ).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            {editItem && (
              <Button
                variant="destructive"
                onClick={() => {
                  setShowCreate(false);
                  setDeleteId(editItem.id);
                }}
              >
                Delete
              </Button>
            )}
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Account"
        description="Are you sure you want to delete this account?"
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
