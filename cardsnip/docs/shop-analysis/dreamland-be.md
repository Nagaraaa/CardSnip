# Dreamland BE - Analyse pre-scraper

## Identite boutique

- Nom : Dreamland BE
- URL du site : https://www.dreamland.be
- Type : retailer
- Pays : BE
- Priorite CardSnip : high
- Difficulte estimee : medium
- Statut actuel : to_analyze
- scraper_key actuel : not_configured
- Positionnement CardSnip : source BE-first retail pertinente pour un acheteur belge, surtout si les frais de port et disponibilites sont fiables.
- Technologie detectee : autre / unknown

## Presence dans CardSnip

Dreamland BE est deja present dans le seed et dans la DB locale avec :

```txt
name = Dreamland BE
url = https://www.dreamland.be
country = BE
type = retailer
priority = high
difficulty = unknown
integration_status = to_analyze
scraper_key = not_configured
trusted = true
```

Le `scraper_key` reste volontairement `not_configured`. Aucun scraper Dreamland BE n'a ete code dans cette passe.

## Limites connues

- Les pages produit publiques sont accessibles sans challenge anti-bot evident.
- Les pages analysees exposent un JSON-LD Product exploitable.
- Les trois pages produit sealed analysees sont toutes en rupture / temporairement epuisees.
- Aucun cas sealed disponible n'a ete confirme pendant cette passe.
- Une URL produit FR booster a coupe la connexion lors d'une tentative, mais d'autres pages produit ont ete accessibles.
- Dreamland ne semble pas etre Shopify dans les HTML observes ; il expose toutefois un JSON-LD compatible avec la logique commune.

## Analyse multi-pages

### Page 1

- URL : https://www.dreamland.be/fr/produits/pokemon-me-2-5-heros-transcendants-bundle-6-boosters-fr/02371634
- Type produit : bundle
- Prix detectable : oui, JSON-LD `offers.price = 35.99`
- Stock detectable : oui, JSON-LD `offers.availability = https://schema.org/OutOfStock`
- Bouton panier : pas de bouton panier achetable observe ; bouton notification stock `Tenez-moi au courant`
- Texte rupture : `Temporairement epuise en ligne`
- JSON-LD Product : oui
- Selecteur titre candidat : JSON-LD Product `name`, fallback `h1`
- Selecteur prix candidat : JSON-LD `offers.price`
- Selecteur stock candidat : JSON-LD `offers.availability`, fallback `.order-actions-main__heading__title`
- Donnees structurees : JSON-LD Product + Offer
- Options / variantes : aucune variante evidente dans le HTML observe
- Notes : page sealed pertinente, mais rupture confirmee.

Snapshot :

```txt
docs/shop-analysis/snapshots/dreamland-be-product-sample-1.html
```

### Page 2

- URL : https://www.dreamland.be/fr/produits/pokemon-me-03-equilibre-parfait-elite-trainer-box/02356174
- Type produit : ETB
- Prix detectable : oui, JSON-LD `offers.price = 59.99`
- Stock detectable : oui, JSON-LD `offers.availability = https://schema.org/OutOfStock`
- Bouton panier : pas de bouton panier achetable observe ; bouton notification stock `Tenez-moi au courant`
- Texte rupture : `Temporairement epuise en ligne`
- JSON-LD Product : oui
- Selecteur titre candidat : JSON-LD Product `name`, fallback `h1`
- Selecteur prix candidat : JSON-LD `offers.price`
- Selecteur stock candidat : JSON-LD `offers.availability`, fallback `.order-actions-main__heading__title`
- Donnees structurees : JSON-LD Product + Offer
- Options / variantes : aucune variante evidente dans le HTML observe
- Notes : page ETB pertinente, mais rupture confirmee.

Snapshot :

```txt
docs/shop-analysis/snapshots/dreamland-be-product-sample-2.html
```

### Page 3

