// src/components/weather/OutfitSimple.tsx
import React from "react";
import s from "./OutfitSimple.module.css";

type ImageMap = { coat?: string; long?: string; light?: string; short?: string };

type Props = {
  tempC?: number | null;
  title?: string;
  images?: ImageMap;
  align?: "left" | "center";
  shiftX?: number;
};

function clothingByTemp(t?: number | null) {
  if (typeof t !== "number") return { label: "—", key: "none" as const };
  const x = Math.round(t);
  if (x <= 10) return { label: "コート", key: "coat" as const };
  if (x <= 19) return { label: "長袖", key: "long" as const };
  if (x <= 25) return { label: "半袖＋薄手", key: "light" as const };
  return { label: "半袖", key: "short" as const };
}

export default function OutfitSimple({
  tempC,
  title = "服装",
  images,
  align = "center",
  shiftX = 0,
}: Props) {
  const { label, key } = clothingByTemp(tempC);
  const emoji: Record<string, string> = { coat: "🧥", long: "🧥", light: "👕", short: "👚" };
  const src = key !== "none" ? images?.[key] : undefined;
  const fallback = key === "none" ? "—" : emoji[key];

  return (
    <section
      aria-label="服装"
      className={s.outfit}
      data-align={align}
      data-shift-x={String(shiftX)}
    >
      <div className={s.inner}>
        <div className={s.title}>{title}</div>
        {src ? (
          <img src={src} alt={`服装: ${label}`} className={s.img} />
        ) : (
          <div className={s.emoji} role="img" aria-label={`服装: ${label}`}>
            {fallback}
          </div>
        )}
        <div className={s.label}>{label}</div>
      </div>
    </section>
  );
}
