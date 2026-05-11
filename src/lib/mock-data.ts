import { avatarUrl } from "./utils";
import type {
  ActivityEvent,
  BodyMetric,
  Exam,
  Exercise,
  LoggedExercise,
  LoggedSet,
  MuscleGroup,
  User,
  WorkoutLog,
  WorkoutPlan,
  WorkoutSessionTemplate,
} from "./types";

// ---------------------------------------------------------------------------
// "Today" — frozen mock date so the demo is reproducible.
// Domingo, 10 de maio de 2026 (per AUGE-BUILD-PROMPT).
// ---------------------------------------------------------------------------
export const TODAY_ISO = "2026-05-10";
export const NOW_ISO = "2026-05-10T10:30:00";

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export const personal: User = {
  id: "u_personal_carlos",
  name: "Carlos Mendes",
  email: "carlos@auge.app",
  role: "personal",
  avatar: avatarUrl("Carlos Mendes"),
  cref: "012345-G/SP",
  studentIds: [
    "u_aluno_bruno",
    "u_aluno_marina",
    "u_aluno_pedro",
    "u_aluno_julia",
  ],
};

export const aluno: User = {
  id: "u_aluno_bruno",
  name: "Bruno Freitas",
  email: "bruno@auge.app",
  role: "aluno",
  avatar: avatarUrl("Bruno Freitas"),
  birthDate: "1993-08-14",
  phone: "+55 11 98765-4321",
  heightCm: 178,
  goal: "Hipertrofia e força",
  personalId: personal.id,
  activePlanId: "plan_hipertrofia_maio_2026",
};

export const otherAlunos: User[] = [
  {
    id: "u_aluno_marina",
    name: "Marina Costa",
    email: "marina@auge.app",
    role: "aluno",
    avatar: avatarUrl("Marina Costa", "168d3f"),
    personalId: personal.id,
    goal: "Emagrecimento",
  },
  {
    id: "u_aluno_pedro",
    name: "Pedro Almeida",
    email: "pedro@auge.app",
    role: "aluno",
    avatar: avatarUrl("Pedro Almeida", "1db954"),
    personalId: personal.id,
    goal: "Força",
  },
  {
    id: "u_aluno_julia",
    name: "Julia Santos",
    email: "julia@auge.app",
    role: "aluno",
    avatar: avatarUrl("Julia Santos", "4d4d4d"),
    personalId: personal.id,
    goal: "Reabilitação",
  },
];

export const allAlunos = [aluno, ...otherAlunos];

// ---------------------------------------------------------------------------
// Exercise library (60+ across 8 muscle groups)
// ---------------------------------------------------------------------------
function ex(
  id: string,
  name: string,
  muscleGroup: MuscleGroup,
  description?: string,
): Exercise {
  return { id, name, muscleGroup, description };
}

