// src/pages/CitySearch.tsx
import React from "react";
import { Autocomplete, TextField, Typography } from "@mui/material";
import HeaderBar from "@/components/layout/HeaderBar/HeaderBar";
import { useCity, type City } from "@/store/city";
import { PREFECTURES, type PrefOption } from "@/data/prefectures";
import s from "./CitySearch.module.css";
// localStorage に保存するときの「キー名」です。
const LS_KEY = "default-city-v1";
// 「これは localStorage に保存する用の City だよ」と意味を分かりやすくしたい
type SavedCity = City;

export default function CitySearch() {
  // 「ユーザーが今何と打ち込んでいるか」を管理する state です。
  const [q, setQ] = React.useState("");

// saved：「前に選んで保存した都市」 を表す state
  const [saved, setSaved] = React.useState<SavedCity | null>(() => {
// 「saved の初期値は、localStorage から
// "default-city-v1" で保存されている都市情報を JSON で復元したもの。
// 何もなければ null。壊れてても null。」
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as SavedCity) : null;
    } catch {
      return null;
    }
  });

//  「Zustand のグローバルストアから setCity 関数だけ取り出しておいて、
// 選んだ都市をアプリ全体の状態に反映できるようにしている」
  const setCity = useCity.getState().setCity;

// 「都道府県が選ばれたら、
// City 型のオブジェクトに変換して localStorage に保存し、
// コンポーネント内の state とグローバル state 両方を更新する」
  const onSave = (pref: PrefOption) => {
    const payload: SavedCity = {
      name: pref.label,  // 「東京都」「大阪府」など
      lat: pref.lat,     // 県庁所在地の緯度
      lon: pref.lon,     // 県庁所在地の経度
      country: "JP",
      state: undefined,
    };

    localStorage.setItem(LS_KEY, JSON.stringify(payload));
    setSaved(payload);
    setCity(payload);
  };

//  「Enter キーが押されたら、入力テキストで都道府県リストから候補1つを見つけて、
// 入力欄を正式名称に置き換え、その都市を localStorage ＋ グローバル state に保存する」
  const handleEnter: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const typed = q.trim();
    if (typed.length < 2) return; // サジェストと合わせて2文字未満は無視

    // 入力テキストを含む都道府県を探す（先頭1件）
    const top = PREFECTURES.find((p) => p.label.includes(typed));
    if (!top) return;

    // 入力欄を正規の都道府県名にして保存
    setQ(top.label);
    onSave(top);
  };

  return (
    <div className={s.ToDoPage}>
      <HeaderBar />

      <div className={s.wrap}>
        <div className={s.shift}>
          <div className={s.box}>
            <Typography variant="h6" align="center" gutterBottom>
              デフォルト都道府県設定
            </Typography>

            {saved && (
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                現在の設定：
                <strong>{saved.name}</strong>
              </Typography>
            )}

            <Autocomplete<PrefOption>
              options={PREFECTURES}
              // 表示テキスト：都道府県名だけ
              getOptionLabel={(option) => option.label}
              // 入力値を state で管理
              inputValue={q}
              onInputChange={(_e, value) => {
                setQ(value);
              }}
              // 候補をクリック／選択したとき
              onChange={(_e, value) => {
                if (value) {
                  onSave(value);
                }
              }}
              // サジェストの絞り込みロジック
              filterOptions={(options, state) => {
                const input = state.inputValue.trim();

                // 2文字未満は候補を出さない
                if (input.length < 2) {
                  return [];
                }

                // ラベルに部分一致するものだけに絞り込み
                const filtered = options.filter((opt) =>
                  opt.label.includes(input)
                );

                // 先頭3件だけサジェストに出す
                return filtered.slice(0, 3);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="都道府県"
                  placeholder="北海道、青森県 など"
                  size="small"
                  onKeyDown={handleEnter} // ★ Enter 対応
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
