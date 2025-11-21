// src/components/modal/TodoModal.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
} from "@mui/material";
import s from "./TodoModal.module.css";

type Props = {
  open: boolean;
  initialText?: string;            // 改行区切りでToDoを渡す
  onSave: (text: string) => void;  // 改行テキストで返す（空なら削除扱い）
  onClose: () => void;
  showDelete?: boolean;            // 削除ボタンを出すか
  onDelete?: () => void;           // 削除押下時
};

export default function TodoModal({
  open,
  initialText,
  onSave,
  onClose,
  showDelete = false,
  onDelete,
}: Props) {
  const [text, setText] = useState(initialText ?? "");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setText(initialText ?? "");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open, initialText]);

  const handleSave = () => {
    onSave(text);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        backdrop: { className: s.overlay },
        paper: { className: s.dialog },
      }}
    >
      <DialogTitle className={s.header}>
        <button
          type="button"
          aria-label="閉じる"
          onClick={onClose}
          className={s.close}
        >
          ×
        </button>
      </DialogTitle>

      <DialogContent className={s.body} >
        <TextField
          inputRef={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="タスクを打ち込んでください"
          multiline
          minRows={6}
          fullWidth
          className={s.textarea}
        />
      </DialogContent>

<DialogActions>
  <div className={s.footer}>
    <div className={s.footerLeft}>
      {showDelete && (
        <button
          type="button"
          onClick={onDelete}
          className={s.delete}
        >
          削除
        </button>
      )}
    </div>

    <div className={s.footerRight}>
      <button
        type="button"
        onClick={handleSave}
        className={s.save}
      >
        更新
      </button>
    </div>
  </div>
</DialogActions>
    </Dialog>
  );
}
