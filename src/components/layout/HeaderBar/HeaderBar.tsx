// src/components/HeaderBar/HeaderBar.tsx
import React, { useState } from "react";
import Modal from "@/components/modal/menumodal/Modal";
import { useAuth } from "@/store/auth";
import { triggerRefetch } from "@/lib/refetchBus";
import { useCity } from "@/store/city";
import s from "./HeaderBar.module.css";

type Props = {
  date?: Date;
  city?: string;
  onMenuClick?: () => void;
  onCityClick?: () => void;
  onRefetchWeather?: () => Promise<void> | void; // Today / Weekly だけ渡す
};

const jpWeek = ["日", "月", "火", "水", "木", "金", "土"];

export default function HeaderBar({
  date = new Date(),
  city,
  onMenuClick,
  onRefetchWeather,
}: Props) {
  const { user, signOut } = useAuth();

  function toJapanesePrefName(city: { state?: string; name: string }): string {
    const baseEn = city.state ?? city.name;
    const plain = baseEn.replace(/ Prefecture$/, "");
    if (plain === "Tokyo") return "東京都";
    if (plain === "Hokkaido") return "北海道";
    if (plain === "Osaka") return "大阪府";
    if (plain === "Kyoto") return "京都府";
    return `${plain}県`;
  }

  const { city: currentCity } = useCity();

  const storeCityLabel = React.useMemo(() => {
    return currentCity?.name ?? "";
  }, [currentCity]);

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

  // ★ Today / Weekly だけ再取得ボタンを出したいので、
  //    「onRefetchWeather が渡されているか」で判断する。
  const showReloadButton = Boolean(onRefetchWeather);

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

      {/* ★ 中身は MenuModal 側に任せる */}
      <Modal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        email={user?.email}
        showReloadButton={showReloadButton}
        refetching={refetching}
        refetchMsg={refetchMsg}
        onClickReload={handleRefetchClick}
        onClickLogout={handleLogout}
      />
    </>
  );
}
