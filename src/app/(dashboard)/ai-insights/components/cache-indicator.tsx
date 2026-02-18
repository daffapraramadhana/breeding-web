"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Archive, RefreshCw } from "lucide-react";
import { formatDistanceToNow, parseISO, format } from "date-fns";
import { id } from "date-fns/locale";

interface CacheIndicatorProps {
  cached: boolean;
  generatedAt: string;
  expiresAt?: string;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function CacheIndicator({
  cached,
  generatedAt,
  expiresAt,
  onRefresh,
  isLoading,
}: CacheIndicatorProps) {
  if (!cached) return null;

  const generatedDate = parseISO(generatedAt);
  const relativeTime = formatDistanceToNow(generatedDate, {
    addSuffix: true,
    locale: id,
  });

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="secondary" className="gap-1.5">
        <Archive className="h-3 w-3" />
        Dari cache
      </Badge>
      <span className="text-xs text-muted-foreground">
        Diperbarui {relativeTime}
      </span>
      {expiresAt && (
        <span className="text-xs text-muted-foreground">
          &bull; Kadaluarsa pukul{" "}
          {format(parseISO(expiresAt), "HH:mm", { locale: id })}
        </span>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        className="h-7 text-xs gap-1.5"
      >
        <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
        Muat Ulang
      </Button>
    </div>
  );
}
