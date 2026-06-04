# Analyse boutique - TCG PokAlex

## Synthèse

- Nom : TCG PokAlex
- URL officielle : https://www.tcgpokalex.com
- Type : tcg_specialist
- Pays / zone : BE
- Priorité CardSnip : high
- Difficulté estimée : medium
- Statut actuel : to_analyze
- scraper_key actuel : not_configured
- Positionnement CardSnip : boutique belge TCG prioritaire, pertinente pour une stratégie BE-first.
- Technologie détectée : autre, très probablement Odoo eCommerce.
- Compatible probable avec ShopifyProductScraper : non.

TCG PokAlex est accessible sans navigateur headless sur les pages testées. Les pages produit exposent un JSON-LD `Product` exploitable avec `name`, `offers.price`, `offers.priceCurrency` et `offers.availability`. Le site ne ressemble pas à Shopify : les URLs, classes CSS et routes observées sont typiques d'Odoo (`/shop/category/...`, `/shop/cart`, `o_wsale`, `oe_price`, `product.product`).

## Vérification shops

TCG PokAlex est déjà présent dans le seed/local DB avec les valeurs attendues :

- name : TCG PokAlex
- url : https://www.tcgpokalex.com
- country : BE
- type : tcg_specialist
- priority : high
- difficulty : unknown
- integration_status : to_analyze
- scraper_key : not_configured
- trusted : true

Aucune correction seed/DB n'a été nécessaire.

## Analyse multi-pages

### Page 1 - En stock

- URL : https://www.tcgpokalex.com/shop/pokemon-17/pokemon-coffret-dresseur-delite-mega-evolution-me04-chaos-ascendant-fr-256
- Snapshot : `docs/shop-analysis/snapshots/tcg-pokalex-product-in-stock.html`
- Type produit : ETB / coffret dresseur d'élite
- Prix détectable : oui, `69.99` via JSON-LD `offers.price`
- Stock détectable : oui, `https://schema.org/InStock`
- Bouton panier : présent, texte `Ajouter au panier`
- Texte rupture : non observé comme signal produit principal
- Texte précommande : présence globale du menu `Articles Précommandes`, à ignorer comme signal produit
- JSON-LD Product : oui
- Sélecteur titre candidat : `main h1` ou `h1.h3`
- Sélecteur prix candidat : JSON-LD prioritaire ; fallback HTML possible via `[name="product_price"] .oe_price .oe_currency_value`
- Sélecteur stock candidat : JSON-LD `offers.availability`
- Données structurées : JSON-LD `Organization`, `Product`, `BreadcrumbList`
- Options / variantes : conteneur Odoo présent mais vide/caché, `ul.o_wsale_product_page_variants.d-none`
- Notes : cas disponible propre. JSON-LD suffisant pour un scraper V1.

### Page 2 - Rupture

- URL : https://www.tcgpokalex.com/shop/pokemon-17/pokemon-jcc-ev10-display-pack-36-booster-fr-50
- Snapshot : `docs/shop-analysis/snapshots/tcg-pokalex-product-out-of-stock.html`
- Type produit : display 36 boosters
- Prix détectable : oui, `299.0` via JSON-LD `offers.price`
- Stock détectable : oui, `https://schema.org/OutOfStock`
- Bouton panier : présent malgré la rupture, donc non fiable seul
- Texte rupture : oui, ruban `En rupture de stock`
- Texte précommande : présence globale du menu `Articles Précommandes`, à ignorer comme signal produit
- JSON-LD Product : oui
- Sélecteur titre candidat : `main h1` ou `h1.h3`
- Sélecteur prix candidat : JSON-LD prioritaire ; fallback HTML possible via `[name="product_price"] .oe_price .oe_currency_value`
- Sélecteur stock candidat : JSON-LD `offers.availability`
- Données structurées : JSON-LD `Organization`, `Product`, `BreadcrumbList`
- Options / variantes : conteneur Odoo présent mais vide/caché
- Notes : le ruban rupture peut confirmer l'indisponibilité, mais le JSON-LD doit rester la source prioritaire.

### Page 3 - Précommande épuisée

- URL : https://www.tcgpokalex.com/shop/pokemon-17/pokemon-display-de-pack-de-booster-mega-evolution-me05-nuit-noire-display-x36-fr-281
- Snapshot : `docs/shop-analysis/snapshots/tcg-pokalex-product-preorder.html`
- Type produit : display 36 boosters
- Prix détectable : oui, `269.99` via JSON-LD `offers.price`
- Stock détectable : oui, `https://schema.org/OutOfStock`
- Bouton panier : présent, donc non fiable seul
- Texte rupture : non retenu comme signal principal sur cette page
- Texte précommande : oui dans la description produit, avec avertissement d'accès prioritaire aux réservations
- JSON-LD Product : oui
- Sélecteur titre candidat : `main h1` ou `h1.h3`
- Sélecteur prix candidat : JSON-LD prioritaire ; fallback HTML possible via `[name="product_price"] .oe_price .oe_currency_value`
- Sélecteur stock candidat : JSON-LD `offers.availability`
- Données structurées : JSON-LD `Organization`, `Product`, `BreadcrumbList`
- Options / variantes : conteneur Odoo présent mais vide/caché
- Notes : cas à traiter comme précommande épuisée / indisponible. La notion "précommande" vient du contenu descriptif, pas de `availability`.

