# Strategy Games - Analyse pre-scraper

## Identite boutique

- Nom : Strategy Games
- URL du site : https://strategygames.be
- Type : tcg_specialist
- Pays : BE
- Priorite CardSnip : high
- Difficulte estimee : medium
- Statut actuel : to_analyze
- scraper_key actuel : not_configured
- Positionnement CardSnip : boutique belge TCG pertinente pour une strategie BE-first, avec produits Pokemon sealed et frais Belgique a verifier.
- Technologie detectee : WooCommerce / WordPress

## Presence dans CardSnip

Strategy Games est deja present dans le seed avec les valeurs attendues :

```txt
name = Strategy Games
url = https://strategygames.be
country = BE
type = tcg_specialist
priority = high
difficulty = unknown
integration_status = to_analyze
scraper_key = not_configured
trusted = true
```

Aucune correction seed/DB n'a ete necessaire.

## Limites connues

- Le site est accessible sans challenge anti-bot evident sur les pages analysees.
- Le site utilise WordPress/WooCommerce, pas Shopify ni Odoo.
- Les pages en stock et precommande exposent un JSON-LD Product avec Offer exploitable.
- La page rupture analysee expose un statut rupture via classes WooCommerce, mais pas de prix produit exploitable dans la zone principale.
- Le modele actuel CardSnip demande un `price` dans `ProductCheck`, donc une page rupture sans prix est un point bloquant a clarifier avant scraper.
- Ne pas utiliser les pages `?add-to-cart` : elles sont interdites par robots.txt et hors perimetre CardSnip.

## Analyse multi-pages

### Page 1 - En stock

- URL : https://strategygames.be/blister-me02-flammes-fantasmagoriques-fr/
- Snapshot : `docs/shop-analysis/snapshots/strategy-games-product-in-stock.html`
- Type produit : booster / blister
- Statut reel observe : en stock
- Prix visible : oui, `7,50 EUR`
- Stock visible : oui, texte `En stock`
- Bouton panier visible : oui, bouton `Ajouter au panier`
- Texte rupture / indisponible : non
- Texte precommande : non
- Structure HTML du titre : `h1.product-title.product_title.entry-title`
- Structure HTML du prix : `p.price.product-page-price .woocommerce-Price-amount`
- Structure HTML du stock : `p.stock.in-stock`
- Options ou variantes : aucune variante complexe observee, produit simple WooCommerce
- JSON-LD Product : oui
- JSON-LD Offer :
  - `offers.price = 7.50`
  - `offers.priceCurrency = EUR`
  - `offers.availability = http://schema.org/InStock`
- Besoin headless : non
- Notes : page propre pour un scraper V1.

### Page 2 - Rupture

- URL : https://strategygames.be/booster-ev08-fr/
- Snapshot : `docs/shop-analysis/snapshots/strategy-games-product-out-of-stock.html`
- Type produit : booster
- Statut reel observe : rupture
- Prix visible : non dans la zone produit principale analysee
- Stock visible : oui via classe produit WooCommerce `outofstock`
- Bouton panier visible : non
- Texte rupture / indisponible : la page produit est marquee `outofstock`; les textes `Rupture de stock` apparaissent aussi dans les produits similaires
- Texte precommande : non
- Structure HTML du titre : `h1.product-title.product_title.entry-title`
- Structure HTML du prix : `p.price.product-page-price.price-not-in-stock`, vide sur cette page
- Structure HTML du stock : classe du conteneur `div#product-3864.product.outofstock`
- Options ou variantes : aucune variante complexe observee
- JSON-LD Product : oui, mais sans Offer exploitable
- Besoin headless : non
- Notes : le statut rupture est detectable, mais l'absence de prix bloque une observation CardSnip standard.

### Page 3 - Precommande

