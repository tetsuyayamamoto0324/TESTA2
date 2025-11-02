// src/pages/Today.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { z } from "zod";
import HeaderBar from "@/components/layout/HeaderBar/HeaderBar";
import WeatherHero from "@/components/weather/WeatherHero";
import QuoteOfTheDay from "@/components/weather/QuoteOfTheDay";
import OutfitSimple from "@/components/weather/OutfitSimple";
import { fetchCurrentByCoords, fetchTodayMaxPop } from "@/lib/openweather";
import { jstYmd } from "@/lib/date-jst";
import { useError } from "@/contexts/ErrorContext";
import { validateResponseOrShow } from "@/lib/validate";
import s from "./Today.module.css";

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

// OpenWeather 受信スキーマ（最小限）
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
const MaxPopSchema = z.number().min(0).max(1).nullable().optional();

export default function Today() {
  const [state, setState] = useState<State>({ loading: true });
  const showError = useError();

  // localStorage から都市設定（なければ東京都）
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

  // 天気再取得（HeaderBarからも呼べる）
  const refetchWeather = useCallback(async () => {
    try {
      const [curRaw, popRaw] = await Promise.all([
        fetchCurrentByCoords(lat, lon),
        fetchTodayMaxPop(lat, lon),
      ]);

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

  // 初回ロード
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

  if (state.loading) return <div className={s.loading}>読み込み中…</div>;
  if (state.error) return <div className={s.error}>{state.error}</div>;

  const seed = jstYmd();

  return (
    <div className={s.todayPage}>
      <HeaderBar
        date={new Date()}
        city={cityName}
        onRefetchWeather={refetchWeather}
      />

      <WeatherHero
        tempC={state.temp ?? null}
        iconCode={state.icon ?? null}
        pop={state.pop ?? null}
        desc={state.desc ?? ""}
      />

      <QuoteOfTheDay seed={seed} />

      <section className={s.twoColumn}>
        <div className={`${s.col} ${s.outfitCol}`}>
          <OutfitSimple tempC={state.temp} />
        </div>

        <div className={`${s.col} ${s.luckyCol}`}>
          <div className={s.luckyTitle}>ラッキーアイテム</div>
          <div className={s.luckyIcon}>🧿</div>
        </div>
      </section>
    </div>
  );
}
