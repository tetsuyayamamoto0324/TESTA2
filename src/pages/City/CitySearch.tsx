// src/pages/CitySearch.tsx
import React from "react";
import {
  Autocomplete,
  CircularProgress,
  TextField,
  Box,
  Button,
  Typography,
} from "@mui/material";
import { useCity } from "@/store/city";
import { useGeoSearch, GeoItem } from "@/hooks/useGeoSearch";
import HeaderBar from "@/components/layout/HeaderBar/HeaderBar";
import s from "./CitySearch.module.css";

const LS_KEY = "default-city-v1";

type SavedCity = GeoItem;

export default function CitySearch() {
  const { q, setQ, results, loading, error, setError, fetchTopCandidate } =
    useGeoSearch();

  const [saved, setSaved] = React.useState<SavedCity | null>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as SavedCity) : null;
    } catch {
      return null;
    }
  });

  const setCity = useCity.getState().setCity;

  const onSave = (it: GeoItem) => {
    const payload: SavedCity = { ...it };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
    setSaved(payload);
    setCity(payload);
  };

  const handleEnter: React.KeyboardEventHandler<HTMLInputElement> = async (e) => {
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
    <div className={s.ToDoPage}>
      <HeaderBar />

      <div className={s.wrap}>
        <div className={s.shift}>
          <div className={s.box}>
            <Typography variant="h6" align="center" gutterBottom>
              デフォルト都市検索
            </Typography>

            {saved && (
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                現在の設定：
                <strong>{saved.name}</strong>
                {saved.state ? `（${saved.state}）` : ""} / {saved.country}
              </Typography>
            )}

            <Autocomplete<GeoItem>
              options={results}
              loading={loading}
              getOptionLabel={(option) => {
                if (!option) return "";

                // OpenWeather の local_names.ja があればそれを優先
                const ja = option.local_names?.ja;
                const label = ja ?? option.name; // 日本語がなければ従来どおり name

                return `${label}${option.state ? ` / ${option.state}` : ""} / ${
                  option.country
                }`;
              }}
              inputValue={q}
              onInputChange={(_e, value) => {
                setError(null);
                setQ(value);
              }}
              onChange={(_e, value) => {
                if (value) onSave(value);
              }}
              noOptionsText={
                q.trim()
                  ? "候補が見つかりませんでした"
                  : "都市名を入力してください"
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="都市名"
                  placeholder="Tokyo, Osaka など"
                  size="small"
                  error={!!error}
                  helperText={error ?? ""}
                  onKeyDown={handleEnter}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              sx={{ mt: 1.5 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
