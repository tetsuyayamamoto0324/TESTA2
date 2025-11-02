// src/components/OutfitSimple.tsx
type ImageMap = {
  coat?: string;      // ≤10℃
  long?: string;      // 11–19℃
  light?: string;     // 20–25℃（半袖＋薄手羽織）
  short?: string;     // ≥26℃
};

type Props = {
  tempC?: number | null;
  title?: string;            // 見出し
  images?: ImageMap;         // 後で画像を差し込みたい場合
  align?: "left" | "center"; // 配置
  shiftX?: number;           // 微調整用（将来CSSで反映）
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

  // 画像が渡されていなければ絵文字で代用
  const emoji: Record<string, string> = {
    coat: "🧥",
    long: "🧥",
    light: "👕",
    short: "👚",
  };

  const src = key !== "none" ? images?.[key] : undefined;
  const fallback = key === "none" ? "—" : emoji[key];

  return (
    // 見た目のCSSは当てない。classNameは将来のCSS Modules用フック。
    <section
      aria-label="服装"
      className="outfit"
      data-align={align}
      data-shift-x={String(shiftX)}
    >
      <div className="inner">
        <div className="title">{title}</div>

        {src ? (
          <img src={src} alt={`服装: ${label}`} className="img" />
        ) : (
          <div className="emoji">{fallback}</div>
        )}

        <div className="label">{label}</div>
      </div>
    </section>
  );
}
