"use client";

import { useEffect, useState } from "react";
import { BrainCircuit } from "lucide-react";

const STEPS = [
  "Mengumpulkan data...",
  "Menganalisis dengan AI...",
  "Menyiapkan hasil...",
];

export function AiLoading() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 2000),
      setTimeout(() => setStep(2), 8000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center py-16"
      aria-busy="true"
      aria-label="AI sedang menganalisis data"
    >
      <BrainCircuit className="h-12 w-12 text-primary animate-pulse" />
      <p className="mt-4 text-lg font-medium">
        AI sedang menganalisis data Anda...
      </p>
      <div className="mt-6 space-y-2 w-full max-w-xs">
        {STEPS.map((label, idx) => (
          <div key={label} className="flex items-center gap-3">
            <div
              className={`h-2 w-2 rounded-full ${
                idx <= step
                  ? "bg-primary animate-pulse"
                  : "bg-muted-foreground/30"
              }`}
            />
            <span
              className={`text-sm ${
                idx <= step ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
