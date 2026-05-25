-- =============================================================================
-- AUGE — RLS Policies (Clerk + Supabase)
-- =============================================================================
-- Pré-requisitos (ver checklist no fim do prompt do Claude):
--   1. Clerk Native Third-Party Auth ativado no Supabase
--      (Dashboard → Authentication → Sign In / Up → Third Party Auth → Add → Clerk)
--   2. Cliente Supabase no browser configurado com `accessToken: () => getToken()`
--      (Clerk SDK) — sem isso, o canal Realtime do NotificationBell para de
--      receber INSERTs depois que RLS for ligada.
--   3. Todas as Server Actions usam SUPABASE_SERVICE_ROLE_KEY → ignoram RLS.
--      As policies abaixo defendem apenas anon + authenticated (browser).
--
-- Convenção: Prisma cria identificadores em PascalCase / camelCase, então
-- TODAS as referências precisam de aspas duplas: "User", "studentId" etc.
-- =============================================================================


-- =============================================================================
-- 0. HELPER FUNCTIONS
-- =============================================================================

-- Clerk userId (sub claim do JWT). Retorna NULL para anon.
CREATE OR REPLACE FUNCTION public.clerk_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() ->> 'sub')::text
$$;

-- True se o user atual é trainer ATIVO de _student_id.
-- SECURITY DEFINER evita recursão de policy ao consultar "TrainerStudent"
-- de dentro de policies de outras tabelas.
CREATE OR REPLACE FUNCTION public.is_trainer_of(_student_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM "TrainerStudent" ts
    WHERE ts."trainerId" = public.clerk_user_id()
      AND ts."studentId" = _student_id
      AND ts.status      = 'ACTIVE'
  )
$$;

