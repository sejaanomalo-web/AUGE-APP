import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarCheck,
  Check,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  LineChart,
  ListChecks,
  Minus,
  Play,
  ShieldCheck,
  Smartphone,
  Target,
  Timer,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { LinkButton } from "@/components/ui/LinkButton";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "ꓥuge | Atinja seu auge",
  description:
    "Treinos prescritos, execução guiada e acompanhamento de evolução em um só app para personal trainers e alunos.",
};

const landingTheme = {
  "--bg-base": "18 18 18",
  "--bg-surface": "24 24 24",
  "--bg-elevated": "31 31 31",
  "--bg-card": "37 37 37",
  "--bg-hover": "42 42 42",
  "--accent": "201 149 58",
  "--accent-hover": "184 132 46",
  "--accent-muted": "138 104 36",
  "--accent-glow": "rgba(201, 149, 58, 0.15)",
  "--coach": "201 149 58",
  "--coach-glow": "rgba(201, 149, 58, 0.12)",
  "--intensity": "255 164 43",
  "--intensity-glow": "rgba(255, 164, 43, 0.12)",
  "--text-primary": "255 255 255",
  "--text-secondary": "179 179 179",
  "--text-muted": "124 124 124",
  "--text-on-accent": "18 18 18",
  "--border-default": "rgba(77, 77, 77, 0.85)",
  "--border-subtle": "rgba(255, 255, 255, 0.08)",
  "--border-strong": "rgba(201, 149, 58, 0.34)",
  "--grid-line": "rgba(255, 255, 255, 0)",
  background: "#121212",
} as CSSProperties;

const navItems = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#personal", label: "Para personal" },
  { href: "#aluno", label: "Para aluno" },
  { href: "#planos", label: "Planos" },
];

const painPoints = [
  "Personal não sabe quem treinou.",
  "Aluno não sabe o que fazer hoje.",
  "Evolução fica espalhada.",
  "Ajustes chegam tarde.",
];

const steps = [
  {
    title: "O personal cria o plano",
    text: "Organiza treinos, sessões, exercícios e rotina semanal.",
    icon: ClipboardList,
  },
  {
    title: "O aluno executa pelo app",
    text: "Vê o treino do dia, registra séries, cargas e progresso.",
    icon: Dumbbell,
  },
  {
    title: "O acompanhamento vira dado",
    text: "Aderência, histórico, evolução e alertas ajudam o personal a agir rápido.",
    icon: LineChart,
  },
];

const personalFeatures = [
  { title: "Dashboard de alunos ativos", icon: Users },
  { title: "Alunos que treinaram hoje", icon: CalendarCheck },
  { title: "Alerta de baixa aderência", icon: Activity },
  { title: "Criação de treinos e sessões", icon: ClipboardList },
  { title: "Biblioteca de exercícios", icon: Dumbbell },
  { title: "Convite por código", icon: UserPlus },
  { title: "Histórico e evolução por aluno", icon: TrendingUp },
];

const alunoFeatures = [
  { title: "Treino do dia", icon: Target },
  { title: "Execução guiada", icon: Play },
  { title: "Registro de carga e reps", icon: ListChecks },
  { title: "Timer de descanso", icon: Timer },
  { title: "Histórico", icon: CalendarCheck },
  { title: "Medidas e evolução", icon: LineChart },
  { title: "Objetivos", icon: CheckCircle2 },
  { title: "Notificações", icon: Bell },
  { title: "Uso com ou sem personal", icon: UserPlus },
];

const comparisons = [
  {
    name: "Planilha",
    issue: "Prescreve, mas não acompanha bem.",
    result: "manual",
  },
  {
    name: "WhatsApp",
    issue: "Comunica, mas bagunça histórico.",
    result: "solto",
  },
  {
    name: "App genérico",
    issue: "Não conecta personal e aluno.",
    result: "isolado",
  },
  {
    name: "ꓥuge",
    issue: "Prescrição + execução + aderência + evolução.",
    result: "conectado",
    featured: true,
  },
];

