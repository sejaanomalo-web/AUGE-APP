import Link from "next/link";
import { Dumbbell, LineChart, Target } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { LinkButton } from "@/components/ui/LinkButton";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-base">
      <header className="flex items-center justify-between px-6 lg:px-10 h-16 lg:h-20">
        <Link href="/" aria-label="Página inicial">
          <Logo size="sm" />
        </Link>
        <nav className="flex items-center gap-2">
          <LinkButton href="/login" variant="tertiary">
            Entrar
          </LinkButton>
          <LinkButton href="/cadastro" variant="primary" size="md">
            Criar conta
          </LinkButton>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
        <h1 className="text-[40px] sm:text-[48px] leading-[1.05] font-bold text-text-primary tracking-[-0.03em] max-w-[640px]">
          Atinja seu <span className="text-accent">auge</span>.
        </h1>
        <p className="mt-5 max-w-[560px] text-body-lg text-text-secondary">
          App de treino para personal trainers e alunos sérios sobre evolução.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <LinkButton href="/cadastro" variant="primary" size="cta">
            Começar agora
          </LinkButton>
          <LinkButton href="/login" variant="tertiary" size="md">
            Já tenho conta
          </LinkButton>
        </div>

        <ul className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl w-full">
          {[
            {
              icon: Dumbbell,
              title: "Treinos prescritos",
              desc: "Receba o treino do seu personal e siga sem esforço.",
            },
            {
              icon: LineChart,
              title: "Evolução em tempo real",
              desc: "Acompanhe peso, volume e PRs em cada série.",
            },
            {
              icon: Target,
              title: "Análise inteligente",
              desc: "Insights semanais sobre seu progresso.",
            },
          ].map((f) => (
            <li
              key={f.title}
              className="bg-bg-surface rounded-lg p-5 text-left flex flex-col gap-2"
            >
              <f.icon className="text-accent" size={28} aria-hidden />
              <p className="text-h3 text-text-primary">{f.title}</p>
              <p className="text-body text-text-secondary">{f.desc}</p>
            </li>
          ))}
        </ul>
      </main>

      <footer className="px-6 lg:px-10 py-6 text-caption text-text-muted text-center">
        © 2026 ꓥuge · Anômalo
      </footer>
    </div>
  );
}
