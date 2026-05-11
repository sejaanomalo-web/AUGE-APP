// Domain types for the AUGE app (Fase 1 estática).

export type Role = "aluno" | "personal";

export type WorkoutStatus =
  | "concluido"
  | "em_andamento"
  | "pulado"
  | "nao_iniciado";

export type MuscleGroup =
  | "Peito"
  | "Costas"
  | "Pernas"
  | "Ombros"
  | "Bíceps"
  | "Tríceps"
  | "Abdômen"
  | "Cardio";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  birthDate?: string; // ISO YYYY-MM-DD
  phone?: string;
  heightCm?: number;
  goal?: string;
  // Aluno
  personalId?: string;
  activePlanId?: string;
  // Personal
  cref?: string;
  studentIds?: string[];
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  description?: string;
  // Placeholder image (unsplash query)
  imageQuery?: string;
}

export type DayOfWeek =
  | "segunda"
  | "terca"
  | "quarta"
  | "quinta"
  | "sexta"
  | "sabado"
  | "domingo";

export interface PrescribedSet {
  /** Reps prescritas, ex. "8-10" ou "12". */
  reps: string;
  weightKg: number;
}

export interface PrescribedExercise {
  id: string;
  exerciseId: string;
  sets: number;
  reps: string; // "8-10", "12", "60s"
  restSeconds: number;
  weightKgSuggested: number;
  notes?: string;
}

export interface WorkoutSessionTemplate {
  id: string;
  letter: "A" | "B" | "C" | "D" | "E";
  name: string; // "Peito e Tríceps"
  fullName: string; // "Treino A — Peito e Tríceps"
  dayOfWeek: DayOfWeek;
  estimatedMinutes: number;
  exercises: PrescribedExercise[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  studentId: string;
  personalId: string;
  startDate: string; // ISO date
  endDate: string;
  weeklyFrequency: number;
  status: "ativo" | "rascunho" | "arquivado";
  sessions: WorkoutSessionTemplate[];
}

export interface LoggedSet {
  setNumber: number;
  weightKg: number;
  reps: number;
  completed: boolean;
  loggedAt: string; // ISO datetime
  notes?: string;
}

export interface LoggedExercise {
  prescribedExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  prescribedSets: number;
  prescribedReps: string;
  sets: LoggedSet[];
  skipped?: boolean;
  skipReason?: string;
}

export interface WorkoutLog {
  id: string;
  planId: string;
  sessionTemplateId: string;
  sessionLetter: "A" | "B" | "C" | "D" | "E";
  sessionName: string;
  studentId: string;
  date: string; // ISO date (when prescribed)
  startedAt?: string; // ISO datetime
  finishedAt?: string;
  status: WorkoutStatus;
  durationSeconds?: number;
  totalVolumeKg?: number;
  exercises: LoggedExercise[];
}

export interface BodyMetric {
  id: string;
  studentId: string;
  date: string;
  weightKg: number;
  bodyFatPercent: number;
  waistCm: number;
  hipCm?: number;
  chestCm?: number;
  armCm: number;
  thighCm: number;
  calfCm?: number;
  notes?: string;
}

export interface Exam {
  id: string;
  studentId: string;
  type: string;
  date: string;
  fileUrl: string;
}

export interface ActivityEvent {
  id: string;
  type:
    | "workout_finished"
    | "workout_started"
    | "workout_skipped"
    | "metric_added"
    | "exam_uploaded";
  studentId: string;
  studentName: string;
  message: string;
  timestamp: string;
  link?: string;
}