export const exercises: Exercise[] = [
  // Peito (8)
  ex("ex_supino_reto", "Supino reto com barra", "Peito"),
  ex("ex_supino_inclinado_hat", "Supino inclinado com halteres", "Peito"),
  ex("ex_supino_declinado", "Supino declinado", "Peito"),
  ex("ex_crucifixo", "Crucifixo com halteres", "Peito"),
  ex("ex_crossover", "Crossover na polia", "Peito"),
  ex("ex_flexao", "Flexão de braço", "Peito"),
  ex("ex_peck_deck", "Peck deck", "Peito"),
  ex("ex_pullover", "Pullover com halter", "Peito"),

  // Costas (8)
  ex("ex_puxada_frente", "Puxada frente na polia", "Costas"),
  ex("ex_puxada_atras", "Puxada atrás", "Costas"),
  ex("ex_remada_curvada", "Remada curvada com barra", "Costas"),
  ex("ex_remada_cavalinho", "Remada cavalinho", "Costas"),
  ex("ex_remada_baixa", "Remada baixa na polia", "Costas"),
  ex("ex_pulldown", "Pulldown unilateral", "Costas"),
  ex("ex_terra", "Levantamento terra", "Costas"),
  ex("ex_barra_fixa", "Barra fixa", "Costas"),

  // Pernas (9)
  ex("ex_agacha_livre", "Agachamento livre", "Pernas"),
  ex("ex_leg_press", "Leg press 45°", "Pernas"),
  ex("ex_extensora", "Cadeira extensora", "Pernas"),
  ex("ex_flexora", "Mesa flexora", "Pernas"),
  ex("ex_stiff", "Stiff", "Pernas"),
  ex("ex_avanco", "Avanço com halteres", "Pernas"),
  ex("ex_hack", "Hack squat", "Pernas"),
  ex("ex_panturrilha_pe", "Panturrilha em pé", "Pernas"),
  ex("ex_panturrilha_sentado", "Panturrilha sentado", "Pernas"),

  // Ombros (7)
  ex("ex_desenvolvimento_militar", "Desenvolvimento militar", "Ombros"),
  ex("ex_desenvolvimento_hat", "Desenvolvimento com halteres", "Ombros"),
  ex("ex_elevacao_lateral", "Elevação lateral", "Ombros"),
  ex("ex_elevacao_frontal", "Elevação frontal", "Ombros"),
  ex("ex_elevacao_posterior", "Elevação posterior", "Ombros"),
  ex("ex_encolhimento", "Encolhimento", "Ombros"),
  ex("ex_arnold_press", "Arnold press", "Ombros"),

  // Bíceps (6)
  ex("ex_rosca_direta", "Rosca direta com barra", "Bíceps"),
  ex("ex_rosca_alternada", "Rosca alternada com halteres", "Bíceps"),
  ex("ex_rosca_martelo", "Rosca martelo", "Bíceps"),
  ex("ex_rosca_scott", "Rosca scott", "Bíceps"),
  ex("ex_rosca_21", "Rosca 21", "Bíceps"),
  ex("ex_rosca_concentrada", "Rosca concentrada", "Bíceps"),

  // Tríceps (6)
  ex("ex_triceps_polia", "Tríceps na polia", "Tríceps"),
  ex("ex_triceps_testa", "Tríceps testa com halter", "Tríceps"),
  ex("ex_triceps_frances", "Tríceps francês", "Tríceps"),
  ex("ex_triceps_coice", "Tríceps coice", "Tríceps"),
  ex("ex_mergulho", "Mergulho no banco", "Tríceps"),
  ex("ex_triceps_corda", "Tríceps com corda", "Tríceps"),

  // Abdômen (6)
  ex("ex_abdominal_supra", "Abdominal supra", "Abdômen"),
  ex("ex_abdominal_infra", "Abdominal infra", "Abdômen"),
  ex("ex_prancha", "Prancha isométrica", "Abdômen"),
  ex("ex_russian_twist", "Russian twist", "Abdômen"),
  ex("ex_bicicleta", "Abdominal bicicleta", "Abdômen"),
  ex("ex_canivete", "Abdominal canivete", "Abdômen"),

  // Cardio (6)
  ex("ex_esteira", "Esteira", "Cardio"),
  ex("ex_bike", "Bicicleta ergométrica", "Cardio"),
  ex("ex_eliptico", "Elíptico", "Cardio"),
  ex("ex_corrida", "Corrida ao ar livre", "Cardio"),
  ex("ex_hiit", "HIIT 4x4", "Cardio"),
  ex("ex_burpee", "Burpee", "Cardio"),
];

export const exercisesById = new Map(exercises.map((e) => [e.id, e]));

export const muscleGroups: MuscleGroup[] = [
  "Peito",
  "Costas",
  "Pernas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Abdômen",
  "Cardio",
];

// ---------------------------------------------------------------------------
// Active workout plan (Bruno) — "Hipertrofia — Maio 2026"
// Period: 2026-04-13 (segunda) → 2026-05-31 — 4x/week (A seg, B ter, C qui, D dom)
// (Domingo escolhido para a sessão D para casar com o exemplo do build prompt.)
// ---------------------------------------------------------------------------

