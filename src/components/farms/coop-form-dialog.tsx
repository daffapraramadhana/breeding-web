"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { fetchApi } from "@/lib/api";
import { Coop, CoopStatus } from "@/types/api";

interface CoopFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmId: string;
  branchId: string;
  coop?: Coop | null;
  onSuccess: () => void;
}

export function CoopFormDialog({
  open,
  onOpenChange,
  farmId,
  branchId,
  coop,
  onSuccess,
}: CoopFormDialogProps) {
  const isEdit = !!coop;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [status, setStatus] = useState<CoopStatus>("ACTIVE");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      if (coop) {
        setCode(coop.code);
        setName(coop.name);
        setCapacity(String(coop.capacity));
        setStatus(coop.status);
        setDescription(coop.description || "");
      } else {
        setCode("");
        setName("");
        setCapacity("");
        setStatus("ACTIVE");
        setDescription("");
      }
    }
  }, [open, coop]);

  async function handleSubmit() {
    if (!code.trim() || !name.trim() || !capacity.trim()) {
      toast.error("Code, name, and capacity are required");
      return;
    }

    const parsedCapacity = parseInt(capacity, 10);
    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      toast.error("Capacity must be a positive number");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        code: code.trim(),
        name: name.trim(),
        capacity: parsedCapacity,
        status,
        ...(description.trim() && { description: description.trim() }),
        ...(!isEdit && { farmId, branchId }),
      };

      if (isEdit) {
        await fetchApi(`/coops/${coop!.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Kandang updated successfully");
      } else {
        await fetchApi("/coops", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Kandang created successfully");
      }

      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(isEdit ? "Failed to update kandang" : "Failed to create kandang");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Kandang" : "Tambah Kandang"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the kandang details below."
              : "Fill in the details for the new kandang."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Code</Label>
            <Input
              placeholder="e.g. KDG-001"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              placeholder="e.g. Kandang Utara"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Capacity</Label>
            <Input
              type="number"
              placeholder="e.g. 5000"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(val) => setStatus(val as CoopStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEdit ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
