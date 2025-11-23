// src/pages/Calendar/CalendarTodo.tsx
import React from "react";
import TodoModal from "@/components/modal/ToDoModal/TodoModal";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useError } from "@/contexts/ErrorContext";
import { useAuth } from "@/store/auth";
import s from "./CalendarTodo.module.css";
import HeaderBar from "@/components/layout/HeaderBar/HeaderBar";

const REMOTE_TODO_ENABLED = import.meta.env.VITE_TODO_REMOTE === "1";
const ERROR_MODAL_ENABLED = import.meta.env.VITE_TODO_ERROR_MODAL === "1";
// Supabase の URL とキーがちゃんと設定されているかを確認する関数。
// 設定がなければ「リモート保存はやらない」という安全策。
function isSupabaseReady() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && supabase?.from);
}
// 文字列が長すぎるときに、
// max 文字で切って「…」をつける関数。
// カレンダーの1マスが長文で崩れないようにする。
const clip = (text: string, max: number) => {
  const arr = Array.from(text);
  return arr.length <= max ? text : arr.slice(0, max).join("") + "…";
};
// LS_KEY … localStorage で ToDo を保存するためのキー名。
const LS_KEY = "todo-cal-v1";
const LONG_LINE_MAX = 10;
const ITEM_LINE_MAX = 10;
// Date オブジェクトを "2025-11-24" みたいな文字列にする関数。
// ローカル保存や Supabase 保存で「日付のキー」として使う。
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

type TodoMap = Record<string, string[]>;
// → localStorage から ToDo マップを読み込む。エラー時は空オブジェクト {}。

// saveTodos
// → ToDo マップを localStorage に保存。
function loadTodos(): TodoMap {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as TodoMap) : {};
  } catch {
    return {};
  }
}
function saveTodos(v: TodoMap) {
  localStorage.setItem(LS_KEY, JSON.stringify(v));
}
// 「カレンダー表示用に42マス（6週間 × 7日）分の Date を作る」関数。
function buildMonthMatrix(viewYear: number, viewMonth: number) {
  const first = new Date(viewYear, viewMonth, 1);
  const firstDow = first.getDay();
  const start = new Date(viewYear, viewMonth, 1 - firstDow);
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({ date: d, inMonth: d.getMonth() === viewMonth });
  }
  return cells;
}
// Row … Supabase の todos テーブルから返ってくる行の型（date と text）。
type Row = { date: string; text: string };

