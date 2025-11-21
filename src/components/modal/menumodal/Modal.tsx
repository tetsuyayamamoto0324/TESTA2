// src/components/modal/menumodal/Modal.tsx
import React, { useEffect, useRef } from "react";
import s from "./Modal.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  email?: string | null;
  showReloadButton?: boolean;      // Today / Weekly だけ true
  refetching?: boolean;
  refetchMsg?: string;
  onClickReload?: () => void;
  onClickLogout?: () => void;
};

export default function MenuModal({
  open,
  onClose,
  email,
  showReloadButton = false,
  refetching = false,
  refetchMsg = "",
  onClickReload,
  onClickLogout,
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

        {/* 中身 */}
        <div className={s.body}>
          <div className={s.userLabel}>ログイン中ユーザー</div>

          <div className={s.emailRow}>
            <span className={s.emailText}>
              {email ?? "（未ログイン）"}
            </span>
          </div>

          {showReloadButton && (
            <div className={s.refetchRow}>
              <button
                type="button"
                onClick={onClickReload}
                disabled={refetching}
                className={s.refetchBtn}
              >
                {refetching ? "再取得中…" : "再取得"}
              </button>
              {refetchMsg && <span className={s.note}>{refetchMsg}</span>}
            </div>
          )}

          <hr className={s.hr} />

          <div className={s.logoutRow}>
            <button
              type="button"
              className={s.logoutBtn}
              onClick={onClickLogout}
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
