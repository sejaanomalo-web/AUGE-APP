import Link from "next/link";
import { Apple } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/Button";

export default function NutriDashboardPlaceholderPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12 text-center">
      <Logo size="md" />
      <div className="mt-10 inline-flex h-16 w-16 items-center justify-center rounded-full bg-bg-elevated">
        <Apple size={32} className="text-text-secondary" aria-hidden />
      </div>
      <h1 className="mt-6 text-h1 text-text-primary">
        Bem-vinda(o) à plataforma
      </h1>
      <p className="mt-3 max-w-md text-body-lg text-text-secondary">
        Seu painel completo de nutricionista está em construção e estará
        disponível em breve. Você já está cadastrada(o) — assim que ficar
        pronto, é só voltar aqui.
      </p>
      <Link href="/" className="mt-10">
        <Button variant="secondary" size="md">
          Voltar para o início
        </Button>
      </Link>
    </div>
  );
}
