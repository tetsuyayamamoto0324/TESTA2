// src/components/HeaderBar/HeaderBar.tsx
import React, { useState } from "react";
import Modal from "@/components/modal/Modal";
import { useAuth } from "@/store/auth";
import { triggerRefetch } from "@/lib/refetchBus";
import { useCity } from "@/store/city"; // ★ 追加
import s from "./HeaderBar.module.css";

type Props = {
  date?: Date;
  city?: string;
  onMenuClick?: () => void;
  onCityClick?: () => void;
  onRefetchWeather?: () => Promise<void> | void;
};

const jpWeek = ["日", "月", "火", "水", "木", "金", "土"];

export default function HeaderBar({
  date = new Date(),
  city,
  onMenuClick,
  onRefetchWeather,
}: Props) {
  const { user, signOut } = useAuth();

  // src/components/HeaderBar/HeaderBar.tsx などに追加

function toJapanesePrefName(city: { state?: string; name: string }): string {
  // OpenWeather の state は "Osaka Prefecture" などなので、
  // " Prefecture" を消して素の名前だけにする
  const baseEn = city.state ?? city.name; // Kyoto / Osaka Prefecture / Tokyo ...
  const plain = baseEn.replace(/ Prefecture$/, "");

  // 特別扱い（都・道・府）
  if (plain === "Tokyo") return "東京都";
  if (plain === "Hokkaido") return "北海道";
  if (plain === "Osaka") return "大阪府";
  if (plain === "Kyoto") return "京都府";

  // それ以外は 〇〇県 として扱う
  return `${plain}県`;
}

const { city: currentCity } = useCity();

const storeCityLabel = React.useMemo(() => {
  if (!currentCity) return "";

  // 日本の場合だけ都道府県名に変換
  if (currentCity.country === "JP") {
    return toJapanesePrefName(currentCity);
  }

  // 海外はとりあえず city 名（日本語ローカル名があればそれ）を表示
  const ja = currentCity.local_names?.ja;
  return ja ?? currentCity.name;
}, [currentCity]);

  // ★ 既存の city props があればそちらを優先し、
  //    なければ store の都市名、それもなければデフォルト「東京都」
  const cityLabel =
    city && city.trim()
      ? city.trim()
      : storeCityLabel || "東京都";

  const month = date.getMonth() + 1;
  const d = date.getDate();
  const dow = jpWeek[date.getDay()];

  const [menuOpen, setMenuOpen] = useState(false);
  const [refetching, setRefetching] = useState(false);
  const [refetchMsg, setRefetchMsg] = useState("");

  const handleRefetchClick = async () => {
    try {
      setRefetchMsg("");
      setRefetching(true);
      if (onRefetchWeather) {
        await onRefetchWeather();
        setRefetchMsg("最新の天気を取得しました");
        return;
      }
      const executed = await triggerRefetch();
      setRefetchMsg(
        executed ? "最新の天気を取得しました" : "この画面では再取得できません"
      );
    } catch {
      setRefetchMsg("取得に失敗しました");
    } finally {
      setRefetching(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      setMenuOpen(false);
    }
  };

  return (
    <>
      <header className={s.header}>
        <div className={s.inner}>
          <div className={s.dateText}>
            {month}/{d}
            {dow}
          </div>
          <div className={s.cityText}>{cityLabel}</div>
          <button
            type="button"
            className={s.menuBtn}
            onClick={() => {
              onMenuClick?.();
              setMenuOpen(true);
            }}
            aria-label="メニュー"
          >
            menu
          </button>
        </div>
      </header>

      <Modal open={menuOpen} onClose={() => setMenuOpen(false)}>
        <div className="modalWrap">
          <div className="modalTitle">ログイン中のユーザー</div>

          <div className="emailRow">
            <span className="emailText">
              {user?.email ?? "（未ログイン）"}
            </span>
          </div>

          <div className="refetchRow">
            <button
              type="button"
              onClick={handleRefetchClick}
              disabled={refetching}
              className="refetchBtn"
            >
              {refetching ? "再取得中…" : "再取得"}
            </button>
            <span className="note">{refetchMsg}</span>
          </div>

          <hr className="hr" />

          <div className="logoutRow">
            <button
              type="button"
              className="logoutBtn"
              onClick={handleLogout}
            >
              ログアウト
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
