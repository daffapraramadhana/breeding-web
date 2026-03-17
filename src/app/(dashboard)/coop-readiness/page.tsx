"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { CoopReadiness } from "@/types/api";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CoopReadinessPage() {
  const { data, isLoading, refetch } = useApi<CoopReadiness>("/coop-readiness");

  const [formDaysBefore, setFormDaysBefore] = useState<number | "">("");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (data) {
      setFormDaysBefore(data.daysBefore);
      setFormDescription(data.description || "");
    }
  }, [data]);

  async function handleSubmit() {
    if (formDaysBefore === "") {
      toast.error("Days before is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchApi("/coop-readiness", {
        method: "PUT",
        body: JSON.stringify({
          daysBefore: formDaysBefore,
          ...(formDescription.trim() && { description: formDescription.trim() }),
        }),
      });
      toast.success("Coop readiness saved successfully");
      refetch();
    } catch {
      toast.error("Failed to save coop readiness");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Coop Readiness" description="Configure coop readiness settings" />
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-10 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-20 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Coop Readiness" description="Configure coop readiness settings" />

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cr-days">Days Before</Label>
            <Input
              id="cr-days"
              type="number"
              placeholder="Enter days before"
              value={formDaysBefore}
              onChange={(e) => setFormDaysBefore(e.target.value ? parseInt(e.target.value) : "")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cr-description">Description</Label>
            <Textarea
              id="cr-description"
              placeholder="Enter description (optional)"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
