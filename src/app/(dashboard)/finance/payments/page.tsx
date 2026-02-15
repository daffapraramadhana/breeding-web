"use client";

import { useState } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { usePaginated } from "@/hooks/use-api";
import { Payment, PaymentType, PaymentMethod } from "@/types/api";
import { fetchApi } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const columns: Column<Payment>[] = [
  {
    header: "Payment #",
    cell: (row) => <span className="font-medium">{row.paymentNumber}</span>,
  },
  {
    header: "Type",
    cell: (row) => (
      <Badge
        variant={row.paymentType === "INCOMING" ? "default" : "secondary"}
      >
        {row.paymentType}
      </Badge>
    ),
  },
  {
    header: "Method",
    cell: (row) => row.paymentMethod.replace("_", " "),
  },
  {
    header: "Amount",
    cell: (row) => (
      <span className="font-medium">{formatCurrency(row.amount)}</span>
    ),
    className: "text-right",
  },
  {
    header: "Date",
    cell: (row) => formatDate(row.paymentDate),
  },
  {
    header: "Reference",
    cell: (row) => row.reference || "—",
  },
];

export default function PaymentsPage() {
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });
  const { data, meta, isLoading, refetch } = usePaginated<Payment>(
    "/payments",
    { page, limit: 20, search }
  );

  const [showCreate, setShowCreate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    paymentType: "OUTGOING" as PaymentType,
    paymentMethod: "BANK_TRANSFER" as PaymentMethod,
    amount: "",
    paymentDate: "",
    reference: "",
    notes: "",
  });

  async function handleSave() {
    setIsSaving(true);
    try {
      await fetchApi("/payments", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          amount: formData.amount,
        }),
      });
      toast.success("Payment created");
      setShowCreate(false);
      setFormData({
        paymentType: "OUTGOING",
        paymentMethod: "BANK_TRANSFER",
        amount: "",
        paymentDate: "",
        reference: "",
        notes: "",
      });
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Manage incoming and outgoing payments"
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Payment
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search payments..."
        page={page}
        totalPages={meta?.totalPages || 1}
        total={meta?.total}
        onPageChange={setPage}
      />

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Payment Type *</Label>
                <Select
                  value={formData.paymentType}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      paymentType: v as PaymentType,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OUTGOING">Outgoing (Pay Supplier)</SelectItem>
                    <SelectItem value="INCOMING">Incoming (Receive from Customer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      paymentMethod: v as PaymentMethod,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CHECK">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="500000"
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Date *</Label>
                <Input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reference</Label>
              <Input
                value={formData.reference}
                onChange={(e) =>
                  setFormData({ ...formData, reference: e.target.value })
                }
                placeholder="TRF-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Payment details..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Creating..." : "Create Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
