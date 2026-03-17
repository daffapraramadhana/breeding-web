"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  label: string;
  sublabel: string;
}

const STEPS: Step[] = [
  { number: 1, label: "Own Farm", sublabel: "Persiapan Own Farm" },
  { number: 2, label: "Kandang", sublabel: "Persiapan Kandang" },
  { number: 3, label: "Chickin", sublabel: "Persiapan Chickin" },
  { number: 4, label: "Anak Kandang", sublabel: "Persiapan Anak Kandang" },
];

interface ProjectWizardStepperProps {
  currentStep: number;
  highestCompletedStep: number;
  onStepClick: (step: number) => void;
}

export function ProjectWizardStepper({
  currentStep,
  highestCompletedStep,
  onStepClick,
}: ProjectWizardStepperProps) {
  const STEP_COLORS = [
    "bg-green-600",
    "bg-amber-600",
    "bg-orange-600",
    "bg-purple-600",
  ];

  return (
    <div className="flex items-stretch gap-0 w-full">
      {STEPS.map((step, index) => {
        const isCompleted = step.number <= highestCompletedStep;
        const isCurrent = step.number === currentStep;
        const isClickable = step.number <= highestCompletedStep + 1;

        return (
          <button
            key={step.number}
            type="button"
            disabled={!isClickable}
            onClick={() => isClickable && onStepClick(step.number)}
            className={cn(
              "flex-1 flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left",
              isCurrent
                ? `${STEP_COLORS[index]} text-white shadow-md`
                : isCompleted
                  ? `${STEP_COLORS[index]}/80 text-white cursor-pointer hover:opacity-90`
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-60",
              index > 0 && "ml-2"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-full text-lg font-bold shrink-0",
                isCurrent || isCompleted
                  ? "bg-white/20 text-white"
                  : "bg-muted-foreground/20"
              )}
            >
              {isCompleted && !isCurrent ? (
                <Check className="h-5 w-5" />
              ) : (
                step.number
              )}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">{step.label}</div>
              <div className="text-xs opacity-80 truncate">{step.sublabel}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
