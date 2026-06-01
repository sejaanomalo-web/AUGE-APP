"use client";

import * as React from "react";
import {
  Activity,
  HeartPulse,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Field, Textarea, Label } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";
import { extractYoutubeId, parseVideoUrl } from "@/lib/video-embed";
import {
  createCustomExercise,
  deleteExercise,
  updateExercise,
  uploadExerciseImage,
} from "@/lib/actions/exercises";

export interface ExerciseRow {
  id: string;
  name: string;
  muscleGroup: string;
  isCustom: boolean;
  imageUrl: string | null;
  videoUrl: string | null;
  instructions: string | null;
  category: "ACADEMIA" | "CORRIDA";
}

type CategoryFilter = "TODOS" | "ACADEMIA" | "CORRIDA";

const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "ACADEMIA", label: "Academia" },
  { value: "CORRIDA", label: "Corrida" },
];

const MUSCLE_GROUPS = [
  "Peito",
  "Costas",
  "Pernas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Abdômen",
  "Cardio",
];

type DialogState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; exercise: ExerciseRow }
  | { mode: "view"; exercise: ExerciseRow };

export function ExerciciosClient({ exercises }: { exercises: ExerciseRow[] }) {
  const [q, setQ] = React.useState("");
  const [active, setActive] = React.useState<string>("Todos");
  const [activeCategory, setActiveCategory] =
    React.useState<CategoryFilter>("TODOS");
  const [dialog, setDialog] = React.useState<DialogState>({ mode: "closed" });

  const filtered = exercises.filter((e) => {
    const matchQ = q === "" || e.name.toLowerCase().includes(q.toLowerCase());
    const matchG = active === "Todos" || e.muscleGroup === active;
    const matchC = activeCategory === "TODOS" || e.category === activeCategory;
    return matchQ && matchG && matchC;
  });

  return (
    <>
      <div className="flex items-center justify-end mb-3">
        <Button
          variant="primary"
          size="md"
          onClick={() => setDialog({ mode: "create" })}
        >
          <Plus size={18} aria-hidden /> Adicionar exercício
        </Button>
      </div>

      {/* Segmented control de categoria fica acima de tudo: define o universo
          antes do filtro por grupo muscular. */}
      <div className="flex gap-1 mb-4 p-1 bg-bg-elevated rounded-pill w-fit">
        {CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setActiveCategory(opt.value)}
            className={cn(
              "px-4 py-1.5 rounded-pill text-body font-semibold transition-colors",
              activeCategory === opt.value
                ? "bg-accent text-text-on-accent"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          aria-hidden
        />
        <Input
          placeholder="Buscar exercício"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-10 rounded-pill"
        />
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none -mx-1 px-1">
        {(["Todos", ...MUSCLE_GROUPS] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setActive(g)}
            className={cn(
              "shrink-0 px-3 py-2 rounded-pill text-body font-semibold transition-colors",
              active === g
                ? "bg-accent text-text-on-accent"
                : "bg-bg-elevated text-text-secondary hover:text-text-primary",
            )}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((e) => (
          <ExerciseCard
            key={e.id}
            ex={e}
            onView={() => setDialog({ mode: "view", exercise: e })}
            onEdit={() => setDialog({ mode: "edit", exercise: e })}
          />
        ))}
      </div>

      {dialog.mode === "create" && (
        <ExerciseFormDialog
          mode="create"
          onClose={() => setDialog({ mode: "closed" })}
        />
      )}
      {dialog.mode === "edit" && (
        <ExerciseFormDialog
          mode="edit"
          exercise={dialog.exercise}
          onClose={() => setDialog({ mode: "closed" })}
        />
      )}
      {dialog.mode === "view" && (
        <ExerciseViewDialog
          exercise={dialog.exercise}
          onClose={() => setDialog({ mode: "closed" })}
          onEdit={() =>
            setDialog({ mode: "edit", exercise: dialog.exercise })
          }
        />
      )}
    </>
  );
}

function ExerciseCard({
  ex,
  onView,
  onEdit,
}: {
  ex: ExerciseRow;
  onView: () => void;
  onEdit: () => void;
}) {
  return (
    <Card variant="interactive" className="group">
      <button
        type="button"
        onClick={onView}
        className="w-full text-left"
      >
        <div
          aria-hidden
          className="aspect-[4/3] rounded-xl bg-gradient-to-br from-bg-elevated to-bg-card border border-border-subtle mb-3 flex items-center justify-center overflow-hidden pulse-line"
        >
          {ex.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ex.imageUrl}
              alt={ex.name}
              className="w-full h-full object-cover"
            />
          ) : ex.muscleGroup === "Cardio" ? (
            <HeartPulse
              size={48}
              strokeWidth={1.5}
              className="text-accent/40"
            />
          ) : (
            <Activity
              size={48}
              strokeWidth={1.5}
              className="text-accent/40"
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge>{ex.muscleGroup}</Badge>
          {ex.isCustom && <Badge variant="info">Personalizado</Badge>}
        </div>
        <p className="mt-2 text-body-lg font-semibold text-text-primary truncate">
          {ex.name}
        </p>
      </button>
      <div className="flex justify-end gap-1 mt-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
        <IconButton
          aria-label={`Editar ${ex.name}`}
          onClick={onEdit}
          className="w-8 h-8"
        >
          <Pencil size={14} />
        </IconButton>
      </div>
    </Card>
  );
}

function ExerciseViewDialog({
  exercise,
  onClose,
  onEdit,
}: {
  exercise: ExerciseRow;
  onClose: () => void;
  onEdit: () => void;
}) {
  const youtubeId = exercise.videoUrl
    ? extractYoutubeId(exercise.videoUrl)
    : null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={exercise.name}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Badge>{exercise.muscleGroup}</Badge>
          {exercise.isCustom && <Badge variant="info">Personalizado</Badge>}
        </div>

        {exercise.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={exercise.imageUrl}
            alt={exercise.name}
            className="w-full rounded-xl aspect-[4/3] object-cover border border-border-subtle"
          />
        )}

        {youtubeId && (
          <div className="aspect-video rounded-xl overflow-hidden bg-bg-elevated border border-border-subtle">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={exercise.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        )}

        {exercise.videoUrl && !youtubeId && (
          <a
            href={exercise.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline text-body"
          >
            Ver vídeo de demonstração
          </a>
        )}

        {exercise.instructions ? (
          <div>
            <h3 className="text-caption uppercase tracking-normal text-text-muted font-semibold mb-2">
              Instruções
            </h3>
            <p className="text-body text-text-primary whitespace-pre-line">
              {exercise.instructions}
            </p>
          </div>
        ) : (
          <p className="text-body text-text-muted italic">
            Sem instruções registradas.
          </p>
        )}

        <div className="flex justify-end gap-2 mt-2">
          <Button variant="secondary" size="md" onClick={onEdit}>
            <Pencil size={14} aria-hidden /> Editar
          </Button>
          <Button variant="primary" size="md" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function ExerciseFormDialog({
  mode,
  exercise,
  onClose,
}: {
  mode: "create" | "edit";
  exercise?: ExerciseRow;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(exercise?.name ?? "");
  const [muscleGroup, setMuscleGroup] = React.useState(
    exercise?.muscleGroup ?? "Peito",
  );
  const [category, setCategory] = React.useState<"ACADEMIA" | "CORRIDA">(
    exercise?.category ?? "ACADEMIA",
  );
  const [instructions, setInstructions] = React.useState(
    exercise?.instructions ?? "",
  );
  const [videoUrl, setVideoUrl] = React.useState(exercise?.videoUrl ?? "");
  const [imageUrl, setImageUrl] = React.useState(exercise?.imageUrl ?? "");
  const [submitting, setSubmitting] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleImageUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const url = await uploadExerciseImage(formData);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "create") {
        const res = await createCustomExercise({
          name: name.trim(),
          muscleGroup,
          category,
          instructions: instructions.trim() || undefined,
          videoUrl: videoUrl.trim() || undefined,
          imageUrl: imageUrl || undefined,
        });
        if (!res.ok) {
          setError(res.error);
          setSubmitting(false);
          return;
        }
      } else if (exercise) {
        const res = await updateExercise(exercise.id, {
          name: name.trim(),
          muscleGroup,
          category,
          instructions: instructions.trim(),
          videoUrl: videoUrl.trim(),
          imageUrl: imageUrl,
        });
        if (!res.ok) {
          setError(res.error);
          setSubmitting(false);
          return;
        }
      }
      onClose();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
      setSubmitting(false);
    }
  }

  async function onDelete() {
    if (!exercise) return;
    if (
      !confirm(
        `Excluir "${exercise.name}"? Esta ação é permanente. Se o exercício estiver em uso em algum treino ou histórico, a exclusão será bloqueada.`,
      )
    )
      return;
    setSubmitting(true);
    setError(null);
    const res = await deleteExercise(exercise.id);
    if (!res.ok) {
      setError(res.error);
      setSubmitting(false);
      return;
    }
    onClose();
    window.location.reload();
  }

  // The form lives inside the Dialog body but the action buttons live
  // in the Dialog's sticky footer slot - connecting them via
  // form="exercise-form" so Submit on a button outside the <form> still
  // triggers onSubmit. Keeps the Save/Cancel/Excluir row pinned to the
  // bottom of the modal even when the form is taller than the viewport.
  const formId = "exercise-form";

  return (
    <Dialog
      open
      onOpenChange={(o) => !submitting && !o && onClose()}
      title={mode === "create" ? "Adicionar exercício" : "Editar exercício"}
      description={
        mode === "create"
          ? "Crie um exercício novo na sua biblioteca. Você pode editar nome, imagem, vídeo e instruções a qualquer momento."
          : "Atualize qualquer campo. A imagem antiga é removida do armazenamento quando você troca por uma nova."
      }
      footer={
        <div className="flex flex-1 items-center justify-between gap-3">
          {mode === "edit" && exercise ? (
            <Button
              type="button"
              variant="destructive"
              size="md"
              onClick={onDelete}
              disabled={submitting}
            >
              <Trash2 size={14} aria-hidden /> Excluir
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form={formId}
              variant="primary"
              size="md"
              disabled={submitting || uploading}
            >
              {submitting
                ? "Salvando..."
                : mode === "create"
                  ? "Criar"
                  : "Salvar"}
            </Button>
          </div>
        </div>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Nome" htmlFor="ex-name">
          <Input
            id="ex-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="ex: Supino articulado"
          />
        </Field>
        <Field label="Categoria" htmlFor="ex-cat">
          <Select
            id="ex-cat"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as "ACADEMIA" | "CORRIDA")
            }
            required
          >
            <option value="ACADEMIA">Academia</option>
            <option value="CORRIDA">Corrida</option>
          </Select>
        </Field>
        <Field label="Grupo muscular" htmlFor="ex-mg">
          <Select
            id="ex-mg"
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value)}
            required
          >
            {MUSCLE_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Instruções (opcional)"
          htmlFor="ex-instr"
          hint="Como executar o movimento. O aluno vê isso ao iniciar o exercício."
        >
          <Textarea
            id="ex-instr"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="ex: Mantenha as escápulas retraídas, desça a barra até tocar o peitoral..."
          />
        </Field>

        <Field
          label="Link do vídeo (opcional)"
          htmlFor="ex-video"
          hint="YouTube, Vimeo, Instagram ou TikTok. Cole a URL e veja a prévia."
        >
          <Input
            id="ex-video"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            type="url"
          />
          <VideoPreview url={videoUrl} />
        </Field>

        <div>
          <Label>Imagem (opcional)</Label>
          {imageUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full rounded-md aspect-[4/3] object-cover bg-bg-elevated"
              />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-bg-base/80 backdrop-blur flex items-center justify-center text-text-primary hover:bg-bg-base"
                aria-label="Remover imagem"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label
              className={cn(
                "border border-dashed border-border rounded-md py-8 px-4 flex flex-col items-center gap-2 cursor-pointer transition-colors",
                uploading
                  ? "bg-bg-elevated text-text-muted"
                  : "hover:bg-bg-elevated text-text-secondary",
              )}
            >
              <Upload size={20} aria-hidden />
              <span className="text-caption">
                {uploading ? "Enviando..." : "Clique para enviar JPG/PNG/WebP (máx 5MB)"}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageUpload(f);
                }}
              />
            </label>
          )}
        </div>

        {error && (
          <p className="text-body text-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </Dialog>
  );
}

// Preview do vídeo embaixo do Input — usa useDeferredValue pra evitar
// re-render por keystroke enquanto o personal cola a URL.
function VideoPreview({ url }: { url: string }) {
  const deferred = React.useDeferredValue(url);
  const trimmed = deferred.trim();
  const parsed = React.useMemo(() => parseVideoUrl(trimmed), [trimmed]);

  if (!trimmed) return null;

  if (!parsed) {
    return (
      <p className="text-xs text-text-tertiary mt-2">
        URL não reconhecida — o aluno verá apenas um link.
      </p>
    );
  }

  const providerLabel: Record<typeof parsed.provider, string> = {
    youtube: "YouTube",
    vimeo: "Vimeo",
    instagram: "Instagram",
    tiktok: "TikTok",
  };

  return (
    <div className="mt-2 flex flex-col gap-2">
      {parsed.provider === "youtube" && parsed.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={parsed.thumbnailUrl}
          alt="Prévia do vídeo"
          className="rounded aspect-video object-cover w-full"
        />
      ) : (
        <iframe
          src={parsed.embedUrl}
          title="Prévia do vídeo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded aspect-video w-full"
        />
      )}
      <Badge>{providerLabel[parsed.provider]}</Badge>
    </div>
  );
}
