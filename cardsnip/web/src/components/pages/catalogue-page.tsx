"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { cardsnipApi } from "@/lib/cardsnip-api";
import { AppPanel, CardSnipAppShell } from "@/components/cardsnip-app-shell";
import { ProductThumb, StatusBadge } from "@/components/product-ui";
import { ApiProduct, ApiShop } from "@/types/local-api";
import {
  CatalogueCategory,
  CatalogueImageStatus,
  CatalogueProduct,
  catalogueProducts,
} from "@/data/mock-catalogue";

type CatalogueRow = CatalogueProduct & {
  apiId?: number;
};

type CatalogueForm = {
  name: string;
  extensionName: string;
  category: CatalogueCategory;
  languageCode: "FR" | "EN" | "JP";
  releaseDate: string;
  imageUrl: string;
  imageStatus: CatalogueImageStatus;
  source: string;
  notes: string;
};

type FollowForm = {
  shopId: string;
  sourceUrl: string;
  targetPrice: string;
  active: boolean;
};

const categories: CatalogueCategory[] = ["ETB", "Display", "Booster", "Bundle", "Collection", "Accessoire"];
const imageStatuses: CatalogueImageStatus[] = ["Validée", "À vérifier", "Manquante"];
const languages: CatalogueForm["languageCode"][] = ["FR", "EN", "JP"];
const catalogueStorageKey = "cardsnip.catalogue-products.v1";
const tones = [
  "from-violet-200 to-sky-100",
  "from-rose-200 to-zinc-100",
  "from-amber-200 to-violet-100",
  "from-emerald-200 to-cyan-100",
  "from-orange-200 to-rose-100",
];

const initialForm: CatalogueForm = {
  name: "",
  extensionName: "",
  category: "ETB",
  languageCode: "FR",
  releaseDate: "",
  imageUrl: "",
  imageStatus: "À vérifier",
  source: "Ajout admin local",
  notes: "",
};

function imageStatusTone(status: CatalogueImageStatus) {
  if (status === "Validée") return "green";
  if (status === "À vérifier") return "amber";
  return "gray";
}

function categoryLabel(category: CatalogueCategory) {
  if (category === "Display") return "DISP";
  if (category === "Booster") return "BST";
  if (category === "Collection") return "COLL";
  if (category === "Accessoire") return "ACC";
  return category;
}

function normalizeCategory(category: string): CatalogueCategory {
  return categories.includes(category as CatalogueCategory) ? (category as CatalogueCategory) : "Collection";
}

function apiProductToCatalogue(product: ApiProduct): CatalogueRow {
  return {
    id: `api-product-${product.id}`,
    apiId: product.id,
    name: product.name,
    extensionName: product.extension ?? "Extension à compléter",
    category: normalizeCategory(product.category),
    languageCode: product.language === "EN" || product.language === "JP" ? product.language : "FR",
    releaseDate: "",
    imageUrl: product.image_url ?? "",
    imageStatus: product.image_url ? "À vérifier" : "Manquante",
    source: "SQLite local",
    notes: "Produit chargé depuis l'API locale.",
    thumbnailTone: tones[product.name.length % tones.length],
  };
}

function makeCatalogueProduct(form: CatalogueForm): CatalogueRow {
  const name = form.name.trim() || "Produit sealed sans nom";

  return {
    id: `cat-local-${Date.now()}`,
    name,
    extensionName: form.extensionName.trim() || "Extension à compléter",
    category: form.category,
    languageCode: form.languageCode,
    releaseDate: form.releaseDate,
    imageUrl: form.imageUrl.trim(),
    imageStatus: form.imageUrl.trim() ? form.imageStatus : "Manquante",
    source: form.source.trim() || "Ajout admin local",
    notes: form.notes.trim(),
    thumbnailTone: tones[name.length % tones.length],
  };
}

function buildInitialFollowForm(shops: ApiShop[]): FollowForm {
  const fakeShop = shops.find((shop) => shop.name === "Fake Shop") ?? shops[0];
  return {
    shopId: fakeShop ? String(fakeShop.id) : "",
    sourceUrl: "http://localhost:8080/index.html?price=39.99&stock=in",
    targetPrice: "45",
    active: true,
  };
}

