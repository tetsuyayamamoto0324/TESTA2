// src/components/Modal.tsx
import React, { useEffect, useRef } from "react";
import s from "./Modal.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  userName: string;
  email: string;
  showReloadButton?: boolean;   // ★ 再取得ボタンを出すかどうか
  onReload?: () => void;        // ★ 再取得クリック時（Today/Weeklyだけ使う）
  onLogout?: () => void;        // ログアウトクリック時
};

export default function Modal({
  open,
  onClose,
  userName,
  email,
  showReloadButton = false,
  onReload,
  onLogout,
}: Props) {
  const firstFocusRef = useRef<HTMLDivElement>(null);

  // ESCで閉じる／オープン中は背景スクロール停止／フォーカス移動
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => firstFocusRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      className={s.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={s.dialog}
        onClick={(e) => e.stopPropagation()}
      >
        {/* フォーカス移動用（見た目には出ない） */}
        <div ref={firstFocusRef} tabIndex={-1} />

        {/* 右上の × */}
        <div className={s.header}>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className={s.close}
          >
            ×
          </button>
        </div>

        {/* ★ ここが中身。メール＋再取得ボタンも含めて全部書く */}
        <div className={s.body}>
          <div className={s.userLabel}>ログイン中ユーザー</div>

          <div className={s.email}>
            <a href={`mailto:${email}`}>{email}</a>
          </div>

          {showReloadButton && (
            <button
              type="button"
              className={s.reloadButton}
              onClick={onReload}
            >
              再取得
            </button>
          )}

          <button
            type="button"
            className={s.logoutButton}
            onClick={onLogout}
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}
