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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  ExerciseSelector,
  type ExerciseOption,
} from "./ExerciseSelector";
import {
  createPlan,
  replacePlanContent,
} from "@/lib/actions/workout-plans";
import {
  createSession,
  addExerciseToSession,
} from "@/lib/actions/workout-sessions";
import { useToast } from "@/components/providers/ToastProvider";

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
  exercises: ExerciseRow[];
  expanded: boolean;
}

type WeekSchedule = Record<string, string | null>;

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

export interface WorkoutBuilderInitialData {
  planId: string;
  studentId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  sessions: Array<{
    name: string;
    dayOfWeek: number;
    exercises: Array<{
      exerciseId: string;
      sets: number;
      reps: string;
      restSeconds: number;
      weight: number;
      notes: string;
    }>;
  }>;
}

/**
 * Group existing DB sessions (each tied to a single dayOfWeek) into templates
 * + weekly schedule. Sessions with identical content signature collapse into
 * the same template, assigned to multiple days.
 */
function buildInitialState(
  initial: WorkoutBuilderInitialData,
): { sessions: SessionDraft[]; schedule: WeekSchedule } {
  const NUM_TO_DAY: Record<number, string> = {
    0: "domingo",
    1: "segunda",
    2: "terca",
    3: "quarta",
    4: "quinta",
    5: "sexta",
    6: "sabado",
  };
  const sigToTemplate = new Map<string, SessionDraft>();
  const schedule: WeekSchedule = Object.fromEntries(
    WEEK_ORDER.map((d) => [d, null]),
  );
  for (const s of initial.sessions) {
    const sig = JSON.stringify({
      n: s.name,
      e: s.exercises.map((e) => ({
        id: e.exerciseId,
        s: e.sets,
        r: e.reps,
        t: e.restSeconds,
        w: e.weight,
      })),
    });
    let tpl = sigToTemplate.get(sig);
    if (!tpl) {
      const letter = String.fromCharCode(65 + sigToTemplate.size);
      tpl = {
        id: makeId(),
        letter,
        name: s.name.startsWith("Treino ") ? "" : s.name,
        exercises: s.exercises.map((e) => ({
          id: makeId(),
          exerciseId: e.exerciseId,
          sets: e.sets,
          reps: e.reps,
          rest: e.restSeconds,
          weight: e.weight,
          notes: e.notes,
        })),
        expanded: false,
      };
      sigToTemplate.set(sig, tpl);
    }
    const dayKey = NUM_TO_DAY[s.dayOfWeek];
    if (dayKey) schedule[dayKey] = tpl.id;
  }
  const sessions = [...sigToTemplate.values()];
  return {
    sessions: sessions.length > 0 ? sessions : [],
    schedule,
  };
}

