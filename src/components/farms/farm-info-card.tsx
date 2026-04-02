"use client";

import { useState } from "react";
import { Pencil, MapPin, Building2, Warehouse, Layers } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
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
import { StatusBadge } from "@/components/shared/status-badge";
import { BranchCombobox } from "@/components/forms/branch-combobox";
import { fetchApi } from "@/lib/api";
import { Farm, FarmStatus } from "@/types/api";

interface FarmInfoCardProps {
  farm: Farm;
  onUpdated: () => void;
}

export function FarmInfoCard({ farm, onUpdated }: FarmInfoCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formBranchId, setFormBranchId] = useState("");
  const [formFarmType, setFormFarmType] = useState("");
  const [formStatus, setFormStatus] = useState<FarmStatus | "">("");

  const coops = farm.coops || [];
  const totalFloors = coops.reduce(
    (sum, coop) => sum + (coop.floors?.length || 0),
    0
  );
  const totalCapacity = coops.reduce((sum, coop) => sum + coop.capacity, 0);

  function handleEditOpen() {
    setFormName(farm.name);
    setFormAddress(farm.address || "");
    setFormBranchId(farm.branchId || "");
    setFormFarmType(farm.farmType || "");
    setFormStatus(farm.status || "");
    setEditOpen(true);
  }

  async function handleSubmit() {
    if (!formName.trim()) {
      toast.error("Farm name is required");
      return;
    }
    if (!formBranchId) {
      toast.error("Branch is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchApi(`/farms/${farm.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: formName.trim(),
          branchId: formBranchId,
          ...(formAddress.trim() && { address: formAddress.trim() }),
          ...(formFarmType.trim() && { farmType: formFarmType.trim() }),
          ...(formStatus && { status: formStatus }),
        }),
      });
      toast.success("Farm updated successfully");
      setEditOpen(false);
      onUpdated();
    } catch {
      toast.error("Failed to update farm");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{farm.name}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                {farm.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {farm.address}
                  </span>
                )}
                {farm.branch?.name && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {farm.branch.name}
                  </span>
                )}
                {farm.status && <StatusBadge status={farm.status} />}
                {farm.farmType && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">
                    {farm.farmType}
                  </span>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleEditOpen}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Farm
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Warehouse className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{coops.length}</div>
              <div className="text-xs text-muted-foreground">Total Kandang</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Layers className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{totalFloors}</div>
              <div className="text-xs text-muted-foreground">Total Floor</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">
                {totalCapacity.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Total Kapasitas
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Farm Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Farm</DialogTitle>
            <DialogDescription>Update the farm details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Branch</Label>
              <BranchCombobox
                value={formBranchId}
                onChange={setFormBranchId}
              />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Enter farm name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                placeholder="Enter farm address (optional)"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Farm Type</Label>
              <Input
                placeholder="Enter farm type (optional)"
                value={formFarmType}
                onChange={(e) => setFormFarmType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formStatus}
                onValueChange={(val) => setFormStatus(val as FarmStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWN">Milik Sendiri (OWN)</SelectItem>
                  <SelectItem value="COOP">Kerjasama (COOP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Update Farm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