const sessionTemplates: WorkoutSessionTemplate[] = [
  {
    id: "sess_A",
    letter: "A",
    name: "Peito e Tríceps",
    fullName: "Treino A — Peito e Tríceps",
    dayOfWeek: "segunda",
    estimatedMinutes: 55,
    exercises: [
      {
        id: "pex_A_1",
        exerciseId: "ex_supino_reto",
        sets: 4,
        reps: "8-10",
        restSeconds: 90,
        weightKgSuggested: 60,
      },
      {
        id: "pex_A_2",
        exerciseId: "ex_supino_inclinado_hat",
        sets: 3,
        reps: "10-12",
        restSeconds: 75,
        weightKgSuggested: 22,
      },
      {
        id: "pex_A_3",
        exerciseId: "ex_crucifixo",
        sets: 3,
        reps: "12",
        restSeconds: 60,
        weightKgSuggested: 14,
      },
      {
        id: "pex_A_4",
        exerciseId: "ex_triceps_polia",
        sets: 4,
        reps: "12",
        restSeconds: 60,
        weightKgSuggested: 25,
      },
      {
        id: "pex_A_5",
        exerciseId: "ex_triceps_testa",
        sets: 3,
        reps: "10-12",
        restSeconds: 60,
        weightKgSuggested: 12,
      },
    ],
  },
  {
    id: "sess_B",
    letter: "B",
    name: "Costas e Bíceps",
    fullName: "Treino B — Costas e Bíceps",
    dayOfWeek: "terca",
    estimatedMinutes: 55,
    exercises: [
      {
        id: "pex_B_1",
        exerciseId: "ex_puxada_frente",
        sets: 4,
        reps: "10",
        restSeconds: 90,
        weightKgSuggested: 55,
      },
      {
        id: "pex_B_2",
        exerciseId: "ex_remada_curvada",
        sets: 4,
        reps: "8-10",
        restSeconds: 90,
        weightKgSuggested: 50,
      },
      {
        id: "pex_B_3",
        exerciseId: "ex_remada_cavalinho",
        sets: 3,
        reps: "10",
        restSeconds: 75,
        weightKgSuggested: 40,
      },
      {
        id: "pex_B_4",
        exerciseId: "ex_rosca_direta",
        sets: 4,
        reps: "10",
        restSeconds: 60,
        weightKgSuggested: 25,
      },
      {
        id: "pex_B_5",
        exerciseId: "ex_rosca_alternada",
        sets: 3,
        reps: "10",
        restSeconds: 60,
        weightKgSuggested: 12,
      },
    ],
  },
  {
    id: "sess_C",
    letter: "C",
    name: "Pernas",
    fullName: "Treino C — Pernas",
    dayOfWeek: "quinta",
    estimatedMinutes: 60,
    exercises: [
      {
        id: "pex_C_1",
        exerciseId: "ex_agacha_livre",
        sets: 4,
        reps: "8",
        restSeconds: 120,
        weightKgSuggested: 80,
      },
      {
        id: "pex_C_2",
        exerciseId: "ex_leg_press",
        sets: 4,
        reps: "10-12",
        restSeconds: 90,
        weightKgSuggested: 180,
      },
      {
        id: "pex_C_3",
        exerciseId: "ex_extensora",
        sets: 3,
        reps: "12",
        restSeconds: 60,
        weightKgSuggested: 50,
      },
      {
        id: "pex_C_4",
        exerciseId: "ex_flexora",
        sets: 3,
        reps: "12",
        restSeconds: 60,
        weightKgSuggested: 40,
      },
      {
        id: "pex_C_5",
        exerciseId: "ex_panturrilha_pe",
        sets: 4,
        reps: "15",
        restSeconds: 45,
        weightKgSuggested: 80,
      },
    ],
  },
  {
    id: "sess_D",
    letter: "D",
    name: "Ombros e Abdômen",
    fullName: "Treino D — Ombros e Abdômen",
    dayOfWeek: "domingo",
    estimatedMinutes: 45,
    exercises: [
      {
        id: "pex_D_1",
        exerciseId: "ex_desenvolvimento_militar",
        sets: 4,
        reps: "10",
        restSeconds: 90,
        weightKgSuggested: 30,
      },
      {
        id: "pex_D_2",
        exerciseId: "ex_elevacao_lateral",
        sets: 4,
        reps: "12",
        restSeconds: 60,
        weightKgSuggested: 8,
      },
      {
        id: "pex_D_3",
        exerciseId: "ex_elevacao_frontal",
        sets: 3,
        reps: "12",
        restSeconds: 60,
        weightKgSuggested: 8,
      },
      {
        id: "pex_D_4",
        exerciseId: "ex_abdominal_infra",
        sets: 3,
        reps: "15",
        restSeconds: 45,
        weightKgSuggested: 0,
      },
      {
        id: "pex_D_5",
        exerciseId: "ex_prancha",
        sets: 3,
        reps: "60s",
        restSeconds: 30,
        weightKgSuggested: 0,
      },
    ],
  },
];

