export type WatchPriority = "Haute" | "Moyenne" | "Basse";
export type WatchStatus = "Annonce" | "Précommande" | "Restock" | "Rumeur";
export type WatchCategory = "ETB" | "Display" | "Booster" | "Collection";
export type WatchSource = "Officiel" | "Boutiques" | "Communauté" | "CardSnip";

export type WatchSignal = {
  id: string;
  title: string;
  product: string;
  category: WatchCategory;
  source: WatchSource;
  status: WatchStatus;
  priority: WatchPriority;
  confidence: number;
  eta: string;
  summary: string;
  action: string;
  tone: string;
};

export type WatchTimelineItem = {
  id: string;
  date: string;
  title: string;
  detail: string;
  source: WatchSource;
};

export const watchSignals: WatchSignal[] = [
  {
    id: "sv-151-restock",
    title: "Restock potentiel 151",
    product: "ETB Écarlate et Violet 151",
    category: "ETB",
    source: "CardSnip",
    status: "Restock",
    priority: "Haute",
    confidence: 86,
    eta: "24-48 h",
    summary: "Plusieurs boutiques mockées reviennent en stock sur une fenêtre courte.",
    action: "Créer une alerte prix + stock",
    tone: "from-rose-300 to-zinc-100",
  },
  {
    id: "prism-preorder",
    title: "Précommandes à surveiller",
    product: "Display Évolutions Prismatiques",
    category: "Display",
    source: "Boutiques",
    status: "Précommande",
    priority: "Haute",
    confidence: 78,
    eta: "Cette semaine",
    summary: "Signal récurrent de précommande, risque de prix trop haut au lancement.",
    action: "Comparer avec target price",
    tone: "from-amber-200 to-violet-200",
  },
  {
    id: "trainer-collection",
    title: "Nouvelle collection spéciale",
    product: "Collection Premium Dresseur",
    category: "Collection",
    source: "Officiel",
    status: "Annonce",
    priority: "Moyenne",
    confidence: 92,
    eta: "Juin 2026",
    summary: "Annonce officielle mockée, utile pour préparer les produits à surveiller.",
    action: "Ajouter au catalogue",
    tone: "from-indigo-200 to-sky-100",
  },
  {
    id: "bundle-community",
    title: "Signal communauté sur bundle",
    product: "Booster Bundle 151",
    category: "Booster",
    source: "Communauté",
    status: "Rumeur",
    priority: "Moyenne",
    confidence: 61,
    eta: "À confirmer",
    summary: "Plusieurs mentions sociales, mais aucune boutique vérifiée pour le moment.",
    action: "Attendre confirmation",
    tone: "from-orange-200 to-rose-200",
  },
  {
    id: "tripack-sv-low",
    title: "Prix bas mais impact faible",
    product: "Tripack Écarlate et Violet",
    category: "Booster",
    source: "CardSnip",
    status: "Restock",
    priority: "Basse",
    confidence: 73,
    eta: "Disponible",
    summary: "Produit disponible, mais marge d'économie limitée face aux autres deals.",
    action: "Garder en veille",
    tone: "from-sky-300 to-cyan-100",
  },
];

export const watchTimeline: WatchTimelineItem[] = [
  {
    id: "official-drop",
    date: "Aujourd'hui",
    title: "Annonce collection spéciale",
    detail: "Signal officiel mocké ajouté au flux de veille.",
    source: "Officiel",
  },
  {
    id: "shops-check",
    date: "Hier",
    title: "Précommandes repérées",
    detail: "Deux boutiques mockées ont changé leur statut produit.",
    source: "Boutiques",
  },
  {
    id: "community-pulse",
    date: "26/05",
    title: "Hausse des mentions communauté",
    detail: "Discussions Discord et Dealabs simulées autour du Bundle 151.",
    source: "Communauté",
  },
];
