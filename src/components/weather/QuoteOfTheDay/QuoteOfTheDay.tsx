// src/components/QuoteOfTheDay.tsx
import React from "react";
import s from "./QuoteOfTheDay.module.css";

function hash32(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
    h |= 0;
  }
  return h >>> 0;
}

type Props = {
  seed: string;            // "YYYY-MM-DD" (JST)
  title?: string;
  quotes?: string[];
};

const defaultQuotes = [
  "夢はでっかく根はふかく。",
  "誰かの為に生きてこそ、人生には価値がある。",
  "創作は常に冒険である。所詮は人力を尽した後、天命にまかせるより仕方はない。",
  "誰にでも可能性はある、私も最初はゼロだった。",
  "迷ったら一歩だけ進む。",
  "やらない後悔より、やった学び。",
  "可能性を超えたものが、人の心に残る。",
  "深呼吸一回、世界が整う。",
  "未来には、誰でも15分間は世界的な有名人になれるだろう。",
  "すべての者は生まれながらに知恵を求める。",
];

export default function QuoteOfTheDay({
  seed,
  title = "今日の格言",
  quotes = defaultQuotes,
}: Props) {
  const idx = quotes.length ? hash32(seed) % quotes.length : 0;
  const quote = quotes[idx] ?? "";

  return (
      <div className={s.inner}>
        <div className={s.title}>{title}</div>
        <div className={s.quote}>{quote}</div>
      </div>
  );
}