export const activePlan: WorkoutPlan = {
  id: "plan_hipertrofia_maio_2026",
  name: "Hipertrofia — Maio 2026",
  description:
    "Bloco de hipertrofia 4x/semana, foco em membros superiores e pernas com volume progressivo.",
  studentId: aluno.id,
  personalId: personal.id,
  startDate: "2026-04-13",
  endDate: "2026-05-31",
  weeklyFrequency: 4,
  status: "ativo",
  sessions: sessionTemplates,
};

export const sessionTemplatesById = new Map(
  sessionTemplates.map((s) => [s.id, s]),
);

// ---------------------------------------------------------------------------
// Workout history generator (Bruno) — ~17 sessions over last 30 days
// ---------------------------------------------------------------------------

interface ScheduledDate {
  date: string; // YYYY-MM-DD
  session: WorkoutSessionTemplate;
}

const scheduledDates: ScheduledDate[] = [
  { date: "2026-04-13", session: sessionTemplates[0] }, // A
  { date: "2026-04-14", session: sessionTemplates[1] }, // B
  { date: "2026-04-16", session: sessionTemplates[2] }, // C
  { date: "2026-04-19", session: sessionTemplates[3] }, // D
  { date: "2026-04-20", session: sessionTemplates[0] },
  { date: "2026-04-21", session: sessionTemplates[1] },
  { date: "2026-04-23", session: sessionTemplates[2] },
  { date: "2026-04-26", session: sessionTemplates[3] },
  { date: "2026-04-27", session: sessionTemplates[0] },
  { date: "2026-04-28", session: sessionTemplates[1] },
  { date: "2026-04-30", session: sessionTemplates[2] },
  { date: "2026-05-03", session: sessionTemplates[3] },
  { date: "2026-05-04", session: sessionTemplates[0] },
  { date: "2026-05-05", session: sessionTemplates[1] },
  { date: "2026-05-07", session: sessionTemplates[2] },
  { date: "2026-05-10", session: sessionTemplates[3] }, // today (em andamento)
];

// Status pattern per index (length matches scheduledDates):
// c = concluido, p = parcial (mostly concluido a few skipped), n = nao realizado, a = em_andamento (today)
const statusPattern: ("c" | "p" | "n" | "a")[] = [
  "c", // 04-13 A
  "c", // 04-14 B
  "p", // 04-16 C — parcial (dor no ombro)
  "c", // 04-19 D
  "c", // 04-20 A
  "n", // 04-21 B — faltou
  "c", // 04-23 C
  "c", // 04-26 D
  "c", // 04-27 A
  "c", // 04-28 B
  "p", // 04-30 C — parcial (falta de tempo)
  "c", // 05-03 D
  "c", // 05-04 A
  "c", // 05-05 B
  "p", // 05-07 C — parcial
  "a", // 05-10 D — em andamento (today)
];

function jitter(seed: number, range: number): number {
  // deterministic pseudo-random in [-range, +range]
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  const r = x - Math.floor(x); // 0..1
  return (r - 0.5) * 2 * range;
}

function timeOfDay(date: string, hour: number, minute: number): string {
  const h = hour.toString().padStart(2, "0");
  const m = minute.toString().padStart(2, "0");
  return `${date}T${h}:${m}:00`;
}

