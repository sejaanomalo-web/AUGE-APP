import {
  eachDayOfInterval,
  format,
  getDay,
  startOfDay,
  subDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export interface HeatmapWorkout {
  date: Date;
  volume: number;
}

export interface FrequencyHeatmapProps {
  workouts: HeatmapWorkout[];
  days?: number;
}

const INTENSITY_BG = [
  "bg-bg-elevated",
  "bg-accent/20",
  "bg-accent/40",
  "bg-accent/70",
  "bg-accent",
];

export function FrequencyHeatmap({
  workouts,
  days = 90,
}: FrequencyHeatmapProps) {
  const today = startOfDay(new Date());
  const startDate = subDays(today, days - 1);
  const allDays = eachDayOfInterval({ start: startDate, end: today });

  const map = new Map(
    workouts.map((w) => [format(startOfDay(w.date), "yyyy-MM-dd"), w.volume]),
  );
  const maxVolume = Math.max(...workouts.map((w) => w.volume), 1);

  function intensity(d: Date): number {
    const v = map.get(format(d, "yyyy-MM-dd"));
    if (!v) return 0;
    const ratio = v / maxVolume;
    if (ratio < 0.25) return 1;
    if (ratio < 0.5) return 2;
    if (ratio < 0.75) return 3;
    return 4;
  }

  const firstDow = getDay(startDate);
  const padded: (Date | null)[] = [
    ...Array(firstDow).fill(null),
    ...allDays,
  ];
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 overflow-x-auto scrollbar-none">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1 shrink-0">
            {week.map((day, di) => (
              <div
                key={di}
                className={`w-3 h-3 rounded-sm ${day ? INTENSITY_BG[intensity(day)] : ""}`}
                title={
                  day
                    ? `${format(day, "dd 'de' MMMM", { locale: ptBR })}${
                        map.get(format(day, "yyyy-MM-dd"))
                          ? ` · ${Math.round(map.get(format(day, "yyyy-MM-dd"))!)}kg`
                          : ""
                      }`
                    : ""
                }
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 text-text-muted text-caption">
        <span>Menos</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <div key={l} className={`w-3 h-3 rounded-sm ${INTENSITY_BG[l]}`} />
        ))}
        <span>Mais</span>
      </div>
    </div>
  );
}
