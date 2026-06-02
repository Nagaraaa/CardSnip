# Analyse boutique - Otakuland-Manga Passion

## Décision

Statut :

```txt
functional
```

Conclusion courte :

Otakuland-Manga Passion est fonctionnel pour CardSnip dans un périmètre V1 limité : pages produit simples, sans options obligatoires. Le flux complet a été validé via `tracked_products -> scraper_key otakuland -> registry -> OtakulandScraper -> SQLite -> API -> dashboard`. Les pages avec `isOptionRequired: true` restent volontairement non supportées.

## Identité boutique

- Nom : Otakuland-Manga Passion
- URL officielle analysée : https://otakuland-mangapassion.com/
- Type CardSnip : `tcg_specialist`
- Pays / zone : Belgique / France
- Priorité CardSnip : `high`
- Difficulté estimée : `medium`
- Statut d'intégration actuel : `functional`
- Scraper actuel : `scraper_key = otakuland`

## URL produit test

URL retenue :

```txt
https://otakuland-mangapassion.com/2208731-Pokemon-JCC-ETB-Coffret-Dresseur-d-Elite-Mega-Evolution-ME04-Chaos-Ascendant-FR
```

Pourquoi cette URL est pertinente :

- produit Pokémon JCC sealed ;
- page produit individuelle ;
- ETB, donc catégorie importante pour CardSnip ;
- prix visible ;
- disponibilité visible ;
- images produit présentes ;
- page accessible sans authentification.

Produit observé :

```txt
Pokémon JCC : ETB Coffret Dresseur d'Élite Méga-Évolution ME04 Chaos Ascendant - FR
```

## Snapshot HTML

Snapshot local sauvegardé :

```txt
docs/shop-analysis/snapshots/otakuland-product-sample.html
```

Statut :

```txt
OK
```

Usage prévu :

- analyse technique locale ;
- comparaison future des sélecteurs ;
- pas d'usage pour contourner une protection ;
- pas de collecte massive.

## Sources consultées

- Page produit test : https://otakuland-mangapassion.com/2208731-Pokemon-JCC-ETB-Coffret-Dresseur-d-Elite-Mega-Evolution-ME04-Chaos-Ascendant-FR
- Catalogue Pokémon : https://otakuland-mangapassion.com/catalogue/364472-Pokemon
- Recherche catalogue : https://otakuland-mangapassion.com/catalogue?search=Pokemon
- CGV : https://otakuland-mangapassion.com/page/cgv.html
- Contact : https://otakuland-mangapassion.com/contactez-nous
- Données personnelles : https://otakuland-mangapassion.com/page/donn%C3%A9es-personnelles.html
- Cookies : https://otakuland-mangapassion.com/donnees-personnelles
- robots.txt : https://otakuland-mangapassion.com/robots.txt

## Analyse technique

### Champs visibles

- Titre : oui
- Prix : oui
- Stock : oui pour une rupture
- Bouton panier : oui, mais caché/inactif sur le produit épuisé
- Bouton retour stock : oui
- Images : oui
- Variations : non confirmées sur la page test

### Titre

Valeur observée :

```txt
Pokémon JCC : ETB Coffret Dresseur d'Élite Méga-Évolution ME04 Chaos Ascendant - FR
```

Sélecteurs / signaux candidats :

```txt
h1[itemprop="name"]
meta[property="og:title"]
title
initProductPage(...).title
```

Recommandation :

Utiliser `h1[itemprop="name"]` en signal principal, puis `og:title` en fallback.

Stabilité estimée :

```txt
bonne
```

### Prix

Valeur observée :

```txt
59.99 EUR
```

Sélecteurs / signaux candidats :

```txt
.ProductPrice .Price-value[itemprop="price"][content]
.Price-value[itemprop="price"][content="59.99"]
initProductPage(...).pricing[0].amountWithTax
```

Signal le plus propre :

```txt
span.Price-value[itemprop="price"][content]
```

Pourquoi :

- la valeur `content="59.99"` est déjà normalisée ;
- elle évite de parser l'affichage français fragmenté `59 € 99` ;
- elle est liée au microdata `Offer`.

Point d'attention :

La page contient aussi d'autres prix dans les blocs produits recommandés. Un futur parser devra limiter la recherche au bloc produit principal, idéalement sous :

```txt
main.ProductPage
```

Stabilité estimée :

```txt
bonne à moyenne
```

### Stock

Valeur observée :

```txt
out_of_stock
```

Texte visible :