- URL : https://www.dreamland.be/nl/producten/pokemon-oinkologne-ex-box/01742428
- Type produit : coffret
- Prix detectable : oui, JSON-LD `offers.price = 25.99`
- Stock detectable : oui, JSON-LD `offers.availability = https://schema.org/OutOfStock`
- Bouton panier : pas de bouton panier achetable observe ; bouton notification stock `Hou me op de hoogte`
- Texte rupture : `Tijdelijk uitverkocht`
- JSON-LD Product : oui
- Selecteur titre candidat : JSON-LD Product `name`, fallback `h1`
- Selecteur prix candidat : JSON-LD `offers.price`
- Selecteur stock candidat : JSON-LD `offers.availability`, fallback `.order-actions-main__heading__title`
- Donnees structurees : JSON-LD Product + Offer
- Options / variantes : aucune variante evidente dans le HTML observe
- Notes : page coffret pertinente, mais rupture confirmee.

Snapshot :

```txt
docs/shop-analysis/snapshots/dreamland-be-product-sample-3.html
```

## Compatibilite ShopifyProductScraper

- Compatible probable : oui, mais a confirmer avec un cas disponible
- Raison : Dreamland ne semble pas etre Shopify, mais les pages produit analysees exposent un JSON-LD Product compatible avec la logique principale de `ShopifyProductScraper`.
- Champs JSON-LD detectes :
  - Product `name`
  - Offer `price`
  - Offer `priceCurrency`
  - Offer `availability`
- Disponibilite observee :
  - `https://schema.org/OutOfStock`
- Fallbacks necessaires :
  - `h1` pour le titre si JSON-LD absent
  - `.order-actions-main__heading__title` pour confirmer les textes `Temporairement epuise en ligne`, `Tijdelijk uitverkocht`, etc.
- Limites :
  - aucun cas `InStock` ou `PreOrder` n'a ete observe sur un produit Pokemon sealed ;
  - pas de fallback Shopify `pickup-availability` observe ;
  - si les pages disponibles utilisent une structure differente, il faudra l'analyser avant codage.

## Comparaison des selecteurs

- Titre :
  - Candidat principal : JSON-LD Product `name`
  - Fallback : `h1`
  - Stabilite apparente : bonne sur les 3 pages

- Prix :
  - Candidat principal : JSON-LD `offers.price`
  - `og:price:amount` absent sur les pages observees
  - Stabilite apparente : bonne via JSON-LD

- Stock :
  - Candidat principal : JSON-LD `offers.availability`
  - Valeur observee : `https://schema.org/OutOfStock`
  - Stabilite apparente : bonne pour les cas rupture

- Disponibilite :
  - `.order-actions-main__heading__title` contient les textes de rupture
  - Exemples : `Temporairement epuise en ligne`, `Tijdelijk uitverkocht`

- Bouton panier :
  - Aucun bouton panier achetable observe sur les trois pages en rupture
  - Boutons de notification stock observes : `Tenez-moi au courant`, `Hou me op de hoogte`

- JSON-LD / meta :
  - JSON-LD Product present sur les trois pages
  - `og:title` present
  - `og:price:amount` absent
  - `product:availability` absent

## Robots.txt, conditions et protection

Robots.txt accessible :

```txt
https://www.dreamland.be/robots.txt
```

Constats :

- `User-agent: *` est globalement `Allow: /`.
- Certaines pages de recherche, filtres, compte et URLs avec query params sont disallow.
- Les pages produit simples analysees sont accessibles.
- Aucun challenge anti-bot evident n'a ete observe.

Conditions d'utilisation :

- Une tentative d'acces a `/fr/cgv` a coupe la connexion.
- Conditions non analysees dans cette passe.

## Risques identifies

