// src/pages/today/Today.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { z } from "zod";
import HeaderBar from "@/components/layout/HeaderBar/HeaderBar";
import WeatherHero from "@/components/weather/WeatherHero/WeatherHero";
import QuoteOfTheDay from "@/components/weather/QuoteOfTheDay/QuoteOfTheDay";
import OutfitSimple from "@/components/weather/OutfitSimple/OutfitSimple";
import LuckyItem from "@/components/weather/LuckyItem/LuckyItem";
import { fetchCurrentByCoords, fetchTodayMaxPop } from "@/lib/openweather";
import { jstYmd } from "@/lib/date-jst";
import { useError } from "@/contexts/ErrorContext";
import { validateResponseOrShow } from "@/lib/validate";
import s from "./Today.module.css";
// これは 画面用の状態（state）の形 を TypeScript で定義しています。
type State = {
  name?: string;
  temp?: number;
  desc?: string;
  icon?: string;
  pop?: number;
  loading: boolean;
  error?: string;
};
// SavedCity は localStorage に保存されている都市情報の形 です。
type SavedCity = {
  name: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
} | null;

// OpenWeather の「現在の天気」レスポンスのうち、必要な最小限だけを Zod で定義しています。
const CurrentSchema = z.object({
  name: z.string().optional(),
  main: z.object({ temp: z.number().nullable().optional() }).optional(),
  weather: z
    .array(
      z.object({
        description: z.string().optional(),
        icon: z.string().optional(),
      })
    )
    .optional(),
});
// 「降水確率」の最大値を 0〜1 の数値 or null or undefined として許可するスキーマ。
const MaxPopSchema = z.number().min(0).max(1).nullable().optional();
// 初期状態は「読み込み中」。
// エラー表示専用の機能も準備しておく。
export default function Today() {
  const [state, setState] = useState<State>({ loading: true });
  const showError = useError();

//   前に選んだ都市があればそれを使う。
// なければ 緯度/経度が東京になる。
  const saved: SavedCity = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("default-city-v1") || "null");
    } catch {
      return null;
    }
  }, []);

  const lat = saved?.lat ?? 35.6895;
  const lon = saved?.lon ?? 139.6917;
  const cityName = saved?.name ?? "東京都";

// 天気と降水確率を同時取得し、
// 形式チェックしてから state に入れる。
// 失敗したらエラーメッセージを表示。
  const refetchWeather = useCallback(async () => {
    try {
      // 2つの API を同時に取得
      const [curRaw, popRaw] = await Promise.all([
        fetchCurrentByCoords(lat, lon),
        fetchTodayMaxPop(lat, lon),
      ]);
 // スキーマでチェック
      const curChk = validateResponseOrShow({
        schema: CurrentSchema,
        data: curRaw,
        showError,
        title: "データの読み取りに失敗しました",
        code: "300",
      });
      if (!curChk.ok) {
        setState((s) => ({ ...s, loading: false }));
        return;
      }

      const popChk = validateResponseOrShow({
        schema: MaxPopSchema,
        data: popRaw,
        showError,
        title: "降水確率データの読み取りに失敗しました",
        code: "301",
      });
      if (!popChk.ok) {
        setState((s) => ({ ...s, loading: false }));
        return;
      }

      const cur = curChk.data;
      const pop = popChk.data;
// 正常に取れたら state 更新
      setState({
        name: cur.name || cityName,
        temp: cur.main?.temp ?? undefined,
        desc: cur.weather?.[0]?.description ?? "",
        icon: cur.weather?.[0]?.icon ?? "01d",
        pop,
        loading: false,
        error: undefined,
      });
    } catch (e) {
      showError(e, { retry: refetchWeather });
      setState((s) => ({ ...s, loading: false, error: undefined }));
    }
  }, [lat, lon, cityName, showError]);

  //Today 画面を開いた瞬間に天気を取りに行く。
  useEffect(() => {
    (async () => {
      try {
        await refetchWeather();
      } catch (e) {
        showError(e, { retry: refetchWeather });
        setState((s) => ({ ...s, loading: false, error: undefined }));
      }
    })();
  }, [refetchWeather, showError]);
// データが来る前は中身を見せず、
// 状態に応じて UI を切り替える。
  if (state.loading) return <div className={s.loading}>読み込み中…</div>;
  if (state.error) return <div className={s.error}>{state.error}</div>;

  const seed = jstYmd();

  return (
    <div className={s.todayPage}>
      <HeaderBar onRefetchWeather={refetchWeather} />

      {/* 2行目: 本文 */}
      <main className={s.main}>
        <div className={s.mainInner}>
          <WeatherHero
            tempC={state.temp ?? null}
            iconCode={state.icon ?? null}
            pop={state.pop ?? null}
            desc={state.desc ?? ""}
          />
          <QuoteOfTheDay />

          <section className={s.outfitLucky}>
            <div className={s.outfitInner}>
              <OutfitSimple tempC={state.temp ?? null} />
            </div>
            <div className={s.luckyInner}>
              <LuckyItem  />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