function generateLog(
  scheduled: ScheduledDate,
  idx: number,
  status: "c" | "p" | "n" | "a",
): WorkoutLog {
  const { date, session } = scheduled;
  const startHour = 18; // typical evening
  const startMinute = 30;

  if (status === "n") {
    return {
      id: `log_${date}_${session.letter}`,
      planId: activePlan.id,
      sessionTemplateId: session.id,
      sessionLetter: session.letter,
      sessionName: session.name,
      studentId: aluno.id,
      date,
      status: "pulado",
      exercises: session.exercises.map((p) => ({
        prescribedExerciseId: p.id,
        exerciseId: p.exerciseId,
        exerciseName: exercisesById.get(p.exerciseId)?.name ?? "",
        muscleGroup: exercisesById.get(p.exerciseId)?.muscleGroup ?? "Peito",
        prescribedSets: p.sets,
        prescribedReps: p.reps,
        sets: [],
        skipped: true,
      })),
    };
  }

  // c, p, a — generate sets
  const isParcial = status === "p";
  const isEmAndamento = status === "a";
  const skipFromIdx = isParcial
    ? Math.max(2, session.exercises.length - 2)
    : isEmAndamento
      ? Math.ceil(session.exercises.length / 2)
      : session.exercises.length;

  const loggedExercises: LoggedExercise[] = session.exercises.map(
    (p, exIdx) => {
      const meta = exercisesById.get(p.exerciseId);
      const fullSkip = exIdx >= skipFromIdx;
      const sets: LoggedSet[] = [];
      if (!fullSkip) {
        for (let s = 1; s <= p.sets; s++) {
          const seed = idx * 1000 + exIdx * 100 + s;
          const repsBase = parseInt(p.reps, 10) || 10;
          const repsActual = Math.max(
            6,
            Math.round(repsBase + jitter(seed, 1.2)),
          );
          const weightActual = Math.max(
            0,
            Math.round((p.weightKgSuggested + jitter(seed + 7, 1.5)) * 2) / 2,
          );
          const loggedAt = timeOfDay(
            date,
            startHour,
            startMinute + exIdx * 6 + (s - 1) * 2,
          );
          sets.push({
            setNumber: s,
            weightKg: weightActual,
            reps: repsActual,
            completed: true,
            loggedAt,
          });
        }
      }
      return {
        prescribedExerciseId: p.id,
        exerciseId: p.exerciseId,
        exerciseName: meta?.name ?? "",
        muscleGroup: meta?.muscleGroup ?? "Peito",
        prescribedSets: p.sets,
        prescribedReps: p.reps,
        sets,
        skipped: fullSkip,
        skipReason: fullSkip
          ? isParcial
            ? exIdx === skipFromIdx
              ? "Dor no ombro"
              : "Falta de tempo"
            : undefined
          : undefined,
      };
    },
  );

  const totalVolume = loggedExercises.reduce(
    (acc, e) =>
      acc + e.sets.reduce((a, s) => a + s.weightKg * s.reps, 0),
    0,
  );

  const startedAt = timeOfDay(date, startHour, startMinute);
  if (isEmAndamento) {
    return {
      id: `log_${date}_${session.letter}`,
      planId: activePlan.id,
      sessionTemplateId: session.id,
      sessionLetter: session.letter,
      sessionName: session.name,
      studentId: aluno.id,
      date,
      startedAt: NOW_ISO,
      status: "em_andamento",
      totalVolumeKg: Math.round(totalVolume),
      exercises: loggedExercises,
    };
  }

  const durationMin = session.estimatedMinutes + Math.round(jitter(idx, 6));
  const finishedAt = timeOfDay(
    date,
    startHour,
    startMinute + durationMin,
  );
  return {
    id: `log_${date}_${session.letter}`,
    planId: activePlan.id,
    sessionTemplateId: session.id,
    sessionLetter: session.letter,
    sessionName: session.name,
    studentId: aluno.id,
    date,
    startedAt,
    finishedAt,
    status: isParcial ? "pulado" : "concluido",
    durationSeconds: durationMin * 60,
    totalVolumeKg: Math.round(totalVolume),
    exercises: loggedExercises,
  };
}

export const workoutLogs: WorkoutLog[] = scheduledDates.map((s, i) =>
  generateLog(s, i, statusPattern[i]),
);

export const logsById = new Map(workoutLogs.map((l) => [l.id, l]));

// In-progress (today's) log
export const todayLog = workoutLogs.find((l) => l.status === "em_andamento");

// Upcoming sessions (next 5 after today)
export const upcomingSessions: { date: string; session: WorkoutSessionTemplate }[] = [
  { date: "2026-05-11", session: sessionTemplates[0] },
  { date: "2026-05-12", session: sessionTemplates[1] },
  { date: "2026-05-14", session: sessionTemplates[2] },
  { date: "2026-05-17", session: sessionTemplates[3] },
  { date: "2026-05-18", session: sessionTemplates[0] },
];