- URL : https://strategygames.be/blister-me05-nuit-noir-fr/
- Snapshot : `docs/shop-analysis/snapshots/strategy-games-product-preorder.html`
- Type produit : booster / blister
- Statut reel observe : precommande disponible
- Prix visible : oui, `7,99 EUR`
- Stock visible : oui, texte `En stock`
- Bouton panier visible : oui, bouton `Precommander`
- Texte rupture / indisponible : non
- Texte precommande : oui, `Disponible le: 17 juillet 2026 a 0h00`
- Structure HTML du titre : `h1.product-title.product_title.entry-title`
- Structure HTML du prix : `p.price.product-page-price .woocommerce-Price-amount`
- Structure HTML du stock : `p.stock.in-stock`
- Structure HTML precommande : `.wpro-pre-order-availability-date`
- Options ou variantes : aucune variante complexe observee, produit simple WooCommerce
- JSON-LD Product : oui
- JSON-LD Offer :
  - `offers.price = 7.99`
  - `offers.priceCurrency = EUR`
  - `offers.availability = http://schema.org/InStock`
- Besoin headless : non
- Notes : precommande detectable par le texte HTML, mais JSON-LD reste `InStock`.

## Compatibilite scraper existant

### ShopifyProductScraper

- Compatible probable : incertain
- Raison : les pages en stock/precommande ont un JSON-LD Product proche de ce que lit `ShopifyProductScraper`, mais le site est WooCommerce et les fallbacks Shopify ne correspondent pas.
- Champs JSON-LD detectes :
  - `Product.name`
  - `Product.offers.price`
  - `Product.offers.priceCurrency`
  - `Product.offers.availability`
- Valeurs availability detectees :
  - `http://schema.org/InStock`
- Fallbacks necessaires :
  - titre : `h1.product-title.product_title.entry-title`
  - prix : `p.price.product-page-price .woocommerce-Price-amount`
  - stock : `p.stock.in-stock`, `div.product.outofstock`
  - precommande : `.wpro-pre-order-availability-date`
- Limites :
  - pas de `pickup-availability`
  - pas de bouton Shopify `button[name="add"]`
  - page rupture analysee sans Offer/prix exploitable

### Odoo / JSON-LD

- Compatible probable : non
- Raison : aucune route `/shop/...` type Odoo, aucune classe `o_wsale`, `oe_price` ou `product.product`.
- Selecteurs ou classes detectees :
  - `woocommerce`
  - `wp-content`
  - `single-product`
  - `product-type-simple`
  - `instock` / `outofstock`
  - `woocommerce-Price-amount`
- Limites : un scraper Odoo/TCG PokAlex ne doit pas etre reutilise tel quel.

## Comparaison des selecteurs

- Titre :
  - JSON-LD `Product.name` sur les pages avec donnees produit
  - fallback HTML : `h1.product-title.product_title.entry-title`
- Prix :
  - JSON-LD `offers.price` sur les pages en stock/precommande
  - fallback HTML : `p.price.product-page-price .woocommerce-Price-amount`
  - rupture analysee : prix absent/vide
- Stock :
  - JSON-LD `offers.availability` sur les pages en stock/precommande
  - fallback HTML : `p.stock.in-stock`
  - rupture : classe `div.product.outofstock`
- Disponibilite :
  - `InStock` dans JSON-LD pour stock et precommande disponible
  - `outofstock` dans la classe produit WooCommerce pour rupture
- Precommande :
  - `.wpro-pre-order-availability-date`
  - bouton `Precommander`
  - JSON-LD reste `InStock`, donc la precommande doit etre un metadata/contexte, pas un `stock_status` different en V1
- Bouton panier :
  - formulaire `form.cart`
  - bouton `.single_add_to_cart_button`
  - texte `Ajouter au panier` ou `Precommander`
- JSON-LD / meta :
  - JSON-LD `Product` present
  - `Offer` present sur stock/precommande
  - `Offer` absent ou incomplet sur la page rupture analysee

## Robots.txt et conditions

Robots.txt accessible :

```txt
https://strategygames.be/robots.txt
```

Constats :

- WordPress/WooCommerce confirme par robots.txt.
- Disallow sur logs WooCommerce, uploads WooCommerce, admin et URLs `add-to-cart`.
- Les pages produit simples analysees ne sont pas explicitement bloquees.
- Conditions generales de vente accessibles :

