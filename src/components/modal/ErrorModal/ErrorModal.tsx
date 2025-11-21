"use client";
import React from "react";
import { createPortal } from "react-dom";
import s from "./ErrorModal.module.css";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  onRetry?: () => void;
};

export default function ErrorModal({
  open,
  title = "エラーが発生しました",
  message,
  onClose,
  onRetry,
}: Props) {
  if (!open) return null;

  const node = (
    <div className={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.dialog} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className={s.head}>
          <span className={s.title}>{title}</span>
        </div>

        <div className={s.message}>{message}</div>

        <div className={s.footer}>
          {onRetry && (
            <button type="button" onClick={onRetry} className={s.retryBtn}>
              再試行
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
