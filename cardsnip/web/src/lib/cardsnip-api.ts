import {
  ApiAlert,
  ApiObservation,
  ApiProduct,
  ApiShop,
  ApiShopStatus,
  ApiTrackedProduct,
  CreateApiProductInput,
  CreateTrackedProductInput,
  ScraperRunResult,
} from "@/types/local-api";

const apiBaseUrl = process.env.NEXT_PUBLIC_CARDSNIP_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "API locale CardSnip indisponible. Lance FastAPI avec `python -m uvicorn api:app --reload --port 8000`.",
    );
  }

  if (!response.ok) {
    let detail = "";

    try {
      const payload = (await response.json()) as { detail?: string };
      detail = payload.detail ? ` ${payload.detail}` : "";
    } catch {
      detail = "";
    }

    throw new Error(`API locale CardSnip: erreur ${response.status} sur ${path}.${detail}`);
  }

  return response.json() as Promise<T>;
}

export const cardsnipApi = {
  health: () => request<{ status: string }>("/health"),
  listProducts: () => request<ApiProduct[]>("/products"),
  createProduct: (payload: CreateApiProductInput) =>
    request<ApiProduct>("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listShops: () => request<ApiShop[]>("/shops"),
  listShopStatuses: () => request<ApiShopStatus[]>("/shops/status"),
  listTrackedProducts: () => request<ApiTrackedProduct[]>("/tracked-products"),
  createTrackedProduct: (payload: CreateTrackedProductInput) =>
    request<ApiTrackedProduct>("/tracked-products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listLatestObservations: () => request<ApiObservation[]>("/observations/latest"),
  listAlerts: () => request<ApiAlert[]>("/alerts"),
  runScraper: () =>
    request<ScraperRunResult>("/scraper/run", {
      method: "POST",
    }),
};