```txt
Épuisé
Article épuisé
PRÉVENEZ-MOI DU RETOUR EN STOCK
```

Sélecteurs / signaux candidats :

```txt
.ProductStock .ProductStock-info
.ProductStock-info.out_of_stock
.ProductStock-info[data-sold-out="true"]
.ProductActionButton-Error.sold-out
.js-warn-for-restock[data-id="P-2208731"]
initProductPage(...).inventories[0].availability
```

Signal le plus propre :

```txt
.ProductStock-info[data-sold-out="true"]
```

ou :

```txt
initProductPage(...).inventories[0].availability
```

Point d'attention :

Le texte `AJOUTER AU PANIER` apparaît dans le HTML même quand le produit est épuisé, avec une classe indiquant que le bouton est caché. Il ne faut donc pas déduire le stock uniquement depuis la présence du texte panier.

Stabilité estimée :

```txt
bonne pour la rupture, incertaine pour le stock positif
```

### Bouton panier

Signaux observés :

```txt
button.ProductActionButton.js-add-to-cart.d-none
button.ProductActionButton.js-warn-for-restock
```

Interprétation :

- `js-add-to-cart.d-none` indique que l'action panier est présente dans le DOM mais cachée ;
- `js-warn-for-restock` indique que le produit peut recevoir une alerte retour stock ;
- le futur scraper doit lire l'état, jamais déclencher une action.

### Images produit

Sélecteurs / signaux candidats :

```txt
main.ProductPage img[itemprop="image"]
main.ProductPage a[href*="eproshopping.cloud/media"]
```

Observation :

La page contient plusieurs images propres : visuel ETB face, boîte, contenu, boosters, sleeves, accessoires.

Recommandation :

Pour CardSnip, ne pas télécharger automatiquement ces images dans cette phase. Si l'image produit devient nécessaire plus tard, privilégier une logique admin validée ou un stockage interne avec autorisation claire.

## Structure HTML apparente

Technologie observée :

- site e-commerce Otakuland-Manga Passion ;
- plateforme eProShopping ;
- microdata Schema.org `Product` / `Offer` ;
- informations produit rendues dans le HTML initial ;
- script `initProductPage` contenant des données produit structurées échappées.

HTML initial :

```txt
exploitable sans navigateur headless
```

Besoin de Playwright/headless :

```txt
non nécessaire pour cette page test
```

Approche technique probable si un scraper est codé plus tard :

1. requête HTTP simple ;
2. parsing HTML ;
3. extraction dans `main.ProductPage` ;
4. titre via `h1[itemprop="name"]` ;
5. prix via `.Price-value[itemprop="price"][content]` ;
6. stock via `.ProductStock-info` ou `initProductPage`.

## Catalogue, pagination et recherche

Catalogue Pokémon :

```txt
https://otakuland-mangapassion.com/catalogue/364472-Pokemon
```

Recherche :

```txt
https://otakuland-mangapassion.com/catalogue?search=Pokemon
```

Signal HTML observé :

```txt
input type="search" data-url="/catalogue"
```

Observation :

- le site contient des catégories Pokémon détaillées ;
- des produits Pokémon sealed sont présents ;
- les pages catalogue sont lourdes ;
- la découverte automatique de produits n'est pas nécessaire pour le MVP.

Décision :

Ne pas crawler le catalogue maintenant. Le futur scraper, s'il est validé, doit fonctionner sur une URL produit fournie manuellement.

## Variations produit

Sur la page test :

```txt
options: []
isOptionRequired: false
```

Interprétation :

- aucune variation obligatoire confirmée pour cette ETB ;
- la plateforme peut gérer des options sur d'autres produits ;
- un futur scraper doit vérifier `options` / `isOptionRequired` si le script `initProductPage` est utilisé.

Statut :

```txt
non bloquant pour cette page, à vérifier sur d'autres produits
```

## robots.txt

URL :

```txt
https://otakuland-mangapassion.com/robots.txt
```

Résultat observé :

```txt
User-agent: *
Allow: /

Sitemap: https://otakuland-mangapassion.com/sitemap.xml
```

Interprétation :

- pas de blocage robots.txt apparent sur les pages produit ;
- le sitemap existe ;
- cela ne constitue pas une autorisation commerciale ou contractuelle ;
- un futur scraper doit rester limité, ponctuel et non intrusif.

## Conditions d'utilisation et mentions

Pages consultées :

