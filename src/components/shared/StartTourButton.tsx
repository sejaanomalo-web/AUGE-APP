"use client";

import * as React from "react";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GuidedTour, type TourStep } from "./GuidedTour";

const NAV_DESC: Record<string, string> = {
  // Aluno — treino
  "/hoje": "Seu dia: o treino de hoje e os próximos eventos.",
  "/planos": "Seus planos de treino montados pelo personal.",
  "/objetivos": "Suas metas e objetivos para acompanhar.",
  "/evolucao": "Sua evolução: frequência, calendário e medidas.",
  "/perfil": "Seus dados, profissionais vinculados e este tutorial.",
  // Aluno — nutrição
  "/nutricao/hoje": "Seu dia na nutrição: refeições e hidratação para registrar.",
  "/nutricao/cardapio": "Os cardápios prescritos pela sua nutricionista.",
  "/nutricao/historico": "O histórico das refeições que você registrou.",
  "/nutricao/evolucao": "Aderência, calorias, hidratação e o calendário.",
  // Personal
  "/dashboard": "Visão geral: seus números e atalhos do dia.",
  "/alunos": "Seus alunos e os códigos de convite.",
  "/treinos": "Onde você monta e gerencia os treinos.",
  "/exercicios": "Sua biblioteca de exercícios.",
  "/eventos": "Agenda de eventos, provas e lembretes.",
  "/conta": "Seus dados e este tutorial.",
};

function buildSteps(role: "aluno" | "personal"): TourStep[] {
  const steps: TourStep[] = [];

  steps.push({
    title: "Bem-vindo ao AUGE 👋",
    body:
      role === "personal"
        ? "Em 1 minuto te mostro onde fica cada coisa para você gerenciar seus alunos."
        : "Em 1 minuto te mostro onde fica cada coisa no app.",
  });

  // Toggle de vertical (só existe se o aluno tem treino + nutrição).
  if (document.querySelector('[data-tour="vertical-toggle"]')) {
    steps.push({
      selector: '[data-tour="vertical-toggle"]',
      title: "Treino e Nutrição",
      body: "Alterne entre as verticais aqui. A cor do app muda (verde limão no treino, verde água na nutrição) para você sempre saber onde está.",
    });
  }

  // Itens de navegação visíveis (barra inferior no mobile, menu lateral no desktop).
  const seen = new Set<string>();
  const navEls = Array.from(
    document.querySelectorAll<HTMLElement>('[data-tour^="navitem:"]'),
  );
  for (const el of navEls) {
    if (el.offsetParent === null) continue; // ignora os ocultos (ex.: sidebar no mobile)
    const href = el.getAttribute("data-tour")!.replace("navitem:", "");
    if (seen.has(href)) continue;
    seen.add(href);
    const label = (el.textContent || "").trim() || href;
    steps.push({
      selector: `[data-tour="navitem:${href}"]`,
      title: label,
      body: NAV_DESC[href] ?? "Acesse esta seção do app por aqui.",
    });
  }

  // Menu da conta (notificações, perfil, sair).
  if (document.querySelector('[data-tour="account-menu"]')) {
    steps.push({
      selector: '[data-tour="account-menu"]',
      title: "Conta e notificações",
      body: "Aqui ficam suas notificações, o seu perfil e a opção de sair.",
    });
  }

  steps.push({
    title: "Tudo pronto! 🎉",
    body: "Explore à vontade — é só tocar nos menus. Você pode rever este tutorial quando quiser, aqui no Perfil.",
  });

  return steps;
}

export function StartTourButton({
  role = "aluno",
  className,
}: {
  role?: "aluno" | "personal";
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [steps, setSteps] = React.useState<TourStep[]>([]);

  function start() {
    setSteps(buildSteps(role));
    setOpen(true);
  }

  return (
    <>
      <Button
        variant="secondary"
        size="md"
        onClick={start}
        className={className}
      >
        <Compass size={16} aria-hidden /> Tutorial: como funciona o app
      </Button>
      <GuidedTour open={open} steps={steps} onClose={() => setOpen(false)} />
    </>
  );
}
