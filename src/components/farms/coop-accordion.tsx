"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { CoopFormDialog } from "@/components/farms/coop-form-dialog";
import { FloorFormDialog } from "@/components/farms/floor-form-dialog";
import { fetchApi } from "@/lib/api";
import { Coop, CoopFloor } from "@/types/api";

interface CoopAccordionProps {
  coops: Coop[];
  farmId: string;
  branchId: string;
  onMutated: () => void;
}

export function CoopAccordion({
  coops,
  farmId,
  branchId,
  onMutated,
}: CoopAccordionProps) {
  // Coop form state
  const [coopFormOpen, setCoopFormOpen] = useState(false);
  const [editingCoop, setEditingCoop] = useState<Coop | null>(null);

  // Floor form state
  const [floorFormOpen, setFloorFormOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<CoopFloor | null>(null);
  const [floorCoopId, setFloorCoopId] = useState("");

  // Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "coop" | "floor";
    id: string;
    name: string;
    floorCount?: number;
  } | null>(null);

  function handleAddCoop() {
    setEditingCoop(null);
    setCoopFormOpen(true);
  }

  function handleEditCoop(coop: Coop) {
    setEditingCoop(coop);
    setCoopFormOpen(true);
  }

  function handleDeleteCoop(coop: Coop) {
    setDeleteTarget({
      type: "coop",
      id: coop.id,
      name: `${coop.code} - ${coop.name}`,
      floorCount: coop.floors?.length || 0,
    });
    setDeleteOpen(true);
  }

  function handleAddFloor(coopId: string) {
    setEditingFloor(null);
    setFloorCoopId(coopId);
    setFloorFormOpen(true);
  }

  function handleEditFloor(floor: CoopFloor) {
    setEditingFloor(floor);
    setFloorCoopId(floor.coopId);
    setFloorFormOpen(true);
  }

  function handleDeleteFloor(floor: CoopFloor) {
    setDeleteTarget({
      type: "floor",
      id: floor.id,
      name: `${floor.code} - ${floor.name}`,
    });
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    const endpoint =
      deleteTarget.type === "coop"
        ? `/coops/${deleteTarget.id}`
        : `/coop-floors/${deleteTarget.id}`;

    try {
      await fetchApi(endpoint, { method: "DELETE" });
      toast.success(
        `${deleteTarget.type === "coop" ? "Kandang" : "Floor"} deleted successfully`
      );
      setDeleteOpen(false);
      setDeleteTarget(null);
      onMutated();
    } catch {
      toast.error(
        `Failed to delete ${deleteTarget.type === "coop" ? "kandang" : "floor"}`
      );
    }
  }

  const deleteDescription = deleteTarget
    ? deleteTarget.type === "coop" && (deleteTarget.floorCount || 0) > 0
      ? `Are you sure you want to delete "${deleteTarget.name}"? This kandang has ${deleteTarget.floorCount} floor(s) that may also be affected.`
      : `Are you sure you want to delete "${deleteTarget.name}"?`
    : "";

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Kandang</h2>
          <Button size="sm" onClick={handleAddCoop}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Kandang
          </Button>
        </div>

        {coops.length === 0 ? (
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            <p>No coops yet. Add the first kandang to this farm.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {coops.map((coop) => (
              <AccordionItem key={coop.id} value={coop.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 items-center gap-3 mr-4">
                    <span className="font-bold">{coop.code}</span>
                    <span className="text-muted-foreground">{coop.name}</span>
                    <StatusBadge status={coop.status} />
                    <span className="text-sm text-muted-foreground">
                      Cap: {coop.capacity.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      · {coop.floors?.length || 0} floor(s)
                    </span>
                    <div className="ml-auto flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEditCoop(coop)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDeleteCoop(coop)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {/* Floor Table */}
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-2 font-medium">Kode</th>
                          <th className="text-left p-2 font-medium">Nama</th>
                          <th className="text-right p-2 font-medium">Luas (m²)</th>
                          <th className="text-right p-2 font-medium">Pop/m²</th>
                          <th className="text-right p-2 font-medium">Max Pop</th>
                          <th className="text-left p-2 font-medium">Status</th>
                          <th className="text-right p-2 font-medium">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!coop.floors || coop.floors.length === 0) ? (
                          <tr>
                            <td colSpan={7} className="p-4 text-center text-muted-foreground">
                              No floors yet
                            </td>
                          </tr>
                        ) : (
                          coop.floors.map((floor) => (
                            <tr key={floor.id} className="border-b last:border-0">
                              <td className="p-2">{floor.code}</td>
                              <td className="p-2">{floor.name}</td>
                              <td className="p-2 text-right">{floor.area || "-"}</td>
                              <td className="p-2 text-right">{floor.population || "-"}</td>
                              <td className="p-2 text-right">
                                {floor.maxPopulation?.toLocaleString() || "-"}
                              </td>
                              <td className="p-2">
                                <StatusBadge status={floor.status || "ACTIVE"} />
                              </td>
                              <td className="p-2 text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleEditFloor(floor)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => handleDeleteFloor(floor)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-3 border-dashed"
                    onClick={() => handleAddFloor(coop.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Floor
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Coop Form Dialog */}
      <CoopFormDialog
        open={coopFormOpen}
        onOpenChange={setCoopFormOpen}
        farmId={farmId}
        branchId={branchId}
        coop={editingCoop}
        onSuccess={onMutated}
      />

      {/* Floor Form Dialog */}
      <FloorFormDialog
        open={floorFormOpen}
        onOpenChange={setFloorFormOpen}
        coopId={floorCoopId}
        farmId={farmId}
        branchId={branchId}
        floor={editingFloor}
        onSuccess={onMutated}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${deleteTarget?.type === "coop" ? "Kandang" : "Floor"}`}
        description={deleteDescription}
        onConfirm={confirmDelete}
        variant="destructive"
        confirmLabel="Delete"
      />
    </>
  );
}
