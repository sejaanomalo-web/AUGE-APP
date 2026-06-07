import { AlunoLayoutShell } from "@/components/aluno/AlunoLayoutShell";
import { getMyProfessionals } from "@/lib/actions/professional-context";

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // `available` depende do banco e não muda durante a navegação, então é
  // resolvido aqui (server). A vertical ATIVA é derivada client-side no
  // shell via usePathname — layouts compartilhados não re-renderizam em
  // navegação client, então computá-la aqui congelaria o tema/nav.
  const { available } = await getMyProfessionals();

  return <AlunoLayoutShell available={available}>{children}</AlunoLayoutShell>;
}
