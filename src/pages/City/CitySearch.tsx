// src/pages/CitySearch.tsx
import React, { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useCity } from "@/store/city";
import { useError } from "@/contexts/ErrorContext";
import { validateResponseOrShow } from "@/lib/validate";

const GEO_API = "https://api.openweathermap.org/geo/1.0/direct";
const KEY = import.meta.env.VITE_OPENWEATHER_KEY as string;
const DEFAULT_COUNTRY = "JP";

const LS_KEY = "default-city-v1";

type GeoItem = {
  name: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
};

type SavedCity = GeoItem;

const GeoItemSchema = z.object({
  name: z.string(),
  state: z.string().optional(),
  country: z.string().length(2),
  lat: z.number(),
  lon: z.number(),
});
const GeoListSchema = z.array(GeoItemSchema);

function hasCountry(raw: string) {
  return /,\s*[A-Za-z]{2}$/.test(raw.trim());
}

export default function CitySearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedCity | null>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as SavedCity) : null;
    } catch {
      return null;
    }
  });

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

  async function fetchTopCandidate(typed: string): Promise<GeoItem | null> {
    if (!typed) return null;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const urlJP = `${GEO_API}?q=${encodeURIComponent(typed + ",JP")}&limit=1&appid=${KEY}`;
      let res = await fetch(urlJP, { signal: ac.signal });
      let list: unknown = res.ok ? await res.json() : [];

      if (Array.isArray(list) && list.length === 0) {
        const urlAny = `${GEO_API}?q=${encodeURIComponent(typed)}&limit=1&appid=${KEY}`;
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
  }

  const onSave = (it: GeoItem) => {
    const payload: SavedCity = { ...it };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
    setSaved(payload);
    setResults([]);
    setQ(it.name);
    useCity.getState().setCity(payload);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = async (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const typed = q.trim();
    if (!typed) return;
    if (results.length > 0) {
      onSave(results[0]);
      return;
    }
    const top = await fetchTopCandidate(typed);
    if (top) onSave(top);
    else setError("候補が見つかりませんでした");
  };

  return (
    <div className="wrap">
      <div className="shift">
        <div className="box">
          <div className="title">デフォルト都市検索</div>

          {saved && (
            <div className="savedLine">
              現在の設定：<strong>{saved.name}</strong>
              {saved.state ? `（${saved.state}）` : ""} / {saved.country}
            </div>
          )}

          <div className="inputWrap">
            <svg viewBox="0 0 24 24" className="icon" aria-hidden>
              <circle cx="10.5" cy="10.5" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
              <line x1="16" y1="16" x2="22" y2="22" stroke="currentColor" strokeWidth="2" />
            </svg>

            <input
              className="input"
              placeholder="都市名"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
            />
          </div>

          {error && <div className="err">{error}</div>}
          {!error && !loading && results.length === 0 && q.trim() && (
            <div className="smallNote">候補が見つかりませんでした</div>
          )}

          {results.length > 0 && (
            <div className="list">
              {results.map((it, i) => (
                <div key={`${it.name}-${it.lat}-${it.lon}-${i}`} className="item">
                  <div>
                    <span className="itemHead">{it.name}</span>
                    <span className="itemSub">
                      {it.state ? ` / ${it.state}` : ""} / {it.country}
                    </span>
                  </div>
                  <button className="saveBtn" onClick={() => onSave(it)}>
                    設定
                  </button>
                </div>
              ))}
            </div>
          )}

          {saved && !results.length && !error && (
            <div className="ok">
              保存しました：{saved.name}（{saved.country}）
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
