import { PageHeader } from "@/components/shared/PageHeader";
import { NutriFoodsClient } from "@/components/nutri/NutriFoodsClient";
import { requireNutricionista } from "@/lib/auth-helpers";
import { listFoods } from "@/lib/actions/nutri-foods";

export default async function NutriAlimentosPage() {
  await requireNutricionista();
  const foods = await listFoods();

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Alimentos"
        subtitle={`${foods.length} alimentos no catálogo`}
      />
      <NutriFoodsClient initialFoods={foods} />
    </div>
  );
}
