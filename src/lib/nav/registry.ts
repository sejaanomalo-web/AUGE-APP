import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Crosshair,
  History,
  Target,
  TrendingUp,
  User,
  Utensils,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Ordered intentionally so "Hoje" sits dead center (position 3 of 5)
// across both verticais — usuário não precisa procurar o botão central.

export const NAV_ALUNO_TREINOS: NavItem[] = [
  { href: "/planos", label: "Treinos", icon: ClipboardList },
  { href: "/objetivos", label: "Objetivos", icon: Crosshair },
  { href: "/hoje", label: "Hoje", icon: Target },
  { href: "/evolucao", label: "Evolução", icon: TrendingUp },
  { href: "/perfil", label: "Perfil", icon: User },
];

export const NAV_ALUNO_NUTRICAO: NavItem[] = [
  { href: "/nutricao/cardapio", label: "Cardápio", icon: Utensils },
  { href: "/nutricao/historico", label: "Histórico", icon: History },
  { href: "/nutricao/hoje", label: "Hoje", icon: Target },
  { href: "/nutricao/evolucao", label: "Evolução", icon: TrendingUp },
  { href: "/perfil", label: "Perfil", icon: User },
];