-- True se o user atual é aluno ATIVO de _trainer_id.
CREATE OR REPLACE FUNCTION public.is_student_of(_trainer_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM "TrainerStudent" ts
    WHERE ts."studentId" = public.clerk_user_id()
      AND ts."trainerId" = _trainer_id
      AND ts.status      = 'ACTIVE'
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_trainer_of(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_student_of(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_trainer_of(text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_student_of(text) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.clerk_user_id()     TO authenticated, anon;


-- =============================================================================
-- 1. ENABLE RLS EM TODAS AS TABELAS
-- =============================================================================

ALTER TABLE "User"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InviteCode"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TrainerStudent"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkoutPlan"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkoutSession"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Exercise"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SessionExercise"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkoutLog"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExerciseLog"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BodyMetric"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExamUpload"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RunningSession"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlanMetricDefinition" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlanMetricLog"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushSubscription"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasskeyCredential"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Goal"                 ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- 2. POLICIES POR TABELA
-- =============================================================================
-- Padrão: cada bloco começa removendo policies anteriores com mesmo nome
-- (idempotente — pode rodar de novo sem quebrar).
-- =============================================================================

-- ---------- User ---------------------------------------------------------------
DROP POLICY IF EXISTS user_self_select          ON "User";
DROP POLICY IF EXISTS user_self_update          ON "User";
DROP POLICY IF EXISTS user_trainer_read_student ON "User";
DROP POLICY IF EXISTS user_student_read_trainer ON "User";

CREATE POLICY user_self_select ON "User"
  FOR SELECT TO authenticated
  USING (id = public.clerk_user_id());

CREATE POLICY user_self_update ON "User"
  FOR UPDATE TO authenticated
  USING      (id = public.clerk_user_id())
  WITH CHECK (id = public.clerk_user_id());

CREATE POLICY user_trainer_read_student ON "User"
  FOR SELECT TO authenticated
  USING (public.is_trainer_of(id));

CREATE POLICY user_student_read_trainer ON "User"
  FOR SELECT TO authenticated
  USING (public.is_student_of(id));


-- ---------- InviteCode ---------------------------------------------------------
-- Aluno aceita convite via Server Action (service_role) — só o trainer dono
-- enxerga seus próprios convites pelo cliente.
DROP POLICY IF EXISTS invite_trainer_select ON "InviteCode";
DROP POLICY IF EXISTS invite_trainer_write  ON "InviteCode";

CREATE POLICY invite_trainer_select ON "InviteCode"
  FOR SELECT TO authenticated
  USING ("trainerId" = public.clerk_user_id());

CREATE POLICY invite_trainer_write ON "InviteCode"
  FOR ALL TO authenticated
  USING      ("trainerId" = public.clerk_user_id())
  WITH CHECK ("trainerId" = public.clerk_user_id());


-- ---------- TrainerStudent -----------------------------------------------------
DROP POLICY IF EXISTS ts_participant_select ON "TrainerStudent";
DROP POLICY IF EXISTS ts_trainer_insert     ON "TrainerStudent";
DROP POLICY IF EXISTS ts_trainer_update     ON "TrainerStudent";
DROP POLICY IF EXISTS ts_trainer_delete     ON "TrainerStudent";

CREATE POLICY ts_participant_select ON "TrainerStudent"
  FOR SELECT TO authenticated
  USING (
    "trainerId" = public.clerk_user_id()
    OR "studentId" = public.clerk_user_id()
  );

CREATE POLICY ts_trainer_insert ON "TrainerStudent"
  FOR INSERT TO authenticated
  WITH CHECK ("trainerId" = public.clerk_user_id());

CREATE POLICY ts_trainer_update ON "TrainerStudent"
  FOR UPDATE TO authenticated
  USING      ("trainerId" = public.clerk_user_id())
  WITH CHECK ("trainerId" = public.clerk_user_id());

CREATE POLICY ts_trainer_delete ON "TrainerStudent"
  FOR DELETE TO authenticated
  USING ("trainerId" = public.clerk_user_id());


-- ---------- WorkoutPlan --------------------------------------------------------
DROP POLICY IF EXISTS plan_participant_select ON "WorkoutPlan";
DROP POLICY IF EXISTS plan_trainer_write      ON "WorkoutPlan";

CREATE POLICY plan_participant_select ON "WorkoutPlan"
  FOR SELECT TO authenticated
  USING (
    "studentId" = public.clerk_user_id()
    OR "trainerId" = public.clerk_user_id()
  );

CREATE POLICY plan_trainer_write ON "WorkoutPlan"
  FOR ALL TO authenticated
  USING (
    "trainerId" = public.clerk_user_id()
    OR ("trainerId" IS NULL AND "studentId" = public.clerk_user_id())
  )
  WITH CHECK (
    "trainerId" = public.clerk_user_id()
    OR ("trainerId" IS NULL AND "studentId" = public.clerk_user_id())
  );


-- ---------- WorkoutSession (derivada via plan) --------------------------------
DROP POLICY IF EXISTS session_select ON "WorkoutSession";
DROP POLICY IF EXISTS session_write  ON "WorkoutSession";

CREATE POLICY session_select ON "WorkoutSession"
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM "WorkoutPlan" wp
    WHERE wp.id = "WorkoutSession"."planId"
      AND (wp."studentId" = public.clerk_user_id() OR wp."trainerId" = public.clerk_user_id())
  ));

CREATE POLICY session_write ON "WorkoutSession"
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM "WorkoutPlan" wp
    WHERE wp.id = "WorkoutSession"."planId"
      AND (
        wp."trainerId" = public.clerk_user_id()
        OR (wp."trainerId" IS NULL AND wp."studentId" = public.clerk_user_id())
      )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "WorkoutPlan" wp
    WHERE wp.id = "WorkoutSession"."planId"
      AND (
        wp."trainerId" = public.clerk_user_id()
        OR (wp."trainerId" IS NULL AND wp."studentId" = public.clerk_user_id())
      )
  ));


-- ---------- Exercise -----------------------------------------------------------
-- Catálogo global: leitura para qualquer authenticated.
-- Custom: leitura só para criador + pessoas vinculadas.
-- Escrita: só pelo criador (custom).
DROP POLICY IF EXISTS exercise_global_read ON "Exercise";
DROP POLICY IF EXISTS exercise_custom_read ON "Exercise";
DROP POLICY IF EXISTS exercise_owner_write ON "Exercise";

CREATE POLICY exercise_global_read ON "Exercise"
  FOR SELECT TO authenticated
  USING ("isCustom" = false);

CREATE POLICY exercise_custom_read ON "Exercise"
  FOR SELECT TO authenticated
  USING (
    "isCustom" = true
    AND "createdById" IS NOT NULL
    AND (
      "createdById" = public.clerk_user_id()
      OR public.is_student_of("createdById")
      OR public.is_trainer_of("createdById")
    )
  );

