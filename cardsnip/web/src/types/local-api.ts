export type ApiProduct = {
  id: number;
  name: string;
  category: string;
  language: string;
  extension: string | null;
  image_url: string | null;
  created_at: string;
};

export type ApiShop = {
  id: number;
  name: string;
  url: string | null;
  scraper_key: string;
  country?: string;
  type?: string;
  priority?: string;
  difficulty?: string;
  integration_status?: string;
  notes?: string | null;
  active: number;
  trusted: number;
  created_at: string;
};

export type ShopHealthStatus = "unknown" | "healthy" | "degraded" | "broken" | "not_configured";

export type ApiShopStatus = {
  shop_id: number;
  name: string;
  url: string | null;
  scraper_key: string;
  country?: string;
  type?: string;
  priority?: string;
  difficulty?: string;
  integration_status?: string;
  notes?: string | null;
  active: number;
  trusted: number;
  created_at: string;
  last_checked_at: string | null;
  last_success_at: string | null;
  last_price: number | null;
  last_stock_status: string | null;
  recent_observations_count: number;
  recent_alerts_count: number;
  last_error: string | null;
  health_status: ShopHealthStatus;
};

export type ApiTrackedProduct = {
  id: number;
  product_id: number;
  product_name: string;
  category: string;
  language: string;
  extension: string | null;
  image_url: string | null;
  shop_id: number;
  shop_name: string;
  shop_url: string | null;
  scraper_key: string;
  source_url: string;
  target_price: number;
  active: number;
  created_at: string;
};

export type ApiObservation = {
  id: number;
  tracked_product_id: number;
  product_name: string;
  shop_name: string;
  price: number;
  stock_status: string;
  checked_at: string;
};

export type ApiAlert = {
  id: number;
  tracked_product_id: number;
  product_name: string;
  shop_name: string;
  type: string;
  message: string;
  created_at: string;
};

export type CreateApiProductInput = {
  name: string;
  category: string;
  language: string;
  extension?: string | null;
  image_url?: string | null;
};

export type CreateTrackedProductInput = {
  product_id: number;
  shop_id: number;
  source_url: string;
  target_price: number;
  active: boolean;
};

export type ScraperRunResult = {
  tracked_products: number;
  observations: number;
  alerts: number;
  errors: number;
  messages: string[];
};

export type ApiTrackedProductCheckResult = {
  tracked_product_id: number;
  shop_name?: string;
  source_url?: string;
  price: number | null;
  stock_status: string | null;
  observation_created: boolean;
  alerts_created: number;
  errors: number;
  messages: string[];
};

export type ApiShopCheckResult = {
  shop_id: number;
  shop_name: string;
  tracked_products: number;
  observations: number;
  alerts: number;
  errors: number;
  messages: string[];
};
