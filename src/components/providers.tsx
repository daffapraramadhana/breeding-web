"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AuthContext, useAuthProvider } from "@/hooks/use-auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  const auth = useAuthProvider();

  return (
    <AuthContext.Provider value={auth}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        themes={["light", "dark", "emerald"]}
        enableSystem
      >
        <NuqsAdapter>
          <TooltipProvider>
            {children}
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </NuqsAdapter>
      </ThemeProvider>
    </AuthContext.Provider>
  );
}