CREATE POLICY exercise_owner_write ON "Exercise"
  FOR ALL TO authenticated
  USING      ("createdById" = public.clerk_user_id())
  WITH CHECK ("createdById" = public.clerk_user_id());


-- ---------- SessionExercise (derivada via session→plan) ----------------------
DROP POLICY IF EXISTS sessex_select ON "SessionExercise";
DROP POLICY IF EXISTS sessex_write  ON "SessionExercise";

CREATE POLICY sessex_select ON "SessionExercise"
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM "WorkoutSession" ws
    JOIN "WorkoutPlan"    wp ON wp.id = ws."planId"
    WHERE ws.id = "SessionExercise"."sessionId"
      AND (wp."studentId" = public.clerk_user_id() OR wp."trainerId" = public.clerk_user_id())
  ));

CREATE POLICY sessex_write ON "SessionExercise"
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM "WorkoutSession" ws
    JOIN "WorkoutPlan"    wp ON wp.id = ws."planId"
    WHERE ws.id = "SessionExercise"."sessionId"
      AND (
        wp."trainerId" = public.clerk_user_id()
        OR (wp."trainerId" IS NULL AND wp."studentId" = public.clerk_user_id())
      )
  ))
  WITH CHECK (EXISTS (
    SELECT 1
    FROM "WorkoutSession" ws
    JOIN "WorkoutPlan"    wp ON wp.id = ws."planId"
    WHERE ws.id = "SessionExercise"."sessionId"
      AND (
        wp."trainerId" = public.clerk_user_id()
        OR (wp."trainerId" IS NULL AND wp."studentId" = public.clerk_user_id())
      )
  ));


-- ---------- WorkoutLog ---------------------------------------------------------
DROP POLICY IF EXISTS log_select       ON "WorkoutLog";
DROP POLICY IF EXISTS log_student_write ON "WorkoutLog";

CREATE POLICY log_select ON "WorkoutLog"
  FOR SELECT TO authenticated
  USING (
    "studentId" = public.clerk_user_id()
    OR public.is_trainer_of("studentId")
  );

CREATE POLICY log_student_write ON "WorkoutLog"
  FOR ALL TO authenticated
  USING      ("studentId" = public.clerk_user_id())
  WITH CHECK ("studentId" = public.clerk_user_id());


-- ---------- ExerciseLog (derivada via WorkoutLog) ----------------------------
DROP POLICY IF EXISTS exlog_select ON "ExerciseLog";
DROP POLICY IF EXISTS exlog_write  ON "ExerciseLog";

CREATE POLICY exlog_select ON "ExerciseLog"
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM "WorkoutLog" wl
    WHERE wl.id = "ExerciseLog"."workoutLogId"
      AND (wl."studentId" = public.clerk_user_id() OR public.is_trainer_of(wl."studentId"))
  ));

CREATE POLICY exlog_write ON "ExerciseLog"
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM "WorkoutLog" wl
    WHERE wl.id = "ExerciseLog"."workoutLogId"
      AND wl."studentId" = public.clerk_user_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "WorkoutLog" wl
    WHERE wl.id = "ExerciseLog"."workoutLogId"
      AND wl."studentId" = public.clerk_user_id()
  ));


-- ---------- BodyMetric ---------------------------------------------------------
DROP POLICY IF EXISTS bm_select ON "BodyMetric";
DROP POLICY IF EXISTS bm_write  ON "BodyMetric";

CREATE POLICY bm_select ON "BodyMetric"
  FOR SELECT TO authenticated
  USING (
    "studentId" = public.clerk_user_id()
    OR public.is_trainer_of("studentId")
  );

CREATE POLICY bm_write ON "BodyMetric"
  FOR ALL TO authenticated
  USING      ("studentId" = public.clerk_user_id())
  WITH CHECK ("studentId" = public.clerk_user_id());


-- ---------- ExamUpload --------------------------------------------------------
-- DADO SENSÍVEL (saúde). Mesma regra do BodyMetric: aluno escreve,
-- trainer ativo do aluno lê (sem permissão de escrita).
DROP POLICY IF EXISTS exam_select        ON "ExamUpload";
DROP POLICY IF EXISTS exam_student_write ON "ExamUpload";

