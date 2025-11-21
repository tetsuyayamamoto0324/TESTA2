// src/pages/Auth/Signup.tsx
import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { z } from "zod";
import { Alert, Title } from "@mantine/core";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../store/auth";
import { useError } from "@/contexts/ErrorContext";
import { normalizeError, messageFor } from "@/lib/appError";
import s from "./Signup.module.css";

const schema = z.object({
  email: z.string().min(1, "メールは必須です").email("メール形式が不正です"),
  password: z.string().min(6, "6文字以上で入力してください"),
});

export default function Signup() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const showError = useError();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [passwordErr, setPasswordErr] = useState<string | null>(null);
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onChangeEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setEmail(v);
    if (submittedOnce) {
      const r = schema.pick({ email: true }).safeParse({ email: v });
      setEmailErr(
        r.success ? null : r.error.flatten().fieldErrors.email?.[0] ?? null
      );
    }
  };

  const onChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setPassword(v);
    if (submittedOnce) {
      const r = schema.pick({ password: true }).safeParse({ password: v });
      setPasswordErr(
        r.success
          ? null
          : r.error.flatten().fieldErrors.password?.[0] ?? null
      );
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmittedOnce(true);
    setError(null);

    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setEmailErr(fe.email?.[0] ?? null);
      setPasswordErr(fe.password?.[0] ?? null);
      return;
    }
    setEmailErr(null);
    setPasswordErr(null);

    setSubmitting(true);
    try {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (signUpError) {
        const appErr = normalizeError(signUpError);
        showError(appErr, {
          title: "このメールアドレスは登録済です。",
          fallbackMessage: messageFor(appErr.kind, appErr.message),
        });
        setError(signUpError.message);
        return;
      }

      if (signUpData?.session && signUpData.user) {
        setUser({ id: signUpData.user.id, email: signUpData.user.email });
        navigate("/today");
        return;
      }

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        const appErr = normalizeError(signInError);
        showError(appErr, {
          title: "ログインに失敗しました",
          fallbackMessage: messageFor(appErr.kind, appErr.message),
        });
        setError(signInError.message);
        return;
      }

      if (signInData?.user) {
        setUser({ id: signInData.user.id, email: signInData.user.email });
        navigate("/today");
        return;
      }

      setError("サインアップは成功しましたが、ログインできませんでした。");
      showError(
        new Error("サインアップは成功しましたが、ログインできませんでした。"),
        {
          title: "ログインできませんでした",
        }
      );
    } catch (e: any) {
      const appErr = normalizeError(e);
      showError(appErr, {
        title: "このメールアドレスは登録済です。",
        fallbackMessage: messageFor(appErr.kind, appErr.message),
      });
      setError(appErr.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={s.loginPage}>
      <div className={s.container}>
        <Title order={2} className={s.title}>
          新規登録
        </Title>

        {/* ログインには無いけど、エラーアラートはそのまま残してOK */}
        {error && (
          <Alert color="red" className={s.errorAlert}>
            {error}
          </Alert>
        )}

<form onSubmit={handleSubmit} className={s.form} noValidate>
  {/* メール */}
  <div className={s.field}>
    <input
      type="email"
      name="email"
      placeholder="メールアドレス"
      autoComplete="email"
      aria-label="メールアドレス"
      value={email}
      onChange={onChangeEmail}
      required
      className={s.input}
    />
    {emailErr && <div className={s.fieldError}>{emailErr}</div>}
  </div>

  {/* パスワード */}
  <div className={s.field}>
    <input
      type="password"
      name="password"
      placeholder="パスワード"
      autoComplete="new-password"
      aria-label="パスワード"
      value={password}
      onChange={onChangePassword}
      required
      className={s.input}
    />
    {passwordErr && <div className={s.fieldError}>{passwordErr}</div>}
  </div>

  {/* 送信ボタン */}
  <button
    type="submit"
    disabled={submitting}
    className={s.linkBtn}
    aria-disabled={submitting}
  >
    <span className={s.linkLabel}>新規登録</span>
  </button>
</form>

        <div className={s.linkWrap}>
          <Link to="/login" className={s.linkBtn}>
            <span className={s.linkLabel}>ログインへ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