```txt
https://strategygames.be/conditions-generales-de-vente/
```

Aucun contournement, panier, compte, checkout ou crawl massif n'a ete effectue.

## Risques identifies

- WooCommerce : necessite probablement un scraper dedie ou une base generique WooCommerce/JSON-LD.
- Les pages rupture peuvent ne pas exposer de prix, ce qui ne colle pas encore parfaitement au modele `ProductCheck`.
- Les textes de rupture dans les produits similaires peuvent polluer une extraction texte naive.
- Les precommandes sont `InStock` dans JSON-LD : il faut capturer la precommande comme contexte separe, pas comme stock different.
- Il faudra tester une autre page rupture pour confirmer si l'absence de prix est generale ou specifique au produit analyse.

## Decision finale pre-scraper

Decision :

```txt
a revoir
```

Raison :

- Points positifs :
  - 3 pages produit pertinentes accessibles ;
  - en stock, rupture et precommande differenciables ;
  - pas de headless browser necessaire ;
  - pas de blocage anti-bot evident ;
  - site BE-first pertinent ;
  - JSON-LD propre pour stock/precommande.

- Point bloquant :
  - la page rupture analysee ne fournit pas de prix/Offer exploitable ;
  - le modele actuel du scraper CardSnip attend toujours un prix pour creer une observation ;
  - un scraper V1 ne serait pas assez robuste tant que ce comportement rupture n'est pas clarifie.

## Recommandation initiale avant analyse precommandes

Avant l'analyse de la page precommandes, la recommandation etait de ne pas coder Strategy Games maintenant.

Prochaine action recommandee :

1. Trouver une deuxieme page Strategy Games en rupture avec prix visible, si elle existe.
2. Si les ruptures n'ont jamais de prix, decider si CardSnip accepte une observation sans prix pour `out_of_stock`.
3. Ensuite seulement envisager un scraper WooCommerce/JSON-LD dedie.

Cette recommandation est remplacee par la decision Strategy Games V1 ci-dessous apres analyse de la page `stock_status=pre_order`.

## Analyse precommandes

### Listing precommandes

- URL : https://strategygames.be/boutique/?stock_status=pre_order
- Snapshot : `docs/shop-analysis/snapshots/strategy-games-preorder-listing.html`
- Page accessible sans headless : oui
- Prix visibles : oui
  - Blister ME05 - Nuit Noire - FR : 7,99 EUR
  - Bundle ME05 - Nuit Noire - FR : 44,99 EUR
  - Coffret Illustration - Premiers Partenaires - Serie 2 - FR : 29,99 EUR
- Dates visibles : oui
  - 17 juillet 2026 a 0h00 pour Blister ME05 et Bundle ME05
  - 19 juin 2026 a 0h00 pour Coffret Illustration
- Liens produit detectables : oui
- Filtre `stock_status=pre_order` fiable : oui pour identifier la page listing des precommandes
- Notes : la page affiche aussi un message WooCommerce indiquant que les articles consultes sont en precommande et que la commande complete sera expediee quand ces articles seront disponibles.

### Produit precommande 1

- URL : https://strategygames.be/blister-me05-nuit-noir-fr/
- Snapshot : `docs/shop-analysis/snapshots/strategy-games-preorder-product-1.html`
- Titre : Blister ME05 - Nuit Noire - FR
- Prix : 7.99 EUR
- Date disponibilite : 17 juillet 2026 a 0h00
- JSON-LD availability : `http://schema.org/InStock`
- Stock / precommande detectable : oui
  - stock WooCommerce : `p.stock.in-stock`
  - contexte precommande : `.wpro-pre-order-availability-date`
  - bouton : `Precommander`
- Selecteurs candidats :
  - titre : `h1.product-title.product_title.entry-title`
  - prix : `p.price.product-page-price .woocommerce-Price-amount`
  - stock : `p.stock.in-stock`
  - date precommande : `.wpro-pre-order-availability-date`
  - bouton : `.single_add_to_cart_button`