function monthRange(y: number, m0: number) {
  const from = new Date(y, m0, 1);
  const to = new Date(y, m0 + 1, 1);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  return { from: iso(from), to: iso(to) };
}
// 「カレンダー画面の“今の状態”を全部用意しているところ」
export default function CalendarTodo() {
  const today = new Date();
  const [viewYear, setViewYear] = React.useState(today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(today.getMonth());
  const [todos, setTodos] = React.useState<TodoMap>(() => loadTodos());

  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalDate, setModalDate] = React.useState<Date | null>(null);
  const [modalInitial, setModalInitial] = React.useState("");
  const [modalShowDelete, setModalShowDelete] = React.useState(false);

  const showError = useError();
  const { user } = useAuth();

  const inflight = React.useRef<Set<string>>(new Set());

  const cells = React.useMemo(
    () => buildMonthMatrix(viewYear, viewMonth),
    [viewYear, viewMonth]
  );
  const titleMonth = viewMonth + 1;
// 「前月ボタンを押したときに、表示中の年・月を1ヶ月前に更新する関数」
  const prev = () => {
    const m = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(m.getFullYear());
    setViewMonth(m.getMonth());
  };
  // 「次月ボタンを押したときに、表示中の年・月を1ヶ月先に更新する関数」
  const next = () => {
    const m = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(m.getFullYear());
    setViewMonth(m.getMonth());
  };
// Date を "2025-11-24" のような文字列に変換する関数
  const keyFromDate = (d: Date) => ymd(d);
// カレンダーのある日をクリックしたときに、その日の ToDo をモーダルに読み込んで、編集できるように開くための関数
  const editDay = (d: Date) => {
    const key = keyFromDate(d);
    const cur = todos[key] ?? [];
    setModalDate(d);
    setModalInitial(cur.join("\n"));
    setModalShowDelete(cur.length > 0);
    setModalOpen(true);
  };
// 「reportError を安定させる（毎回作り直さない）ために useCallback を使っている」
  const reportError = React.useCallback(
    // 「エラー（e）と、必要なら再試行用の関数（retry）を受け取る関数」
    (e: unknown, retry?: () => void) => {
//       画面に「サーバーエラーが発生しました（WLP-SRV-501）」というタイトル
// 「時間をおいて再度お試しください」という説明
// 場合によっては「再試行」ボタン（→ retry が呼ばれる）
      if (ERROR_MODAL_ENABLED) {
        showError(e, {
          title: "サーバーエラーが発生しました（WLP-SRV-501）",
          fallbackMessage: "時間をおいて再度お試しください。",
          retry,
        });
      } else {
        console.warn("[CalendarTodo] remote error (suppressed):", e);
      }
    },
    [showError]
  );

  async function loadMonthTodos(y: number, m0: number) {
    if (!(REMOTE_TODO_ENABLED && isSupabaseReady())) return;
    if (!user?.id) return;

    const k = `${y}-${m0}`;
    if (inflight.current.has(k)) return;
    inflight.current.add(k);

    const { from, to } = monthRange(y, m0);
    try {
      const { data, error } = await supabase
        .from("todos")
        .select("date,text")
        .eq("user_id", user.id)
        .gte("date", from)
        .lt("date", to);

      if (error) throw error;

      const map: TodoMap = {};
      (data as Row[]).forEach((r) => {
        const lines =
          r.text?.split("\n").map((s) => s.trim()).filter(Boolean) ?? [];
        if (lines.length) map[r.date] = lines;
      });

      setTodos(map);
      saveTodos(map);
    } catch (e) {
      reportError(e, () => loadMonthTodos(y, m0));
    } finally {
      inflight.current.delete(k);
    }
  }

  async function upsertDayTodos(date: string, lines: string[]) {
    if (!(REMOTE_TODO_ENABLED && isSupabaseReady())) return;
    if (!user?.id) return;
    try {
      const text = lines.join("\n");
      const { error } = await supabase
        .from("todos")
        .upsert({ user_id: user.id, date, text }, { onConflict: "user_id,date" });
      if (error) throw error;
    } catch (e) {
      reportError(e, () => upsertDayTodos(date, lines));
    }
  }

  async function deleteDayTodos(date: string) {
    if (!(REMOTE_TODO_ENABLED && isSupabaseReady())) return;
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from("todos")
        .delete()
        .eq("user_id", user.id)
        .eq("date", date);
      if (error) throw error;
    } catch (e) {
      reportError(e, () => deleteDayTodos(date));
    }
  }

  React.useEffect(() => {
    loadMonthTodos(viewYear, viewMonth);
  }, [viewYear, viewMonth, user?.id]);

  const handleDeleteModal = () => {
    if (!modalDate) return;
    const key = ymd(modalDate);

    const nextTodos: TodoMap = { ...todos };
    delete nextTodos[key];
    setTodos(nextTodos);
    saveTodos(nextTodos);

    setModalOpen(false);
    setModalDate(null);

    deleteDayTodos(key);
  };

  const handleSaveModal = (text: string) => {
    if (!modalDate) return;
    const key = keyFromDate(modalDate);

    const lines = text.split("\n").map((s) => s.trim()).filter(Boolean);

    const nextTodos: TodoMap = { ...todos };
    if (lines.length === 0) delete nextTodos[key];
    else nextTodos[key] = lines;

    setTodos(nextTodos);
    saveTodos(nextTodos);

    setModalOpen(false);
    setModalDate(null);

    if (lines.length === 0) deleteDayTodos(key);
    else upsertDayTodos(key, lines);
  };

  const week = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const prevMonthText = (() => {
    const m = new Date(viewYear, viewMonth - 1, 1);
    return `${m.getMonth() + 1}月`;
  })();
  const nextMonthText = (() => {
    const m = new Date(viewYear, viewMonth + 1, 1);
    return `${m.getMonth() + 1}月`;
  })();

  return (
    <div className={s.ToDoPage}>
      <HeaderBar />
      <div className={s.wrap}>
        <div className={s.shift}>
          <div className={s.box}>
            <div className={s.title}>ToDoカレンダー</div>

            <div className={s.weekHead}>
              {week.map((w) => (
                <div key={w} className={s.weekCell}>{w}</div>
              ))}
            </div>

            <div className={s.grid}>
              {cells.map(({ date, inMonth }) => {
                const key = ymd(date);
                const list = todos[key] ?? [];

                const first = list[0] ?? "";
                const totalChars = list.join("").length;
                const isLong = first.length >= 8 || totalChars >= 20;

                return (
                  <div
                    key={key}
                    className={`${s.cell} ${inMonth ? "" : s.outCell}`}
                    onClick={() => editDay(date)}
                    title="クリックでこの日のToDoを編集"
                  >
                    <div className={s.dateNum}>{date.getDate()}</div>

                    {list.length > 0 &&
                      (isLong ? (
                        <div className={s.todoOneLineCenter} title={first}>
                          {clip(first, LONG_LINE_MAX)}
                        </div>
                      ) : (
                        <div className={s.todoList}>
                          {list.slice(0, 3).map((t, i) => (
                            <div key={i} className={s.todoItem} title={t}>
                              {clip(t, ITEM_LINE_MAX)}
                            </div>
                          ))}
                          {list.length > 3 && (
                            <div className={`${s.todoItem} ${s.more}`}>
                              +{list.length - 3} more
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>

            <div className={s.navRow}>
              <div className={`${s.navBtn} ${s.navPrevOffset}`} onClick={prev}>
                <div className={s.navTxt}>{prevMonthText}</div>
                <div className={s.arrow} aria-hidden>←</div>
              </div>

              <div className={`${s.centerYM} ${s.navCenterOffset}`}>
                {viewYear} / {titleMonth}
              </div>

              <div className={`${s.navBtn} ${s.navNextOffset}`} onClick={next}>
                <div className={s.navTxt}>{nextMonthText}</div>
                <div className={s.arrow} aria-hidden>→</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TodoModal
        open={modalOpen}
        initialText={modalInitial}
        showDelete={modalShowDelete}
        onDelete={handleDeleteModal}
        onSave={handleSaveModal}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