- Aucun cas disponible Pokemon sealed confirme.
- La differenciation `InStock` / `OutOfStock` est validee techniquement, mais le cas `InStock` observe concerne un accessoire Pokemon/TCG, pas un produit sealed.
- Dreamland est un retailer plus gros, potentiellement plus variable qu'une boutique Shopify simple.
- Les pages FR/NL peuvent avoir des libelles differents, il faudra normaliser uniquement via JSON-LD en priorite.
- Certaines URLs ou endpoints de recherche sont disallow dans robots.txt ; ne pas crawler la recherche.

## Analyse disponibilite

### Page disponible analysee

- URL : https://www.dreamland.be/fr/produits/ultra-pro-pokemon-mega-evolution-a4-portfolio-a-9-pochettes-me03-equilibre-parfait/02355313
- Produit : Ultra Pro - Pokemon - Mega-Evolution - A4 Portfolio a 9 pochettes ME03 Equilibre Parfait
- Type : accessoire Pokemon/TCG, pas un produit sealed
- Prix detectable : oui, JSON-LD `offers.price = 15.99`
- Stock detectable : oui, JSON-LD `offers.availability = https://schema.org/InStock`
- JSON-LD availability : `https://schema.org/InStock`
- Texte disponibilite visible : `Delai de livraison: 1-3 jours ouvrables`
- Bouton panier : formulaire `add_to_cart_item` present, bouton actif detecte dans la zone `order-actions-main`
- Meta tags : `og:title` present ; `og:price:amount` absent ; `product:availability` absent
- Classes / attributs utiles :
  - `section.order-actions-main[data-main-order-actions]`
  - `.order-actions-main__stock-status`
  - `[data-product-stock-label]`
  - `form[data-component="cart/add-to-cart-action-form"]`
- Differences avec page OutOfStock :
  - page disponible : JSON-LD `InStock`, texte delai de livraison, formulaire panier actif ;
  - pages rupture : JSON-LD `OutOfStock`, texte `Temporairement epuise en ligne` / `Tijdelijk uitverkocht`, bouton notification stock.
- Notes : ce cas valide le signal technique `InStock` sur Dreamland, mais pas encore sur un produit Pokemon sealed.

Snapshot :

```txt
docs/shop-analysis/snapshots/dreamland-be-product-in-stock.html
```

### Conclusion disponibilite

Dreamland expose bien la disponibilite en JSON-LD :

```txt
https://schema.org/InStock
https://schema.org/OutOfStock
```

Le signal `InStock` est fiable sur la page disponible analysee, et les fallbacks HTML sont coherents. En revanche, aucun produit Pokemon sealed disponible n'a ete confirme pendant cette passe. La validation metier CardSnip reste donc incomplete pour les produits sealed.

## Decision finale pre-scraper

Decision :

```txt
a revoir
```

Raison :

- Points positifs :
  - au moins 3 pages produit Pokemon sealed accessibles ;
  - un cas Dreamland disponible a ete analyse sur un accessoire Pokemon/TCG ;
  - titre detectable proprement ;
  - prix detectable proprement ;
  - stock/availability detectable proprement via JSON-LD ;
  - pas de headless browser necessaire pour les pages analysees ;
  - pas de blocage anti-bot evident ;
  - JSON-LD compatible avec une base type `ShopifyProductScraper`.

- Point bloquant pour `pret a coder` :
  - aucun produit Pokemon sealed disponible n'a ete confirme ;
  - le cas `InStock` est valide techniquement, mais pas encore sur un produit sealed ;
  - il manque donc une comparaison disponible vs indisponible sur le coeur de cible CardSnip.

## Recommandation

Ne pas coder de scraper Dreamland BE maintenant.

Prochaine action recommandee :

1. Trouver une page Dreamland Pokemon sealed reellement disponible.
2. Sauvegarder un snapshot disponible.
3. Verifier si JSON-LD passe a `https://schema.org/InStock` ou equivalent.
4. Si oui, envisager un `DreamlandScraper` V1 base sur JSON-LD, potentiellement en reutilisant la logique commune de `ShopifyProductScraper` malgre le nom Shopify.
