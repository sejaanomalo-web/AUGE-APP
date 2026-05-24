-- Optional photo URL attached to each physical evaluation
-- (avaliação física — peso, % gordura, medidas, foto). The URL points
-- at a public file in the `avatars` Supabase bucket under
-- `{studentId}/evaluations/{cuid}.{ext}` — same bucket the profile
-- avatar already uses, no new storage infra needed.
ALTER TABLE "BodyMetric" ADD COLUMN "photoUrl" TEXT;
