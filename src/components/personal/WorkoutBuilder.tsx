"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { IconButton } from "@/components/ui/IconButton";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { createPlan } from "@/lib/actions/workout-plans";
import {
  createSession,
  addExerciseToSession,
} from "@/lib/actions/workout-sessions";

interface ExerciseOption {
  id: string;
  name: string;
  muscleGroup: string;
}

interface StudentOption {
  id: string;
  name: string;
}

interface ExerciseRow {
  id: string;
  exerciseId: string;
  sets: number;
  reps: string;
  rest: number;
  weight: number;
  notes: string;
}

interface SessionDraft {
  id: string;
  letter: string;
  name: string;
  dayOfWeek: string;
  exercises: ExerciseRow[];
  expanded: boolean;
}

const DAY_MAP: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
};

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function makeSession(letter: string, defaultExerciseId: string): SessionDraft {
  return {
    id: makeId(),
    letter,
    name: `Treino ${letter}`,
    dayOfWeek: "segunda",
    exercises: [
      {
        id: makeId(),
        exerciseId: defaultExerciseId,
        sets: 4,
        reps: "8-10",
        rest: 90,
        weight: 0,
        notes: "",
      },
    ],
    expanded: true,
  };
}

export function WorkoutBuilder({
  students,
  exercises,
}: {
  students: StudentOption[];
  exercises: ExerciseOption[];
}) {
  const router = useRouter();
  const defaultExerciseId = exercises[0]?.id ?? "";
  const [studentId, setStudentId] = React.useState(students[0]?.id ?? "");
  const [planName, setPlanName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [startDate, setStartDate] = React.useState(
    new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = React.useState("");
  const [sessions, setSessions] = React.useState<SessionDraft[]>([
    makeSession("A", defaultExerciseId),
  ]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function addSession() {
    const nextLetter = String.fromCharCode(65 + sessions.length);
    setSessions((prev) => [...prev, makeSession(nextLetter, defaultExerciseId)]);
  }
  function updateSession(idx: number, patch: Partial<SessionDraft>) {
    setSessions((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    );
  }
  function removeSession(idx: number) {
    setSessions((prev) => prev.filter((_, i) => i !== idx));
  }
  function addExercise(sessionIdx: number) {
    setSessions((prev) =>
      prev.map((s, i) =>
        i === sessionIdx
          ? {
              ...s,
              exercises: [
                ...s.exercises,
                {
                  id: makeId(),
                  exerciseId: defaultExerciseId,
                  sets: 3,
                  reps: "10-12",
                  rest: 60,
                  weight: 0,
                  notes: "",
                },
              ],
            }
          : s,
      ),
    );
  }
  function updateExercise(
    sessionIdx: number,
    exIdx: number,
    patch: Partial<ExerciseRow>,
  ) {
    setSessions((prev) =>
      prev.map((s, i) =>
        i === sessionIdx
          ? {
              ...s,
              exercises: s.exercises.map((e, j) =>
                j === exIdx ? { ...e, ...patch } : e,
              ),
            }
          : s,
      ),
    );
  }
  function removeExercise(sessionIdx: number, exIdx: number) {
    setSessions((prev) =>
      prev.map((s, i) =>
        i === sessionIdx
          ? { ...s, exercises: s.exercises.filter((_, j) => j !== exIdx) }
          : s,
      ),
    );
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      if (!studentId) throw new Error("Selecione um aluno");
      if (!planName.trim()) throw new Error("Preencha o nome do plano");
      if (sessions.length === 0) throw new Error("Adicione ao menos um treino");

      const plan = await createPlan({
        studentId,
        name: planName.trim(),
        description: description.trim() || undefined,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
      });

      for (let i = 0; i < sessions.length; i++) {
        const s = sessions[i];
        const session = await createSession(plan.id, {
          name: s.name.trim() || `Treino ${s.letter}`,
          dayOfWeek: DAY_MAP[s.dayOfWeek],
          order: i,
        });
        for (let j = 0; j < s.exercises.length; j++) {
          const ex = s.exercises[j];
          await addExerciseToSession(session.id, ex.exerciseId, {
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.rest,
            weight: ex.weight || undefined,
            notes: ex.notes || undefined,
            order: j,
          });
        }
      }

      router.push("/treinos");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar plano");
      setSaving(false);
    }
  }

  if (students.length === 0) {
    return (
      <Card variant="default">
        <p className="text-body text-text-secondary">
          Você precisa ter ao menos um aluno vinculado para criar um plano de
          treino. Gere um código de convite na página /alunos.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-h3 text-text-primary mb-3">
          1. Informações do plano
        </h2>
        <Card variant="default">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Nome do plano"
              htmlFor="plan-name"
              className="sm:col-span-2"
            >
              <Input
                id="plan-name"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="ex: Hipertrofia — Junho 2026"
                required
              />
            </Field>
            <Field
              label="Descrição"
              htmlFor="plan-desc"
              className="sm:col-span-2"
            >
              <Textarea
                id="plan-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Bloco de hipertrofia 4x/sem com volume progressivo."
              />
            </Field>
            <Field label="Aluno" htmlFor="plan-student">
              <Select
                id="plan-student"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Frequência (x/sem)" htmlFor="plan-freq">
              <Input
                id="plan-freq"
                type="number"
                value={sessions.length}
                readOnly
              />
            </Field>
            <Field label="Data de início" htmlFor="plan-start">
              <Input
                id="plan-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Field>
            <Field label="Data de fim (opcional)" htmlFor="plan-end">
              <Input
                id="plan-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Field>
          </div>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-h3 text-text-primary">2. Sessões de treino</h2>
          <Button variant="secondary" size="sm" onClick={addSession}>
            <Plus size={14} aria-hidden /> Adicionar treino
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {sessions.map((s, sIdx) => (
            <Card key={s.id} variant="default">
              <div className="flex items-center gap-2 mb-3">
                <Badge>Treino {s.letter}</Badge>
                <Input
                  className="flex-1"
                  value={s.name}
                  onChange={(e) =>
                    updateSession(sIdx, { name: e.target.value })
                  }
                  placeholder="Nome do treino"
                />
                <Select
                  className="w-auto"
                  value={s.dayOfWeek}
                  onChange={(e) =>
                    updateSession(sIdx, { dayOfWeek: e.target.value })
                  }
                >
                  <option value="segunda">Segunda</option>
                  <option value="terca">Terça</option>
                  <option value="quarta">Quarta</option>
                  <option value="quinta">Quinta</option>
                  <option value="sexta">Sexta</option>
                  <option value="sabado">Sábado</option>
                  <option value="domingo">Domingo</option>
                </Select>
                <IconButton
                  aria-label={s.expanded ? "Recolher" : "Expandir"}
                  onClick={() =>
                    updateSession(sIdx, { expanded: !s.expanded })
                  }
                >
                  {s.expanded ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </IconButton>
                {sessions.length > 1 && (
                  <IconButton
                    aria-label="Remover treino"
                    onClick={() => removeSession(sIdx)}
                  >
                    <Trash2 size={18} className="text-error" />
                  </IconButton>
                )}
              </div>

              {s.expanded && (
                <div className="flex flex-col gap-2">
                  {s.exercises.map((ex, exIdx) => (
                    <div
                      key={ex.id}
                      className="grid grid-cols-1 sm:grid-cols-[2fr_repeat(4,1fr)_auto] gap-2 items-start p-3 bg-bg-elevated rounded-md"
                    >
                      <Select
                        value={ex.exerciseId}
                        onChange={(e) =>
                          updateExercise(sIdx, exIdx, {
                            exerciseId: e.target.value,
                          })
                        }
                      >
                        {exercises.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}
                          </option>
                        ))}
                      </Select>
                      <Input
                        type="number"
                        aria-label="Séries"
                        min={1}
                        value={ex.sets}
                        onChange={(e) =>
                          updateExercise(sIdx, exIdx, {
                            sets: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                      <Input
                        aria-label="Reps"
                        value={ex.reps}
                        onChange={(e) =>
                          updateExercise(sIdx, exIdx, {
                            reps: e.target.value,
                          })
                        }
                      />
                      <Input
                        type="number"
                        aria-label="Descanso (s)"
                        min={0}
                        value={ex.rest}
                        onChange={(e) =>
                          updateExercise(sIdx, exIdx, {
                            rest: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                      <Input
                        type="number"
                        aria-label="Peso sugerido (kg)"
                        min={0}
                        step={0.5}
                        value={ex.weight}
                        onChange={(e) =>
                          updateExercise(sIdx, exIdx, {
                            weight: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                      <IconButton
                        aria-label="Remover exercício"
                        onClick={() => removeExercise(sIdx, exIdx)}
                      >
                        <Trash2 size={16} className="text-error" />
                      </IconButton>
                    </div>
                  ))}
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => addExercise(sIdx)}
                    className="self-start"
                  >
                    <Plus size={14} aria-hidden /> Adicionar exercício
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {error && (
        <p className="text-body text-error" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 justify-end">
        <Button
          variant="primary"
          size="cta"
          disabled={saving}
          onClick={save}
        >
          {saving ? "Salvando..." : "Salvar plano"}
        </Button>
      </div>
    </div>
  );
}
