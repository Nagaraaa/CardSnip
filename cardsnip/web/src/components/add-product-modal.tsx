"use client";

import { FormEvent, useMemo, useState } from "react";
import { ProductThumb } from "@/components/product-ui";

export type ProductCategoryOption = "ETB" | "Display" | "Booster" | "Bundle" | "Collection" | "Accessoire";

export type AddedProductDraft = {
  id: string;
  productUrl: string;
  shop: string;
  name: string;
  extensionName: string;
  targetPrice: string;
  category: ProductCategoryOption;
  imageUrl: string;
  thumbnailTone: string;
};

type AddProductModalProps = {
  shops: string[];
  onClose: () => void;
  onSubmit: (product: AddedProductDraft) => void;
};

const categories: ProductCategoryOption[] = ["ETB", "Display", "Booster", "Bundle", "Collection", "Accessoire"];
const tones = [
  "from-violet-200 to-sky-100",
  "from-rose-200 to-zinc-100",
  "from-amber-200 to-violet-100",
  "from-emerald-200 to-cyan-100",
];

function guessNameFromUrl(url: string) {
  if (!url.trim()) return "";

  try {
    const path = new URL(url).pathname;
    const lastPart = path.split("/").filter(Boolean).pop() ?? "";

    return lastPart
      .replaceAll("-", " ")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
      .slice(0, 70);
  } catch {
    return "";
  }
}

function normalizePrice(price: string) {
  const value = Number(price.replace(",", "."));

  if (!Number.isFinite(value) || value <= 0) return "";

  return `${value.toFixed(2).replace(".", ",")} EUR`;
}

export function AddProductModal({ shops, onClose, onSubmit }: AddProductModalProps) {
  const [productUrl, setProductUrl] = useState("");
  const [shop, setShop] = useState(shops[0] ?? "Boutique manuelle");
  const [name, setName] = useState("");
  const [extensionName, setExtensionName] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [category, setCategory] = useState<ProductCategoryOption>("ETB");
  const [imageUrl, setImageUrl] = useState("");

  const previewName = name.trim() || guessNameFromUrl(productUrl) || "Nouveau produit sealed";
  const previewPrice = normalizePrice(targetPrice) || "Prix cible non défini";
  const thumbnailTone = useMemo(() => tones[previewName.length % tones.length], [previewName]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSubmit({
      id: `local-${Date.now()}`,
      productUrl,
      shop,
      name: previewName,
      extensionName,
      targetPrice,
      category,
      imageUrl,
      thumbnailTone,
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="grid w-full max-w-5xl gap-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1019] shadow-[0_24px_80px_rgba(0,0,0,0.45)] lg:grid-cols-[minmax(0,1fr)_340px]"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Ajouter un produit</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Prépare le suivi prix/stock. Les données restent locales pour ce MVP.
              </p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg px-3 py-1 text-zinc-400 hover:bg-white/5">
              Fermer
            </button>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm text-zinc-300">
              URL produit
              <input
                required
                type="url"
                value={productUrl}
                onChange={(event) => setProductUrl(event.target.value)}
                placeholder="https://boutique.example/produit"
                className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-white outline-none transition focus:border-violet-400/60"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-zinc-300">
                Boutique
                <select
                  value={shop}
                  onChange={(event) => setShop(event.target.value)}
                  className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-white outline-none transition focus:border-violet-400/60"
                >
                  {shops.map((shopName) => (
                    <option key={shopName}>{shopName}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-zinc-300">
                Prix cible
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={targetPrice}
                  onChange={(event) => setTargetPrice(event.target.value)}
                  placeholder="59.90"
                  className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-white outline-none transition focus:border-violet-400/60"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-zinc-300">
                Nom produit
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="ETB Écarlate et Violet 151"
                  className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-white outline-none transition focus:border-violet-400/60"
                />
              </label>
              <label className="grid gap-2 text-sm text-zinc-300">
                Extension
                <input
                  value={extensionName}
                  onChange={(event) => setExtensionName(event.target.value)}
                  placeholder="151, Évolutions Prismatiques..."
                  className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-white outline-none transition focus:border-violet-400/60"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-zinc-300">
                Catégorie
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as ProductCategoryOption)}
                  className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-white outline-none transition focus:border-violet-400/60"
                >
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm text-zinc-300">
                URL image propre
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="Optionnel pour l'instant"
                  className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-white outline-none transition focus:border-violet-400/60"
                />
              </label>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-300 hover:bg-white/5"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="h-10 rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(139,92,246,0.22)] hover:bg-violet-400"
            >
              Ajouter au suivi
            </button>
          </div>
        </div>

        <aside className="border-t border-white/10 bg-black/20 p-5 lg:border-l lg:border-t-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Aperçu</p>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start gap-4">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={previewName}
                  className="h-20 w-16 rounded-xl border border-white/10 object-cover"
                />
              ) : (
                <ProductThumb tone={thumbnailTone} label={category.slice(0, 4).toUpperCase()} />
              )}
              <div className="min-w-0">
                <h3 className="font-semibold text-white">{previewName}</h3>
                <p className="mt-1 text-sm text-zinc-400">{extensionName || "Extension à compléter"}</p>
                <p className="mt-3 text-sm text-zinc-500">{shop}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Catégorie</span>
                <span className="font-semibold text-zinc-200">{category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Target price</span>
                <span className="font-semibold text-violet-200">{previewPrice}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Statut</span>
                <span className="font-semibold text-amber-200">À configurer</span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-500">
            Plus tard, cette étape créera une ligne `products`, une ligne `tracked_products`, puis stockera l&apos;image dans
            Supabase Storage après validation admin.
          </p>
        </aside>
      </form>
    </div>
  );
}
