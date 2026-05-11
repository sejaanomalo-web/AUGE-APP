"use client";

import * as React from "react";
import {
  updateNotificationSettings,
  type NotificationSettingsPatch,
} from "@/lib/actions/notification-settings";
import { cn } from "@/lib/utils";

export interface SettingsShape {
  morningReminder: boolean;
  eveningReminder: boolean;
  streakAlerts: boolean;
  trainerActivity: boolean;
  studentActivity: boolean;
}

type ToggleKey = keyof SettingsShape;

export function NotificationSettingsForm({
  initialSettings,
  role,
}: {
  initialSettings: SettingsShape;
  role: "ALUNO" | "PERSONAL";
}) {
  const [settings, setSettings] =
    React.useState<SettingsShape>(initialSettings);
  const [saving, setSaving] = React.useState<ToggleKey | null>(null);

  async function update(key: ToggleKey, value: boolean) {
    const before = settings[key];
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaving(key);
    try {
      await updateNotificationSettings({ [key]: value } as NotificationSettingsPatch);
    } catch {
      // revert on failure
      setSettings((prev) => ({ ...prev, [key]: before }));
    } finally {
      setSaving(null);
    }
  }

  const items: Array<{ key: ToggleKey; label: string; desc: string; show: boolean }> = [
    {
      key: "morningReminder",
      label: "Lembrete matinal (7h)",
      desc: "Hoje é dia de treino",
      show: role === "ALUNO",
    },
    {
      key: "eveningReminder",
      label: "Lembrete noturno (20h)",
      desc: "Se você ainda não treinou",
      show: role === "ALUNO",
    },
    {
      key: "streakAlerts",
      label: "Alertas de inatividade",
      desc: "Quando você fica dias sem treinar",
      show: role === "ALUNO",
    },
    {
      key: "trainerActivity",
      label: "Atividade do personal",
      desc: "Quando seu personal atualiza algo no seu plano",
      show: role === "ALUNO",
    },
    {
      key: "studentActivity",
      label: "Atividade dos alunos",
      desc: "Quando algum aluno seu treina, anexa exame, etc.",
      show: role === "PERSONAL",
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      {items
        .filter((i) => i.show)
        .map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-3 p-4 bg-bg-surface rounded-md"
          >
            <div className="min-w-0">
              <p className="text-body-lg text-text-primary font-semibold">
                {item.label}
              </p>
              <p className="text-caption text-text-muted">{item.desc}</p>
            </div>
            <button
              type="button"
              onClick={() => update(item.key, !settings[item.key])}
              disabled={saving === item.key}
              aria-pressed={settings[item.key]}
              aria-label={item.label}
              className={cn(
                "relative w-12 h-7 rounded-full transition-colors shrink-0 disabled:opacity-50",
                settings[item.key] ? "bg-accent" : "bg-bg-elevated",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 w-5 h-5 rounded-full bg-white transition-all",
                  settings[item.key] ? "left-6" : "left-1",
                )}
              />
            </button>
          </div>
        ))}
    </div>
  );
}