```txt
https://otakuland-mangapassion.com/page/cgv.html
https://otakuland-mangapassion.com/contactez-nous
https://otakuland-mangapassion.com/page/donn%C3%A9es-personnelles.html
https://otakuland-mangapassion.com/donnees-personnelles
```

Mentions observées :

- CGV accessibles ;
- contact accessible ;
- page données personnelles accessible ;
- page cookies accessible ;
- bloc footer `Mentions légales` présent ;
- aucune autorisation explicite de scraping identifiée pendant cette passe.

Risque légal / usage :

```txt
moyen
```

Recommandation :

Ne pas faire de crawl massif, ne pas appeler panier/compte/checkout, ne pas contourner de protection. Pour un usage SaaS ou commercial, demander une autorisation ou privilégier des sources autorisées.

## Analyse multi-pages

### Page 1

- URL : https://otakuland-mangapassion.com/2208731-Pokemon-JCC-ETB-Coffret-Dresseur-d-Elite-Mega-Evolution-ME04-Chaos-Ascendant-FR
- Snapshot : `docs/shop-analysis/snapshots/otakuland-product-sample-1.html`
- Type produit : ETB
- Nom produit : Pokémon JCC : ETB Coffret Dresseur d'Élite Méga-Évolution ME04 Chaos Ascendant - FR
- Prix détectable : oui, `59.99`
- Stock détectable : oui
- Stock observé : `Épuisé`
- Disponibilité normalisée : `out_of_stock`
- Bouton panier : présent dans le DOM mais caché via `d-none`
- Texte rupture : `Épuisé`, `Article épuisé`, bouton retour stock visible
- Sélecteur titre candidat : `main.ProductPage h1[itemprop="name"]`
- Sélecteur prix candidat : `main.ProductPage .Price-value[itemprop="price"][content]`
- Sélecteur stock candidat : `main.ProductPage .ProductStock-info`
- Données structurées : microdata Schema.org `Product` / `Offer`, pas de JSON-LD détecté
- Variations produit : non bloquantes sur cette page
- Headless requis : non
- Notes : page rupture très propre pour tester `out_of_stock`.

### Page 2

- URL : https://otakuland-mangapassion.com/2208735-Pokemon-JCC-Tripack-Reptincel-Mega-Evolution-ME04-Chaos-Ascendant-FR
- Snapshot : `docs/shop-analysis/snapshots/otakuland-product-sample-2.html`
- Type produit : tripack / coffret blister
- Nom produit : Pokémon JCC : Tripack Reptincel Méga-Évolution ME04 Chaos Ascendant - FR
- Prix détectable : oui, `19.99`
- Stock détectable : oui
- Stock observé : `En stock`
- Disponibilité normalisée : `in_stock`
- Bouton panier : présent et actif dans le DOM
- Texte rupture : non
- Sélecteur titre candidat : `main.ProductPage h1[itemprop="name"]`
- Sélecteur prix candidat : `main.ProductPage .Price-value[itemprop="price"][content]`
- Sélecteur stock candidat : `main.ProductPage .ProductStock-info`
- Données structurées : microdata Schema.org `Product` / `Offer`, pas de JSON-LD détecté
- Variations produit : non bloquantes sur cette page
- Headless requis : non
- Notes : page la plus utile pour valider le signal positif `in_stock`.

### Page 3

- URL : https://otakuland-mangapassion.com/2208743-Pokemon-JCC-Booster-Mega-Evolution-ME04-Chaos-Ascendant-FR
- Snapshot : `docs/shop-analysis/snapshots/otakuland-product-sample-3.html`
- Type produit : booster
- Nom produit : Pokémon JCC : Booster Méga-Évolution ME04 Chaos Ascendant - FR
- Prix détectable : oui, `5.99` pour le prix affiché principal
- Stock détectable : incertain au niveau produit global
- Stock observé : dépend des options
- Bouton panier : présent
- Texte rupture : présent pour certaines options
- Sélecteur titre candidat : `main.ProductPage h1[itemprop="name"]`
- Sélecteur prix candidat : `main.ProductPage .Price-value[itemprop="price"][content]`
- Sélecteur stock candidat : insuffisant si options obligatoires
- Données structurées : microdata Schema.org `Product` / `Offer`, données options dans `initProductPage`
- Variations produit : oui, `isOptionRequired: true`
- Headless requis : non
- Notes : ce cas doit être exclu d'une V1 simple ou traité avec parsing spécifique des options. Le script `initProductPage` montre des variantes comme `Booster en loose`, `Booster blister`, `Art set`, avec des prix et disponibilités distincts.

