"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { fetchApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectWizardStepper } from "@/components/projects/project-wizard-stepper";
import {
  StepOwnFarm,
  SelectedCoop,
  BonusRow,
} from "@/components/projects/step-own-farm";
import { StepKandang } from "@/components/projects/step-kandang";
import { StepChickin, ChickInData } from "@/components/projects/step-chickin";
import { StepAnakKandang } from "@/components/projects/step-anak-kandang";

export default function NewProjectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [highestCompletedStep, setHighestCompletedStep] = useState(0);

  // --- Step 1 state ---
  const [branchId, setBranchId] = useState("");
  const [farmId, setFarmId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [contractCategoryId, setContractCategoryId] = useState("");
  const [supervisorIncentive, setSupervisorIncentive] = useState("10");
  const [isActive, setIsActive] = useState(true);
  const [fcrStandardId, setFcrStandardId] = useState("");
  const [productionDayEstimateId, setProductionDayEstimateId] = useState("");
  const [cullingType, setCullingType] = useState<"culling" | "culling-mortality">(
    "culling"
  );
  const [coopTypePercentage, setCoopTypePercentage] = useState("");
  const [cumulativeMultiplier, setCumulativeMultiplier] = useState("");
  const [coopMultiplier, setCoopMultiplier] = useState("");
  const [selectedCoops, setSelectedCoops] = useState<SelectedCoop[]>([]);
  const [bonusRows, setBonusRows] = useState<BonusRow[]>([]);

  // --- Step 2 state ---
  const [coopDescriptions, setCoopDescriptions] = useState<
    Record<string, string>
  >({});

  // --- Step 3 state ---
  const [chickIns, setChickIns] = useState<Record<string, ChickInData>>({});

  // --- Step 4 state ---
  const [workerAssignments, setWorkerAssignments] = useState<
    Record<string, string[]>
  >({});

  // --- Helpers ---
  const checkedCoops = selectedCoops.filter((c) => c.checked);

  function validateStep(step: number): boolean {
    switch (step) {
      case 1:
        if (!branchId) {
          toast.error("Area (Branch) wajib dipilih");
          return false;
        }
        if (!farmId) {
          toast.error("Farm wajib dipilih");
          return false;
        }
        if (!startDate) {
          toast.error("Tanggal mulai wajib diisi");
          return false;
        }
        if (checkedCoops.length === 0) {
          toast.error("Pilih minimal 1 kandang");
          return false;
        }
        return true;
      case 2:
        // Step 2 is always valid (description is optional)
        return true;
      case 3:
        for (const coop of checkedCoops) {
          const data = chickIns[coop.coopId];
          if (!data || !data.rearingStartDate) {
            toast.error(`DOC IN wajib diisi untuk ${coop.coopCode}`);
            return false;
          }
          if (!data.population || data.population <= 0) {
            toast.error(`Populasi wajib diisi untuk ${coop.coopCode}`);
            return false;
          }
        }
        return true;
      case 4:
        for (const coop of checkedCoops) {
          const workers = workerAssignments[coop.coopId] || [];
          if (workers.length === 0) {
            toast.error(
              `Pilih minimal 1 anak kandang untuk ${coop.coopCode}`
            );
            return false;
          }
        }
        return true;
      default:
        return true;
    }
  }

  function handleNext() {
    if (!validateStep(currentStep)) return;
    const newHighest = Math.max(highestCompletedStep, currentStep);
    setHighestCompletedStep(newHighest);

    // Initialize chickIns with coop capacity defaults when entering Step 3
    if (currentStep === 2) {
      const updated = { ...chickIns };
      for (const coop of checkedCoops) {
        if (!updated[coop.coopId]) {
          updated[coop.coopId] = {
            population: coop.capacity,
            rearingStartDate: "",
            rearingEndDate: "",
            harvestStartDate: "",
            harvestEndDate: "",
            cleaningStartDate: "",
            cleaningEndDate: "",
            prepStartDate: "",
            prepEndDate: "",
          };
        }
      }
      setChickIns(updated);
    }

    setCurrentStep(currentStep + 1);
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  function handleStepClick(step: number) {
    if (step <= highestCompletedStep + 1) {
      if (step > highestCompletedStep && step > currentStep) {
        if (!validateStep(currentStep)) return;
        setHighestCompletedStep(Math.max(highestCompletedStep, currentStep));
      }
      setCurrentStep(step);
    }
  }

  const handleSubmit = useCallback(async () => {
    // Validate all steps
    for (let i = 1; i <= 4; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // 1. Create project
      const projectBody: Record<string, unknown> = {
        branchId,
        farmId,
        startDate,
        checkCulling:
          cullingType === "culling" || cullingType === "culling-mortality",
        checkMortality: cullingType === "culling-mortality",
        isActive,
      };
      if (contractCategoryId)
        projectBody.contractCategoryId = contractCategoryId;
      if (fcrStandardId) projectBody.fcrStandardId = fcrStandardId;
      if (productionDayEstimateId)
        projectBody.productionDayEstimateId = productionDayEstimateId;
      if (supervisorIncentive)
        projectBody.supervisorIncentive = parseFloat(supervisorIncentive);
      if (coopTypePercentage)
        projectBody.coopTypePercentage = parseFloat(coopTypePercentage);
      if (cumulativeMultiplier)
        projectBody.cumulativeMultiplier = parseFloat(cumulativeMultiplier);
      if (coopMultiplier)
        projectBody.coopMultiplier = parseFloat(coopMultiplier);

      const project = await fetchApi<{ id: string }>("/projects", {
        method: "POST",
        body: JSON.stringify(projectBody),
      });
      const projectId = project.id;

      // 2. Create coops (sequential — need IDs for next steps)
      const coopIdMap: Record<string, string> = {};
      for (const coop of checkedCoops) {
        const result = await fetchApi<{ id: string }>(
          `/projects/${projectId}/coops`,
          {
            method: "POST",
            body: JSON.stringify({
              coopId: coop.coopId,
              pplId: coop.pplId || undefined,
              coopName: coop.coopName,
              description: coopDescriptions[coop.coopId] || undefined,
            }),
          }
        );
        coopIdMap[coop.coopId] = result.id;
      }

      // 3. Parallel: chick-ins + workers + bonuses
      const parallelPromises: Promise<unknown>[] = [];

      // 3a. Chick-ins
      for (const coop of checkedCoops) {
        const projectCoopId = coopIdMap[coop.coopId];
        const data = chickIns[coop.coopId];
        if (data && projectCoopId) {
          parallelPromises.push(
            fetchApi(`/project-coops/${projectCoopId}/chick-ins`, {
              method: "POST",
              body: JSON.stringify({
                population: data.population,
                rearingStartDate: data.rearingStartDate,
                rearingEndDate: data.rearingEndDate,
                harvestStartDate: data.harvestStartDate,
                harvestEndDate: data.harvestEndDate,
                cleaningStartDate: data.cleaningStartDate,
                cleaningEndDate: data.cleaningEndDate,
                prepStartDate: data.prepStartDate,
                prepEndDate: data.prepEndDate,
              }),
            })
          );
        }
      }

      // 3b. Workers
      for (const coop of checkedCoops) {
        const projectCoopId = coopIdMap[coop.coopId];
        const workers = workerAssignments[coop.coopId] || [];
        for (const employeeId of workers) {
          parallelPromises.push(
            fetchApi(`/project-coops/${projectCoopId}/workers`, {
              method: "POST",
              body: JSON.stringify({ employeeId }),
            })
          );
        }
      }

      // 3c. Bonuses
      for (const row of bonusRows) {
        if (!row.bonusId) continue;
        const endpoint =
          row.type === "fcr-deff"
            ? `/projects/${projectId}/bonuses/fcr-deff`
            : row.type === "ip"
              ? `/projects/${projectId}/bonuses/ip`
              : `/projects/${projectId}/bonuses/mortality`;

        const bonusIdField =
          row.type === "fcr-deff"
            ? "bonusFcrDeffId"
            : row.type === "ip"
              ? "bonusIpId"
              : "bonusMortalityId";

        parallelPromises.push(
          fetchApi(endpoint, {
            method: "POST",
            body: JSON.stringify({
              [bonusIdField]: row.bonusId,
              unitOption: row.unitOption,
              details: [],
            }),
          })
        );
      }

      await Promise.all(parallelPromises);

      toast.success("Project berhasil dibuat");
      router.push(`/projects/${projectId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal membuat project"
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    branchId,
    farmId,
    startDate,
    contractCategoryId,
    supervisorIncentive,
    isActive,
    fcrStandardId,
    productionDayEstimateId,
    cullingType,
    coopTypePercentage,
    cumulativeMultiplier,
    coopMultiplier,
    checkedCoops,
    coopDescriptions,
    chickIns,
    workerAssignments,
    bonusRows,
    router,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat Project Baru"
        actions={
          <Button variant="outline" asChild>
            <Link href="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
        }
      />

      <ProjectWizardStepper
        currentStep={currentStep}
        highestCompletedStep={highestCompletedStep}
        onStepClick={handleStepClick}
      />

      <div>
        {currentStep === 1 && (
          <StepOwnFarm
            branchId={branchId}
            setBranchId={setBranchId}
            farmId={farmId}
            setFarmId={setFarmId}
            startDate={startDate}
            setStartDate={setStartDate}
            contractCategoryId={contractCategoryId}
            setContractCategoryId={setContractCategoryId}
            supervisorIncentive={supervisorIncentive}
            setSupervisorIncentive={setSupervisorIncentive}
            isActive={isActive}
            setIsActive={setIsActive}
            fcrStandardId={fcrStandardId}
            setFcrStandardId={setFcrStandardId}
            productionDayEstimateId={productionDayEstimateId}
            setProductionDayEstimateId={setProductionDayEstimateId}
            cullingType={cullingType}
            setCullingType={setCullingType}
            coopTypePercentage={coopTypePercentage}
            setCoopTypePercentage={setCoopTypePercentage}
            cumulativeMultiplier={cumulativeMultiplier}
            setCumulativeMultiplier={setCumulativeMultiplier}
            coopMultiplier={coopMultiplier}
            setCoopMultiplier={setCoopMultiplier}
            selectedCoops={selectedCoops}
            setSelectedCoops={setSelectedCoops}
            bonusRows={bonusRows}
            setBonusRows={setBonusRows}
          />
        )}
        {currentStep === 2 && (
          <StepKandang
            selectedCoops={selectedCoops}
            coopDescriptions={coopDescriptions}
            setCoopDescriptions={setCoopDescriptions}
          />
        )}
        {currentStep === 3 && (
          <StepChickin
            selectedCoops={selectedCoops}
            chickIns={chickIns}
            setChickIns={setChickIns}
          />
        )}
        {currentStep === 4 && (
          <StepAnakKandang
            branchId={branchId}
            selectedCoops={selectedCoops}
            workerAssignments={workerAssignments}
            setWorkerAssignments={setWorkerAssignments}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        {currentStep === 1 ? (
          <Button variant="outline" asChild>
            <Link href="/projects">Kembali</Link>
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={handleBack}>
            Kembali
          </Button>
        )}

        {currentStep < 4 ? (
          <Button type="button" onClick={handleNext}>
            Lanjut
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>
        )}
      </div>
    </div>
  );
}
