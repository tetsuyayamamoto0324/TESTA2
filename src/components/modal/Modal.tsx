// src/components/Modal.tsx
import React, { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: number; // 将来CSS Modules側で使う想定（現状は未使用）
  children: React.ReactNode;
};

export default function Modal({ open, onClose, title, width = 460, children }: Props) {
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
    // 見た目のスタイルは当てない。classNameは将来のCSS Modules用フック。
    <div
      role="presentation"
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div ref={firstFocusRef} tabIndex={-1} />
        <div className="header">
          {title ? (
            <div id="modal-title" className="title">
              {title}
            </div>
          ) : (
            <div />
          )}
          <button type="button" onClick={onClose} aria-label="閉じる" className="close">
            ×
          </button>
        </div>
        <div className="body">{children}</div>
      </div>
    </div>
  );
}
