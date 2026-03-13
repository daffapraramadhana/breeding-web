"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionForecast } from "@/types/api";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

interface ForecastTableProps {
  data: ProductionForecast["jadwal_produksi"];
}

export function ForecastTable({ data }: ForecastTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Jadwal Produksi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bulan</TableHead>
                <TableHead className="text-center">Proyek</TableHead>
                <TableHead className="text-center">Est. Populasi</TableHead>
                <TableHead>Coop Rekomendasi</TableHead>
                <TableHead className="text-right">Est. Biaya</TableHead>
                <TableHead className="text-right">Est. Pendapatan</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">
                    {MONTH_NAMES[row.bulan - 1] || row.bulan}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.jumlah_proyek}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.estimasi_populasi.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell>{row.coop_rekomendasi}</TableCell>
                  <TableCell className="text-right">
                    {row.estimasi_biaya}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.estimasi_pendapatan}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {row.catatan}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
