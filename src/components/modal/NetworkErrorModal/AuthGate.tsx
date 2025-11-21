// src/components/AuthGate.tsx
import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useError } from "@/contexts/ErrorContext";
import { AppError } from "@/lib/appError"; // ★追記: NETWORKエラーを明示

// ユーザーが閉じてもオフラインの間は定期的に再表示する設定
const OFFLINE_RESURFACE_MS = 8000; // ★追記: 何秒ごとに再表示するか（8秒）

export default function AuthGate() {
  const showError = useError();

  const intervalRef = useRef<number | null>(null);     // ★追記: 再表示のsetInterval管理
  const lastShownAtRef = useRef<number>(0);            // ★追記: 直近表示時刻（連打抑制）
  const didRunRef = useRef(false);                     // ★追記: StrictMode対策

  // ★ オフライン用モーダルを表示（頻度制御付き）
  const showOfflineModal = useCallback(() => {
    const now = Date.now();
    if (now - lastShownAtRef.current < 1500) return;   // 1.5秒以内の多重表示を抑止
    lastShownAtRef.current = now;

    showError(
      new AppError("NETWORK", "インターネットに接続されていません。"),
      {
        title: "オフラインです",
        fallbackMessage: "ネットワークに接続してから、もう一度お試しください。（WLP-AUTH-201）",
        retry: async () => {
          // ★再試行: 接続回復を軽く確認（成功時は以後の再表示も止まる）
          try {
            await supabase.auth.getSession();
          } catch {
            // まだオフラインなら何もしない（インターバルで再び出る）
          }
        },
      }
    );
  }, [showError]);

  const startOfflineLoop = useCallback(() => {
    // すでに回っていれば何もしない
    if (intervalRef.current != null) return;
    showOfflineModal(); // まず即時に1回出す
    // 以降、オフライン中は一定間隔で再表示
    intervalRef.current = window.setInterval(showOfflineModal, OFFLINE_RESURFACE_MS);
  }, [showOfflineModal]);

  const stopOfflineLoop = useCallback(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (didRunRef.current) return;                     // ★StrictModeの二度呼び防止
    didRunRef.current = true;

    // 初期状態をチェック
    if (!navigator.onLine) startOfflineLoop();

    // ブラウザのオンライン/オフラインイベントを監視
    const onOffline = () => startOfflineLoop();        // ★オフラインになったらループ開始
    const onOnline = () => {                           // ★オンライン復帰で停止
      stopOfflineLoop();
      lastShownAtRef.current = 0;                      // 次回のためにリセット
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      stopOfflineLoop();
    };
  }, [startOfflineLoop, stopOfflineLoop]);

  return null;
}

/* 変更点（修正/追記）
- AppError("NETWORK", ...) を使って「オフライン専用」モーダルを表示
- オフラインの間は setInterval で一定間隔ごとに再表示（OFFLINE_RESURFACE_MS）
- 直近1.5秒以内の多重表示を抑制（lastShownAtRef）
- navigator.onLine の online/offline を監視して、オンライン復帰で停止
- StrictMode の二重実行を didRunRef で抑止
*/
