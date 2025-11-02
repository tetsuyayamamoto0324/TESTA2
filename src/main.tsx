// src/main.tsx
import './global.css'; // ← 忘れずに最上位で読み込む
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorProvider } from "@/contexts/ErrorContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorProvider>
      <App />
    </ErrorProvider>
  </React.StrictMode>
);