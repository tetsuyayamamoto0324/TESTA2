// src/components/weather/WeatherHero.tsx
import React from "react";
import s from "./WeatherHero.module.css";

type Props = {
  tempC?: number | null;
  iconCode?: string | null;
  pop?: number | null;  // 0–1 or 0–100 の両対応
  desc?: string | null;
  className?: string;   // 例: s.compact / s.spacious / s.narrow を親から付与
};

export default function WeatherHero({ tempC, iconCode, pop, desc, className }: Props) {
  const temp = typeof tempC === "number" ? Math.round(tempC) : null;
  const popPct = typeof pop === "number" ? Math.round(pop <= 1 ? pop * 100 : pop) : null;
  const iconUrl = iconCode ? `https://openweathermap.org/img/wn/${iconCode}@2x.png` : null;

  return (
    <div aria-label="現在の天気概要" className={[s.hero, className].filter(Boolean).join(" ")}>
      <div className={s.inner}>
        <div className={s.temp}>{temp !== null ? `${temp}℃` : "—"}</div>

        <div className={s.center}>
          {iconUrl ? (
            <img src={iconUrl} alt={desc ?? "weather"} className={s.icon} />
          ) : (
            <span className={s.iconFallback}>⛅</span>
          )}
          {desc ? <span className={s.desc}>{desc}</span> : null}
        </div>

        <div className={s.pop}>
          降水 <span className={s.popNum}>{popPct !== null ? `${popPct}%` : "—"}</span>
        </div>
      </div>
    </div>
  );
}
