// src/contexts/ErrorContext.tsx
// src/contexts/ErrorContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import ErrorModal from "@/components/modal/ErrorModal/ErrorModal";
import NetworkErrorModal from "@/components/modal/NetworkErrorModal/NetworkErrorModal";
import { AppErrorKind, normalizeError, messageFor } from "@/lib/appError";


// グローバルの showError API 型
type ShowError = (err: unknown, opts?: { title?: string; retry?: () => void; fallbackMessage?: string }) => void;

const Ctx = createContext<ShowError | null>(null);

// ★追加: 種類別の既定タイトルをここで一元管理
function titleFor(kind: AppErrorKind) { // 修正
  switch (kind) { // 修正
    case "SCHEMA":       return "入力が正しくありません";       // 修正
    case "CREATE_FAIL":  return "WLP-AUTHー301";         // 修正
    case "AUTH_FAIL":    return "認証に失敗しました";             // 修正
    case "EMAIL_EXISTS": return "このメールはすでに登録されています"; // 修正
    case "API_FAIL":     return "サーバーエラーが発生しました";   // 修正
    case "NETWORK":      return "通信できません";                 // 修正（通常は NetworkErrorModal 側で表示）
    default:             return "エラーが発生しました";           // 修正
  }
}

export function ErrorProvider({ children }: { children: ReactNode }) {
  // 共通モーダル用
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("エラーが発生しました");
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState<null | (() => void)>(null);
  const [kind, setKind] = useState<AppErrorKind>("UNKNOWN");

  // ネットワーク専用モーダル（online/offline 監視）
  const [netOpen, setNetOpen] = useState(false);

  useEffect(() => {
    const onOffline = () => setNetOpen(true);
    const onOnline  = () => setNetOpen(false);

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    // 初期状態がすでにオフラインなら即表示
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setNetOpen(true); // 修正
    }

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  const showError: ShowError = (err, opts) => {
    const appErr = normalizeError(err);
    if (appErr.kind === "NETWORK") {
      // 通信失敗はネットワーク専用モーダルでハンドリング
      setNetOpen(true); // 修正: 毎回確実に開く
      return;
    }
    setKind(appErr.kind);
    // ★変更: タイトルは opts.title があればそれを優先、なければ種類別既定 titleFor を採用
    setTitle(opts?.title ?? titleFor(appErr.kind)); // 修正
    // 本文は種類別の messageFor を使い、必要なら fallbackMessage で上書き
    setMessage(messageFor(appErr.kind, opts?.fallbackMessage ?? (appErr as any)?.message));
    setRetry(opts?.retry ?? null);
    setOpen(true);
  };

  return (
    <Ctx.Provider value={showError}>
      {children}

      {/* ネットワーク専用（常に最優先）。閉じる手段は提供しない。 */} {/* 修正 */}
      <NetworkErrorModal open={netOpen} /> {/* 修正: onClose を渡さない */}

      {/* 通常のエラーモーダル（ネットワーク以外） */}
      <ErrorModal
        open={open}
        title={title}
        message={message}
        onClose={() => setOpen(false)}
        onRetry={retry ?? undefined}
      />
    </Ctx.Provider>
  );
}

export function useError() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useError must be used within <ErrorProvider>");
  return ctx;
}
