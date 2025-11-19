// src/data/prefectures.ts

export type PrefOption = {
  code: number;
  label: string;
  lat: number;
  lon: number;
};

export const PREFECTURES: PrefOption[] = [

  { code: 1,  label: "北海道",   lat: 43.07, lon: 141.35 },
  { code: 2,  label: "青森県",   lat: 40.32, lon: 140.74 },
  { code: 3,  label: "岩手県",   lat: 39.70, lon: 141.15 },
  { code: 4,  label: "宮城県",   lat: 38.27, lon: 140.87 },
  { code: 5,  label: "秋田県",   lat: 39.71, lon: 140.87 },
  { code: 6,  label: "山形県",   lat: 38.24, lon: 140.36 },
  { code: 7,  label: "福島県",   lat: 37.75, lon: 140.46 },

  { code: 8,  label: "茨城県",   lat: 36.34, lon: 140.44 },
  { code: 9,  label: "栃木県",   lat: 36.56, lon: 139.88 },
  { code: 10, label: "群馬県",   lat: 36.39, lon: 139.06 },
  { code: 11, label: "埼玉県",   lat: 35.85, lon: 139.64 },
  { code: 12, label: "千葉県",   lat: 35.60, lon: 140.12 },
  { code: 13, label: "東京都",   lat: 35.69, lon: 139.69 },
  { code: 14, label: "神奈川県", lat: 35.44, lon: 139.64 },

  { code: 15, label: "新潟県",   lat: 37.90, lon: 139.02 },
  { code: 16, label: "富山県",   lat: 36.69, lon: 137.21 },
  { code: 17, label: "石川県",   lat: 36.59, lon: 136.63 },
  { code: 18, label: "福井県",   lat: 36.07, lon: 136.22 },
  { code: 19, label: "山梨県",   lat: 35.66, lon: 138.57 },
  { code: 20, label: "長野県",   lat: 36.65, lon: 138.18 },
  { code: 21, label: "岐阜県",   lat: 35.39, lon: 136.72 },
  { code: 22, label: "静岡県",   lat: 34.98, lon: 138.38 },
  { code: 23, label: "愛知県",   lat: 35.18, lon: 136.91 },

  { code: 24, label: "三重県",   lat: 34.73, lon: 136.50 },
  { code: 25, label: "滋賀県",   lat: 35.00, lon: 135.87 },
  { code: 26, label: "京都府",   lat: 35.01, lon: 135.77 },
  { code: 27, label: "大阪府",   lat: 34.69, lon: 135.50 },
  { code: 28, label: "兵庫県",   lat: 34.69, lon: 135.18 },
  { code: 29, label: "奈良県",   lat: 34.69, lon: 135.83 },
  { code: 30, label: "和歌山県", lat: 34.22, lon: 135.17 },

  { code: 31, label: "鳥取県",   lat: 35.50, lon: 134.24 },
  { code: 32, label: "島根県",   lat: 35.47, lon: 133.05 },
  { code: 33, label: "岡山県",   lat: 34.66, lon: 133.94 },
  { code: 34, label: "広島県",   lat: 34.39, lon: 132.46 },
  { code: 35, label: "山口県",   lat: 34.19, lon: 131.47 },

  { code: 36, label: "徳島県",   lat: 34.07, lon: 134.56 },
  { code: 37, label: "香川県",   lat: 34.34, lon: 134.04 },
  { code: 38, label: "愛媛県",   lat: 33.84, lon: 132.77 },
  { code: 39, label: "高知県",   lat: 33.56, lon: 133.53 },

  { code: 40, label: "福岡県",   lat: 33.59, lon: 130.40 },
  { code: 41, label: "佐賀県",   lat: 33.24,     lon: 130.30 },
  { code: 42, label: "長崎県",   lat: 32.74,     lon: 129.87 },
  { code: 43, label: "熊本県",   lat: 32.79,     lon: 130.74 },
  { code: 44, label: "大分県",   lat: 33.24,     lon: 131.61 },
  { code: 45, label: "宮崎県",   lat: 31.91,     lon: 131.42 },
  { code: 46, label: "鹿児島県", lat: 31.56,     lon: 130.56 },
  { code: 47, label: "沖縄県",   lat: 26.21, lon: 127.68 },
];
