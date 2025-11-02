// src/pages/Auth/Login.tsx
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { z } from "zod";
import { Alert, Title, Stack } from "@mantine/core";
import { useForm, zodResolver } from "@mantine/form";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../store/auth";
import { useError } from "@/contexts/ErrorContext";
import { normalizeError, messageFor } from "@/lib/appError";

const schema = z.object({
  email: z.string().min(1, "メールは必須です").email("メール形式が不正です"),
  password: z.string().min(6, "6文字以上で入力してください"),
});
type FormValues = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const showError = useError();

  const form = useForm<FormValues>({
    initialValues: { email: "", password: "" },
    validate: zodResolver(schema),
  });

  const onSubmit = form.onSubmit(async (values) => {
    setError(null);
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        const appErr = normalizeError(error);
        showError(appErr, {
          title: "ログインに失敗しました",
          fallbackMessage: messageFor(appErr.kind, appErr.message),
        });
        setError(error.message);
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
        fallbackMessage: messageFor(appErr.kind, appErr.message),
      });
      setError(appErr.message);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="authPage">
      <div className="authContainer">
        <Title order={2} ta="center" fw={700} mb={28}>
          ログイン
        </Title>
        <Title order={5} ta="center" c="dimmed" fw={600} mb={20}>
          メールアドレスでログイン
        </Title>

        {error && (
          <Alert color="red" mb="sm" className="errorAlert">
            {error}
          </Alert>
        )}

        <form onSubmit={onSubmit} className="form">
          <Stack gap={24}>
            <div className="field">
              <input
                name="email"
                type="email"
                placeholder="メールアドレス"
                autoComplete="email"
                className="input"
                {...form.getInputProps("email")}
              />
            </div>

            <div className="field">
              <input
                name="password"
                type="password"
                placeholder="パスワード"
                autoComplete="current-password"
                className="input"
                {...form.getInputProps("password")}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`submitBtn${submitting ? " isSubmitting" : ""}`}
              aria-disabled={submitting}
            >
              <span className="submitLabel">ログイン</span>
            </button>
          </Stack>
        </form>

        <div className="linkWrap">
          <Link to="/signup" className="linkBtn">
            <span className="linkLabel">新規登録へ</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
