"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pause, Pencil, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import {
  pauseStudent,
  removeStudent,
  resumeStudent,
} from "@/lib/actions/students";

/**
 * Ações do aluno no cabeçalho do detalhe (dashboard do personal): editar/criar
 * o treino, pausar/retomar o acompanhamento e remover o aluno. Antes eram
 * botões `disabled` (stubs) — agora ligados às server actions de students.ts.
 */
export function StudentActions({
  studentId,
  studentName,
  paused,
  activePlanId,
}: {
  studentId: string;
  studentName: string;
  paused: boolean;
  activePlanId: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<null | "pause" | "remove">(null);

  async function togglePause() {
    setBusy("pause");
    try {
      if (paused) await resumeStudent(studentId);
      else await pauseStudent(studentId);
      router.refresh();
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : "Não foi possível atualizar o aluno.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    const ok = window.confirm(
      `Remover ${studentName}? O aluno deixa de aparecer na sua lista. Os dados são mantidos e o vínculo pode ser refeito por convite.`,
    );
    if (!ok) return;
    setBusy("remove");
    try {
      await removeStudent(studentId);
      router.push("/alunos");
      router.refresh();
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : "Não foi possível remover o aluno.",
      );
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap justify-end">
      <LinkButton
        href={activePlanId ? `/treinos/${activePlanId}/editar` : "/treinos/novo"}
        variant="secondary"
        size="sm"
      >
        <Pencil size={14} aria-hidden />
        {activePlanId ? "Editar treino" : "Criar treino"}
      </LinkButton>

      <Button
        variant="secondary"
        size="sm"
        onClick={togglePause}
        disabled={busy !== null}
      >
        {paused ? (
          <>
            <Play size={14} aria-hidden />
            {busy === "pause" ? "Retomando..." : "Retomar"}
          </>
        ) : (
          <>
            <Pause size={14} aria-hidden />
            {busy === "pause" ? "Pausando..." : "Pausar"}
          </>
        )}
      </Button>

      <Button
        variant="destructive"
        size="sm"
        onClick={remove}
        disabled={busy !== null}
      >
        <Trash2 size={14} aria-hidden />
        {busy === "remove" ? "Removendo..." : "Remover"}
      </Button>
    </div>
  );
}
