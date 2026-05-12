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
import { DayPicker } from "@/components/ui/DayPicker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  ExerciseSelector,
  type ExerciseOption,
} from "./ExerciseSelector";
import { createPlan } from "@/lib/actions/workout-plans";
import {
  createSession,
  addExerciseToSession,
} from "@/lib/actions/workout-sessions";
import { createPlanMetric } from "@/lib/actions/plan-metrics";

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

interface MetricDraft {
  id: string;
  name: string;
  unit: string;
  requiresAttachment: boolean;
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

const DAY_SHORT: Record<string, string> = {
  domingo: "Domingo",
  segunda: "Segunda",
  terca: "Terça",
  quarta: "Quarta",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sábado",
};

const WEEK_ORDER = [
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
  "domingo",
];

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function makeSession(letter: string, defaultExerciseId: string): SessionDraft {
  return {
    id: makeId(),
    letter,
    name: "",
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
  successRedirect = "/treinos",
}: {
  students: StudentOption[];
  exercises: ExerciseOption[];
  successRedirect?: string;
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
  const [metrics, setMetrics] = React.useState<MetricDraft[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function addMetric() {
    setMetrics((prev) => [
      ...prev,
      {
        id: makeId(),
        name: "",
        unit: "",
        requiresAttachment: false,
      },
    ]);
  }
  function updateMetric(idx: number, patch: Partial<MetricDraft>) {
    setMetrics((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)),
    );
  }
  function removeMetric(idx: number) {
    setMetrics((prev) => prev.filter((_, i) => i !== idx));
  }

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
        const sessionName =
          s.name.trim() || `Treino ${s.letter}`;
        const session = await createSession(plan.id, {
          name: sessionName,
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

      // Persist custom metrics
      for (let i = 0; i < metrics.length; i++) {
        const m = metrics[i];
        if (!m.name.trim()) continue;
        await createPlanMetric({
          planId: plan.id,
          name: m.name.trim(),
          unit: m.unit.trim() || undefined,
          requiresAttachment: m.requiresAttachment,
          order: i,
        });
      }

      router.push(successRedirect);
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
            {students.length > 1 ? (
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
            ) : (
              <Field label="Para" htmlFor="plan-student">
                <Input
                  id="plan-student"
                  value={students[0]?.name ?? "—"}
                  readOnly
                />
              </Field>
            )}
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
        </div>

        <Tabs defaultValue="plan">
          <TabsList>
            <TabsTrigger value="plan">Treinos do plano</TabsTrigger>
            <TabsTrigger value="schedule">Cronograma semanal</TabsTrigger>
          </TabsList>

          <TabsContent value="plan">
            <div className="flex flex-col gap-3">
              {sessions.map((s, sIdx) => (
                <Card key={s.id} variant="default">
                  {/* Header em uma linha só — Badge + Input nome + DayPicker + ações */}
                  <div className="flex items-center gap-2 mb-4 flex-nowrap">
                    <Badge className="shrink-0">Treino {s.letter}</Badge>
                    <Input
                      className="flex-1 min-w-0"
                      value={s.name}
                      onChange={(e) =>
                        updateSession(sIdx, { name: e.target.value })
                      }
                      placeholder={`ex: Peito e bíceps com foco em recuperação`}
                    />
                    <DayPicker
                      value={s.dayOfWeek}
                      onChange={(v) =>
                        updateSession(sIdx, { dayOfWeek: v })
                      }
                      className="shrink-0"
                    />
                    <IconButton
                      aria-label={s.expanded ? "Recolher" : "Expandir"}
                      onClick={() =>
                        updateSession(sIdx, { expanded: !s.expanded })
                      }
                      className="shrink-0"
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
                        className="shrink-0"
                      >
                        <Trash2 size={18} className="text-error" />
                      </IconButton>
                    )}
                  </div>

                  {s.expanded && (
                    <div className="flex flex-col gap-2">
                      {/* Header das colunas */}
                      <div className="hidden sm:grid grid-cols-[minmax(0,2.5fr)_70px_90px_90px_90px_44px] gap-2 items-center px-3 text-[11px] uppercase tracking-[0.06em] text-text-muted font-semibold">
                        <span>Exercício</span>
                        <span className="text-center">Séries</span>
                        <span className="text-center">Reps</span>
                        <span className="text-center">Descanso (s)</span>
                        <span className="text-center">Peso (kg)</span>
                        <span />
                      </div>

                      {s.exercises.map((ex, exIdx) => (
                        <div
                          key={ex.id}
                          className="grid grid-cols-1 sm:grid-cols-[minmax(0,2.5fr)_70px_90px_90px_90px_44px] gap-2 items-start sm:items-center p-3 bg-bg-elevated rounded-md"
                        >
                          <div className="min-w-0">
                            <span className="sm:hidden block text-[11px] uppercase tracking-[0.06em] text-text-muted font-semibold mb-1">
                              Exercício
                            </span>
                            <ExerciseSelector
                              value={ex.exerciseId}
                              options={exercises}
                              onChange={(id) =>
                                updateExercise(sIdx, exIdx, { exerciseId: id })
                              }
                            />
                          </div>
                          {/* Mobile: 2x2 grid for the 4 numeric inputs.
                           * Desktop (sm+): wrapper dissolves (contents) so each
                           * input becomes a direct child of the parent grid,
                           * keeping the 70/90/90/90 column layout. */}
                          <div className="grid grid-cols-2 gap-2 sm:contents">
                            <label className="min-w-0 block sm:contents">
                              <span className="sm:hidden block text-[11px] uppercase tracking-[0.06em] text-text-muted font-semibold mb-1">
                                Séries
                              </span>
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
                                className="text-center"
                              />
                            </label>
                            <label className="min-w-0 block sm:contents">
                              <span className="sm:hidden block text-[11px] uppercase tracking-[0.06em] text-text-muted font-semibold mb-1">
                                Reps
                              </span>
                              <Input
                                aria-label="Reps"
                                value={ex.reps}
                                onChange={(e) =>
                                  updateExercise(sIdx, exIdx, {
                                    reps: e.target.value,
                                  })
                                }
                                className="text-center"
                                placeholder="8-10"
                              />
                            </label>
                            <label className="min-w-0 block sm:contents">
                              <span className="sm:hidden block text-[11px] uppercase tracking-[0.06em] text-text-muted font-semibold mb-1">
                                Descanso (s)
                              </span>
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
                                className="text-center"
                              />
                            </label>
                            <label className="min-w-0 block sm:contents">
                              <span className="sm:hidden block text-[11px] uppercase tracking-[0.06em] text-text-muted font-semibold mb-1">
                                Peso (kg)
                              </span>
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
                                className="text-center"
                              />
                            </label>
                          </div>
                          <div className="flex sm:block justify-end">
                            <IconButton
                              aria-label="Remover exercício"
                              onClick={() => removeExercise(sIdx, exIdx)}
                            >
                              <Trash2 size={16} className="text-error" />
                            </IconButton>
                          </div>
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

              <Button
                variant="secondary"
                size="md"
                onClick={addSession}
                className="self-start"
              >
                <Plus size={16} aria-hidden /> Adicionar treino
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="schedule">
            <Card variant="default">
              <p className="text-caption text-text-muted mb-4">
                Visualização do que o aluno fará em cada dia da semana,
                baseado nos treinos definidos acima. Edite o dia em "Treinos
                do plano".
              </p>
              <ul className="flex flex-col gap-2">
                {WEEK_ORDER.map((d) => {
                  const matches = sessions.filter((s) => s.dayOfWeek === d);
                  return (
                    <li
                      key={d}
                      className="flex items-center justify-between gap-3 py-2 px-3 rounded-md bg-bg-elevated"
                    >
                      <span className="text-body font-semibold text-text-primary w-24 shrink-0">
                        {DAY_SHORT[d]}
                      </span>
                      <div className="flex-1 min-w-0 flex flex-wrap gap-1.5 justify-end">
                        {matches.length === 0 ? (
                          <span className="text-caption text-text-muted italic">
                            Descanso
                          </span>
                        ) : (
                          matches.map((m) => (
                            <Badge key={m.id} variant="default">
                              Treino {m.letter}
                              {m.name ? ` — ${m.name}` : ""}
                            </Badge>
                          ))
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-h3 text-text-primary">
              3. Métricas a coletar
              <span className="ml-2 text-caption text-text-muted font-normal">
                (opcional)
              </span>
            </h2>
            <p className="text-caption text-text-muted">
              Campos custom que o aluno preenche durante o plano.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={addMetric}>
            <Plus size={14} aria-hidden /> Adicionar métrica
          </Button>
        </div>

        {metrics.length === 0 ? (
          <Card variant="default">
            <p className="text-caption text-text-muted">
              Nenhuma métrica adicionada. Use isso para pedir registros como
              "Peso na barra do supino (kg)", "Foto da execução do agachamento"
              (com anexo obrigatório), etc.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {metrics.map((m, idx) => (
              <Card key={m.id} variant="default">
                <div className="grid grid-cols-1 sm:grid-cols-[2fr_120px_auto_44px] gap-2 items-end">
                  <Field label="Nome da métrica" htmlFor={`m-name-${m.id}`}>
                    <Input
                      id={`m-name-${m.id}`}
                      value={m.name}
                      onChange={(e) =>
                        updateMetric(idx, { name: e.target.value })
                      }
                      placeholder="ex: Peso na barra do supino"
                    />
                  </Field>
                  <Field label="Unidade" htmlFor={`m-unit-${m.id}`}>
                    <Input
                      id={`m-unit-${m.id}`}
                      value={m.unit}
                      onChange={(e) =>
                        updateMetric(idx, { unit: e.target.value })
                      }
                      placeholder="kg / cm / —"
                    />
                  </Field>
                  <label className="flex items-center gap-2 cursor-pointer min-h-[48px]">
                    <input
                      type="checkbox"
                      checked={m.requiresAttachment}
                      onChange={(e) =>
                        updateMetric(idx, {
                          requiresAttachment: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-accent"
                    />
                    <span className="text-caption text-text-secondary whitespace-nowrap">
                      Anexo obrigatório
                    </span>
                  </label>
                  <IconButton
                    aria-label="Remover métrica"
                    onClick={() => removeMetric(idx)}
                  >
                    <Trash2 size={16} className="text-error" />
                  </IconButton>
                </div>
              </Card>
            ))}
          </div>
        )}
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