## Compatibilité ShopifyProductScraper

- Compatible probable : non
- Raison : le site semble basé sur Odoo eCommerce, pas Shopify.
- Champs JSON-LD détectés :
  - `Product.name`
  - `Product.offers.price`
  - `Product.offers.priceCurrency`
  - `Product.offers.availability`
- Valeurs availability détectées :
  - `https://schema.org/InStock`
  - `https://schema.org/OutOfStock`
- Valeur PreOrder détectée : non, pas dans JSON-LD sur les pages analysées
- Fallbacks nécessaires :
  - titre : `h1.h3`
  - prix : `[name="product_price"] .oe_price .oe_currency_value`
  - rupture : ruban `.o_wsale_ribbon` contenant `En rupture de stock`
- Limites :
  - le bouton `#add_to_cart` peut être présent même quand `availability = OutOfStock`, il ne doit donc pas être utilisé comme source fiable seule ;
  - les pages précommande peuvent être indiquées par le texte descriptif plutôt que par une valeur structurée `PreOrder` ;
  - le scraper V1 devrait être spécifique Odoo/TCG PokAlex ou un futur scraper générique JSON-LD, pas une simple sous-classe Shopify.

## Comparaison des sélecteurs

- Titre :
  - JSON-LD `Product.name` fiable sur les 3 pages.
  - Fallback : `h1.h3`.
- Prix :
  - JSON-LD `offers.price` fiable sur les 3 pages.
  - Fallback HTML : `[name="product_price"] .oe_price .oe_currency_value`.
- Stock / disponibilité :
  - JSON-LD `offers.availability` fiable sur les 3 pages.
  - `InStock` -> `in_stock`.
  - `OutOfStock` -> `out_of_stock`.
- Rupture :
  - Ruban `.o_wsale_ribbon` avec texte `En rupture de stock` visible sur la page rupture.
  - À utiliser seulement comme confirmation/fallback.
- Précommande :
  - Texte dans description produit ou contexte produit.
  - Pas de valeur JSON-LD `PreOrder` observée.
- Bouton panier :
  - `#add_to_cart`, `.js_check_product`.
  - Non fiable seul, car présent sur une page `OutOfStock`.
- JSON-LD / meta :
  - JSON-LD Product exploitable.
  - Pas de `og:price:amount` ni de `product:availability` observés sur les pages testées.

## Robots.txt et conditions

- `https://www.tcgpokalex.com/robots.txt` accessible.
- Règles observées :
  - `Allow: /`
  - `Disallow: /web/`
  - `Disallow: /shop/cart`
  - `Disallow: /shop/checkout`
  - `Disallow: /shop/compare`
  - `Disallow: /shop/address`
  - `Disallow: /shop/payment`
  - `Disallow: /shop/confirmation`
  - `Disallow: /my/`
- Les pages produit publiques ne semblent pas bloquées par robots.txt.
- Page conditions accessible : https://www.tcgpokalex.com/terms
- Aucune tentative de contournement, compte, panier, checkout ou crawling massif n'a été effectuée.

## Risques identifiés

- Technologie Odoo : le scraper Shopify générique ne doit pas être utilisé directement.
- Le bouton panier peut être trompeur et ne doit pas décider le stock seul.
- Les précommandes ne sont pas structurées avec `schema.org/PreOrder` sur les pages observées.
- Certains signaux texte comme `Articles Précommandes` viennent de la navigation globale et doivent être ignorés.
- Les classes Odoo peuvent changer lors d'une mise à jour du thème, mais le JSON-LD semble plus stable.
- Un scraper futur devra rester limité aux pages produit suivies manuellement, sans crawl catalogue.

## Décision finale pré-scraper

Décision : prêt à coder

Raison :

- 3 pages produit pertinentes ont été accessibles sans headless browser.
- Les cas `InStock` et `OutOfStock` sont différenciables proprement via JSON-LD.
- Le titre et le prix sont détectables via JSON-LD.
- Les snapshots locaux sont disponibles pour tests unitaires.
- Aucun anti-bot/captcha/403 n'a été observé.
- La source est BE-first et très pertinente pour CardSnip.

Condition importante : coder un scraper V1 TCG PokAlex limité aux pages produit Odoo simples, priorisant JSON-LD. Ne pas le brancher via `ShopifyProductScraper` tel quel.

## Décision d'implémentation V1

Statut : prêt à coder V1 limitée

Périmètre :

- pages produit Odoo simples uniquement ;
- parsing prioritaire via JSON-LD ;
- fallback Odoo léger ;
- pas de crawl catalogue ;
- pas de panier ;
- pas de checkout ;
- pas de headless browser.

scraper_key :

```txt
tcg_pokalex
```

Statut seed actuel :

```txt
integration_status = functional
difficulty = medium
priority = high
notes = Fonctionnel uniquement pour TcgPokalexScraper V1 : pages produit Odoo simples, parsing JSON-LD prioritaire, pas de crawl catalogue.
```
