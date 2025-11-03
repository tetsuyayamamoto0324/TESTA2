import React from "react";
import { NavLink } from "react-router-dom";
import s from "./BottomTabs.module.css";

const tabs = [
  { to: "/today", label: "HOME" },
  { to: "/weekly", label: "週間" },
  { to: "/calendar", label: "ToDoカレンダー" },
  { to: "/cities", label: "都市検索" },
];

const cx = (...xs: Array<string | false | undefined>) =>
  xs.filter(Boolean).join(" ");

export default function BottomTabs() {
  return (
    <nav className={s.tabbar} aria-label="ボトムタブナビゲーション">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end
          className={({ isActive }) => cx(s.link, isActive && s.active)}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
