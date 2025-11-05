// src/components/weather/LuckyItem.tsx
import React from "react";
import s from "./LuckyItem.module.css";

type Props = {
  title?: string;
  imgSrc?: string;
  fallbackEmoji?: string;
  label?: string;
};

export default function LuckyItem({
  title = "ラッキーアイテム",
  imgSrc,
  fallbackEmoji = "🍀",
  label = "カッパ",
}: Props) {
  return (
    <section aria-label={title} className={s.box}>
      <div className={s.inner}>
        <div className={s.title}>{title}</div>
        {imgSrc ? (
          <img className={s.img} src={imgSrc} alt={label} />
        ) : (
          <div className={s.emoji} role="img" aria-label={label}>
            {fallbackEmoji}
          </div>
        )}
        <div className={s.label}>{label}</div>
      </div>
    </section>
  );
}
