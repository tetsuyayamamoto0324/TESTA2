// src/components/weather/LuckyItem.tsx
import React from "react";
import s from "./LuckyItem.module.css";

// --- JSTのYYYY-MM-DD ---
function jstYmd(d: Date): string {
  // JST(UTC+9) に合わせて日付文字列を作る
  const tzDate = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = tzDate.getUTCFullYear();
  const m = String(tzDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(tzDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// --- 32bitハッシュ ---
function hash32(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
    h |= 0;
  }
  return h >>> 0;
}

type Item = { label: string; imgSrc?: string; emoji?: string };

const ITEMS: Item[] = [
  { label: "カッパ", imgSrc: "/images/kappa.png", emoji: "🌧️" },
  { label: "四つ葉のクローバー", emoji: "🍀" },
  { label: "青いペン", emoji: "🖊️" },
  { label: "ハンカチ", emoji: "🟦" },
  { label: "コイン", emoji: "🪙" },
  { label: "本", emoji: "📘" },
  { label: "水筒", emoji: "🫗" },
  { label: "イヤホン", emoji: "🎧" },
  { label: "ノート", emoji: "📓" },
  { label: "スマホスタンド", emoji: "📱" },
];

export default function LuckyItem() {
  // ▼テストで日付を固定したい場合は、この行を好きな日付に書き換えてください
  // const seed = "2025-11-06";
  const seed = jstYmd(new Date());

  const idx = ITEMS.length ? hash32(seed) % ITEMS.length : 0;
  const chosen = ITEMS[idx] ?? { label: "星", emoji: "☆" };
  const { label, imgSrc, emoji } = chosen;

  return (
    <div className={s.inner}>
      <div className={s.title}>ラッキーアイテム</div>

      {imgSrc ? (
        <img src={imgSrc} alt={`ラッキーアイテム: ${label}`} className={s.img} />
      ) : (
        <div className={s.emoji} role="img" aria-label={`ラッキーアイテム: ${label}`}>
          {emoji ?? "—"}
        </div>
      )}

      <div className={s.label}>{label}</div>
    </div>
  );
}
