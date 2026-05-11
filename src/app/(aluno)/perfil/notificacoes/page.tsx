import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Card } from "@/components/ui/Card";
import { EnableNotificationsButton } from "@/components/notifications/EnableNotificationsButton";
import { NotificationSettingsForm } from "@/components/notifications/NotificationSettingsForm";
import { requireRole } from "@/lib/auth-helpers";
import { getOrCreateMySettings } from "@/lib/actions/notification-settings";

export default async function NotificacoesAlunoPage() {
  await requireRole("ALUNO");
  const settings = await getOrCreateMySettings();

  return (
    <div className="max-w-2xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/perfil">
          <IconButton aria-label="Voltar">
            <ChevronLeft size={20} />
          </IconButton>
        </Link>
        <div>
          <h1 className="text-h1 text-text-primary">Notificações</h1>
          <p className="text-body text-text-secondary">
            Gerencie como você é notificado
          </p>
        </div>
      </header>

      <Card variant="default" className="mb-6">
        <h2 className="text-h3 text-text-primary mb-2">Notificações push</h2>
        <p className="text-body text-text-secondary mb-4">
          Ative para receber notificações na tela de bloqueio
        </p>
        <EnableNotificationsButton />
      </Card>

      <NotificationSettingsForm
        initialSettings={{
          morningReminder: settings.morningReminder,
          eveningReminder: settings.eveningReminder,
          streakAlerts: settings.streakAlerts,
          trainerActivity: settings.trainerActivity,
          studentActivity: settings.studentActivity,
        }}
        role="ALUNO"
      />
    </div>
  );
}