export function WorkoutBuilder({
  students,
  exercises,
  successRedirect = "/treinos",
  initialData,
}: {
  students: StudentOption[];
  exercises: ExerciseOption[];
  successRedirect?: string;
  initialData?: WorkoutBuilderInitialData;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!initialData;
  const defaultExerciseId = exercises[0]?.id ?? "";

  const prebuilt = React.useMemo(
    () => (initialData ? buildInitialState(initialData) : null),
    [initialData],
  );

  const [studentId, setStudentId] = React.useState(
    initialData?.studentId ?? students[0]?.id ?? "",
  );
  const [planName, setPlanName] = React.useState(initialData?.name ?? "");
  const [description, setDescription] = React.useState(
    initialData?.description ?? "",
  );
  const [startDate, setStartDate] = React.useState(
    initialData?.startDate ?? new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = React.useState(initialData?.endDate ?? "");
  const [sessions, setSessions] = React.useState<SessionDraft[]>(
    prebuilt?.sessions ?? [makeSession("A", defaultExerciseId)],
  );
  const [schedule, setSchedule] = React.useState<WeekSchedule>(
    prebuilt?.schedule ??
      Object.fromEntries(WEEK_ORDER.map((d) => [d, null])),
  );
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
    setSessions((prev) => {
      const removed = prev[idx];
      // Clear any schedule slot pointing to this template.
      if (removed) {
        setSchedule((curr) =>
          Object.fromEntries(
            Object.entries(curr).map(([day, sid]) => [
              day,
              sid === removed.id ? null : sid,
            ]),
          ),
        );
      }
      return prev.filter((_, i) => i !== idx);
    });
  }
  function assignDay(day: string, sessionId: string | null) {
    setSchedule((prev) => ({ ...prev, [day]: sessionId }));
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

      const scheduledTemplateIds = new Set(
        Object.values(schedule).filter((v): v is string => v !== null),
      );
      if (scheduledTemplateIds.size === 0) {
        throw new Error(
          "Atribua pelo menos um treino a um dia no cronograma semanal.",
        );
      }

      // Flatten schedule → array of (dayOfWeek, template) pairs in week order.
      const scheduleRows: Array<{
        dayOfWeek: number;
        name: string;
        exercises: Array<{
          exerciseId: string;
          sets: number;
          reps: string;
          restSeconds?: number;
          weight?: number;
          notes?: string;
        }>;
      }> = [];
      for (const day of WEEK_ORDER) {
        const templateId = schedule[day];
        if (!templateId) continue;
        const template = sessions.find((s) => s.id === templateId);
        if (!template) continue;
        scheduleRows.push({
          dayOfWeek: DAY_MAP[day],
          name: template.name.trim() || `Treino ${template.letter}`,
          exercises: template.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.rest,
            weight: ex.weight || undefined,
            notes: ex.notes || undefined,
          })),
        });
      }

      if (isEdit && initialData) {
        const result = await replacePlanContent(initialData.planId, {
          name: planName.trim(),
          description: description.trim() || undefined,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : undefined,
          schedule: scheduleRows,
        });
        if (!result.ok) {
          setError(result.error);
          toast({
            type: "error",
            title: "Não foi possível salvar",
            description: result.error,
          });
          setSaving(false);
          return;
        }
      } else {
        const plan = await createPlan({
          studentId,
          name: planName.trim(),
          description: description.trim() || undefined,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : undefined,
        });
        for (let i = 0; i < scheduleRows.length; i++) {
          const row = scheduleRows[i];
          const session = await createSession(plan.id, {
            name: row.name,
            dayOfWeek: row.dayOfWeek,
            order: i,
          });
          for (let j = 0; j < row.exercises.length; j++) {
            const ex = row.exercises[j];
            await addExerciseToSession(session.id, ex.exerciseId, {
              sets: ex.sets,
              reps: ex.reps,
              restSeconds: ex.restSeconds,
              weight: ex.weight,
              notes: ex.notes,
              order: j,
            });
          }
        }
      }

      toast({
        type: "success",
        title: isEdit ? "Plano atualizado!" : "Plano salvo!",
        description: isEdit
          ? "As alterações já estão valendo para o aluno."
          : "O aluno já consegue acessar o novo plano.",
      });
      router.push(successRedirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar plano");
      toast({
        type: "error",
        title: "Não foi possível salvar",
        description: err instanceof Error ? err.message : undefined,
      });
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
          Dados do plano
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
                placeholder="ex: Hipertrofia - Junho 2026"
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
            {students.length > 1 && !isEdit ? (
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
                  value={
                    students.find((s) => s.id === studentId)?.name ??
                    students[0]?.name ??
                    "-"
                  }
                  readOnly
                />
              </Field>
            )}
            <Field label="Frequência (x/sem)" htmlFor="plan-freq">
              <Input
                id="plan-freq"
                type="number"
                value={
                  Object.values(schedule).filter((v) => v !== null).length
                }
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
          <h2 className="text-h3 text-text-primary">Sessões de treino</h2>
        </div>

        <Tabs defaultValue="plan">
          <TabsList>
            <TabsTrigger value="plan">Exercícios</TabsTrigger>
            <TabsTrigger value="schedule">Cronograma semanal</TabsTrigger>
          </TabsList>

          <TabsContent value="plan">
            <div className="flex flex-col gap-3">
              {sessions.map((s, sIdx) => (
                <Card key={s.id} variant="default">
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
                      <div className="hidden sm:grid grid-cols-[minmax(0,2.5fr)_70px_90px_90px_90px_44px] gap-2 items-center px-3 text-[11px] uppercase tracking-normal text-text-muted font-semibold">
                        <span>Exercício</span>
                        <span className="text-center">Séries</span>
                        <span className="text-center">Repetições</span>
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
                            <span className="sm:hidden block text-[11px] uppercase tracking-normal text-text-muted font-semibold mb-1">
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
                          <div className="grid grid-cols-2 gap-2 sm:contents">
                            <label className="min-w-0 block sm:contents">
                              <span className="sm:hidden block text-[11px] uppercase tracking-normal text-text-muted font-semibold mb-1">
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
                              <span className="sm:hidden block text-[11px] uppercase tracking-normal text-text-muted font-semibold mb-1">
                                Repetições
                              </span>
                              <Input
                                aria-label="Repetições"
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
                              <span className="sm:hidden block text-[11px] uppercase tracking-normal text-text-muted font-semibold mb-1">
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
                              <span className="sm:hidden block text-[11px] uppercase tracking-normal text-text-muted font-semibold mb-1">
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
                Atribua a cada dia da semana um dos treinos criados na aba
                "Treinos do plano". O mesmo treino pode ser repetido em vários
                dias. Dias sem atribuição contam como descanso.
              </p>
              <ul className="flex flex-col gap-2">
                {WEEK_ORDER.map((d) => {
                  const assigned = schedule[d];
                  return (
                    <li
                      key={d}
                      className="flex items-center gap-3 py-2 px-3 rounded-md bg-bg-elevated"
                    >
                      <span className="text-body font-semibold text-text-primary w-24 shrink-0">
                        {DAY_SHORT[d]}
                      </span>
                      <Select
                        aria-label={`Treino de ${DAY_SHORT[d]}`}
                        value={assigned ?? ""}
                        onChange={(e) =>
                          assignDay(d, e.target.value || null)
                        }
                        className="flex-1 min-w-0"
                      >
                        <option value="">Descanso</option>
                        {sessions.map((s) => (
                          <option key={s.id} value={s.id}>
                            Treino {s.letter}
                            {s.name ? ` - ${s.name}` : ""}
                          </option>
                        ))}
                      </Select>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </TabsContent>
        </Tabs>
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
          {saving
            ? "Salvando..."
            : isEdit
              ? "Salvar alterações"
              : "Salvar plano"}
        </Button>
      </div>
    </div>
  );
}
