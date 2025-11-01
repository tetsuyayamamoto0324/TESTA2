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
  shiftX?: number;           // 微調整用（-8 などで少し左へ）
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

  const src =
    (key !== "none" ? images?.[key] : undefined) ?? undefined;
  const fallback = key === "none" ? "—" : emoji[key];

  const styles: Record<string, React.CSSProperties> = {
    wrap: {
      width: "100%",
      transform: "translate(100px, -0px)",
    },
    inner: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "12px clamp(12px, 2vw, 20px)",
      display: "flex",
      flexDirection: "column",
      alignItems: align === "center" ? "center" : "flex-start",
      gap: 8,
      transform: "translate(200px, 80px)",
    },
    title: {
      fontWeight: 800,
      fontSize: "clamp(16px, 2.2vw, 22px)",
      transform: "translate(-0px, -45px)",
    },
    img: {
      width: "clamp(56px, 10vw, 110px)",
      height: "auto",
      objectFit: "contain",
      display: "block",
    },
    emoji: {
      fontSize: "clamp(40px, 8vw, 72px)",
      lineHeight: 1,
    },
    label: {
      fontSize: "clamp(14px, 1.8vw, 16px)",
      opacity: 0.85,
    },
  };

  return (
    <section aria-label="服装" style={styles.wrap}>
      <div style={styles.inner}>
        <div style={styles.title}>{title}</div>
        {src ? (
          <img src={src} alt={label} style={styles.img} />
        ) : (
          <div style={styles.emoji}>{fallback}</div>
        )}
        <div style={styles.label}>{label}</div>
      </div>
    </section>
  );
}
