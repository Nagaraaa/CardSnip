export type ProductCategory = "etb" | "display" | "booster" | "bundle" | "collection" | "accessory" | "other";

export type ObservationSource = "manual" | "csv_import" | "scraper" | "api" | "partner";

export type StockStatus = "in_stock" | "out_of_stock" | "preorder" | "unknown";

export type AlertKind = "price_below_target" | "back_in_stock" | "new_deal" | "watch_signal";

export type Product = {
  id: string;
  slug: string;
  name: string;
  extensionName?: string;
  category: ProductCategory;
  languageCode: string;
  releaseDate?: string;
  imageUrl?: string;
};

export type Shop = {
  id: string;
  slug: string;
  name: string;
  countryCode?: string;
  websiteUrl?: string;
  enabled: boolean;
  reliabilityScore: number;
};

export type TrackedProduct = {
  id: string;
  productId: string;
  shopId?: string;
  productUrl?: string;
  targetPrice?: number;
  enabled: boolean;
  priority: 1 | 2 | 3;
};

export type PriceObservation = {
  id: string;
  trackedProductId: string;
  observedAt: string;
  source: ObservationSource;
  price: number;
  currency: "EUR" | string;
  stockStatus: StockStatus;
  sourceUrl?: string;
};

export type CardSnipAlert = {
  id: string;
  trackedProductId?: string;
  observationId?: string;
  kind: AlertKind;
  title: string;
  message: string;
  createdAt: string;
};
