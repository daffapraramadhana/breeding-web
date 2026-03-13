"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { RecordingDeviation } from "@/types/api";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function RecordingDeviationPage() {
  const { data, isLoading, refetch } = useApi<RecordingDeviation>("/recording-deviation");

  const [formMaxDeviationDays, setFormMaxDeviationDays] = useState<number | "">("");
  const [formDescription, setFormDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (data) {
      setFormMaxDeviationDays(data.maxDeviationDays);
      setFormDescription(data.description || "");
    }
  }, [data]);

  async function handleSubmit() {
    if (formMaxDeviationDays === "") {
      toast.error("Max deviation days is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchApi("/recording-deviation", {
        method: "PUT",
        body: JSON.stringify({
          maxDeviationDays: formMaxDeviationDays,
          ...(formDescription.trim() && { description: formDescription.trim() }),
        }),
      });
      toast.success("Recording deviation saved successfully");
      refetch();
    } catch {
      toast.error("Failed to save recording deviation");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Recording Deviation" description="Configure recording deviation settings" />
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
      <PageHeader title="Recording Deviation" description="Configure recording deviation settings" />

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rd-max-days">Max Deviation Days</Label>
            <Input
              id="rd-max-days"
              type="number"
              placeholder="Enter max deviation days"
              value={formMaxDeviationDays}
              onChange={(e) => setFormMaxDeviationDays(e.target.value ? parseInt(e.target.value) : "")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rd-description">Description</Label>
            <Textarea
              id="rd-description"
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
