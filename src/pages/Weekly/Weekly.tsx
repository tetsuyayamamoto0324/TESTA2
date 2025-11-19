// src/pages/Weekly.tsx
import { useEffect, useState } from "react";
import { fetchDailyFromForecast } from "@/lib/openweather";
import HeaderBar from "@/components/layout/HeaderBar/HeaderBar";
import { useCity } from "@/store/city";
import s from "./Weekly.module.css";

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

  // ★ Zustand から現在の都市を取得
  const { city } = useCity();

  useEffect(() => {
    // city がまだ読めていない場合の保護
    if (!city || typeof city.lat !== "number" || typeof city.lon !== "number") {
      return;
    }

    setDays(null);
    setError(null);

    (async () => {
      try {
        const daily = await fetchDailyFromForecast(city.lat, city.lon);
        setDays(daily as Day[]);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      }
    })();
  }, [city.lat, city.lon]); // ★ 都市が変わるたびに再取得

  // ローディング・エラー時も HeaderBar は出したいならこうする
  if (!days && !error) {
    return (
      <div className={s.weeklyPage}>
        <HeaderBar />
        <div className={s.loading}>読み込み中…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={s.weeklyPage}>
        <HeaderBar />
        <div className={s.error}>{error}</div>
      </div>
    );
  }

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
