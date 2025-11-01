// src/pages/Today.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { fetchCurrentByCoords, fetchTodayMaxPop } from "@/lib/openweather";
import HeaderBar from "@/components/layout/HeaderBar/HeaderBar";
import WeatherHero from "@/components/weather/WeatherHero";
import { jstYmd } from "@/lib/date-jst";
import QuoteOfTheDay from "@/components/weather/QuoteOfTheDay";
import OutfitSimple from "@/components/weather/OutfitSimple";
import s from "./Today.module.css";
import type * as React from "react";
import { useError } from "@/contexts/ErrorContext"; // 追記
import { z } from "zod"; // 追記
import { validateResponseOrShow } from "@/lib/validate"; // 追記

type State = {
  name?: string;
  temp?: number;
  desc?: string;
  icon?: string;
  pop?: number;
  loading: boolean;
  error?: string;
};

type SavedCity = {
  name: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
} | null;

// OpenWeather 受信スキーマ（実際に使う最小限） // 追記
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
}); // 追記
const MaxPopSchema = z.number().min(0).max(1).nullable().optional();

export default function Today() {
  const [state, setState] = useState<State>({ loading: true });
  const showError = useError(); // 追記

  // localStorage から都市設定（なければ東京都(35.6895, 139.6917)）
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

  // 天気再取得（HeaderBar の「再取得」から呼ばれる）
  const refetchWeather = useCallback(async () => {
    try {
      const [curRaw, popRaw] = await Promise.all([
        fetchCurrentByCoords(lat, lon),
        fetchTodayMaxPop(lat, lon),
      ]); // 修正

      // スキーマ検証（NGならここでモーダル） // 追記
      const curChk = validateResponseOrShow({
        schema: CurrentSchema,
        data: curRaw,
        showError,
        title: "データの読み取りに失敗しました", // 追記
        code: "300", // 追記
      }); // 追記
      if (!curChk.ok) {
        setState((s) => ({ ...s, loading: false })); // 追記
        return; // 追記
      }

      const popChk = validateResponseOrShow({
        schema: MaxPopSchema,
        data: popRaw,
        showError,
        title: "降水確率データの読み取りに失敗しました", // 追記
        code: "301", // 追記
      }); // 追記
      if (!popChk.ok) {
        setState((s) => ({ ...s, loading: false })); // 追記
        return; // 追記
      }

      const cur = curChk.data; // 追記
      const pop = popChk.data; // 追記

      setState({
        name: cur.name || cityName,
        temp: cur.main?.temp ?? undefined,
        desc: cur.weather?.[0]?.description ?? "",
        icon: cur.weather?.[0]?.icon ?? "01d",
        pop,
        loading: false,
        error: undefined,
      }); // 修正
    } catch (e) {
      // 通信エラー等はここで共通モーダル表示（NETWORK は専用モーダルへ） // 追記
      showError(e, { retry: refetchWeather }); // 修正
      setState((s) => ({ ...s, loading: false, error: undefined })); // 修正
    }
  }, [lat, lon, cityName, showError]); // 修正

  // 初回ロード
  useEffect(() => {
    (async () => {
      try {
        await refetchWeather();
      } catch (e: any) {
        showError(e, { retry: refetchWeather }); // 修正
        setState((s) => ({ ...s, loading: false, error: undefined })); // 修正
      }
    })();
  }, [refetchWeather, showError]); // 修正

  if (state.loading) return <div style={{ padding: 16 }}>読み込み中…</div>;
  if (state.error) return <div style={{ padding: 16, color: "#e03131" }}>{state.error}</div>;

  const seed = jstYmd();

  return (
    <>
      {/* ヘッダー（都市名は保存値 or API 名、再取得を渡す） */}
      <HeaderBar
        date={new Date()}
        city={cityName}
        onRefetchWeather={refetchWeather}
        onCityClick={() => {
          // ヘッダーの都市名タップで都市設定画面へ飛ばす場合は
          // ルーターでやる（例：useNavigate("/city")）。必要ならここに実装。
        }}
      />

      {/* メインヒーロー（気温・アイコン等） */}
      <WeatherHero
        tempC={state.temp ?? null}
        iconCode={state.icon ?? null}
        pop={state.pop ?? null}
        desc={state.desc ?? ""}
      />

      {/* 今日の格言（毎日固定 seed） */}
      <QuoteOfTheDay seed={seed} />

      {/* 2カラム（服装 / ラッキーアイテム） */}
      <section
        className={`${s.twoCol} ${s.vline}`}
        style={
          {
            "--vline-offset": "720px",
            "--vline-offset-y": "50px",
            "--vline-extend": "50px",
          } as React.CSSProperties
        }
      >
        <div>
          <OutfitSimple tempC={state.temp} />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontSize: "clamp(16px, 2.2vw, 22px)",
              transform: "translate(1200px, 50px)",
            }}
          >
            ラッキーアイテム
          </div>
          <div
            style={{
              fontSize: "clamp(40px, 8vw, 72px)",
              lineHeight: 1,
              transform: "translate(1200px, 100px)",
            }}
          >
            🧿
          </div>
        </div>
      </section>
    </>
  );
}
