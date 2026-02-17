"use client";

import { Badge } from "@/components/ui/badge";

type Priority = "TINGGI" | "SEDANG" | "RENDAH";
type Penilaian = "BAIK" | "CUKUP" | "BURUK";

const PRIORITY_STYLES: Record<Priority, string> = {
  TINGGI: "bg-red-100 text-red-800 border-red-200",
  SEDANG: "bg-amber-100 text-amber-800 border-amber-200",
  RENDAH: "bg-blue-100 text-blue-800 border-blue-200",
};

const PENILAIAN_STYLES: Record<Penilaian, string> = {
  BAIK: "bg-green-100 text-green-800 border-green-200",
  CUKUP: "bg-amber-100 text-amber-800 border-amber-200",
  BURUK: "bg-red-100 text-red-800 border-red-200",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="outline" className={PRIORITY_STYLES[priority]}>
      {priority}
    </Badge>
  );
}

export function PenilaianBadge({ penilaian }: { penilaian: Penilaian }) {
  return (
    <Badge variant="outline" className={PENILAIAN_STYLES[penilaian]}>
      {penilaian}
    </Badge>
  );
}
