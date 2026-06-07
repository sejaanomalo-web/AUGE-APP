import { cookies } from "next/headers";
import { AlunoLayoutShell } from "@/components/aluno/AlunoLayoutShell";
import { getMyProfessionals } from "@/lib/actions/professional-context";
import type { VerticalKey } from "@/lib/vertical/route-mirror";

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // `available` depende do banco e não muda durante a navegação. A vertical
  // ATIVA é derivada client-side no shell (usePathname). O cookie só dá o
  // valor inicial para rotas compartilhadas (/perfil) e evitar flash no
  // primeiro paint após refresh.
  const [{ available }, cookieStore] = await Promise.all([
    getMyProfessionals(),
    cookies(),
  ]);
  const initialVertical: VerticalKey =
    cookieStore.get("auge_vertical")?.value === "nutricao"
      ? "nutricao"
      : "treinos";

  return (
    <AlunoLayoutShell available={available} initialVertical={initialVertical}>
      {children}
    </AlunoLayoutShell>
  );
}
