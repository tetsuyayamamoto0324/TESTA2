// src/App.tsx
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MantineProvider, AppShell } from "@mantine/core";

import { useAuth } from "./store/auth";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import ProtectedLayout from "./components/layout/ProtectedLayout";
import AuthGate from "./components/modal/NetworkErrorModal/AuthGate";

import Login from "./pages/Auth/Login/Login";
import Signup from "./pages/Auth/Signup/Signup";
import Today from "./pages/today/Today";
import Weekly from "./pages/Weekly/Weekly";
import CalendarTodo from "./pages/Todo/CalendarTodo";
import CitySearch from "./pages/City/CitySearch";

export default function App() {
  const { init } = useAuth();

  useEffect(() => {
    // Supabaseのセッション初期化＆リスナー登録
    init();
    // Zustandの関数参照は安定している想定。lintを黙らせるなら↓を有効化
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MantineProvider>
      <BrowserRouter>
        <AppShell header={{ height: 0 }} padding="md">
          <AuthGate />
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<Today />} />
                <Route path="/today" element={<Today />} />
                <Route path="/weekly" element={<Weekly />} />
                <Route path="/calendar" element={<CalendarTodo />} />
                <Route path="/cities" element={<CitySearch />} />
                <Route path="/city" element={<CitySearch />} />
              </Route>
            </Route>

            {/* 非ログイン時のみ表示するルート */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* 不明URLはホームへリダイレクト */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </MantineProvider>
  );
}