const plans = [
  {
    name: "Essencial",
    price: "R$ --/mês",
    intro: "Para personal começando a organizar alunos.",
    cta: "Começar no Essencial",
    href: "/cadastro",
    features: [
      "Até 10 alunos ativos",
      "Criação de treinos e sessões",
      "Biblioteca de exercícios",
      "App do aluno com treino do dia",
      "Registro de treinos",
      "Histórico básico",
      "Convite por código",
    ],
  },
  {
    name: "Pro",
    price: "R$ --/mês",
    intro: "Para personal que já acompanha uma carteira ativa.",
    cta: "Escolher o Pro",
    href: "/cadastro",
    badge: "Mais escolhido",
    featured: true,
    features: [
      "Até 40 alunos ativos",
      "Tudo do Essencial",
      "Dashboard de aderência",
      "Alunos que treinaram hoje",
      "Alertas de baixa frequência",
      "Evolução com medidas e gráficos",
      "Objetivos do aluno",
      "Notificações",
      "PWA para uso mobile",
    ],
  },
  {
    name: "Elite",
    price: "Sob consulta",
    intro: "Para personal premium, consultoria online ou equipe.",
    cta: "Falar sobre Elite",
    href: "/cadastro",
    features: [
      "Alunos ativos ampliados ou ilimitados",
      "Tudo do Pro",
      "Acompanhamento avançado por aluno",
      "Métricas de plano",
      "Rotinas de notificação morning/evening",
      "Priorização de alunos que precisam de ajuste",
      "Experiência premium para alunos",
      "Preparado para operação online/híbrida",
    ],
  },
];

const outcomes = [
  "Mais clareza para o aluno.",
  "Mais controle para o personal.",
  "Mais constância no treino.",
  "Menos tempo cobrando atualização.",
];

const faqs = [
  {
    question: "O aluno precisa pagar?",
    answer:
      "O modelo pode ser contratado pelo personal, com acesso do aluno incluído conforme o plano.",
  },
  {
    question: "Funciona para treino online?",
    answer: "Sim. Serve para acompanhamento presencial, online e híbrido.",
  },
  {
    question: "O aluno consegue treinar sem personal?",
    answer:
      "Sim. O app já prevê uso do aluno e vínculo posterior com personal.",
  },
  {
    question: "Tem notificações?",
    answer: "Sim. Há estrutura de push notifications e preferências de aviso.",
  },
  {
    question: "Substitui planilhas?",
    answer:
      "Sim, para prescrição, execução, histórico e acompanhamento de rotina.",
  },
];

export default function LandingPage() {
  return (
    <div
      className="min-h-screen overflow-x-hidden bg-[#121212] text-text-primary"
      style={landingTheme}
    >
      <Header />

      <main>
        <HeroSection />
        <PainSection />
        <HowItWorksSection />
        <AudienceSection
          id="personal"
          eyebrow="Para personal"
          title="Menos operação. Mais acompanhamento."
          text="Prescreva, veja quem executou e aja antes da rotina do aluno esfriar."
          features={personalFeatures}
          variant="desktop"
        />
        <AudienceSection
          id="aluno"
          eyebrow="Para aluno"
          title="O aluno abre o app e sabe o que fazer."
          text="Treino claro, registro simples e evolução visível no mesmo lugar."
          features={alunoFeatures}
          variant="mobile"
        />
        <DifferenceSection />
        <PlansSection />
        <OutcomesSection />
        <FaqSection />
        <FinalCta />
      </main>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-[#121212]/95">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Página inicial do ꓥuge">
          <Logo size="md" />
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-7 lg:flex"
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[14px] font-semibold text-text-secondary transition-colors hover:text-text-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-[8px] px-3 py-2 text-[14px] font-semibold text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary sm:inline-flex"
          >
            Entrar
          </Link>
          <LinkButton
            href="/cadastro"
            variant="primary"
            size="sm"
            className="rounded-pill normal-case tracking-normal shadow-[0_14px_36px_-14px_rgba(201,149,58,0.65)] hover:shadow-[0_18px_42px_-16px_rgba(201,149,58,0.72)]"
          >
            Começar
          </LinkButton>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1180px] items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
      <div className="max-w-2xl">
        <div className="mb-5 inline-flex rounded-[4px] border border-accent/25 bg-accent/10 px-3 py-1.5 text-[11px] font-bold text-accent">
          Atinja seu auge
        </div>
        <h1 className="text-[42px] font-extrabold leading-[1.02] text-text-primary sm:text-[58px] lg:text-[68px]">
          O app que conecta personal, aluno e rotina de treino.
        </h1>
        <p className="mt-6 max-w-xl text-[17px] leading-7 text-text-secondary sm:text-[19px]">
          Prescreva treinos, acompanhe aderência e entregue uma experiência
          clara para o aluno saber exatamente o que fazer hoje.
        </p>
        <p className="mt-4 max-w-xl text-[15px] font-bold leading-6 text-text-primary">
          Treinos prescritos, execução guiada e acompanhamento de evolução em um
          só app.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <LinkButton
            href="/cadastro"
            variant="primary"
            size="cta"
            className="normal-case tracking-normal shadow-[0_16px_38px_-14px_rgba(201,149,58,0.72)] hover:shadow-[0_20px_48px_-18px_rgba(201,149,58,0.8)]"
          >
            Começar agora <ArrowRight size={18} aria-hidden />
          </LinkButton>
          <a
            href="#como-funciona"
            className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-[8px] border border-border-default bg-bg-elevated px-6 py-4 text-[15px] font-bold text-text-primary transition-colors hover:border-accent/60 hover:bg-bg-hover"
          >
            Ver como funciona <Play size={17} aria-hidden />
          </a>
        </div>
        <p className="mt-4 text-[13px] font-medium text-text-muted">
          Feito para treino presencial, online ou híbrido.
        </p>
      </div>

      <ProductMockup />
    </section>
  );
}

