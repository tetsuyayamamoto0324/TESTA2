// src/components/ProtectedLayout.tsx
import { Outlet, useNavigate } from "react-router-dom";
import HeaderBar from "./HeaderBar/HeaderBar";
import BottomTabs from "./BottomTabs";
import { useCity } from "@/store/city";
import React from "react";

/**
 * レイアウトコンポーネント
 * - デフォルトで共通ヘッダー(HeaderBar)とボトムタブ(BottomTabs)を表示
 * - ページ側でヘッダーを出したくない場合は showHeader={false} を指定
 * - 固定ヘッダー/タブのぶんだけ main にパディングを入れて重なりを回避
 */
type Props = {
  /** レイアウトの共通ヘッダーを表示するか（Today などで false に） */
  showHeader?: boolean;
  /** ヘッダーの高さ(px) */
  headerHeight?: number;
  /** タブバーの高さ(px) */
  tabbarHeight?: number;
  /** レイアウト外側の className（必要なら） */
  className?: string;
};

export default function ProtectedLayout({
  showHeader = true,
  headerHeight = 56,
  tabbarHeight = 60,
  className,
}: Props) {
  const city = useCity((s) => s.city);
  const navigate = useNavigate();

  // main エリアが固定ヘッダー/タブに隠れないようにパディング
  const mainPaddingTop = showHeader ? headerHeight : 0;

  return (
    <div
      className={["protectedLayout", className].filter(Boolean).join(" ")}
      style={
        {
          // 他コンポーネントでも参照できるようCSS変数化しておく
          ["--header-h" as any]: `${headerHeight}px`,
          ["--tabbar-h" as any]: `${tabbarHeight}px`,
        } as React.CSSProperties
      }
    >
      {/* 共通ヘッダー（不要なページは showHeader=false に） */}
      {/* {showHeader && (
        <HeaderBar
          city={city.name}
          onMenuClick={() => {}}
          onCityClick={() => navigate("/city")}
        />
      )} */}

      {/* コンテンツ。固定ヘッダー/タブに重ならないよう上下を確保 */}
      <main
        className="pageCenter"
        style={{
          paddingBottom: tabbarHeight,
          // レイアウト全体のスクロールを抑え、必要なら中だけスクロール
          minHeight: 0,
        }}
      >
        <Outlet />
      </main>

      {/* 固定フッター（タブ） */}
      <BottomTabs
        // BottomTabs が position:fixed の場合でも高さを合わせておくと安心
        style={{
          height: tabbarHeight,
        }}
      />
    </div>
  );
}
