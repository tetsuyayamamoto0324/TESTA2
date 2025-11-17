// src/hooks/useGeoSearch.ts
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useError } from "@/contexts/ErrorContext";
import { validateResponseOrShow } from "@/lib/validate";

const GEO_API = "https://api.openweathermap.org/geo/1.0/direct";
const KEY = import.meta.env.VITE_OPENWEATHER_KEY as string;
const DEFAULT_COUNTRY = "JP";

export type GeoItem = {
  name: string;
  local_names?: Record<string, string>;
  state?: string;
  country: string;
  lat: number;
  lon: number;
};

const GeoItemSchema = z.object({
  name: z.string(),
  local_names: z.record(z.string(), z.string()).optional(),
  state: z.string().optional(),
  country: z.string().length(2),
  lat: z.number(),
  lon: z.number(),
});
const GeoListSchema = z.array(GeoItemSchema);

function hasCountry(raw: string) {
  return /,\s*[A-Za-z]{2}$/.test(raw.trim());
}

export function useGeoSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showError = useError();
  const tRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const typed = q.trim();
    if (!typed) {
      setResults([]);
      setError(null);
      abortRef.current?.abort();
      return;
    }

    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        setLoading(true);
        setError(null);

        const q1 = hasCountry(typed) ? typed : `${typed},${DEFAULT_COUNTRY}`;
        const url1 = `${GEO_API}?q=${encodeURIComponent(q1)}&limit=1&appid=${KEY}`;

        let res = await fetch(url1, { signal: ac.signal });
        let list: unknown = res.ok ? await res.json() : [];

        // JP で見つからなければ全世界で再検索
        if (Array.isArray(list) && list.length === 0) {
          const url2 = `${GEO_API}?q=${encodeURIComponent(typed)}&limit=1&appid=${KEY}`;
          res = await fetch(url2, { signal: ac.signal });
          list = res.ok ? await res.json() : [];
        }

        const chk = validateResponseOrShow({
          schema: GeoListSchema,
          data: list,
          showError,
          title: "都市データの読み取りに失敗しました",
          code: "WLP-DATA-301",
        });

        if (!chk.ok) {
          setResults([]);
          return;
        }

        const arr = chk.data;
        setResults(arr);
        if (arr.length === 0) setError("都市名を正しく打ってください");
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        showError(e, {
          title: "通信エラーが発生しました（WLP-AUTH-201）",
          fallbackMessage: "時間をおいて再度お試しください。",
          retry: () => setQ((s) => s),
        });
        setError("検索に失敗しました");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (tRef.current) window.clearTimeout(tRef.current);
    };
  }, [q, showError]);

  // 「今の入力値から候補1件を強制的に取りに行く」用（Enterで使う想定）
  const fetchTopCandidate = async (typed: string): Promise<GeoItem | null> => {
    const v = typed.trim();
    if (!v) return null;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const urlJP = `${GEO_API}?q=${encodeURIComponent(v + ",JP")}&limit=1&appid=${KEY}`;
      let res = await fetch(urlJP, { signal: ac.signal });
      let list: unknown = res.ok ? await res.json() : [];

      if (Array.isArray(list) && list.length === 0) {
        const urlAny = `${GEO_API}?q=${encodeURIComponent(v)}&limit=1&appid=${KEY}`;
        res = await fetch(urlAny, { signal: ac.signal });
        list = res.ok ? await res.json() : [];
      }

      const parsed = GeoListSchema.safeParse(list);
      if (!parsed.success) return null;
      return parsed.data[0] ?? null;
    } catch (e: any) {
      if (e?.name === "AbortError") return null;
      showError(e, {
        title: "通信エラーが発生しました（WLP-AUTH-201）",
        fallbackMessage: "時間をおいて再度お試しください。",
      });
      return null;
    }
  };

  return {
    q,
    setQ,
    results,
    loading,
    error,
    setError,
    fetchTopCandidate,
  };
}
