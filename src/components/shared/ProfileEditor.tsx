"use client";

import * as React from "react";
import { Camera, Check, Loader2, Pencil, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { updateProfile, uploadAvatar } from "@/lib/actions/users";

const SPORTS = ["Musculação", "Corrida"];

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
  birthDate: string | null; // YYYY-MM-DD
  height: number | null;
  currentWeight: number | null;
  goal: string | null;
  cref: string | null;
  sportsPracticed: string[];
  role: "PERSONAL" | "ALUNO" | null;
}

export function ProfileEditor({ user }: { user: ProfileData }) {
  const [editing, setEditing] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = React.useState(user.avatarUrl);

  const [name, setName] = React.useState(user.name);
  const [phone, setPhone] = React.useState(user.phone ?? "");
  const [birthDate, setBirthDate] = React.useState(user.birthDate ?? "");
  const [height, setHeight] = React.useState(
    user.height != null ? String(user.height) : "",
  );
  const [currentWeight, setCurrentWeight] = React.useState(
    user.currentWeight != null ? String(user.currentWeight) : "",
  );
  const [goal, setGoal] = React.useState(user.goal ?? "");
  const [cref, setCref] = React.useState(user.cref ?? "");
  const [sports, setSports] = React.useState<string[]>(user.sportsPracticed);

  function toggleSport(s: string) {
    setSports((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  function cancel() {
    setName(user.name);
    setPhone(user.phone ?? "");
    setBirthDate(user.birthDate ?? "");
    setHeight(user.height != null ? String(user.height) : "");
    setCurrentWeight(
      user.currentWeight != null ? String(user.currentWeight) : "",
    );
    setGoal(user.goal ?? "");
    setCref(user.cref ?? "");
    setSports(user.sportsPracticed);
    setError(null);
    setEditing(false);
  }

  async function save() {
    setSubmitting(true);
    setError(null);
    try {
      const heightNum = height === "" ? null : parseFloat(height);
      const weightNum =
        currentWeight === "" ? null : parseFloat(currentWeight);

      // Client-side guards so the user gets immediate feedback instead of
      // waiting for the round-trip to surface the same complaint.
      if (heightNum !== null && Number.isNaN(heightNum)) {
        setError("Altura inválida.");
        setSubmitting(false);
        return;
      }
      if (weightNum !== null && Number.isNaN(weightNum)) {
        setError("Peso inválido.");
        setSubmitting(false);
        return;
      }
      let parsedBirth: Date | null = null;
      if (birthDate) {
        const d = new Date(birthDate);
        if (Number.isNaN(d.getTime())) {
          setError("Data de nascimento inválida.");
          setSubmitting(false);
          return;
        }
        parsedBirth = d;
      }

      const result = await updateProfile({
        name: name.trim() || user.name,
        phone: phone.trim(),
        birthDate: parsedBirth,
        height: heightNum,
        currentWeight: weightNum,
        goal: goal.trim(),
        cref: user.role === "PERSONAL" ? cref.trim() : undefined,
        sportsPracticed: sports,
      });
      if (!result.ok) {
        setError(result.error);
        setSubmitting(false);
        return;
      }
      setEditing(false);
      window.location.reload();
    } catch (err) {
      console.error("[ProfileEditor.save] unexpected", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao salvar. Tente novamente.",
      );
      setSubmitting(false);
    }
  }

  async function onPickAvatar(file: File) {
    setUploading(true);
    setError(null);
    try {
      // Client-side size guard mirrors the server (3MB). The Next.js
      // server-action body limit is now 5MB, but we still reject larger
      // images here so the user sees a clear message before upload.
      const MAX_BYTES = 3 * 1024 * 1024;
      if (file.size > MAX_BYTES) {
        setError(
          `Imagem muito grande (${(file.size / 1024 / 1024).toFixed(
            1,
          )} MB). Limite 3 MB.`,
        );
        setUploading(false);
        return;
      }
      const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
      if (!ok) {
        setError("Formato não permitido. Use JPG, PNG ou WebP.");
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadAvatar(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAvatarUrl(result.data.url);
    } catch (err) {
      console.error("[ProfileEditor.onPickAvatar] unexpected", err);
      setError(
        err instanceof Error ? err.message : "Erro ao enviar foto.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <Card variant="default" className="flex items-center gap-4 mb-6">
        <label
          className={cn(
            "relative cursor-pointer group",
            uploading && "pointer-events-none",
          )}
        >
          <Avatar
            src={avatarUrl ?? undefined}
            name={user.name}
            size={72}
          />
          <span className="absolute inset-0 rounded-full bg-bg-base/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            {uploading ? (
              <Loader2
                size={20}
                className="text-text-primary animate-spin"
              />
            ) : (
              <Camera size={20} className="text-text-primary" />
            )}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickAvatar(f);
            }}
          />
        </label>
        <div className="flex-1 min-w-0">
          <p className="text-h2 text-text-primary truncate">{user.name}</p>
          <p className="text-caption text-text-muted truncate">{user.email}</p>
        </div>
        {!editing && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditing(true)}
          >
            <Pencil size={14} aria-hidden /> Editar
          </Button>
        )}
      </Card>

      {editing ? (
        <Card variant="default" className="flex flex-col gap-4">
          <Field label="Nome completo" htmlFor="profile-name">
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Telefone" htmlFor="profile-phone">
              <Input
                id="profile-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+55 11 ..."
                inputMode="tel"
              />
            </Field>
            <Field label="Data de nascimento" htmlFor="profile-birth">
              <Input
                id="profile-birth"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </Field>
            <Field label="Altura (cm)" htmlFor="profile-height">
              <Input
                id="profile-height"
                type="number"
                min={0}
                step={0.5}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                inputMode="decimal"
                placeholder="178"
              />
            </Field>
            <Field label="Peso atual (kg)" htmlFor="profile-weight">
              <Input
                id="profile-weight"
                type="number"
                min={0}
                step={0.1}
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                inputMode="decimal"
                placeholder="80.1"
              />
            </Field>
            <Field
              label="Objetivo"
              htmlFor="profile-goal"
              className="sm:col-span-2"
            >
              <Input
                id="profile-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="ex: Hipertrofia e força"
              />
            </Field>
            {user.role === "PERSONAL" && (
              <Field label="CREF" htmlFor="profile-cref">
                <Input
                  id="profile-cref"
                  value={cref}
                  onChange={(e) => setCref(e.target.value)}
                  placeholder="012345-G/SP"
                />
              </Field>
            )}
          </div>

          <Field label="Esportes que pratica">
            <div className="flex flex-wrap gap-2">
              {SPORTS.map((s) => {
                const active = sports.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSport(s)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-body font-medium transition-colors",
                      active
                        ? "bg-accent text-text-on-accent"
                        : "bg-bg-elevated text-text-secondary hover:text-text-primary",
                    )}
                  >
                    {active && <Check size={14} aria-hidden />}
                    {s}
                  </button>
                );
              })}
            </div>
          </Field>

          {error && (
            <p className="text-body text-error" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={cancel}
              disabled={submitting}
            >
              <X size={14} aria-hidden /> Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={save}
              disabled={submitting}
            >
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </Card>
      ) : (
        <Card variant="default">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <ReadField label="Telefone" value={user.phone} />
            <ReadField
              label="Data de nascimento"
              value={
                user.birthDate
                  ? new Date(user.birthDate).toLocaleDateString("pt-BR")
                  : null
              }
            />
            <ReadField
              label="Altura"
              value={user.height ? `${user.height} cm` : null}
            />
            <ReadField
              label="Peso atual"
              value={
                user.currentWeight ? `${user.currentWeight.toFixed(1)} kg` : null
              }
            />
            <div className="sm:col-span-2">
              <ReadField label="Objetivo" value={user.goal} />
            </div>
            {user.role === "PERSONAL" && (
              <ReadField label="CREF" value={user.cref} />
            )}
            <div className="sm:col-span-2">
              <dt className="text-caption text-text-muted mb-1">
                Esportes que pratica
              </dt>
              {user.sportsPracticed.length === 0 ? (
                <dd className="text-body text-text-muted italic">
                  Nenhum selecionado
                </dd>
              ) : (
                <dd className="flex flex-wrap gap-1.5">
                  {user.sportsPracticed.map((s) => (
                    <span
                      key={s}
                      className="inline-block px-2.5 py-1 rounded-pill bg-accent-glow text-accent text-[12px] font-semibold"
                    >
                      {s}
                    </span>
                  ))}
                </dd>
              )}
            </div>
          </dl>
        </Card>
      )}
    </>
  );
}

function ReadField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <dt className="text-caption text-text-muted">{label}</dt>
      <dd className="text-body-lg text-text-primary">{value || "-"}</dd>
    </div>
  );
}
