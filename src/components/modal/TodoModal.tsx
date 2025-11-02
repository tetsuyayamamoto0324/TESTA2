// src/components/TodoModal.tsx
import React, { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  dateText?: string;               // 例: "2025-10-22"
  initialText?: string;            // 改行区切りでToDoを渡す
  onSave: (text: string) => void;  // 改行テキストで返す（空なら削除扱い）
  onClose: () => void;
  showDelete?: boolean;            // 削除ボタンを出すか
  onDelete?: () => void;           // 削除押下時
};

export default function TodoModal({
  open,
  dateText,
  initialText,
  onSave,
  onClose,
  showDelete = false,
  onDelete,
}: Props) {
  const [text, setText] = useState(initialText ?? "");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setText(initialText ?? "");
    // 開いたら自動フォーカス
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [open, initialText]);

  if (!open) return null;

  const onBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    // 見た目は当てない。classNameは将来のCSS Modules用フック。
    <div role="presentation" className="overlay" onClick={onBackdropClick}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="todo-modal-title"
        aria-describedby="todo-modal-desc"
        className="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 見出し */}
        <div className="header">
          <div id="todo-modal-title" className="title">ToDo を編集</div>
          <button type="button" onClick={onClose} aria-label="閉じる" className="close">
            ×
          </button>
        </div>

        {/* 日付バッジ（任意表示） */}
        {dateText && (
          <div id="todo-modal-desc" className="date">
            {dateText}
          </div>
        )}

        {/* 入力 */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="タスクを打ち込んでください"
          className="textarea"
        />

        {/* フッター */}
        <div className="footer">
          {showDelete && (
            <button type="button" onClick={onDelete} className="delete">
              削除
            </button>
          )}
          <button type="button" onClick={() => onSave(text)} className="save">
            更新
          </button>
        </div>
      </div>
    </div>
  );
}
