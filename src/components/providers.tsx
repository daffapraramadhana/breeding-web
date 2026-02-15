"use client";

import { ReactNode } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AuthContext, useAuthProvider } from "@/hooks/use-auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  const auth = useAuthProvider();

  return (
    <AuthContext.Provider value={auth}>
      <NuqsAdapter>
        <TooltipProvider>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </NuqsAdapter>
    </AuthContext.Provider>
  );
}
