"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { FarmInfoCard } from "@/components/farms/farm-info-card";
import { CoopAccordion } from "@/components/farms/coop-accordion";
import { useApi } from "@/hooks/use-api";
import { Farm } from "@/types/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function FarmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: farm, isLoading, error, refetch } = useApi<Farm>(`/farms/${id}`);

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
        <Skeleton className="h-48" />
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

      <FarmInfoCard farm={farm} onUpdated={refetch} />

      <Separator />

      <CoopAccordion
        coops={farm.coops || []}
        farmId={farm.id}
        branchId={farm.branchId}
        onMutated={refetch}
      />
    </div>
  );
}
