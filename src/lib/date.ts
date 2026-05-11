import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDayMonth(iso: string) {
  return format(parseISO(iso), "EEEE, d 'de' MMMM", { locale: ptBR });
}

export function formatShortDate(iso: string) {
  return format(parseISO(iso), "d MMM", { locale: ptBR });
}

export function formatLongDate(iso: string) {
  return format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatDayShort(iso: string) {
  return format(parseISO(iso), "EEEEEE", { locale: ptBR }).toUpperCase();
}

export function formatRelativeFromNow(iso: string, nowIso: string) {
  const now = parseISO(nowIso);
  const target = parseISO(iso);
  const diffMs = now.getTime() - target.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.round(hours / 24);
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  return formatShortDate(iso);
}

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