CREATE POLICY exam_select ON "ExamUpload"
  FOR SELECT TO authenticated
  USING (
    "studentId" = public.clerk_user_id()
    OR public.is_trainer_of("studentId")
  );

CREATE POLICY exam_student_write ON "ExamUpload"
  FOR ALL TO authenticated
  USING      ("studentId" = public.clerk_user_id())
  WITH CHECK ("studentId" = public.clerk_user_id());


-- ---------- RunningSession ----------------------------------------------------
DROP POLICY IF EXISTS run_select ON "RunningSession";
DROP POLICY IF EXISTS run_write  ON "RunningSession";

CREATE POLICY run_select ON "RunningSession"
  FOR SELECT TO authenticated
  USING (
    "studentId" = public.clerk_user_id()
    OR public.is_trainer_of("studentId")
  );

CREATE POLICY run_write ON "RunningSession"
  FOR ALL TO authenticated
  USING      ("studentId" = public.clerk_user_id())
  WITH CHECK ("studentId" = public.clerk_user_id());


-- ---------- PlanMetricDefinition (derivada via plan) -------------------------
DROP POLICY IF EXISTS pmd_select ON "PlanMetricDefinition";
DROP POLICY IF EXISTS pmd_write  ON "PlanMetricDefinition";

CREATE POLICY pmd_select ON "PlanMetricDefinition"
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM "WorkoutPlan" wp
    WHERE wp.id = "PlanMetricDefinition"."planId"
      AND (wp."studentId" = public.clerk_user_id() OR wp."trainerId" = public.clerk_user_id())
  ));

CREATE POLICY pmd_write ON "PlanMetricDefinition"
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM "WorkoutPlan" wp
    WHERE wp.id = "PlanMetricDefinition"."planId"
      AND wp."trainerId" = public.clerk_user_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "WorkoutPlan" wp
    WHERE wp.id = "PlanMetricDefinition"."planId"
      AND wp."trainerId" = public.clerk_user_id()
  ));


-- ---------- PlanMetricLog -----------------------------------------------------
DROP POLICY IF EXISTS pml_select        ON "PlanMetricLog";
DROP POLICY IF EXISTS pml_student_write ON "PlanMetricLog";

CREATE POLICY pml_select ON "PlanMetricLog"
  FOR SELECT TO authenticated
  USING (
    "studentId" = public.clerk_user_id()
    OR public.is_trainer_of("studentId")
  );

CREATE POLICY pml_student_write ON "PlanMetricLog"
  FOR ALL TO authenticated
  USING      ("studentId" = public.clerk_user_id())
  WITH CHECK ("studentId" = public.clerk_user_id());


-- ---------- Notification ------------------------------------------------------
-- CRÍTICO: tabela consumida pelo Realtime no NotificationBell (client-side).
-- Sem essa policy + setup do Clerk no cliente, o sino para de atualizar.
DROP POLICY IF EXISTS notif_owner_select ON "Notification";
DROP POLICY IF EXISTS notif_owner_update ON "Notification";
DROP POLICY IF EXISTS notif_owner_delete ON "Notification";

CREATE POLICY notif_owner_select ON "Notification"
  FOR SELECT TO authenticated
  USING ("userId" = public.clerk_user_id());

CREATE POLICY notif_owner_update ON "Notification"
  FOR UPDATE TO authenticated
  USING      ("userId" = public.clerk_user_id())
  WITH CHECK ("userId" = public.clerk_user_id());

CREATE POLICY notif_owner_delete ON "Notification"
  FOR DELETE TO authenticated
  USING ("userId" = public.clerk_user_id());

-- Inserts vêm do servidor (service_role) — sem policy de INSERT pra authenticated.

-- Habilita Realtime para Notification (idempotente).
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ---------- PushSubscription --------------------------------------------------
DROP POLICY IF EXISTS push_owner_all ON "PushSubscription";

CREATE POLICY push_owner_all ON "PushSubscription"
  FOR ALL TO authenticated
  USING      ("userId" = public.clerk_user_id())
  WITH CHECK ("userId" = public.clerk_user_id());


