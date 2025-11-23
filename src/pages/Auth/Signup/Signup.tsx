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
// 「メール入力欄の値が変わった時に
// ① email state を更新して
// ②（もし一度でも送信されていたら）その場でメールのバリデーションをして、
// エラーメッセージを emailErr に入れる」
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
// 「フォームが送信されたときに呼ばれる関数です。
// まずブラウザ標準のフォーム送信（ページリロード）を止め、
// 『このフォームは一度送信された』というフラグを立てて、
// さらに画面上の古いエラーメッセージをクリアしてから、
// このあと API 呼び出しなど、本当のサインアップ処理を続けます。」
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmittedOnce(true);
    setError(null);
// 「もしバリデーションに失敗していたら、
// 各フィールドにエラーをセットして、
// ここで処理を中断する（サインアップ処理本体には進まない）。」
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setEmailErr(fe.email?.[0] ?? null);
      setPasswordErr(fe.password?.[0] ?? null);
      return;
    }
//「Supabase の signUp の結果から
// 返ってきた data を signUpData、
// 返ってきた error を signUpError
// という変数名で受け取っている」
    setEmailErr(null);
    setPasswordErr(null);

    setSubmitting(true);
    try {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
        });
// 「サインアップに失敗した場合は、
// エラーを表示して、
// ここでサインアップ処理全体を終了する。
// 成功時のログイン状態更新や画面遷移は行わない。」
      if (signUpError) {
        const appErr = normalizeError(signUpError);
        showError(appErr, {
          title: "このメールアドレスは登録済です。",
          fallbackMessage: messageFor(appErr.kind, appErr.message),
        });
        setError(signUpError.message);
        return;
      }
// 「Supabase が session と user を返してきていれば、
// それを使ってアプリ内でログイン状態にセットし、
// /today 画面へ遷移して処理を終了する」
      if (signUpData?.session && signUpData.user) {
        setUser({ id: signUpData.user.id, email: signUpData.user.email });
        navigate("/today");
        return;
      }
// 「メール＆パスワードで Supabase にログインをお願いして、
// エラーが返ってきたら、
// 共通のエラー表示を出して、画面用のエラーメッセージもセットして、
// そこで処理を終了する」
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
// 「ログインAPIの結果にユーザー情報が入っていれば、
// そのユーザーをアプリの user 状態にセットして、
// /today ページに遷移し、そこで処理を終える」
      if (signInData?.user) {
        setUser({ id: signInData.user.id, email: signInData.user.email });
        navigate("/today");
        return;
      }
// サインアップ＆ログインの処理を一通り試した結果、
// うまくログイン状態になれなかった場合は、
// 「サインアップは成功したがログインできなかった」とユーザーに知らせる。

// その途中で予期しない例外が起きた場合も、
// normalizeError と showError と setError でエラーを見せる。

// どんなパターンでも、最後には submitting を false に戻して
// 「送信中」状態を解除する。
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
