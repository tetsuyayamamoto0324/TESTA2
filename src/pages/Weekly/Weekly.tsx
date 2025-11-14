// src/pages/Weekly.tsx
import { useEffect, useState } from "react";
import { fetchDailyFromForecast } from "@/lib/openweather";
import s from "./Weekly.module.css";
import HeaderBar from "@/components/layout/HeaderBar/HeaderBar";

const enWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

type Day = {
  dt: number;
  temp: { min: number; max: number };
  pop: number; // 0-1
  weather: { icon: string; description: string }[];
};

function DayCard({ d }: { d: Day }) {
  const date = new Date(d.dt * 1000);
  const wk = enWeek[date.getDay()];
  const max = Math.round(d.temp.max);
  const min = Math.round(d.temp.min);
  const pop = Math.round((d.pop ?? 0) * 100);
  const icon = d.weather?.[0]?.icon ?? "01d";
  const desc = d.weather?.[0]?.description ?? "";

  return (
    <div className={s.card}>
      <div className={s.week}>{wk}</div>
      <img
        src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
        alt={desc || "weather"}
        className={s.icon}
      />
      <div className={s.temp}>
        {max}℃ / {min}℃
        <div className={s.pop}>降水 {pop}%</div>
      </div>
    </div>
  );
}

export default function Weekly() {
  const [days, setDays] = useState<Day[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const lat = 35.6895,
      lon = 139.6917;
    (async () => {
      try {
        const daily = await fetchDailyFromForecast(lat, lon);
        setDays(daily as Day[]);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      }
    })();
  }, []);

  if (!days && !error) return <div className={s.loading}>読み込み中…</div>;
  if (error) return <div className={s.error}>{error}</div>;

  return (
    <div className={s.weeklyPage}>
      <HeaderBar />
      <h1 className={s.title}>週間予報</h1>
      <div className={s.wrap}>
        <div className={s.grid}>
          {days!.map((d) => (
            <DayCard key={d.dt} d={d} />
          ))}
        </div>
      </div>
    </div>
  );
}
