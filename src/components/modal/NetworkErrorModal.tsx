// src/components/NetworkErrorModal.tsx
import React from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  // 閉じる操作は提供しない（オンライン復旧で自動的に非表示にする想定）
};

export default function NetworkErrorModal({ open }: Props) {
  if (!open) return null;

  const node = (
    // CSSは当てない。classNameは将来のCSS Modules用フック。
    <div role="presentation" className="overlay">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="neterr-title"
        aria-describedby="neterr-desc"
        className="dialog"
      >
        <div className="head">
          <strong className="badge">!</strong>
          <span id="neterr-title" className="title">オフラインです</span>
        </div>

        <p id="neterr-desc" className="message">
          ネットワークに接続できません。回線・Wi-Fi をご確認ください。
          <br />
          復旧すると自動で閉じます。（201）
        </p>

        <p className="tip">
          それでもダメな場合：ブラウザの拡張機能やプロキシ、VPN、企業ネットワークの制限をご確認ください。
        </p>

        {/* フッターやボタンは意図的に未提供（常時表示） */}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
