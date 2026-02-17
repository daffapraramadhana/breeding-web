"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface InsightCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  borderColor?: string;
}

export function InsightCard({
  title,
  icon,
  children,
  className,
  borderColor,
}: InsightCardProps) {
  return (
    <Card className={cn(borderColor && `border-l-4 ${borderColor}`, className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
