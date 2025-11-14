// src/components/QuoteOfTheDay.tsx
import React from "react";
import s from "./QuoteOfTheDay.module.css";

// JSTのYYYY-MM-DDを返す
function jstYmd(d: Date): string {
  const tzDate = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = tzDate.getUTCFullYear();
  const m = String(tzDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(tzDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 32bitハッシュ
function hash32(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
    h |= 0;
  }
  return h >>> 0;
}

const QUOTES = [
  "夢はでっかく根はふかく。",
  "誰かの為に生きてこそ、人生には価値がある。",
  `創作は常に冒険である。
  所詮は人力を尽した後、天命にまかせるより仕方はない。`,
  "誰にでも可能性はある、私も最初はゼロだった。",
  "迷ったら一歩だけ進む。",
  "やらない後悔より、やった学び。",
  "可能性を超えたものが、人の心に残る。",
  "深呼吸一回、世界が整う。",
  "未来には、誰でも15分間は世界的な有名人になれるだろう。",
  "すべての者は生まれながらに知恵を求める。",
];

export default function QuoteOfTheDay() {
  // テストで固定したい場合は下行をコメントアウトして、固定値に差し替え
  // const seed = "2025-11-06";
  const seed = jstYmd(new Date());

  const idx = QUOTES.length ? hash32(seed) % QUOTES.length : 0;
  const quote = QUOTES[idx] ?? "";

  return (
    <div className={s.inner}>
      <div className={s.title}>今日の格言</div>
      <div className={s.quote}>{quote}</div>
    </div>
  );
}