export function CataloguePage() {
  const [products, setProducts] = useState<CatalogueRow[]>(catalogueProducts);
  const [shops, setShops] = useState<ApiShop[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CatalogueCategory | "Toutes">("Toutes");
  const [selectedId, setSelectedId] = useState(catalogueProducts[0]?.id ?? "");
  const [form, setForm] = useState<CatalogueForm>(initialForm);
  const [toast, setToast] = useState("");
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [followProduct, setFollowProduct] = useState<CatalogueRow | null>(null);
  const [followForm, setFollowForm] = useState<FollowForm>(buildInitialFollowForm([]));

  useEffect(() => {
    let cancelled = false;

    async function loadApiData() {
      try {
        const [apiProducts, apiShops] = await Promise.all([cardsnipApi.listProducts(), cardsnipApi.listShops()]);
        if (cancelled) return;

        setProducts(apiProducts.map(apiProductToCatalogue));
        setShops(apiShops);
        setSelectedId(apiProducts[0] ? `api-product-${apiProducts[0].id}` : "");
        setFollowForm(buildInitialFollowForm(apiShops));
        setApiAvailable(true);
        setIsStorageReady(true);
      } catch {
        if (cancelled) return;

        const timer = window.setTimeout(() => {
          try {
            const savedProducts = window.localStorage.getItem(catalogueStorageKey);
            if (savedProducts) {
              const parsedProducts = JSON.parse(savedProducts) as CatalogueRow[];
              if (parsedProducts.length > 0) {
                setProducts(parsedProducts);
                setSelectedId(parsedProducts[0].id);
              }
            }
          } catch {
            setProducts(catalogueProducts);
          } finally {
            setIsStorageReady(true);
          }
        }, 0);

        return () => window.clearTimeout(timer);
      }
    }

    void loadApiData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isStorageReady || apiAvailable) return;

    window.localStorage.setItem(catalogueStorageKey, JSON.stringify(products));
  }, [apiAvailable, isStorageReady, products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.extensionName.toLowerCase().includes(normalizedQuery);
      const matchesCategory = categoryFilter === "Toutes" || product.category === categoryFilter;

      return matchesQuery && matchesCategory;
    });
  }, [categoryFilter, products, query]);

  const selectedProduct = products.find((product) => product.id === selectedId) ?? products[0];
  const validatedImages = products.filter((product) => product.imageStatus === "Validée").length;
  const missingImages = products.filter((product) => product.imageStatus === "Manquante").length;

  function updateForm<Key extends keyof CatalogueForm>(key: Key, value: CatalogueForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateFollowForm<Key extends keyof FollowForm>(key: Key, value: FollowForm[Key]) {
    setFollowForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const localProduct = makeCatalogueProduct(form);

    if (apiAvailable) {
      try {
        const created = await cardsnipApi.createProduct({
          name: localProduct.name,
          category: localProduct.category,
          language: localProduct.languageCode,
          extension: localProduct.extensionName,
          image_url: localProduct.imageUrl || null,
        });
        const apiProduct = apiProductToCatalogue(created);
        setProducts((current) => [apiProduct, ...current]);
        setSelectedId(apiProduct.id);
        setToast(`${apiProduct.name} ajouté dans SQLite.`);
      } catch {
        setToast("Erreur API pendant l'ajout catalogue.");
      }
    } else {
      setProducts((current) => [localProduct, ...current]);
      setSelectedId(localProduct.id);
      setToast(`${localProduct.name} ajouté au catalogue local.`);
    }

    setForm(initialForm);
    window.setTimeout(() => setToast(""), 2800);
  }

  function openFollowModal(product: CatalogueRow) {
    setFollowProduct(product);
    setFollowForm(buildInitialFollowForm(shops));
  }

  async function submitFollow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!followProduct?.apiId || !apiAvailable) {
      setToast("L'API locale doit être lancée pour créer un suivi serveur.");
      window.setTimeout(() => setToast(""), 2800);
      return;
    }

    try {
      await cardsnipApi.createTrackedProduct({
        product_id: followProduct.apiId,
        shop_id: Number(followForm.shopId),
        source_url: followForm.sourceUrl,
        target_price: Number(followForm.targetPrice),
        active: followForm.active,
      });
      setFollowProduct(null);
      setToast(`Suivi créé pour ${followProduct.name}.`);
    } catch {
      setToast("Erreur API pendant la création du suivi.");
    }

    window.setTimeout(() => setToast(""), 2800);
  }

  function removeProduct(productId: string) {
    if (apiAvailable) {
      setToast("Suppression serveur non prévue dans ce MVP local.");
      window.setTimeout(() => setToast(""), 2400);
      return;
    }

    setProducts((current) => {
      const nextProducts = current.filter((product) => product.id !== productId);
      setSelectedId(nextProducts[0]?.id ?? "");
      return nextProducts;
    });
    setToast("Produit retiré du catalogue local.");
    window.setTimeout(() => setToast(""), 2400);
  }

  function markImageValidated(productId: string) {
    setProducts((current) =>
      current.map((product) => (product.id === productId ? { ...product, imageStatus: "Validée" } : product)),
    );
  }

  return (
    <CardSnipAppShell
      title="Catalogue Admin"
      subtitle="Prépare les fiches produits sealed et les images propres avant le branchement Supabase Storage."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-4">
          <section className="grid gap-3 md:grid-cols-3">
            <AppPanel className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Produits catalogue</p>
              <p className="mt-2 text-3xl font-semibold text-white">{products.length}</p>
              <p className="mt-1 text-sm text-zinc-400">{apiAvailable ? "SQLite local" : "Fallback localStorage"}</p>
            </AppPanel>
            <AppPanel className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Images validées</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-300">{validatedImages}</p>
              <p className="mt-1 text-sm text-zinc-400">Prêtes pour l&apos;affichage produit</p>
            </AppPanel>
            <AppPanel className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Images manquantes</p>
              <p className="mt-2 text-3xl font-semibold text-amber-200">{missingImages}</p>
              <p className="mt-1 text-sm text-zinc-400">À compléter côté admin</p>
            </AppPanel>
          </section>

          <AppPanel className="overflow-hidden">
            <div className="border-b border-white/10 p-4 md:p-5">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px]">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Rechercher un produit ou une extension..."
                  className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-violet-300/40"
                />
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value as CatalogueCategory | "Toutes")}
                  className="h-10 rounded-lg border border-white/[0.08] bg-black/30 px-3 text-sm text-zinc-200 outline-none"
                >
                  {["Toutes", ...categories].map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="divide-y divide-white/8">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className={`grid gap-4 p-4 transition hover:bg-white/[0.025] md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-5 ${
                    selectedId === product.id ? "bg-violet-500/[0.035]" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(product.id)}
                    className="flex min-w-0 items-center gap-4 text-left"
                  >
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-16 w-12 shrink-0 rounded-xl border border-white/10 object-cover"
                      />
                    ) : (
                      <ProductThumb tone={product.thumbnailTone} label={categoryLabel(product.category)} />
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-white">{product.name}</h2>
                        <StatusBadge tone={imageStatusTone(product.imageStatus)}>{product.imageStatus}</StatusBadge>
                      </div>
                      <p className="mt-1 text-sm text-zinc-400">
                        {product.extensionName} · {product.category} · {product.languageCode}
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">{product.source}</p>
                    </div>
                  </button>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <button
                      type="button"
                      onClick={() => openFollowModal(product)}
                      className="rounded-lg border border-violet-300/20 bg-violet-400/10 px-3 py-2 text-xs font-semibold text-violet-100 transition hover:bg-violet-400/15"
                    >
                      Créer un suivi
                    </button>
                    <button
                      type="button"
                      onClick={() => markImageValidated(product.id)}
                      disabled={!product.imageUrl || product.imageStatus === "Validée"}
                      className="rounded-lg border border-emerald-300/15 bg-emerald-400/5 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:border-white/[0.06] disabled:bg-white/[0.02] disabled:text-zinc-600"
                    >
                      Valider image
                    </button>
                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="rounded-lg border border-red-300/15 bg-red-400/5 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-400/10"
                    >
                      Retirer
                    </button>
                  </div>
                </article>
              ))}
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-500">Aucun produit catalogue trouvé.</div>
              ) : null}
            </div>
          </AppPanel>
        </div>

        <div className="space-y-4">
          <AppPanel className="p-5">
            <h2 className="text-base font-semibold text-white">Ajouter au catalogue</h2>
            <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
              <label className="grid gap-1.5 text-sm text-zinc-300">
                Nom produit
                <input
                  required
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="ETB Écarlate et Violet 151"
                  className="h-10 rounded-lg border border-white/10 bg-black/20 px-3 text-white outline-none transition focus:border-violet-400/60"
                />
              </label>
              <label className="grid gap-1.5 text-sm text-zinc-300">
                Extension
                <input
                  value={form.extensionName}
                  onChange={(event) => updateForm("extensionName", event.target.value)}
                  placeholder="151, Destinées de Paldea..."
                  className="h-10 rounded-lg border border-white/10 bg-black/20 px-3 text-white outline-none transition focus:border-violet-400/60"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <label className="grid gap-1.5 text-sm text-zinc-300">
                  Catégorie
                  <select
                    value={form.category}
                    onChange={(event) => updateForm("category", event.target.value as CatalogueCategory)}
                    className="h-10 rounded-lg border border-white/10 bg-black/20 px-3 text-white outline-none transition focus:border-violet-400/60"
                  >
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm text-zinc-300">
                  Langue
                  <select
                    value={form.languageCode}
                    onChange={(event) => updateForm("languageCode", event.target.value as CatalogueForm["languageCode"])}
                    className="h-10 rounded-lg border border-white/10 bg-black/20 px-3 text-white outline-none transition focus:border-violet-400/60"
                  >
                    {languages.map((language) => (
                      <option key={language}>{language}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="grid gap-1.5 text-sm text-zinc-300">
                URL image propre
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(event) => updateForm("imageUrl", event.target.value)}
                  placeholder="https://..."
                  className="h-10 rounded-lg border border-white/10 bg-black/20 px-3 text-white outline-none transition focus:border-violet-400/60"
                />
              </label>
              <button
                type="submit"
                className="mt-1 h-10 rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(139,92,246,0.22)] transition hover:bg-violet-400"
              >
                Ajouter au catalogue
              </button>
            </form>
          </AppPanel>

          <AppPanel className="p-5">
            <h2 className="text-base font-semibold text-white">Aperçu fiche</h2>
            {selectedProduct ? (
              <div className="mt-4">
                <div className="flex gap-4">
                  {selectedProduct.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="h-28 w-20 rounded-2xl border border-white/10 object-cover"
                    />
                  ) : (
                    <ProductThumb tone={selectedProduct.thumbnailTone} label={categoryLabel(selectedProduct.category)} />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white">{selectedProduct.name}</h3>
                    <p className="mt-1 text-sm text-zinc-400">{selectedProduct.extensionName}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge tone="violet">{selectedProduct.category}</StatusBadge>
                      <StatusBadge tone={imageStatusTone(selectedProduct.imageStatus)}>
                        {selectedProduct.imageStatus}
                      </StatusBadge>
                    </div>
                  </div>
                </div>
                <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-sm leading-6 text-zinc-400">
                  {selectedProduct.notes || "Aucune note admin pour ce produit."}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">Sélectionne ou ajoute un produit.</p>
            )}
          </AppPanel>
        </div>
      </div>

      {followProduct ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 backdrop-blur-sm">
          <form
            onSubmit={submitFollow}
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1019] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Créer un suivi</h2>
                <p className="mt-1 text-sm text-zinc-400">{followProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setFollowProduct(null)}
                className="rounded-lg px-3 py-1 text-zinc-400 hover:bg-white/5"
              >
                Fermer
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm text-zinc-300">
                Boutique
                <select
                  required
                  value={followForm.shopId}
                  onChange={(event) => updateFollowForm("shopId", event.target.value)}
                  className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-white outline-none transition focus:border-violet-400/60"
                >
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-zinc-300">
                URL source
                <input
                  required
                  type="url"
                  value={followForm.sourceUrl}
                  onChange={(event) => updateFollowForm("sourceUrl", event.target.value)}
                  className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-white outline-none transition focus:border-violet-400/60"
                />
              </label>
              <label className="grid gap-2 text-sm text-zinc-300">
                Target price
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={followForm.targetPrice}
                  onChange={(event) => updateFollowForm("targetPrice", event.target.value)}
                  className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-white outline-none transition focus:border-violet-400/60"
                />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.025] p-3 text-sm text-zinc-300">
                Suivi actif
                <input
                  type="checkbox"
                  checked={followForm.active}
                  onChange={(event) => updateFollowForm("active", event.target.checked)}
                  className="h-4 w-4 accent-violet-500"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFollowProduct(null)}
                className="h-10 rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-300 hover:bg-white/5"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!apiAvailable || shops.length === 0}
                className="h-10 rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(139,92,246,0.22)] hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              >
                Créer
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-emerald-400/20 bg-[#0d1019] px-4 py-3 text-sm font-semibold text-emerald-300 shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
          {toast}
        </div>
      ) : null}
    </CardSnipAppShell>
  );
}
