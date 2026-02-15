"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "./confirm-dialog";
import { DocumentStatus } from "@/types/api";
import { STATUS_TRANSITIONS } from "@/lib/constants";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

interface StatusActionProps {
  currentStatus: DocumentStatus;
  endpoint: string;
  onSuccess: () => void;
}

const ACTION_LABELS: Record<DocumentStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submit",
  APPROVED: "Approve",
  PROCESSED: "Process",
  CLOSED: "Close",
  CANCELLED: "Cancel",
};

const ACTION_VARIANTS: Record<DocumentStatus, "default" | "destructive" | "outline" | "secondary"> = {
  DRAFT: "outline",
  SUBMITTED: "default",
  APPROVED: "default",
  PROCESSED: "default",
  CLOSED: "secondary",
  CANCELLED: "destructive",
};

export function StatusAction({ currentStatus, endpoint, onSuccess }: StatusActionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<DocumentStatus | null>(null);

  const transitions = STATUS_TRANSITIONS[currentStatus];
  if (!transitions || transitions.length === 0) return null;

  const primaryAction = transitions[0];
  const secondaryActions = transitions.slice(1);

  async function handleTransition(targetStatus: DocumentStatus) {
    setIsLoading(true);
    try {
      await fetchApi(endpoint, {
        method: "PATCH",
        body: JSON.stringify({ targetStatus }),
      });
      toast.success(`Status updated to ${targetStatus}`);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setIsLoading(false);
      setConfirmTarget(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={ACTION_VARIANTS[primaryAction]}
        onClick={() => setConfirmTarget(primaryAction)}
        disabled={isLoading}
      >
        {ACTION_LABELS[primaryAction]}
      </Button>

      {secondaryActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" disabled={isLoading}>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {secondaryActions.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => setConfirmTarget(status)}
                className={status === "CANCELLED" ? "text-destructive" : ""}
              >
                {ACTION_LABELS[status]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title={`Confirm ${confirmTarget ? ACTION_LABELS[confirmTarget] : ""}`}
        description={`Are you sure you want to ${confirmTarget ? ACTION_LABELS[confirmTarget].toLowerCase() : ""} this document? This action cannot be undone.`}
        onConfirm={() => confirmTarget && handleTransition(confirmTarget)}
        variant={confirmTarget === "CANCELLED" ? "destructive" : "default"}
      />
    </div>
  );
}
