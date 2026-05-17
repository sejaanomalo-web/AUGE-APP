import { PageHeader } from "@/components/shared/PageHeader";
import { EvolucaoClient } from "@/components/aluno/EvolucaoClient";
import { requireRole } from "@/lib/auth-helpers";
import { getEvolucaoYear } from "@/lib/actions/evolution";

export default async function EvolucaoPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  await requireRole("ALUNO");
  const { year: yearParam } = await searchParams;
  const requestedYear = Number(yearParam);
  const year =
    Number.isFinite(requestedYear) && requestedYear > 2000
      ? requestedYear
      : new Date().getFullYear();

  const data = await getEvolucaoYear(year);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <PageHeader
        title="Evolução"
        subtitle="Sua frequência de treinos, mês a mês."
      />
      <EvolucaoClient
        year={data.year}
        trainedDates={data.trainedDates}
        monthlyCounts={data.monthlyCounts}
        firstYearWithData={data.firstYearWithData}
      />
    </div>
  );
}