-- ---------- PasskeyCredential -------------------------------------------------
-- Apenas o dono. Inserts/Updates reais passam pelo servidor (challenge WebAuthn).
DROP POLICY IF EXISTS passkey_owner_all ON "PasskeyCredential";

CREATE POLICY passkey_owner_all ON "PasskeyCredential"
  FOR ALL TO authenticated
  USING      ("userId" = public.clerk_user_id())
  WITH CHECK ("userId" = public.clerk_user_id());


-- ---------- NotificationSettings ----------------------------------------------
DROP POLICY IF EXISTS notif_settings_owner_all ON "NotificationSettings";

CREATE POLICY notif_settings_owner_all ON "NotificationSettings"
  FOR ALL TO authenticated
  USING      ("userId" = public.clerk_user_id())
  WITH CHECK ("userId" = public.clerk_user_id());


-- ---------- Goal --------------------------------------------------------------
DROP POLICY IF EXISTS goal_select ON "Goal";
DROP POLICY IF EXISTS goal_write  ON "Goal";

CREATE POLICY goal_select ON "Goal"
  FOR SELECT TO authenticated
  USING (
    "studentId" = public.clerk_user_id()
    OR public.is_trainer_of("studentId")
  );

CREATE POLICY goal_write ON "Goal"
  FOR ALL TO authenticated
  USING      ("studentId" = public.clerk_user_id())
  WITH CHECK ("studentId" = public.clerk_user_id());


-- =============================================================================
-- 3. STORAGE POLICIES (buckets privados)
-- =============================================================================
-- Buckets do app:
--   exams         → PRIVADO (uploads/downloads via service_role em Server Action)
--   plan-metrics  → PRIVADO (mesmo padrão)
--   avatars       → PÚBLICO (mantém — usado em <img src> direto)
--   exercise-media→ PÚBLICO (mantém)
--
-- Para buckets privados não é necessário expor leitura ao client: tudo passa
-- por URLs assinadas geradas no servidor. As policies abaixo cobrem o caso
-- de futuras subidas client-side (hoje não há); se quiser bloqueio total,
-- basta deixar sem policies (RLS já está ativa em storage.objects).
-- =============================================================================

-- Garante que os buckets privados existam como private.
-- (Crie no Dashboard se ainda não existirem; este UPDATE só normaliza.)
UPDATE storage.buckets SET public = false WHERE id IN ('exams','plan-metrics');
UPDATE storage.buckets SET public = true  WHERE id IN ('avatars','exercise-media');

-- Permite o dono enxergar/operar arquivos sob um "path prefix" igual ao seu id.
-- Convenção sugerida: salvar como `<clerkUserId>/<filename>`.
DROP POLICY IF EXISTS exams_owner_all        ON storage.objects;
DROP POLICY IF EXISTS plan_metrics_owner_all ON storage.objects;

CREATE POLICY exams_owner_all ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'exams'
    AND (storage.foldername(name))[1] = public.clerk_user_id()
  )
  WITH CHECK (
    bucket_id = 'exams'
    AND (storage.foldername(name))[1] = public.clerk_user_id()
  );

CREATE POLICY plan_metrics_owner_all ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'plan-metrics'
    AND (storage.foldername(name))[1] = public.clerk_user_id()
  )
  WITH CHECK (
    bucket_id = 'plan-metrics'
    AND (storage.foldername(name))[1] = public.clerk_user_id()
  );


-- =============================================================================
-- 4. SMOKE TEST
-- =============================================================================
-- Após rodar, confira no SQL Editor:
--   SELECT relname, relrowsecurity
--   FROM pg_class
--   WHERE relname IN (
--     'User','InviteCode','TrainerStudent','WorkoutPlan','WorkoutSession',
--     'Exercise','SessionExercise','WorkoutLog','ExerciseLog','BodyMetric',
--     'ExamUpload','RunningSession','PlanMetricDefinition','PlanMetricLog',
--     'Notification','PushSubscription','PasskeyCredential',
--     'NotificationSettings','Goal'
--   );
-- Todas devem aparecer com relrowsecurity = true.
--
--   SELECT schemaname, tablename, policyname, cmd
--   FROM pg_policies
--   WHERE schemaname = 'public'
--   ORDER BY tablename, policyname;
-- =============================================================================