## Comparaison des sélecteurs

- Titre : stable sur les 3 pages via `main.ProductPage h1[itemprop="name"]`.
- Prix : stable sur les 3 pages via `main.ProductPage .Price-value[itemprop="price"][content]`, mais les pages avec options peuvent avoir des prix par option dans `initProductPage`.
- Stock : stable sur pages simples via `main.ProductPage .ProductStock-info`, mais insuffisant pour les produits à options obligatoires.
- Disponibilité : `out_of_stock` / `in_stock` visible en classe CSS sur pages simples ; les options exposent aussi `availability` dans `initProductPage`.
- Bouton panier : pas fiable seul, car il peut être présent mais caché ou lié à une option.
- JSON-LD / meta : pas de JSON-LD détecté sur les snapshots ; microdata Schema.org présent et exploitable.
- Headless : non nécessaire sur les 3 pages analysées.

## Décision finale pré-scraper

Décision :

```txt
prêt à coder
```

Périmètre exact :

```txt
prêt à coder pour une V1 limitée aux pages produit simples, sans options obligatoires
```

Raison :

- 3 pages produit Pokémon sealed ont été analysées.
- 2 pages simples couvrent les deux états utiles : `in_stock` et `out_of_stock`.
- Le titre est détectable de manière cohérente.
- Le prix est détectable de manière cohérente.
- Le stock est détectable de manière cohérente sur les pages sans options.
- Aucun navigateur headless n'est nécessaire.
- Aucun blocage anti-bot évident n'a été observé pendant cette analyse ponctuelle.
- `robots.txt` autorise `/`.

Limite importante :

Les produits à options obligatoires, comme certains boosters, doivent être ignorés ou retourner une erreur propre en V1. Ils ne doivent pas être traités comme des pages simples, car chaque option peut avoir son propre prix et son propre stock.

## Décision d'implémentation V1

Statut :

```txt
functional V1 limitée
```

Périmètre :

- pages produit simples uniquement ;
- options obligatoires non supportées ;
- aucun crawl catalogue ;
- aucun parsing marketplace ;
- aucun navigateur headless ;
- bouton panier non utilisé comme source de stock.

scraper_key :

```txt
otakuland
```

Comportement attendu :

- extraire titre, prix, stock, source URL et timestamp ;
- retourner un `ProductCheck` normalisé ;
- refuser proprement une page avec `isOptionRequired: true` ;
- ne jamais appeler panier, compte, checkout ou notification retour stock.

Validation finale :

- test snapshots : OK ;
- test live direct : OK ;
- flux complet SQLite/API/dashboard : OK ;
- `integration_status` recommandé : `functional`.

Note obligatoire :

```txt
Fonctionnel uniquement pour OtakulandScraper V1 : pages produit simples sans options obligatoires.
```

## Risques identifiés

- La page contient plusieurs prix hors produit principal dans des recommandations : le parser doit rester scoped à `main.ProductPage`.
- Le texte `AJOUTER AU PANIER` existe même en rupture : ne pas l'utiliser seul pour le stock.
- Les produits avec options obligatoires ont des prix/stocks par variante : V1 doit les ignorer ou les marquer non supportés.
- Les pages catalogue sont lourdes : ne pas crawler.
- Les images viennent d'un CDN tiers : ne pas les télécharger automatiquement sans stratégie claire.
- Les CGV ne donnent pas d'autorisation explicite de scraping.
- La stabilité est suffisante pour une V1 limitée, mais pas encore pour tous les types de produits.

## Recommandation

Décision finale :

```txt
prêt à coder
```

Raison :

- Techniquement, les pages test sont exploitables.
- Les champs essentiels sont détectables dans le HTML initial sur plusieurs pages.
- Les produits test sont dans le scope CardSnip.
- `robots.txt` n'interdit pas les pages produit.
- Une page en stock et plusieurs fiches produit ont été validées.
- Les produits avec options obligatoires doivent être exclus ou traités plus tard.
- Le cadre d'autorisation reste à clarifier avant usage réel, surtout pour une évolution SaaS.

Prochaine action recommandée :

1. Conserver Otakuland-Manga Passion en `functional` pour le périmètre V1 limité.
2. Utiliser uniquement des URLs produit simples fournies manuellement.
3. Refuser proprement les pages avec `isOptionRequired: true`.
4. Ne pas crawler le catalogue.
5. Ne jamais appeler panier, compte, checkout ou notification retour stock.
