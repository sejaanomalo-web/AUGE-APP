import { headers } from "next/headers";
import { AlunoLayoutShell } from "@/components/aluno/AlunoLayoutShell";
import { getMyProfessionals } from "@/lib/actions/professional-context";
import { detectVerticalFromPathname } from "@/lib/vertical/route-mirror";

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/hoje";
  const vertical = detectVerticalFromPathname(pathname);
  const { available } = await getMyProfessionals();

  return (
    <div data-vertical={vertical} className="min-h-screen bg-bg-base">
      <AlunoLayoutShell vertical={vertical} available={available}>
        {children}
      </AlunoLayoutShell>
    </div>
  );
}
