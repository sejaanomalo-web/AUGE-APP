import { prisma } from "@/lib/prisma";
import { fetchStrava } from "./client";

// Tipos espelhando o que a API do Strava devolve (subset usado aqui).
type StravaActivityPayload = {
  id: number;
  name: string;
  type: string;
  distance: number; // metros
  moving_time: number; // segundos
  elapsed_time: number;
  start_date: string; // ISO
  average_heartrate?: number;
  max_heartrate?: number;
  average_speed?: number;
  total_elevation_gain?: number;
  calories?: number;
  map?: { summary_polyline?: string | null; polyline?: string | null };
};

// Tipos de atividade que devem espelhar como RunningSession.
const RUN_TYPES = new Set(["Run", "TrailRun", "VirtualRun"]);

async function upsertActivity(
  userId: string,
  act: StravaActivityPayload,
): Promise<void> {
  const stravaActivityId = BigInt(act.id);
  const startDate = new Date(act.start_date);
  const polyline =
    act.map?.summary_polyline ?? act.map?.polyline ?? null;

  await prisma.stravaActivity.upsert({
    where: { stravaActivityId },
    create: {
      studentId: userId,
      stravaActivityId,
      type: act.type,
      name: act.name,
      distanceMeters: act.distance ?? 0,
      movingTimeSeconds: act.moving_time ?? 0,
      elapsedTimeSeconds: act.elapsed_time ?? 0,
      startDate,
      averageHeartrate: act.average_heartrate ?? null,
      maxHeartrate: act.max_heartrate ?? null,
      averageSpeed: act.average_speed ?? null,
      totalElevationGain: act.total_elevation_gain ?? null,
      calories: act.calories ?? null,
      polyline,
      raw: act as unknown as object,
    },
    update: {
      type: act.type,
      name: act.name,
      distanceMeters: act.distance ?? 0,
      movingTimeSeconds: act.moving_time ?? 0,
      elapsedTimeSeconds: act.elapsed_time ?? 0,
      startDate,
      averageHeartrate: act.average_heartrate ?? null,
      maxHeartrate: act.max_heartrate ?? null,
      averageSpeed: act.average_speed ?? null,
      totalElevationGain: act.total_elevation_gain ?? null,
      calories: act.calories ?? null,
      polyline,
      raw: act as unknown as object,
    },
  });

  if (RUN_TYPES.has(act.type)) {
    const distanceKm = (act.distance ?? 0) / 1000;
    const durationSeconds = act.moving_time ?? 0;
    const paceSecondsPerKm =
      distanceKm > 0 ? Math.round(durationSeconds / distanceKm) : 0;
    const externalId = String(act.id);

    await prisma.runningSession.upsert({
      where: {
        studentId_externalId: { studentId: userId, externalId },
      },
      create: {
        studentId: userId,
        source: "strava",
        externalId,
        date: startDate,
        distanceKm,
        durationSeconds,
        paceSecondsPerKm,
      },
      update: {
        date: startDate,
        distanceKm,
        durationSeconds,
        paceSecondsPerKm,
      },
    });
  }
}

export async function syncRecentActivities(
  userId: string,
  opts: { perPage?: number; after?: number } = {},
): Promise<number> {
  const perPage = opts.perPage ?? 30;
  const params = new URLSearchParams({ per_page: String(perPage) });
  if (typeof opts.after === "number") params.set("after", String(opts.after));

  const res = await fetchStrava(
    userId,
    `/api/v3/athlete/activities?${params.toString()}`,
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Strava sync falhou: ${res.status} ${text}`);
  }
  const list = (await res.json()) as StravaActivityPayload[];

  let count = 0;
  for (const act of list) {
    try {
      await upsertActivity(userId, act);
      count++;
    } catch (err) {
      console.error("[strava] upsert activity falhou", act?.id, err);
    }
  }

  await prisma.stravaAccount
    .update({
      where: { userId },
      data: { lastSyncAt: new Date() },
    })
    .catch(() => {});

  return count;
}

export async function syncSingleActivity(
  userId: string,
  activityId: bigint,
): Promise<void> {
  const res = await fetchStrava(userId, `/api/v3/activities/${activityId}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Strava single activity falhou: ${res.status} ${text}`,
    );
  }
  const act = (await res.json()) as StravaActivityPayload;
  await upsertActivity(userId, act);
  await prisma.stravaAccount
    .update({ where: { userId }, data: { lastSyncAt: new Date() } })
    .catch(() => {});
}
