import { AppError } from '@/lib/appError';

const API = 'https://api.openweathermap.org/data/2.5';
const KEY = import.meta.env.VITE_OPENWEATHER_KEY as string;


export async function fetchCurrentByCoords(lat: number, lon: number) {
  const url = `${API}/weather?lat=${lat}&lon=${lon}&appid=${KEY}&units=metric&lang=ja`;
  const res = await fetch(url);
  if (!res.ok) {
    // ★ サーバー側エラー扱いにする
    throw new AppError(
      "API_FAIL",
      `現在の天気の取得に失敗しました（status: ${res.status}）`
    );
  }
  return res.json();
}

export async function fetchTodayMaxPop(lat: number, lon: number) {
  const url = `${API}/forecast?lat=${lat}&lon=${lon}&appid=${KEY}&units=metric&lang=ja`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new AppError(
      "API_FAIL",
      `降水確率データの取得に失敗しました（status: ${res.status}）`
    );
  }

  const json = await res.json();
  // 以下はそのまま
  const today = new Date().getDate();
  const pops: number[] = json.list
    .filter((it: any) => new Date(it.dt * 1000).getDate() === today)
    .map((it: any) => it.pop ?? 0);
  return pops.length ? Math.max(...pops) : undefined;
}


// /forecast（無料）から日ごとに集計して 5〜6 日分の簡易デイリーを作る
export async function fetchDailyFromForecast(lat: number, lon: number) {
  const url =
    `${API}/forecast?lat=${lat}&lon=${lon}` +
    `&appid=${KEY}&units=metric&lang=ja`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new AppError(
      "API_FAIL",
      `週間予報の取得に失敗しました（status: ${res.status}）`
    );
  }

  const json = await res.json();

  type Bucket = {
    dt: number;        // 代表時刻（その日の最も早い dt）
    max: number;       // 最高
    min: number;       // 最低
    popMax: number;    // その日の降水確率の最大（%表示しやすい）
    icon: string;      // できれば昼頃のアイコン
    desc: string;
  };

  const buckets = new Map<string, Bucket>();

  for (const it of json.list as any[]) {
    const d = new Date(it.dt * 1000);
    const keyDay = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;

    const cur = buckets.get(keyDay) ?? {
      dt: it.dt,
      max: -1e9,
      min:  1e9,
      popMax: 0,
      icon: it.weather?.[0]?.icon ?? "01d",
      desc: it.weather?.[0]?.description ?? ""
    };

    // 代表時刻は最も早い時刻
    cur.dt = Math.min(cur.dt, it.dt);

    // 最高/最低
    const tmax = it.main?.temp_max ?? it.main?.temp ?? cur.max;
    const tmin = it.main?.temp_min ?? it.main?.temp ?? cur.min;
    cur.max = Math.max(cur.max, tmax);
    cur.min = Math.min(cur.min, tmin);

    // POPは最大値を採用（カードの「降水50%」に合わせやすい）
    const pop = (it.pop ?? 0) * 100;
    cur.popMax = Math.max(cur.popMax, pop);

    // 昼のアイコンがあれば採用
    if (d.getHours() === 12 && it.weather?.[0]?.icon) {
      cur.icon = it.weather[0].icon;
      cur.desc = it.weather[0].description;
    }

    buckets.set(keyDay, cur);
  }

  // 代表配列へ整形（最大6日分）
  return Array.from(buckets.values())
    .sort((a, b) => a.dt - b.dt)
    .slice(0, 6)
    .map(b => ({
      dt: b.dt,
      temp: { max: b.max, min: b.min },
      pop: Math.round(b.popMax) / 100,               // 0〜1 に戻す（%表示はUI側で）
      weather: [{ icon: b.icon, description: b.desc }]
    })) as Array<{
      dt: number;
      temp: { min: number; max: number };
      pop: number; // 0〜1
      weather: Array<{ icon: string; description: string }>;
    }>;
}
