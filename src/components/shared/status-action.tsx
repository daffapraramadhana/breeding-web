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
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

interface StatusActionProps {
  currentStatus: string;
  transitions: Record<string, string[]>;
  endpoint: string;
  onSuccess: () => void;
}

export function StatusAction({ currentStatus, transitions, endpoint, onSuccess }: StatusActionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);

  const available = transitions[currentStatus];
  if (!available || available.length === 0) return null;

  const primaryAction = available[0];
  const secondaryActions = available.slice(1);

  function getLabel(status: string) {
    return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function getVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
    if (status === "CANCELLED" || status === "REJECTED" || status === "SUPPLIER_REJECTED" || status === "CREDIT_LIMIT_REJECTED") return "destructive";
    return "default";
  }

  async function handleTransition(targetStatus: string) {
    setIsLoading(true);
    try {
      await fetchApi(endpoint, {
        method: "PATCH",
        body: JSON.stringify({ targetStatus }),
      });
      toast.success(`Status updated to ${getLabel(targetStatus)}`);
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
        variant={getVariant(primaryAction)}
        onClick={() => setConfirmTarget(primaryAction)}
        disabled={isLoading}
      >
        {getLabel(primaryAction)}
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
                className={getVariant(status) === "destructive" ? "text-destructive" : ""}
              >
                {getLabel(status)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title={`Confirm ${confirmTarget ? getLabel(confirmTarget) : ""}`}
        description={`Are you sure you want to change status to ${confirmTarget ? getLabel(confirmTarget) : ""}? This action cannot be undone.`}
        onConfirm={() => confirmTarget && handleTransition(confirmTarget)}
        variant={confirmTarget && getVariant(confirmTarget) === "destructive" ? "destructive" : "default"}
      />
    </div>
  );
}
