// src/pages/Auth/Login.tsx
import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { z } from "zod";
import { Title, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../store/auth";
import { useError } from "@/contexts/ErrorContext";
import { normalizeError } from "@/lib/appError";
import s from "./Login.module.css";

const schema = z.object({
  email: z.string().min(1, "メールは必須です").email("メール形式が不正です"),
  password: z.string().min(6, "6文字以上で入力してください"),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const showError = useError();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    initialValues: { email: "", password: "" },
    validate: (values) => {
      const result = schema.safeParse(values);

      if (result.success) return {};

      const fieldErrors: Record<string, string | null> = {};

      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (typeof path === "string" && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });

      return fieldErrors;
    },
  });

  const onSubmit = form.onSubmit(async (values) => {
    setSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email.trim(), // 前後の空白を削る
        password: values.password,
      });

      if (error) {
        const appErr = normalizeError(error);
        showError(appErr, {
          title: "ログインに失敗しました",
          // ★ 固定の日本語メッセージだけを渡す
          fallbackMessage: "メールアドレスまたはパスワードが正しくありません。",
        });
        return;
      }

      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email });
        const to = (location.state as any)?.from?.pathname ?? "/today";
        navigate(to, { replace: true });
      }
    } catch (e) {
      const appErr = normalizeError(e);
      showError(appErr, {
        title: "ログインに失敗しました",
        fallbackMessage:
          "予期せぬエラーが発生しました。時間をおいて再度お試しください。",
      });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className={s.loginPage}>
      <div className={s.container}>
        <Title order={2} className={s.title}>
          ログイン
        </Title>

<form onSubmit={onSubmit} className={s.form}>
  <div className={s.field}>
    <input
      name="email"
      type="email"
      placeholder="メールアドレス"
      autoComplete="email"
      className={s.input}
      {...form.getInputProps("email")}
    />
    {form.errors.email && (
      <div className={s.fieldError}>{form.errors.email}</div>
    )}
  </div>

  <div className={s.field}>
    <input
      name="password"
      type="password"
      placeholder="パスワード"
      autoComplete="current-password"
      className={s.input}
      {...form.getInputProps("password")}
    />
    {form.errors.password && (
      <div className={s.fieldError}>{form.errors.password}</div>
    )}
  </div>

  <button
    type="submit"
    disabled={submitting}
    className={s.linkBtn}
    aria-disabled={submitting}
  >
    <span className={s.linkLabel}>ログイン</span>
  </button>
</form>



        <div className={s.linkWrap}>
          <Link to="/signup" className={s.linkBtn}>
            <span className={s.linkLabel}>新規登録へ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
