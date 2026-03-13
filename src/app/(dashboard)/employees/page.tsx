"use client";

import { useState } from "react";
import { useQueryState, parseAsInteger } from "nuqs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { DataTable, Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { BranchCombobox } from "@/components/forms/branch-combobox";
import { usePaginated } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Employee, EmployeeStatus } from "@/types/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function EmployeesPage() {
  // URL state for pagination and search
  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1)
  );
  const [search, setSearch] = useQueryState("search", { defaultValue: "" });

  // Fetch employees
  const { data: employees, meta, isLoading, refetch } = usePaginated<Employee>(
    "/employees",
    { page, limit: 10, search }
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmployeeNumber, setFormEmployeeNumber] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPosition, setFormPosition] = useState("");
  const [formStatus, setFormStatus] = useState<EmployeeStatus>("ACTIVE");
  const [formBranchId, setFormBranchId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  // Table columns
  const columns: Column<Employee>[] = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Employee Number",
      cell: (row) => row.employeeNumber || "-",
    },
    {
      header: "Position",
      cell: (row) => row.position || "-",
    },
    {
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Branch",
      cell: (row) => row.branch?.name || "-",
    },
    {
      header: "Created",
      cell: (row) => formatDate(row.createdAt),
      className: "w-[150px]",
    },
    {
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(row);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
      className: "w-[100px]",
    },
  ];

  // Open create dialog
  function handleCreate() {
    setEditingEmployee(null);
    setFormName("");
    setFormEmployeeNumber("");
    setFormPhone("");
    setFormPosition("");
    setFormStatus("ACTIVE");
    setFormBranchId("");
    setDialogOpen(true);
  }

  // Open edit dialog
  function handleEdit(employee: Employee) {
    setEditingEmployee(employee);
    setFormName(employee.name);
    setFormEmployeeNumber(employee.employeeNumber || "");
    setFormPhone(employee.phone || "");
    setFormPosition(employee.position || "");
    setFormStatus(employee.status);
    setFormBranchId(employee.branchId || "");
    setDialogOpen(true);
  }

  // Open delete confirmation
  function handleDeleteClick(employee: Employee) {
    setDeletingEmployee(employee);
    setDeleteDialogOpen(true);
  }

  // Submit create/edit
  async function handleSubmit() {
    if (!formName.trim()) {
      toast.error("Employee name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        name: formName.trim(),
        status: formStatus,
        ...(formEmployeeNumber.trim() && { employeeNumber: formEmployeeNumber.trim() }),
        ...(formPhone.trim() && { phone: formPhone.trim() }),
        ...(formPosition.trim() && { position: formPosition.trim() }),
        ...(formBranchId.trim() && { branchId: formBranchId.trim() }),
      };

      if (editingEmployee) {
        await fetchApi(`/employees/${editingEmployee.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Employee updated successfully");
      } else {
        await fetchApi("/employees", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Employee created successfully");
      }

      setDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(
        editingEmployee ? "Failed to update employee" : "Failed to create employee"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Confirm delete
  async function handleDelete() {
    if (!deletingEmployee) return;

    try {
      await fetchApi(`/employees/${deletingEmployee.id}`, {
        method: "DELETE",
      });
      toast.success("Employee deleted successfully");
      setDeleteDialogOpen(false);
      setDeletingEmployee(null);
      refetch();
    } catch (error) {
      toast.error("Failed to delete employee");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage your employees and their assignments"
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Employee
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={employees}
        isLoading={isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search employees..."
        page={page}
        totalPages={meta?.totalPages || 1}
        onPageChange={setPage}
        total={meta?.total}
        emptyTitle="No employees found"
        emptyDescription="Get started by adding your first employee."
        emptyAction={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Employee
          </Button>
        }
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Edit Employee" : "New Employee"}
            </DialogTitle>
            <DialogDescription>
              {editingEmployee
                ? "Update the employee details below."
                : "Fill in the details to add a new employee."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee-name">Name</Label>
              <Input
                id="employee-name"
                placeholder="Enter employee name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-number">Employee Number</Label>
              <Input
                id="employee-number"
                placeholder="Enter employee number (optional)"
                value={formEmployeeNumber}
                onChange={(e) => setFormEmployeeNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-phone">Phone</Label>
              <Input
                id="employee-phone"
                placeholder="Enter phone number (optional)"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-position">Position</Label>
              <Input
                id="employee-position"
                placeholder="Enter position (optional)"
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-status">Status</Label>
              <Select
                value={formStatus}
                onValueChange={(value) => setFormStatus(value as EmployeeStatus)}
              >
                <SelectTrigger id="employee-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                  <SelectItem value="TERMINATED">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <BranchCombobox
                value={formBranchId}
                onChange={setFormBranchId}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : editingEmployee
                  ? "Update Employee"
                  : "Create Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Employee"
        description={`Are you sure you want to delete "${deletingEmployee?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </div>
  );
}
