// src/pages/Auth/Signup.tsx
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { z } from "zod";
import { Alert, Title } from "@mantine/core";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../store/auth";
import { useError } from "@/contexts/ErrorContext";
import { normalizeError, messageFor } from "@/lib/appError";

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
      setEmailErr(r.success ? null : r.error.flatten().fieldErrors.email?.[0] ?? null);
    }
  };
  const onChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setPassword(v);
    if (submittedOnce) {
      const r = schema.pick({ password: true }).safeParse({ password: v });
      setPasswordErr(r.success ? null : r.error.flatten().fieldErrors.password?.[0] ?? null);
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
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
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
        navigate("/");
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
        navigate("/");
        return;
      }

      setError("サインアップは成功しましたが、ログインできませんでした。");
      showError(new Error("サインアップは成功しましたが、ログインできませんでした。"), {
        title: "ログインできませんでした",
      });
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
    <div className="authPage">
      <div className="authContainer">
        <Title order={2} ta="center" fw={700} mb={28}>
          新規登録
        </Title>
        <Title order={5} ta="center" c="dimmed" fw={600} mb={20}>
          メールアドレスで登録
        </Title>

        {error && (
          <Alert color="red" className="errorAlert">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="form">
          {/* メール */}
          <div className="field">
            <input
              type="email"
              name="email"
              placeholder="メールアドレス"
              autoComplete="email"
              aria-label="メールアドレス"
              value={email}
              onChange={onChangeEmail}
              required
              className="input"
            />
          </div>
          {emailErr && <div className="fieldError">{emailErr}</div>}

          {/* パスワード */}
          <div className="field">
            <input
              type="password"
              name="password"
              placeholder="パスワード"
              autoComplete="new-password"
              aria-label="パスワード"
              value={password}
              onChange={onChangePassword}
              required
              className="input"
            />
          </div>
          {passwordErr && <div className="fieldError">{passwordErr}</div>}

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={submitting}
            className={`submitBtn${submitting ? " isSubmitting" : ""}`}
            aria-disabled={submitting}
          >
            <span className="submitLabel">新規登録</span>
          </button>
        </form>

        <div className="linkWrap">
          <Link to="/login" className="linkBtn">
            <span className="linkLabel">ログインへ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
