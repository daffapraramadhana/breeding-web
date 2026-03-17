"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SelectedCoop } from "./step-own-farm";

interface StepKandangProps {
  selectedCoops: SelectedCoop[];
  coopDescriptions: Record<string, string>;
  setCoopDescriptions: (v: Record<string, string>) => void;
}

export function StepKandang({
  selectedCoops,
  coopDescriptions,
  setCoopDescriptions,
}: StepKandangProps) {
  const checkedCoops = selectedCoops.filter((c) => c.checked);

  function updateDescription(coopId: string, description: string) {
    setCoopDescriptions({ ...coopDescriptions, [coopId]: description });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Data Persiapan Kandang</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {checkedCoops.map((coop) => (
            <div key={coop.coopId} className="space-y-2 pb-4 border-b last:border-b-0">
              <div className="font-medium">
                {coop.coopCode} - {coop.coopName}
              </div>
              <Label>Keterangan:</Label>
              <Textarea
                value={coopDescriptions[coop.coopId] || ""}
                onChange={(e) => updateDescription(coop.coopId, e.target.value)}
                placeholder="Catatan persiapan kandang..."
                className="min-h-[100px] bg-yellow-50"
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