// ---------------------------------------------------------------------------
// Body metrics — 12 weeks evolution (Bruno)
// Peso 82.5 → 80.1, BF 22 → 18.5, cintura 92 → 87, braço 36 → 37.5, coxa 58 → 60
// ---------------------------------------------------------------------------

function linear(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

export const bodyMetrics: BodyMetric[] = Array.from({ length: 12 }).map(
  (_, i) => {
    const t = i / 11;
    // weekly walk back from TODAY by (11 - i) weeks
    const weeksAgo = 11 - i;
    const d = new Date(TODAY_ISO);
    d.setDate(d.getDate() - weeksAgo * 7);
    const iso = d.toISOString().slice(0, 10);
    const noise = jitter(i + 11, 0.15);
    return {
      id: `metric_${iso}`,
      studentId: aluno.id,
      date: iso,
      weightKg: parseFloat((linear(82.5, 80.1, t) + noise).toFixed(1)),
      bodyFatPercent: parseFloat(
        (linear(22, 18.5, t) + noise * 0.3).toFixed(1),
      ),
      waistCm: parseFloat((linear(92, 87, t) + noise * 0.6).toFixed(1)),
      hipCm: parseFloat((linear(102, 99, t) + noise * 0.4).toFixed(1)),
      chestCm: parseFloat((linear(101, 104, t) + noise * 0.4).toFixed(1)),
      armCm: parseFloat((linear(36, 37.5, t) + noise * 0.2).toFixed(1)),
      thighCm: parseFloat((linear(58, 60, t) + noise * 0.3).toFixed(1)),
      calfCm: parseFloat((linear(37, 38.5, t) + noise * 0.2).toFixed(1)),
      notes:
        i === 11
          ? "Sentindo mais força nas pernas. Energia alta."
          : undefined,
    };
  },
);

// ---------------------------------------------------------------------------
// Exams (Bruno)
// ---------------------------------------------------------------------------
export const exams: Exam[] = [
  {
    id: "exam_hemograma_2025_12",
    studentId: aluno.id,
    type: "Hemograma completo",
    date: "2025-12-15",
    fileUrl: "#",
  },
  {
    id: "exam_bioimpedancia_2026_01",
    studentId: aluno.id,
    type: "Bioimpedância",
    date: "2026-01-02",
    fileUrl: "#",
  },
  {
    id: "exam_avaliacao_2026_01",
    studentId: aluno.id,
    type: "Avaliação física",
    date: "2026-01-06",
    fileUrl: "#",
  },
];

// ---------------------------------------------------------------------------
// Activity feed (Personal dashboard)
// ---------------------------------------------------------------------------
export const activityEvents: ActivityEvent[] = [
  {
    id: "act_1",
    type: "workout_started",
    studentId: aluno.id,
    studentName: aluno.name,
    message: "iniciou Treino D — Ombros e Abdômen",
    timestamp: "2026-05-10T10:25:00",
    link: `/alunos/${aluno.id}`,
  },
  {
    id: "act_2",
    type: "workout_finished",
    studentId: "u_aluno_marina",
    studentName: "Marina Costa",
    message: "finalizou Treino B — Cardio HIIT",
    timestamp: "2026-05-10T09:50:00",
  },
  {
    id: "act_3",
    type: "metric_added",
    studentId: "u_aluno_pedro",
    studentName: "Pedro Almeida",
    message: "registrou nova medida (-1.2kg)",
    timestamp: "2026-05-09T19:10:00",
  },
  {
    id: "act_4",
    type: "workout_skipped",
    studentId: "u_aluno_julia",
    studentName: "Julia Santos",
    message: "pulou Treino C — Mobilidade",
    timestamp: "2026-05-09T18:00:00",
  },
  {
    id: "act_5",
    type: "workout_finished",
    studentId: aluno.id,
    studentName: aluno.name,
    message: "finalizou Treino B — Costas e Bíceps",
    timestamp: "2026-05-05T19:25:00",
  },
  {
    id: "act_6",
    type: "exam_uploaded",
    studentId: aluno.id,
    studentName: aluno.name,
    message: "anexou Avaliação física",
    timestamp: "2026-01-06T14:00:00",
  },
];

// ---------------------------------------------------------------------------
// Aggregate stats for Bruno (this week)
// ---------------------------------------------------------------------------
function weekStartIso(iso: string) {
  const d = new Date(iso);
  const dow = d.getDay(); // 0=sun
  // Semana começa segunda
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export const thisWeekStart = weekStartIso(TODAY_ISO);

export const alunoStats = {
  treinosCompletosSemana: workoutLogs.filter(
    (l) => l.date >= thisWeekStart && l.status === "concluido",
  ).length,
  treinosPrescritosSemana: 4,
  streakDias: 12,
  volumeSemanaKg: 18450,
  tempoMedioMinutos: 52,
};

// Other students' summary for personal dashboard cards
export interface AlunoSummary {
  user: User;
  plano: string;
  aderencia: number; // 0-100
  treinosSemana: { feitos: number; prescritos: number };
  ultimoTreino: string; // ISO date
  status: "ativo" | "pausado";
}

export const alunosSummary: AlunoSummary[] = [
  {
    user: aluno,
    plano: "Hipertrofia — Maio 2026",
    aderencia: 88,
    treinosSemana: { feitos: 3, prescritos: 4 },
    ultimoTreino: "2026-05-07",
    status: "ativo",
  },
  {
    user: otherAlunos[0],
    plano: "Emagrecimento — Maio 2026",
    aderencia: 92,
    treinosSemana: { feitos: 4, prescritos: 4 },
    ultimoTreino: "2026-05-10",
    status: "ativo",
  },
  {
    user: otherAlunos[1],
    plano: "Força — Bloco 3",
    aderencia: 76,
    treinosSemana: { feitos: 2, prescritos: 3 },
    ultimoTreino: "2026-05-08",
    status: "ativo",
  },
  {
    user: otherAlunos[2],
    plano: "Reabilitação de joelho",
    aderencia: 58,
    treinosSemana: { feitos: 1, prescritos: 3 },
    ultimoTreino: "2026-05-04",
    status: "ativo",
  },
];

// Mini plan summaries for personal dashboard
export const personalPlans = [
  {
    id: "plan_hipertrofia_maio_2026",
    name: "Hipertrofia — Maio 2026",
    aluno: aluno.name,
    status: "ativo" as const,
    weeklyFrequency: 4,
    updatedAt: "2026-04-30",
  },
  {
    id: "plan_emagrecimento_marina",
    name: "Emagrecimento — Maio 2026",
    aluno: "Marina Costa",
    status: "ativo" as const,
    weeklyFrequency: 4,
    updatedAt: "2026-04-28",
  },
  {
    id: "plan_forca_pedro",
    name: "Força — Bloco 3",
    aluno: "Pedro Almeida",
    status: "ativo" as const,
    weeklyFrequency: 3,
    updatedAt: "2026-04-20",
  },
  {
    id: "plan_reab_julia",
    name: "Reabilitação de joelho",
    aluno: "Julia Santos",
    status: "ativo" as const,
    weeklyFrequency: 3,
    updatedAt: "2026-05-01",
  },
];

// ---------------------------------------------------------------------------
// Helpers for views
// ---------------------------------------------------------------------------

export function getActiveSessionForToday(): WorkoutSessionTemplate | null {
  // Hard-coded para o demo: hoje (domingo) cai no Treino D.
  return sessionTemplates[3];
}

export function getWeeklyVolume(): { week: string; volumeKg: number }[] {
  // Últimas 8 semanas — agrega por week start.
  const buckets = new Map<string, number>();
  for (const log of workoutLogs) {
    if (!log.totalVolumeKg) continue;
    const ws = weekStartIso(log.date);
    buckets.set(ws, (buckets.get(ws) ?? 0) + log.totalVolumeKg);
  }
  // Build 8 most recent week buckets
  const sorted = Array.from(buckets.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return sorted.slice(-8).map(([week, volumeKg]) => ({ week, volumeKg }));
}

export function getWeeklyAnalysis(): string {
  return "Você aumentou 8% o volume total esta semana comparado à anterior. Seu peso de supino subiu 2.5kg em 3 semanas — evolução acima da média. Mantenha a frequência.";
}
