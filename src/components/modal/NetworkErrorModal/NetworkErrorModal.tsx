// src/components/NetworkErrorModal.tsx
import React from "react";
import { createPortal } from "react-dom";
import s from "./NetworkErrorModal.module.css";

type Props = {
  open: boolean;
  // 閉じる操作は提供しない（オンライン復旧で自動的に非表示にする想定）
};

export default function NetworkErrorModal({ open }: Props) {
  if (!open) return null;

  const node = (
    <div role="presentation" className={s.overlay}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="neterr-title"
        aria-describedby="neterr-desc"
        className={s.dialog}
      >
        <div className={s.head}>
          <span id="neterr-title" className={s.title}>
            オフラインです
          </span>
        </div>

        <p id="neterr-desc" className={s.message}>
          ネットワークに接続できません。回線・Wi-Fi をご確認ください。
          <br />
          復旧すると自動で閉じます。（201）
        </p>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
