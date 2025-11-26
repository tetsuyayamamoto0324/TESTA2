// src/pages/Weekly.tsx
import { useEffect, useState, useCallback } from "react";
import { fetchDailyFromForecast } from "@/lib/openweather";
import HeaderBar from "@/components/layout/HeaderBar/HeaderBar";
import { useCity } from "@/store/city";
import s from "./Weekly.module.css";

const enWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

type Day = {
  dt: number;
  temp: { min: number; max: number };
  pop: number; // 0-1
  //下記が配列になっている理由は、気象情報は単純に1種類じゃなく、雨が降ってるけど雷も鳴ってて霧もかかっているみたいに
  // 複数状態が同時に起きることがあるから情報が複数入る
  weather: { icon: string; description: string }[];
};

// 、DayCardという関数で、親コンポーネントからpropsのdを受け取って、受け取ったdはDayの形ですよと定義している
function DayCard({ d }: { d: Day }) {
  // ここの部分はまずdのdtの値を掛ける1000してミリ秒にしてJSがわかる数値にしてあげて
  // その数値をnew Dateで日付オブジェクトにすることで年月日をとりだせるようにしてあげて、そのオブジェクトをdateにいれてる
  const date = new Date(d.dt * 1000);
//   ()の意味は実行する、1日分のデータが入っているdateにgetday関数を実行して曜日の数字を計算してもらい0~6の数字をもらい、
// あらかじめ定義しておいたconst enWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];を参考し、曜日をwkに定義する
  const wk = enWeek[date.getDay()];
//dの中に入っている一日分の天気データの最高気温を取り出して、Math.round関数を使って四捨五入して整数にしてmaxに定義している
  const max = Math.round(d.temp.max);
  const min = Math.round(d.temp.min);
  // d.popに数値が入っていない場合は代わりに0を使う、少数点できた数字に100をかけて、四捨五入してpopに定義している
  const pop = Math.round((d.pop ?? 0) * 100);
  // 一日分のデータが入っているdのweatherが無くてもエラーははかないようにしていて、次に配列の最初があるかどうか確認し、なくてもエラーにはせず
  // iconをとりだし、もしそれらがなかった場合は代わりに01dを使い、それをiconに定義している
  const icon = d.weather?.[0]?.icon ?? "01d";
  const desc = d.weather?.[0]?.description ?? "";

  return (
    <div className={s.card}>
      <div className={s.week}>{wk}</div>
      <img
      //2x＝2倍で見やすく、10dなどのIDでわたってくるためURLにいれて動的に表示
        src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
        alt={desc || "weather"}
        className={s.icon}
      />
      <div className={s.temp}>
        {max}℃ / {min}℃
        <div className={s.pop}>降水 {pop}%</div>
      </div>
    </div>
  );
}

export default function Weekly() {
  // この state（days）には「Day の配列」（）1週間分の天気か「null」のどちらかが入りますという意味で
  // 初期値はnullです
  const [days, setDays] = useState<Day[] | null>(null);
  const [error, setError] = useState<string | null>(null);

// Zustand + カスタムフックで useCity を作り
// その中の zustand に保存されている city をとりだしている
  const { city } = useCity();

  const lat = city?.lat;
  const lon = city?.lon;

  //
  const refetchWeather = useCallback(async () => {
    // latの型がnumberじゃないまたはlonの型 がnumber じゃないなら
    // どちらか片方でもおかしかったら NG
    if (typeof lat !== "number" || typeof lon !== "number") {
      return;
    }

    setDays(null);
    setError(null);

    try {
      const daily = await fetchDailyFromForecast(lat, lon);
      setDays(daily as Day[]);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }, [lat, lon]);

  // 初回 & 都市変更時に自動取得
  useEffect(() => {
    refetchWeather();
  }, [refetchWeather]);

  // ローディング中
  if (!days && !error) {
    return (
      <div className={s.weeklyPage}>
        {/* ★ ローディング中でも再取得ボタンは出したいので渡す */}
        <HeaderBar onRefetchWeather={refetchWeather} />
        <div className={s.loading}>読み込み中…</div>
      </div>
    );
  }

  // エラー時
  if (error) {
    return (
      <div className={s.weeklyPage}>
        <HeaderBar onRefetchWeather={refetchWeather} />
        <div className={s.error}>{error}</div>
      </div>
    );
  }

  // 正常時
  return (
    <div className={s.weeklyPage}>
      <HeaderBar onRefetchWeather={refetchWeather} />
      <h1 className={s.title}>週間予報</h1>
      <div className={s.wrap}>
        <div className={s.grid}>
        {/* この書き方（days!.map((d) => ( ... ))）そのものが、
「配列の中から**1日分の情報を順番に取り出す仕組み」dという文字に意味はない */}
          {days!.map((d) => (
            <DayCard key={d.dt} d={d} />
          ))}
        </div>
      </div>
    </div>
  );
}
