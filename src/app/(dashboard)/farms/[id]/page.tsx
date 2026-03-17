"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Calendar, Warehouse } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { useApi } from "@/hooks/use-api";
import { formatDate } from "@/lib/utils";
import { Farm, Coop } from "@/types/api";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  MAINTENANCE: "outline",
};

export default function FarmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: farm, isLoading, error } = useApi<Farm>(`/farms/${id}`);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !farm) {
    return (
      <div className="space-y-6">
        <PageHeader title="Farm Not Found" />
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              {error || "The farm you are looking for does not exist."}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/farms")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Farms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const coops = farm.coops || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={farm.name}
        description={farm.address || "No address specified"}
        actions={
          <Button variant="outline" onClick={() => router.push("/farms")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Farms
          </Button>
        }
      />

      {/* Farm Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Address</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm">{farm.address || "-"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Coops</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coops.length}</div>
            <p className="text-xs text-muted-foreground">Total enclosures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm">{formatDate(farm.createdAt)}</p>
            <p className="text-xs text-muted-foreground">
              Updated {formatDate(farm.updatedAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Coops Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Coops</h2>

        {coops.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Warehouse className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No coops yet</p>
              <p className="text-sm text-muted-foreground">
                This farm does not have any coops assigned.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {coops.map((coop: Coop) => (
              <Card key={coop.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{coop.name}</CardTitle>
                    <StatusBadge status={coop.status} />
                  </div>
                  <CardDescription>
                    Capacity: {coop.capacity}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Created</span>
                    <span>{formatDate(coop.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
