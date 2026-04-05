"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("recordingDeviation");
  const tc = useTranslations("common");
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
      toast.error(t("maxDeviationDaysRequired"));
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
      toast.success(t("savedSuccess"));
      refetch();
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("description")} />
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
      <PageHeader title={t("title")} description={t("description")} />

      <Card>
        <CardHeader>
          <CardTitle>{t("settings")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rd-max-days">{t("maxDeviationDays")}</Label>
            <Input
              id="rd-max-days"
              type="number"
              placeholder={t("enterMaxDeviationDays")}
              value={formMaxDeviationDays}
              onChange={(e) => setFormMaxDeviationDays(e.target.value ? parseInt(e.target.value) : "")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rd-description">{tc("description")}</Label>
            <Textarea
              id="rd-description"
              placeholder={tc("enterFieldOptional", { field: tc("description") })}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? tc("saving") : t("saveSettings")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
