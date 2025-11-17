import { create } from "zustand";

const LS_KEY = "default-city-v1";

export type City = {
  name: string;
  lat: number;
  lon: number;
  country?: string;
  state?: string;
  local_names?: Record<string, string>;
};

// 東京をデフォルト
const TOKYO: City = {
  name: "東京都",
  lat: 35.6895,
  lon: 139.6917,
  country: "JP",
  state: "Tokyo",
};

function loadFromLS(): City {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return TOKYO;
    const c = JSON.parse(raw);
    // 必須が欠けていたら東京にフォールバック
    if (typeof c?.lat !== "number" || typeof c?.lon !== "number") return TOKYO;
    return { ...TOKYO, ...c };
  } catch {
    return TOKYO;
  }
}

type CityState = {
  city: City;
  setCity: (c: City) => void;
  resetToTokyo: () => void;
};

export const useCity = create<CityState>((set) => ({
  city: loadFromLS(),
  setCity: (c) => {
    localStorage.setItem(LS_KEY, JSON.stringify(c));
    set({ city: c });
  },
  resetToTokyo: () => {
    localStorage.setItem(LS_KEY, JSON.stringify(TOKYO));
    set({ city: TOKYO });
  },
}));