function ProductMockup() {
  return (
    <div
      className="relative mx-auto min-h-[560px] w-full max-w-[650px] lg:min-h-[620px]"
      aria-label="Mockups do painel do personal e tela do aluno"
    >
      <div className="absolute left-0 top-8 w-[92%] rounded-[18px] border border-border-subtle bg-bg-surface p-3 shadow-[0_28px_80px_-34px_rgba(0,0,0,0.9)] sm:p-4 lg:top-12">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#4d4d4d]" />
            <span className="h-3 w-3 rounded-full bg-[#4d4d4d]" />
            <span className="h-3 w-3 rounded-full bg-accent" />
          </div>
          <span className="text-[11px] font-bold text-text-muted">
            Painel do Personal
          </span>
        </div>

        <div className="grid gap-3 pt-4 sm:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[12px] bg-bg-elevated p-4">
            <p className="text-[11px] font-bold text-text-muted">
              Hoje, 24 maio
            </p>
            <h2 className="mt-2 text-[25px] font-extrabold leading-tight text-text-primary">
              Controle real da carteira.
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <MetricCard label="Alunos ativos" value="38" />
              <MetricCard label="Treinaram hoje" value="16" active />
              <MetricCard label="Baixa aderência" value="04" />
              <MetricCard label="Sem atividade" value="07" />
            </div>
          </div>

          <div className="rounded-[12px] bg-[#121212] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-text-primary">
                Status dos alunos
              </h3>
              <span className="rounded-[4px] bg-accent/10 px-2 py-1 text-[10px] font-bold text-accent">
                30 logs
              </span>
            </div>
            <div className="space-y-3">
              <StudentRow
                initials="MA"
                name="Marina Alves"
                action="finalizou Pernas A"
                time="há 12 min"
                tone="success"
              />
              <StudentRow
                initials="RO"
                name="Rodolfo N."
                action="iniciou Upper Push"
                time="agora"
                tone="accent"
              />
              <StudentRow
                initials="BF"
                name="Bruno F."
                action="3 sessões abaixo"
                time="revisar hoje"
                tone="warning"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <MiniPanel title="Treinos ativos" value="24" />
          <MiniPanel title="Planos ajustados" value="8" />
          <MiniPanel title="Convites" value="A7K9P2" />
        </div>
      </div>

      <div className="absolute bottom-0 right-0 w-[260px] rounded-[32px] border border-border-default bg-[#0f0f0f] p-3 shadow-[0_32px_90px_-34px_rgba(0,0,0,0.95)] sm:w-[285px] lg:right-8">
        <div className="rounded-[24px] bg-[#121212] p-4">
          <div className="mb-5 flex items-center justify-between">
            <Logo size="sm" />
            <span className="rounded-[4px] bg-accent/10 px-2 py-1 text-[10px] font-bold text-accent">
              Hoje
            </span>
          </div>
          <p className="text-[11px] font-bold text-text-muted">
            Missão de hoje
          </p>
          <h3 className="mt-2 text-[25px] font-extrabold leading-tight text-text-primary">
            Pernas A
          </h3>
          <p className="mt-2 text-[13px] text-text-secondary">
            6 exercícios · ~52 min · Plano Hipertrofia
          </p>

          <div className="mt-5">
            <div className="mb-2 flex justify-between text-[11px] font-bold text-text-muted">
              <span>Progresso semanal</span>
              <span className="text-text-primary">67%</span>
            </div>
            <div className="h-2 rounded-pill bg-bg-card">
              <div className="h-full w-2/3 rounded-pill bg-accent" />
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <ExerciseLine name="Agachamento livre" detail="4 x 8 · 90s" />
            <ExerciseLine name="Leg press" detail="4 x 10 · 75s" />
            <ExerciseLine name="Cadeira extensora" detail="3 x 12 · 60s" />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-[12px] bg-bg-elevated p-3">
              <p className="text-[10px] font-bold text-text-muted">Carga</p>
              <p className="mt-1 text-[22px] font-extrabold text-text-primary">
                80kg
              </p>
            </div>
            <div className="rounded-[12px] bg-bg-elevated p-3">
              <p className="text-[10px] font-bold text-text-muted">Descanso</p>
              <p className="mt-1 text-[22px] font-extrabold text-text-primary">
                01:30
              </p>
            </div>
          </div>

          <div className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-pill bg-accent px-4 text-[14px] font-extrabold text-text-on-accent">
            Iniciar treino
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  active = false,
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[10px] border p-3",
        active
          ? "border-accent/35 bg-accent/10"
          : "border-border-subtle bg-bg-surface",
      )}
    >
      <p className="text-[10px] font-bold text-text-muted">{label}</p>
      <p className="mt-1 text-[26px] font-extrabold leading-none text-text-primary">
        {value}
      </p>
    </div>
  );
}

