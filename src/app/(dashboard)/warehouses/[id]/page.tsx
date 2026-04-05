"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageHeader } from "@/components/shared/page-header";
import { EntityCombobox } from "@/components/forms/entity-combobox";
import { useApi } from "@/hooks/use-api";
import { fetchApi } from "@/lib/api";
import { Warehouse, WarehouseOwnerType } from "@/types/api";

export default function EditWarehousePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const t = useTranslations("warehouses");
  const tc = useTranslations("common");

  const { data: warehouse, isLoading } = useApi<Warehouse>(`/warehouses/${id}`);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    address: "",
    ownerType: "" as WarehouseOwnerType | "",
    ownerId: "",
    branchId: "",
  });

  useEffect(() => {
    if (warehouse) {
      setForm({
        code: warehouse.code,
        name: warehouse.name,
        address: warehouse.address || "",
        ownerType: warehouse.ownerType,
        ownerId: warehouse.ownerId,
        branchId: warehouse.branchId || "",
      });
    }
  }, [warehouse]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.code.trim() || !form.name.trim()) {
      toast.error(t("codeAndNameRequired"));
      return;
    }

    if (!form.ownerType) {
      toast.error(t("ownerTypeRequired"));
      return;
    }

    if (!form.ownerId) {
      toast.error(t("ownerRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const body: Record<string, string | undefined> = {
        code: form.code,
        name: form.name,
        address: form.address.trim() || undefined,
        ownerType: form.ownerType,
        ownerId: form.ownerId,
        ...(form.ownerType === "BRANCH" && { branchId: form.ownerId }),
      };

      await fetchApi(`/warehouses/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      toast.success(tc("entityUpdated", { entity: t("entity") }));
      router.push("/warehouses");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("failedToSave")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOwnerTypeChange(value: string) {
    setForm((prev) => ({
      ...prev,
      ownerType: value as WarehouseOwnerType,
      ownerId: "",
      branchId: "",
    }));
  }

  function handleOwnerChange(id: string) {
    setForm((prev) => ({ ...prev, ownerId: id }));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("editWarehouse")}
        actions={
          <Button variant="outline" asChild>
            <Link href="/warehouses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tc("cancel")}
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">
                  {tc("code")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder={t("codePlaceholder")}
                  value={form.code}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, code: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  {tc("name")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder={t("warehouseName")}
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{tc("address")}</Label>
              <Input
                id="address"
                placeholder={t("addressPlaceholder")}
                value={form.address}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </div>

            <div className="space-y-3">
              <Label>
                {t("ownerType")} <span className="text-destructive">*</span>
              </Label>
              <RadioGroup
                value={form.ownerType}
                onValueChange={handleOwnerTypeChange}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="BRANCH" id="owner-branch" />
                  <Label htmlFor="owner-branch" className="cursor-pointer font-normal">
                    {t("branch")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="FARM" id="owner-farm" />
                  <Label htmlFor="owner-farm" className="cursor-pointer font-normal">
                    {t("farm")}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {form.ownerType && (
              <div className="space-y-2">
                <Label>
                  {form.ownerType === "BRANCH" ? t("branch") : t("farm")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <EntityCombobox
                  endpoint={form.ownerType === "BRANCH" ? "/branches" : "/farms"}
                  value={form.ownerId}
                  onChange={handleOwnerChange}
                  placeholder={
                    form.ownerType === "BRANCH"
                      ? t("selectBranch")
                      : t("selectFarm")
                  }
                  searchPlaceholder={tc("searchField", {
                    field: form.ownerType === "BRANCH" ? t("branch") : t("farm"),
                  })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? tc("saving") : tc("update")}
          </Button>
        </div>
      </form>
    </div>
  );
}
