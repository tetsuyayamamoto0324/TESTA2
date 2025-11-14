// src/pages/Calendar/CalendarTodo.tsx
import React from "react";
import TodoModal from "@/components/modal/TodoModal";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { useError } from "@/contexts/ErrorContext";
import { useAuth } from "@/store/auth";
import s from "./CalendarTodo.module.css";
import HeaderBar from "@/components/layout/HeaderBar/HeaderBar";

const REMOTE_TODO_ENABLED = import.meta.env.VITE_TODO_REMOTE === "1";
const ERROR_MODAL_ENABLED = import.meta.env.VITE_TODO_ERROR_MODAL === "1";

function isSupabaseReady() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && supabase?.from);
}

const clip = (text: string, max: number) => {
  const arr = Array.from(text);
  return arr.length <= max ? text : arr.slice(0, max).join("") + "…";
};

const LS_KEY = "todo-cal-v1";
const LONG_LINE_MAX = 10;
const ITEM_LINE_MAX = 10;

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

type TodoMap = Record<string, string[]>;

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

  const prev = () => {
    const m = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(m.getFullYear());
    setViewMonth(m.getMonth());
  };
  const next = () => {
    const m = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(m.getFullYear());
    setViewMonth(m.getMonth());
  };

  const keyFromDate = (d: Date) => ymd(d);

  const editDay = (d: Date) => {
    const key = keyFromDate(d);
    const cur = todos[key] ?? [];
    setModalDate(d);
    setModalInitial(cur.join("\n"));
    setModalShowDelete(cur.length > 0);
    setModalOpen(true);
  };

  const reportError = React.useCallback(
    (e: unknown, retry?: () => void) => {
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
        dateText={modalDate ? ymd(modalDate) : ""}
        initialText={modalInitial}
        showDelete={modalShowDelete}
        onDelete={handleDeleteModal}
        onSave={handleSaveModal}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
