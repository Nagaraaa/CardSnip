export type CatalogueCategory = "ETB" | "Display" | "Booster" | "Bundle" | "Collection" | "Accessoire";
export type CatalogueImageStatus = "Validée" | "À vérifier" | "Manquante";

export type CatalogueProduct = {
  id: string;
  name: string;
  extensionName: string;
  category: CatalogueCategory;
  languageCode: "FR" | "EN" | "JP";
  releaseDate: string;
  imageUrl: string;
  imageStatus: CatalogueImageStatus;
  source: string;
  notes: string;
  thumbnailTone: string;
};

export const catalogueProducts: CatalogueProduct[] = [
  {
    id: "cat-etb-151",
    name: "ETB Écarlate et Violet 151",
    extensionName: "151",
    category: "ETB",
    languageCode: "FR",
    releaseDate: "2023-10-06",
    imageUrl: "",
    imageStatus: "À vérifier",
    source: "Import manuel",
    notes: "Produit prioritaire pour les tests de target price.",
    thumbnailTone: "from-rose-300 to-zinc-100",
  },
  {
    id: "cat-display-prism",
    name: "Display Évolutions Prismatiques",
    extensionName: "Évolutions Prismatiques",
    category: "Display",
    languageCode: "FR",
    releaseDate: "2025-01-17",
    imageUrl: "",
    imageStatus: "Manquante",
    source: "Veille CardSnip",
    notes: "Image propre à récupérer avant branchement Supabase Storage.",
    thumbnailTone: "from-amber-200 to-violet-200",
  },
  {
    id: "cat-bundle-151",
    name: "Booster Bundle 151",
    extensionName: "151",
    category: "Bundle",
    languageCode: "FR",
    releaseDate: "2023-10-06",
    imageUrl: "",
    imageStatus: "À vérifier",
    source: "Import manuel",
    notes: "Bon candidat pour le suivi multi-boutiques.",
    thumbnailTone: "from-orange-200 to-rose-200",
  },
];
