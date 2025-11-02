// src/components/weather/WeatherHero.tsx
import React from "react";

type Props = {
  tempC?: number | null;
  iconCode?: string | null;
  pop?: number | null;
  desc?: string | null;
};

export default function WeatherHero({ tempC, iconCode, pop, desc }: Props) {
  const temp = typeof tempC === "number" ? Math.round(tempC) : null;
  const popPct =
    typeof pop === "number" ? Math.round(pop <= 1 ? pop * 100 : pop) : null;

  const iconUrl =
    iconCode ? `https://openweathermap.org/img/wn/${iconCode}@2x.png` : null;

  return (
    // 見た目のCSSは当てない。classNameは将来のCSS Modules用フック。
    <section aria-label="現在の天気概要" className="hero">
      <div className="inner">
        <div className="temp">{temp !== null ? `${temp}℃` : "—"}</div>

        <div className="iconBox">
          {iconUrl ? (
            <img src={iconUrl} alt={desc ?? "weather"} className="icon" />
          ) : (
            <span className="iconFallback">⛅</span>
          )}
          {desc ? <span className="desc">{desc}</span> : null}
        </div>

        <div className="pop">
          降水 <span className="popNum">{popPct !== null ? `${popPct}%` : "—"}</span>
        </div>
      </div>
    </section>
  );
}
