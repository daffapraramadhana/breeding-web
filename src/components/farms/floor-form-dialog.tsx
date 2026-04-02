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
import { CoopFloor, CoopStatus } from "@/types/api";

interface FloorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coopId: string;
  farmId: string;
  branchId: string;
  floor?: CoopFloor | null;
  onSuccess: () => void;
}

export function FloorFormDialog({
  open,
  onOpenChange,
  coopId,
  farmId,
  branchId,
  floor,
  onSuccess,
}: FloorFormDialogProps) {
  const isEdit = !!floor;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [population, setPopulation] = useState("");
  const [area, setArea] = useState("");
  const [status, setStatus] = useState<CoopStatus>("ACTIVE");
  const [description, setDescription] = useState("");

  const parsedPop = parseInt(population, 10) || 0;
  const parsedArea = parseInt(area, 10) || 0;
  const maxPopulation = parsedPop * parsedArea;

  useEffect(() => {
    if (open) {
      if (floor) {
        setCode(floor.code);
        setName(floor.name);
        setPopulation(String(floor.population || 0));
        setArea(String(floor.area || 0));
        setStatus(floor.status || "ACTIVE");
        setDescription(floor.description || "");
      } else {
        setCode("");
        setName("");
        setPopulation("");
        setArea("");
        setStatus("ACTIVE");
        setDescription("");
      }
    }
  }, [open, floor]);

  async function handleSubmit() {
    if (!code.trim() || !name.trim()) {
      toast.error("Code and name are required");
      return;
    }
    if (parsedPop <= 0 || parsedArea <= 0) {
      toast.error("Population and area must be positive numbers");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        code: code.trim(),
        name: name.trim(),
        maxPopulation,
        area: parsedArea,
        status,
        ...(description.trim() && { description: description.trim() }),
        ...(!isEdit && { coopId, farmId, branchId }),
      };

      if (isEdit) {
        await fetchApi(`/coop-floors/${floor!.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Floor updated successfully");
      } else {
        await fetchApi("/coop-floors", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Floor created successfully");
      }

      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(isEdit ? "Failed to update floor" : "Failed to create floor");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Floor" : "Tambah Floor"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the floor details below."
              : "Fill in the details for the new floor."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input
                placeholder="e.g. FLR-001-A"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g. Blok A"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Populasi/m²</Label>
              <Input
                type="number"
                placeholder="e.g. 40"
                value={population}
                onChange={(e) => setPopulation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Luas (m²)</Label>
              <Input
                type="number"
                placeholder="e.g. 50"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Populasi</Label>
              <Input
                type="number"
                value={maxPopulation}
                disabled
                className="bg-muted"
              />
            </div>
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
