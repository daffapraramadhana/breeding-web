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
        defaultTheme="light"
        themes={["light", "dark"]}
      >
        <NuqsAdapter>
          <TooltipProvider>
            {children}
            <Toaster
              richColors
              position="top-right"
              toastOptions={{
                className: "!rounded-[14px] !border-[var(--glass-border)] !shadow-[var(--glass-shadow)]",
              }}
            />
          </TooltipProvider>
        </NuqsAdapter>
      </ThemeProvider>
    </AuthContext.Provider>
  );
}
