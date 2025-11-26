// src/components/weather/OutfitSimple.tsx
import React from "react";
import s from "./OutfitSimple.module.css";

type ImageMap = { coat?: string; long?: string; light?: string; short?: string };

type Props = {
  tempC?: number | null;
  images?: ImageMap;
};

function clothingByTemp(t?: number | null) {
  if (typeof t !== "number") return { label: "—", key: "none" as const };
  // Math.round(t) で四捨五入した整数にする
  const x = Math.round(t);
  if (x <= 10) return { label: "コート", key: "coat" as const };
  if (x <= 19) return { label: "長袖", key: "long" as const };
  if (x <= 25) return { label: "半袖＋薄手", key: "light" as const };
  return { label: "半袖", key: "short" as const };
}

export default function OutfitSimple({ tempC, images }: Props) {
  const { label, key } = clothingByTemp(tempC);

  const src = key !== "none" ? images?.[key] : undefined;
  const fallbackEmoji =
    key === "none" ? "—" : ({ coat: "🧥", long: "🧥", light: "👕", short: "👚" } as const)[key];

  return (
    <div className={s.inner}>
      <div className={s.title}>服装</div>

      {src ? (
        <img src={src} alt={`服装: ${label}`} className={s.img} />
      ) : (
        <div className={s.emoji} role="img" aria-label={`服装: ${label}`}>
          {fallbackEmoji}
        </div>
      )}

      <div className={s.label}>{label}</div>
    </div>
  );
}
