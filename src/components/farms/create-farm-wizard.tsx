"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BranchCombobox } from "@/components/forms/branch-combobox";
import { fetchApi } from "@/lib/api";
import { FarmStatus, CoopStatus } from "@/types/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FloorForm {
  id: string; // local key only
  code: string;
  name: string;
  description: string;
  population: string;
  area: string;
  status: CoopStatus | "";
}

interface CoopForm {
  id: string; // local key only
  code: string;
  name: string;
  description: string;
  capacity: string;
  status: CoopStatus | "";
  isOwnFarm: boolean;
  floors: FloorForm[];
}

interface FarmForm {
  branchId: string;
  name: string;
  address: string;
  farmType: string;
  status: FarmStatus | "";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2);
}

function emptyFloor(): FloorForm {
  return { id: uid(), code: "", name: "", description: "", population: "", area: "", status: "" };
}

function emptyCoop(): CoopForm {
  return {
    id: uid(),
    code: "",
    name: "",
    description: "",
    capacity: "",
    status: "",
    isOwnFarm: true,
    floors: [emptyFloor()],
  };
}

// ─── Step indicator ────────────────────────────────────────────────────────────

const STEPS = ["Farm Details", "Coops & Floors", "Review"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                i < current
                  ? "bg-primary border-primary text-primary-foreground"
                  : i === current
                  ? "border-primary text-primary bg-background"
                  : "border-muted text-muted-foreground bg-background"
              }`}
            >
              {i < current ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={`text-xs font-medium ${
                i === current ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-0.5 w-12 mb-4 transition-colors ${
                i < current ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1 — Farm Details ────────────────────────────────────────────────────

function StepFarm({
  form,
  onChange,
}: {
  form: FarmForm;
  onChange: (f: FarmForm) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Branch <span className="text-destructive">*</span></Label>
        <BranchCombobox value={form.branchId} onChange={(v) => onChange({ ...form, branchId: v })} />
      </div>
      <div className="space-y-2">
        <Label>Farm Name <span className="text-destructive">*</span></Label>
        <Input
          placeholder="e.g. Farm Cirebon A"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Input
          placeholder="Enter farm address (optional)"
          value={form.address}
          onChange={(e) => onChange({ ...form, address: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Farm Type</Label>
        <Input
          placeholder="e.g. Broiler, Layer (optional)"
          value={form.farmType}
          onChange={(e) => onChange({ ...form, farmType: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={form.status}
          onValueChange={(v) => onChange({ ...form, status: v as FarmStatus })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OWN">Milik Sendiri (OWN)</SelectItem>
            <SelectItem value="COOP">Kerjasama (COOP)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ─── Step 2 — Coops & Floors ─────────────────────────────────────────────────

function FloorRow({
  floor,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  floor: FloorForm;
  index: number;
  onChange: (f: FloorForm) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 items-start pl-4 border-l-2 border-muted">
      <div className="space-y-1">
        <Label className="text-xs">Code *</Label>
        <Input
          className="h-8 text-sm"
          placeholder="L01"
          value={floor.code}
          onChange={(e) => onChange({ ...floor, code: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Name *</Label>
        <Input
          className="h-8 text-sm"
          placeholder="Lantai 1"
          value={floor.name}
          onChange={(e) => onChange({ ...floor, name: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Populasi / m² *</Label>
        <Input
          className="h-8 text-sm"
          type="number"
          placeholder="50"
          value={floor.population}
          onChange={(e) => onChange({ ...floor, population: e.target.value })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Luas (m²) *</Label>
        <Input
          className="h-8 text-sm"
          type="number"
          placeholder="100"
          value={floor.area}
          onChange={(e) => onChange({ ...floor, area: e.target.value })}
        />
      </div>
      <div className="col-span-2 space-y-1">
        <Label className="text-xs text-muted-foreground">Max Populasi (otomatis)</Label>
        <Input
          className="h-8 text-sm bg-muted"
          type="number"
          readOnly
          disabled
          value={floor.population && floor.area ? Number(floor.population) * Number(floor.area) : ""}
          placeholder="Populasi × Luas"
        />
      </div>
      <div className="col-span-2 flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive"
          onClick={onRemove}
          disabled={!canRemove}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function CoopCard({
  coop,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  coop: CoopForm;
  index: number;
  onChange: (c: CoopForm) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  function updateFloor(fi: number, floor: FloorForm) {
    const floors = [...coop.floors];
    floors[fi] = floor;
    onChange({ ...coop, floors });
  }

  function removeFloor(fi: number) {
    onChange({ ...coop, floors: coop.floors.filter((_, i) => i !== fi) });
  }

  function addFloor() {
    onChange({ ...coop, floors: [...coop.floors, emptyFloor()] });
  }

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
      {/* Coop header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">Kandang {index + 1}</Badge>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive h-7"
          onClick={onRemove}
          disabled={!canRemove}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Remove
        </Button>
      </div>

      {/* Coop fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-sm">Code <span className="text-destructive">*</span></Label>
          <Input
            className="h-8"
            placeholder="K01"
            value={coop.code}
            onChange={(e) => onChange({ ...coop, code: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Name <span className="text-destructive">*</span></Label>
          <Input
            className="h-8"
            placeholder="Kandang 1"
            value={coop.name}
            onChange={(e) => onChange({ ...coop, name: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Capacity <span className="text-destructive">*</span></Label>
          <Input
            className="h-8"
            type="number"
            placeholder="10000"
            value={coop.capacity}
            onChange={(e) => onChange({ ...coop, capacity: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm">Status</Label>
          <Select
            value={coop.status}
            onValueChange={(v) => onChange({ ...coop, status: v as CoopStatus })}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Optional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Floors */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Lantai (Floors)</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={addFloor}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Floor
          </Button>
        </div>
        <div className="space-y-2">
          {coop.floors.map((floor, fi) => (
            <FloorRow
              key={floor.id}
              floor={floor}
              index={fi}
              onChange={(f) => updateFloor(fi, f)}
              onRemove={() => removeFloor(fi)}
              canRemove={coop.floors.length > 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepCoops({
  coops,
  onChange,
}: {
  coops: CoopForm[];
  onChange: (c: CoopForm[]) => void;
}) {
  function updateCoop(i: number, coop: CoopForm) {
    const next = [...coops];
    next[i] = coop;
    onChange(next);
  }

  function removeCoop(i: number) {
    onChange(coops.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add one or more kandang. Each kandang can have multiple floors.
      </p>
      {coops.map((coop, i) => (
        <CoopCard
          key={coop.id}
          coop={coop}
          index={i}
          onChange={(c) => updateCoop(i, c)}
          onRemove={() => removeCoop(i)}
          canRemove={coops.length > 1}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => onChange([...coops, emptyCoop()])}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Kandang
      </Button>
    </div>
  );
}

// ─── Step 3 — Review ─────────────────────────────────────────────────────────

function StepReview({ farm, coops }: { farm: FarmForm; coops: CoopForm[] }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 space-y-2">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Farm</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">Name</span><span className="font-medium">{farm.name}</span>
          {farm.address && <><span className="text-muted-foreground">Address</span><span>{farm.address}</span></>}
          {farm.farmType && <><span className="text-muted-foreground">Type</span><span>{farm.farmType}</span></>}
          {farm.status && <><span className="text-muted-foreground">Status</span><span>{farm.status}</span></>}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {coops.length} Kandang
        </p>
        {coops.map((coop, i) => (
          <div key={coop.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{coop.code}</Badge>
              <span className="font-medium text-sm">{coop.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">Capacity: {coop.capacity}</span>
            </div>
            {coop.floors.length > 0 && (
              <div className="space-y-1 pl-2 border-l-2 border-muted">
                {coop.floors.map((floor, fi) => (
                  <div key={floor.id} className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{floor.code} — {floor.name}</span>
                    {floor.area && <span>Luas: {floor.area}m²</span>}
                    {floor.population && <span>Pop/m²: {floor.population}</span>}
                    {floor.population && floor.area && (
                      <span className="font-medium text-foreground">Max: {Number(floor.population) * Number(floor.area)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}

export function CreateFarmWizard({ open, onOpenChange, onSuccess }: Props) {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [farm, setFarm] = useState<FarmForm>({
    branchId: "",
    name: "",
    address: "",
    farmType: "",
    status: "",
  });

  const [coops, setCoops] = useState<CoopForm[]>([emptyCoop()]);

  function reset() {
    setStep(0);
    setFarm({ branchId: "", name: "", address: "", farmType: "", status: "" });
    setCoops([emptyCoop()]);
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  // Validation per step
  function validateStep0(): string | null {
    if (!farm.branchId) return "Please select a branch";
    if (!farm.name.trim()) return "Farm name is required";
    return null;
  }

  function validateStep1(): string | null {
    for (let ci = 0; ci < coops.length; ci++) {
      const c = coops[ci];
      if (!c.code.trim()) return `Kandang ${ci + 1}: code is required`;
      if (!c.name.trim()) return `Kandang ${ci + 1}: name is required`;
      if (!c.capacity || isNaN(Number(c.capacity)) || Number(c.capacity) < 1)
        return `Kandang ${ci + 1}: valid capacity is required`;

      for (let fi = 0; fi < c.floors.length; fi++) {
        const f = c.floors[fi];
        if (!f.code.trim()) return `Kandang ${ci + 1}, Lantai ${fi + 1}: code is required`;
        if (!f.name.trim()) return `Kandang ${ci + 1}, Lantai ${fi + 1}: name is required`;
        if (!f.population || isNaN(Number(f.population)) || Number(f.population) < 1)
          return `Kandang ${ci + 1}, Lantai ${fi + 1}: populasi per m² harus diisi`;
        if (!f.area || isNaN(Number(f.area)) || Number(f.area) < 1)
          return `Kandang ${ci + 1}, Lantai ${fi + 1}: luas harus diisi`;
      }
    }
    return null;
  }

  function handleNext() {
    if (step === 0) {
      const err = validateStep0();
      if (err) { toast.error(err); return; }
    }
    if (step === 1) {
      const err = validateStep1();
      if (err) { toast.error(err); return; }
    }
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const payload = {
        branchId: farm.branchId,
        name: farm.name.trim(),
        ...(farm.address.trim() && { address: farm.address.trim() }),
        ...(farm.farmType.trim() && { farmType: farm.farmType.trim() }),
        ...(farm.status && { status: farm.status }),
        coops: coops.map((c) => ({
          code: c.code.trim(),
          name: c.name.trim(),
          ...(c.description.trim() && { description: c.description.trim() }),
          capacity: Number(c.capacity),
          ...(c.status && { status: c.status }),
          isOwnFarm: c.isOwnFarm,
          floors: c.floors.map((f) => ({
            code: f.code.trim(),
            name: f.name.trim(),
            ...(f.description.trim() && { description: f.description.trim() }),
            population: Number(f.population),
            area: Number(f.area),
            maxPopulation: Number(f.population) * Number(f.area),
            ...(f.status && { status: f.status }),
          })),
        })),
      };

      await fetchApi("/farms/with-coops", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success("Farm, coops, and floors created successfully! 🎉");
      handleClose();
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create farm");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Farm</DialogTitle>
          <DialogDescription>
            Set up your farm, kandang, and floors in one step.
          </DialogDescription>
        </DialogHeader>

        <StepIndicator current={step} />
        <Separator className="mb-4" />

        {step === 0 && <StepFarm form={farm} onChange={setFarm} />}
        {step === 1 && <StepCoops coops={coops} onChange={setCoops} />}
        {step === 2 && <StepReview farm={farm} coops={coops} />}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t mt-4">
          <Button
            variant="outline"
            onClick={step === 0 ? handleClose : () => setStep((s) => s - 1)}
            disabled={isSubmitting}
          >
            {step === 0 ? (
              "Cancel"
            ) : (
              <><ChevronLeft className="w-4 h-4 mr-1" /> Back</>
            )}
          </Button>

          {step < 2 ? (
            <Button onClick={handleNext}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Farm 🚀"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