- Notes : JSON-LD donne `InStock`, donc le statut CardSnip V1 peut rester `in_stock`, avec un indicateur contexte "precommande" si besoin plus tard.

### Produit precommande 2

- URL : https://strategygames.be/bundle-me05-nuit-noir-fr/
- Snapshot : `docs/shop-analysis/snapshots/strategy-games-preorder-product-2.html`
- Titre : Bundle ME05 - Nuit Noire - FR
- Prix : 44.99 EUR
- Date disponibilite : 17 juillet 2026 a 0h00
- JSON-LD availability : `http://schema.org/InStock`
- Stock / precommande detectable : oui
  - stock WooCommerce : `p.stock.in-stock`
  - contexte precommande : `.wpro-pre-order-availability-date`
  - bouton : `Precommander`
- Selecteurs candidats :
  - titre : `h1.product-title.product_title.entry-title`
  - prix : `p.price.product-page-price .woocommerce-Price-amount`
  - stock : `p.stock.in-stock`
  - date precommande : `.wpro-pre-order-availability-date`
  - bouton : `.single_add_to_cart_button`
- Notes : produit sealed pertinent pour CardSnip, prix et precommande propres.

### Produit precommande 3

- URL : https://strategygames.be/coffret-illustration-premiers-partenaires-serie-2-fr/
- Snapshot : `docs/shop-analysis/snapshots/strategy-games-preorder-product-3.html`
- Titre : Coffret Illustration - Premiers Partenaires - Serie 2 - FR
- Prix : 29.99 EUR
- Date disponibilite : 19 juin 2026 a 0h00
- JSON-LD availability : `http://schema.org/InStock`
- Stock / precommande detectable : oui
  - stock WooCommerce : `p.stock.in-stock`
  - contexte precommande : `.wpro-pre-order-availability-date`
  - bouton : `Precommander`
- Selecteurs candidats :
  - titre : `h1.product-title.product_title.entry-title`
  - prix : `p.price.product-page-price .woocommerce-Price-amount`
  - stock : `p.stock.in-stock`
  - date precommande : `.wpro-pre-order-availability-date`
  - bouton : `.single_add_to_cart_button`
- Notes : page propre pour un scraper WooCommerce/JSON-LD V1.

## Decision Strategy Games V1

Decision :

```txt
pret a coder
```

Raison :

- produit en stock detectable avec prix ;
- precommandes detectables avec prix, dates et bouton `Precommander` ;
- pages produit accessibles sans headless browser ;
- pas de protection anti-bot evidente ;
- selecteurs WooCommerce stables sur les pages analysees ;
- JSON-LD Product/Offer propre sur les pages exploitables ;
- le cas rupture sans prix ne bloque plus la V1 si le futur scraper refuse proprement les pages `outofstock` sans prix.

Perimetre recommande pour un futur scraper V1 :

- pages produit WooCommerce simples uniquement ;
- JSON-LD prioritaire pour titre, prix et availability ;
- fallback WooCommerce pour titre/prix/stock ;
- precommande detectee via `.wpro-pre-order-availability-date` et bouton `Precommander` ;
- pages rupture sans prix refusees proprement avec erreur claire ;
- pas de crawl catalogue ;
- pas de panier ;
- pas de checkout.

## Decision d'implementation V1

Statut : pret a coder V1 limitee

Perimetre :

- pages produit WooCommerce simples uniquement ;
- parsing prioritaire via JSON-LD ;
- fallback WooCommerce leger ;
- precommandes avec prix supportees ;
- ruptures sans prix refusees proprement ;
- pas de crawl catalogue ;
- pas de panier ;
- pas de checkout ;
- pas de headless browser.

scraper_key :

```txt
strategy_games
```

Statut seed initial :

```txt
integration_status = functional
difficulty = medium
priority = high
notes = Fonctionnel uniquement pour StrategyGamesScraper V1 : pages produit WooCommerce simples, produits en stock ou precommandes avec prix, parsing JSON-LD prioritaire, ruptures sans prix refusees proprement, pas de crawl catalogue.
```
