// src/components/ErrorModal.tsx
import React from "react";
import { createPortal } from "react-dom";

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
    // CSSは当てていない。classNameは将来のCSS Modules用フック。
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="err-title"
        aria-describedby="err-msg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="head">
          <strong className="badge">!</strong>
          <span id="err-title" className="title">{title}</span>
        </div>

        <div id="err-msg" className="message">{message}</div>

        <div className="footer">
          {onRetry && (
            <button type="button" onClick={onRetry} className="retryBtn">
              再試行
            </button>
          )}
          <button type="button" onClick={onClose} className="closeBtn">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
