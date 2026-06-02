export type DealScore = "Excellent" | "Bon" | "Moyen" | "Faible";

export type StatCard = {
  id: string;
  label: string;
  value: string;
  delta: string;
  icon: string;
  sparkline: string;
};

export type Deal = {
  id: string;
  product: string;
  region: string;
  shop: string;
  shopMark: string;
  currentPrice: string;
  oldPrice: string;
  discount: string;
  stock: string;
  added: string;
  score: DealScore;
  thumbnailTone: string;
};

export type Shop = {
  id: string;
  name: string;
  products: string;
  lastCheck: string;
  enabled: boolean;
  mark: string;
};

export type PricePoint = {
  date: string;
  price: number;
};

export type PriceSeries = {
  id: string;
  productId: string;
  shopId: string;
  product: string;
  shop: string;
  targetPrice: number;
  points: PricePoint[];
};

export const stats: StatCard[] = [
  {
    id: "products",
    label: "Produits surveillés",
    value: "156",
    delta: "+12 ce mois",
    icon: "CS",
    sparkline: "M6 34 L22 30 L38 36 L54 22 L70 28 L86 18 L102 30 L118 26",
  },
  {
    id: "shops",
    label: "Boutiques actives",
    value: "5",
    delta: "100% OK",
    icon: "SH",
    sparkline: "M6 36 L24 34 L42 30 L60 32 L78 24 L96 27 L116 18",
  },
  {
    id: "alerts",
    label: "Alertes aujourd'hui",
    value: "23",
    delta: "+8 vs hier",
    icon: "AL",
    sparkline: "M6 38 L24 28 L42 32 L60 20 L78 27 L96 16 L116 31",
  },
  {
    id: "savings",
    label: "Économies détectées",
    value: "-124,67 EUR",
    delta: "Ce mois",
    icon: "EU",
    sparkline: "M6 35 L22 31 L38 33 L54 24 L70 27 L86 20 L102 34 L118 29",
  },
];

export const deals: Deal[] = [
  {
    id: "etb-151",
    product: "ETB Écarlate et Violet 151",
    region: "FR",
    shop: "Kuro Star",
    shopMark: "KS",
    currentPrice: "59,90 EUR",
    oldPrice: "89,90 EUR",
    discount: "-33%",
    stock: "En stock",
    added: "2 min",
    score: "Excellent",
    thumbnailTone: "from-rose-300 to-zinc-100",
  },
  {
    id: "display-prism",
    product: "Display Évolutions Prismatiques",
    region: "FR",
    shop: "Pikastore",
    shopMark: "PK",
    currentPrice: "109,90 EUR",
    oldPrice: "149,90 EUR",
    discount: "-27%",
    stock: "En stock",
    added: "5 min",
    score: "Bon",
    thumbnailTone: "from-amber-200 to-violet-200",
  },
  {
    id: "coffret-eb",
    product: "Coffret Dresseur élite Épée et Bouclier",
    region: "FR",
    shop: "UltraJeux",
    shopMark: "UJ",
    currentPrice: "44,90 EUR",
    oldPrice: "69,90 EUR",
    discount: "-36%",
    stock: "En stock",
    added: "11 min",
    score: "Excellent",
    thumbnailTone: "from-slate-200 to-indigo-200",
  },
  {
    id: "bundle-151",
    product: "Booster Bundle 151",
    region: "FR",
    shop: "Otakuland-Manga Passion",
    shopMark: "OMP",
    currentPrice: "29,90 EUR",
    oldPrice: "44,90 EUR",
    discount: "-33%",
    stock: "En stock",
    added: "18 min",
    score: "Bon",
    thumbnailTone: "from-orange-200 to-rose-200",
  },
  {
    id: "tripack-sv",
    product: "Tripack Écarlate et Violet",
    region: "FR",
    shop: "Cardmarket",
    shopMark: "CM",
    currentPrice: "15,50 EUR",
    oldPrice: "24,90 EUR",
    discount: "-38%",
    stock: "En stock",
    added: "24 min",
    score: "Moyen",
    thumbnailTone: "from-sky-300 to-cyan-100",
  },
];

export const shops: Shop[] = [
  { id: "cardmarket", name: "Cardmarket", products: "1.234", lastCheck: "12:34:58", enabled: true, mark: "CM" },
  { id: "kuro-star", name: "Kuro Star", products: "856", lastCheck: "12:34:41", enabled: true, mark: "KS" },
  { id: "pikastore", name: "Pikastore", products: "742", lastCheck: "12:34:37", enabled: true, mark: "PK" },
  { id: "ultrajeux", name: "UltraJeux", products: "612", lastCheck: "12:34:29", enabled: true, mark: "UJ" },
  { id: "otakuland-mangapassion", name: "Otakuland-Manga Passion", products: "503", lastCheck: "12:34:21", enabled: true, mark: "OMP" },
];

export const priceSeries: PriceSeries[] = [
  {
    id: "etb-151-kuro",
    productId: "etb-151",
    shopId: "kuro-star",
    product: "ETB Écarlate et Violet 151",
    shop: "Kuro Star",
    targetPrice: 65,
    points: [
      { date: "23/04", price: 89.9 },
      { date: "25/04", price: 87.5 },
      { date: "27/04", price: 82.9 },
      { date: "29/04", price: 84.9 },
      { date: "01/05", price: 79.9 },
      { date: "03/05", price: 76.9 },
      { date: "05/05", price: 74.9 },
      { date: "07/05", price: 72.9 },
      { date: "09/05", price: 69.9 },
      { date: "11/05", price: 67.9 },
      { date: "13/05", price: 64.9 },
      { date: "15/05", price: 62.9 },
      { date: "17/05", price: 61.9 },
      { date: "19/05", price: 60.9 },
      { date: "21/05", price: 59.9 },
    ],
  },
  {
    id: "display-prism-pikastore",
    productId: "display-prism",
    shopId: "pikastore",
    product: "Display Évolutions Prismatiques",
    shop: "Pikastore",
    targetPrice: 115,
    points: [
      { date: "23/04", price: 149.9 },
      { date: "25/04", price: 149.9 },
      { date: "27/04", price: 142.9 },
      { date: "29/04", price: 139.9 },
      { date: "01/05", price: 137.9 },
      { date: "03/05", price: 134.9 },
      { date: "05/05", price: 129.9 },
      { date: "07/05", price: 127.9 },
      { date: "09/05", price: 124.9 },
      { date: "11/05", price: 119.9 },
      { date: "13/05", price: 117.9 },
      { date: "15/05", price: 114.9 },
      { date: "17/05", price: 112.9 },
      { date: "19/05", price: 111.9 },
      { date: "21/05", price: 109.9 },
    ],
  },
  {
    id: "bundle-151-otakuland-mangapassion",
    productId: "bundle-151",
    shopId: "otakuland-mangapassion",
    product: "Booster Bundle 151",
    shop: "Otakuland-Manga Passion",
    targetPrice: 35,
    points: [
      { date: "23/04", price: 44.9 },
      { date: "25/04", price: 44.9 },
      { date: "27/04", price: 42.9 },
      { date: "29/04", price: 41.9 },
      { date: "01/05", price: 39.9 },
      { date: "03/05", price: 39.9 },
      { date: "05/05", price: 37.9 },
      { date: "07/05", price: 36.9 },
      { date: "09/05", price: 34.9 },
      { date: "11/05", price: 33.9 },
      { date: "13/05", price: 32.9 },
      { date: "15/05", price: 31.9 },
      { date: "17/05", price: 31.5 },
      { date: "19/05", price: 30.9 },
      { date: "21/05", price: 29.9 },
    ],
  },
];
