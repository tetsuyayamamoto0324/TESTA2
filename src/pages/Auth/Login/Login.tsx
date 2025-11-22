// src/pages/Auth/Login.tsx
import { useState } from "react";
import { supabase } from "../../../lib/supabase";
import { z } from "zod";
import { Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../store/auth";
import { useError } from "@/contexts/ErrorContext";
import { normalizeError } from "@/lib/appError";
import s from "./Login.module.css";

//ログインフォームの入力値の型とルールをまとめて定義しています。
const schema = z.object({
//xxx@yyy.zz のようなメール形式かチェック。
  email: z.string().min(1, "メールは必須です").email("メール形式が不正です"),
  //6文字未満ならエラー。
  password: z.string().min(6, "6文字以上で入力してください"),
});
//「このフォームが持つ値の型（email と password）を schema から自動で作って、それに FormValues という名前をつけている」
// 実際には infer で自動生成されるけど、手で書くとこんな感じ
// type FormValues = {
//   email: string;
//   password: string;
// };
type FormValues = z.infer<typeof schema>;
//フック
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const showError = useError();
  const [submitting, setSubmitting] = useState(false);

//「このフォームは FormValues 型の値を扱います」とTypeScript に教えています。
  const form = useForm<FormValues>({
    //「フォームを最初に表示するときの値は、全部空にしておく」
    initialValues: { email: "", password: "" },
    //「フォームの値 values を受け取って、その値が正しいかどうかチェックする関数」
    validate: (values) => {
      //「Zod のバリデーションルール（メール必須・形式チェック・パスワード6文字以上）を使って、今のフォームの入力が正しいかどうかを判定している」
      const result = schema.safeParse(values);
//「もし入力値がすべてルールに合っていれば、エラーはないので空のオブジェクトを返して終わり」
      if (result.success) return {};
//TypeScript の型宣言
      const fieldErrors: Record<string, string | null> = {};
//「このエラーはどのフィールドのものなのか？そのフィールド名（email / password）を path という変数に取り出している」
      result.error.issues.forEach((issue) => {
        const path = issue.path[0];
        if (typeof path === "string" && !fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });
// 「Zod でフォームの値をチェックして、
// もしエラーがあれば
// email や password といったフィールド名をキーにした
// { email: "エラーメッセージ", password: "エラーメッセージ" } という形に変換して
// Mantine のフォームに渡している」
      return fieldErrors;
    },
  });
//「フォームが送信されたときに呼ばれる onSubmit 関数を定義している。中ではフォームの値 values を受け取り、非同期でログイン処理を行う」
  const onSubmit = form.onSubmit(async (values) => {
    //「これからログイン処理を始めるので、送信中フラグを ON にしている」
    setSubmitting(true);
//予期せぬエラーが出たときに落ちないように try で囲んでいます。
    try {
      //Supabase の 認証API を呼んでからメールアドレス + パスワードでログインしようとしています。
      // 「Supabase にメール+パスワードでログインを試みて、その結果から data と error を取り出している」
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email.trim(), // 前後の空白を削る
        password: values.password,
      });

      if (error) {
        //「Supabase が返したエラーを、アプリ内で扱いやすい共通形式のエラー appErr に変換している」
//         「ログインに失敗したので、
// アプリ共通のエラー表示処理 showError を使って、
// ユーザーに
// 　『ログインに失敗しました』
// 　『メールアドレスまたはパスワードが正しくありません。』
// というメッセージを表示する」
        const appErr = normalizeError(error);
        showError(appErr, {
          title: "ログインに失敗しました",
          fallbackMessage: "メールアドレスまたはパスワードが正しくありません。",
        });
        return;
      }
//Supabase が data.user を返していたら
// そのユーザー情報をアプリの user 状態に保存し
// 元のページ、なければ /today にリダイレクトする（履歴は置き換え）
// もし実行中に予期しないエラーが起きたら
// 共通エラー処理で「予期せぬエラーが発生しました」と表示する
// 成功しても失敗しても、最後に必ず submitting を false に戻す
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
    {/* /* メール欄にエラーがあるときだけ、そのエラーメッセージを下に表示 * */}
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