function StudentRow({
  initials,
  name,
  action,
  time,
  tone,
}: {
  initials: string;
  name: string;
  action: string;
  time: string;
  tone: "success" | "accent" | "warning";
}) {
  const dotClass = {
    success: "bg-success",
    accent: "bg-accent",
    warning: "bg-warning",
  }[tone];

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-card text-[11px] font-extrabold text-text-primary">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-text-primary">
          {name}
        </p>
        <p className="truncate text-[12px] text-text-secondary">{action}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className={cn("h-2 w-2 rounded-full", dotClass)} />
        <span className="hidden text-[10px] font-semibold text-text-muted sm:inline">
          {time}
        </span>
      </div>
    </div>
  );
}

function MiniPanel({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-bg-elevated p-3">
      <p className="truncate text-[10px] font-bold text-text-muted">{title}</p>
      <p className="mt-1 truncate text-[16px] font-extrabold text-text-primary">
        {value}
      </p>
    </div>
  );
}

function ExerciseLine({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-[10px] bg-bg-elevated px-3 py-2.5">
      <span className="truncate text-[12px] font-bold text-text-primary">
        {name}
      </span>
      <span className="shrink-0 text-[11px] text-text-muted">{detail}</span>
    </div>
  );
}

function PainSection() {
  return (
    <section className="border-y border-border-subtle bg-[#141414]">
      <div className="mx-auto max-w-[1180px] px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <SectionEyebrow>O problema</SectionEyebrow>
            <h2 className="mt-4 max-w-2xl text-[34px] font-extrabold leading-tight text-text-primary sm:text-[46px]">
              Chega de treino perdido em planilha, print e conversa solta.
            </h2>
          </div>
          <p className="text-[17px] leading-7 text-text-secondary">
            O ꓥuge coloca tudo no mesmo fluxo: prescrição, execução e
            acompanhamento.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {painPoints.map((point) => (
            <div
              key={point}
              className="rounded-[12px] border border-border-subtle bg-bg-surface p-5"
            >
              <X size={18} className="text-error" aria-hidden />
              <p className="mt-4 text-[16px] font-bold leading-6 text-text-primary">
                {point}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="como-funciona" className="scroll-mt-20">
      <div className="mx-auto max-w-[1180px] px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Como funciona"
          title="Do plano prescrito ao dado de evolução."
          text="Três movimentos simples para transformar acompanhamento em rotina."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {steps.map((step, index) => (
            <FeatureCard
              key={step.title}
              icon={step.icon}
              title={`${index + 1}. ${step.title}`}
              text={step.text}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function AudienceSection({
  id,
  eyebrow,
  title,
  text,
  features,
  variant,
}: {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  features: Array<{ title: string; icon: LucideIcon }>;
  variant: "desktop" | "mobile";
}) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-border-subtle">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:px-8">
        <div>
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
          <h2 className="mt-4 text-[34px] font-extrabold leading-tight text-text-primary sm:text-[46px]">
            {title}
          </h2>
          <p className="mt-5 text-[17px] leading-7 text-text-secondary">
            {text}
          </p>
          <div className="mt-8 hidden lg:block">
            {variant === "desktop" ? <DesktopSignal /> : <MobileSignal />}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DesktopSignal() {
  return (
    <div className="rounded-[12px] border border-border-subtle bg-bg-surface p-5">
      <div className="mb-4 flex items-center gap-3">
        <ShieldCheck size={20} className="text-accent" aria-hidden />
        <span className="text-[14px] font-bold text-text-primary">
          Operação sob controle
        </span>
      </div>
      <div className="space-y-3">
        <ProgressRow label="Aderência média" value="82%" width="82%" />
        <ProgressRow label="Planos ativos" value="24" width="68%" />
        <ProgressRow label="Ajustes pendentes" value="4" width="28%" />
      </div>
    </div>
  );
}

function MobileSignal() {
  return (
    <div className="rounded-[12px] border border-border-subtle bg-bg-surface p-5">
      <div className="mb-4 flex items-center gap-3">
        <Smartphone size={20} className="text-accent" aria-hidden />
        <span className="text-[14px] font-bold text-text-primary">
          Rotina no bolso
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <SmallStat value="Hoje" label="treino" />
        <SmallStat value="01:30" label="timer" />
        <SmallStat value="12x" label="reps" />
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  width,
}: {
  label: string;
  value: string;
  width: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between gap-3 text-[12px] font-bold">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-primary">{value}</span>
      </div>
      <div className="h-2 rounded-pill bg-bg-card">
        <div className="h-full rounded-pill bg-accent" style={{ width }} />
      </div>
    </div>
  );
}

function SmallStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[10px] bg-bg-elevated p-3">
      <p className="text-[16px] font-extrabold text-text-primary">{value}</p>
      <p className="mt-1 text-[10px] font-bold text-text-muted">{label}</p>
    </div>
  );
}

function DifferenceSection() {
  return (
    <section className="border-y border-border-subtle bg-[#141414]">
      <div className="mx-auto max-w-[1180px] px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Diferencial"
          title="Não é só montar treino. É manter rotina."
          text="A diferença aparece quando o plano encontra a execução real do aluno."
        />

        <div className="mt-10 grid gap-3 lg:grid-cols-4">
          {comparisons.map((item) => (
            <div
              key={item.name}
              className={cn(
                "rounded-[12px] border p-5",
                item.featured
                  ? "border-accent/40 bg-accent/10"
                  : "border-border-subtle bg-bg-surface",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[18px] font-extrabold text-text-primary">
                  {item.name}
                </h3>
                {item.featured ? (
                  <Check size={20} className="text-accent" aria-hidden />
                ) : (
                  <Minus size={20} className="text-text-muted" aria-hidden />
                )}
              </div>
              <p className="mt-4 text-[14px] leading-6 text-text-secondary">
                {item.issue}
              </p>
              <p
                className={cn(
                  "mt-5 text-[11px] font-bold",
                  item.featured ? "text-accent" : "text-text-muted",
                )}
              >
                {item.result}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlansSection() {
  return (
    <section id="planos" className="scroll-mt-20">
      <div className="mx-auto max-w-[1180px] px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Planos"
          title="Modelo focado no personal. Experiência do aluno incluída."
          text="Escolha o nível de operação. Os preços finais podem ser definidos depois."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.name} {...plan} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  name,
  price,
  intro,
  cta,
  href,
  features,
  badge,
  featured = false,
}: {
  name: string;
  price: string;
  intro: string;
  cta: string;
  href: string;
  features: string[];
  badge?: string;
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex rounded-[12px] border bg-bg-surface p-6",
        featured ? "border-accent/45 shadow-[0_0_44px_-26px_rgba(201,149,58,0.8)]" : "border-border-subtle",
      )}
    >
      <div className="flex min-h-full w-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[22px] font-extrabold text-text-primary">
              {name}
            </h3>
            <p className="mt-2 text-[14px] leading-6 text-text-secondary">
              {intro}
            </p>
          </div>
          {badge && (
            <span className="shrink-0 rounded-[4px] bg-accent px-2.5 py-1.5 text-[10px] font-extrabold text-text-on-accent">
              {badge}
            </span>
          )}
        </div>

        <p className="mt-7 text-[28px] font-extrabold text-text-primary">
          {price}
        </p>

        <ul className="mt-6 flex flex-1 flex-col gap-3">
          {features.map((feature) => (
            <li key={feature} className="flex gap-3 text-[14px] leading-6">
              <Check
                size={17}
                className="mt-1 shrink-0 text-accent"
                aria-hidden
              />
              <span className="text-text-secondary">{feature}</span>
            </li>
          ))}
        </ul>

        <LinkButton
          href={href}
          variant={featured ? "primary" : "secondary"}
          size="lg"
          fullWidth
          className={cn(
            "mt-7 normal-case tracking-normal",
            featured
              ? "rounded-pill shadow-[0_16px_38px_-16px_rgba(201,149,58,0.72)] hover:shadow-[0_20px_48px_-18px_rgba(201,149,58,0.82)]"
              : "rounded-[8px] border-border-default",
          )}
        >
          {cta}
        </LinkButton>
      </div>
    </div>
  );
}

function OutcomesSection() {
  return (
    <section className="border-y border-border-subtle bg-[#141414]">
      <div className="mx-auto max-w-[1180px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {outcomes.map((outcome) => (
            <div
              key={outcome}
              className="rounded-[12px] border border-border-subtle bg-bg-surface p-5"
            >
              <CheckCircle2 size={20} className="text-accent" aria-hidden />
              <p className="mt-4 text-[18px] font-extrabold leading-6 text-text-primary">
                {outcome}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="border-b border-border-subtle">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <SectionEyebrow>FAQ</SectionEyebrow>
          <h2 className="mt-4 text-[34px] font-extrabold leading-tight text-text-primary sm:text-[46px]">
            Perguntas diretas.
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-[12px] border border-border-subtle bg-bg-surface p-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-extrabold text-text-primary">
                {faq.question}
                <span className="text-accent transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 text-[14px] leading-6 text-text-secondary">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[980px] rounded-[12px] border border-accent/35 bg-bg-surface p-8 text-center shadow-[0_0_60px_-34px_rgba(201,149,58,0.9)] sm:p-12">
        <SectionEyebrow>ꓥuge</SectionEyebrow>
        <h2 className="mx-auto mt-4 max-w-3xl text-[34px] font-extrabold leading-tight text-text-primary sm:text-[50px]">
          Transforme treino prescrito em rotina acompanhada.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-7 text-text-secondary">
          Com o ꓥuge, o personal entrega clareza e o aluno mantém constância.
        </p>
        <div className="mt-8 flex justify-center">
          <LinkButton
            href="/cadastro"
            variant="primary"
            size="cta"
            className="normal-case tracking-normal shadow-[0_16px_38px_-14px_rgba(201,149,58,0.72)] hover:shadow-[0_20px_48px_-18px_rgba(201,149,58,0.82)]"
          >
            Começar agora <ArrowRight size={18} aria-hidden />
          </LinkButton>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border-subtle px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-4 text-[13px] text-text-muted sm:flex-row sm:items-center sm:justify-between">
        <Logo size="sm" />
        <p>© 2026 ꓥuge · Anômalo</p>
      </div>
    </footer>
  );
}

function SectionHeader({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="max-w-3xl">
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h2 className="mt-4 text-[34px] font-extrabold leading-tight text-text-primary sm:text-[46px]">
        {title}
      </h2>
      <p className="mt-5 text-[17px] leading-7 text-text-secondary">{text}</p>
    </div>
  );
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-extrabold text-accent">
      {children}
    </p>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text?: string;
}) {
  return (
    <div className="rounded-[12px] border border-border-subtle bg-bg-surface p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-accent/25 bg-accent/10">
        <Icon size={20} className="text-accent" aria-hidden />
      </div>
      <h3 className="mt-5 text-[18px] font-extrabold leading-6 text-text-primary">
        {title}
      </h3>
      {text && (
        <p className="mt-3 text-[14px] leading-6 text-text-secondary">{text}</p>
      )}
    </div>
  );
}
