# Outpost Brussels - Analyse pre-scraper

## Identite boutique

- Nom : Outpost Brussels
- URL du site : https://outpostbrussels.be
- Type : tcg_specialist
- Pays : BE
- Priorite CardSnip : high
- Difficulte estimee : unknown, probablement easy/medium pour une V1 limitee
- Statut actuel : to_analyze
- scraper_key actuel : not_configured
- Positionnement CardSnip : source BE-first prioritaire pour un utilisateur belge

## Presence dans CardSnip

Outpost Brussels est deja present dans le seed et dans la DB locale avec :

```txt
name = Outpost Brussels
url = https://outpostbrussels.be
country = BE
type = tcg_specialist
priority = high
difficulty = unknown
integration_status = to_analyze
scraper_key = not_configured
trusted = true
```

Le `scraper_key` reste volontairement `not_configured`. Aucun scraper reel n'a ete code dans cette passe.

## Limites connues

- Analyse limitee a 3 pages produit publiques.
- Les 3 pages analysees sont en stock ou en precommande avec bouton panier actif.
- Aucune page Pokemon sealed en rupture n'a ete identifiee de maniere fiable pendant cette passe limitee.
- Les frais de port vers Belgique restent a verifier dans une logique Deal Score.
- Le site semble etre une boutique Shopify.
- Ne pas automatiser panier, checkout ou paiement.

## Analyse multi-pages

### Page 1

- URL : https://outpostbrussels.be/products/pokemon-me04-chaos-ascendant-display-boosters-36-fr
- Nom produit : Pokemon - ME04 Chaos Ascendant - Display Boosters (36) - FR
- Type produit : display
- Prix visible : oui, 204,99 EUR
- Stock detectable : oui via JSON-LD `offers.availability = http://schema.org/InStock`
- Bouton panier : oui, texte `Ajouter au panier`
- Texte rupture : badge `Epuisé` present dans le template HTML, mais non actif pour ce produit car le bouton panier n'est pas disabled et JSON-LD indique InStock
- Selecteur titre candidat : `main h1` ou JSON-LD `@type=Product.name`
- Selecteur prix candidat : JSON-LD `offers.price`, fallback `meta[property="og:price:amount"]`, fallback `.price-item--regular`
- Selecteur stock candidat : JSON-LD `offers.availability`, fallback `<pickup-availability available ...>`
- Donnees structurees : oui, JSON-LD Product + Offer
- Options / variantes : aucune variante visible, pas de `variant-selects`, `variant-radios` ou `variant-picker`; `data-has-only-default-variant="true"`
- Besoin headless browser : non pour titre/prix/availability
- Notes : page tres exploitable pour une V1 limitee

Snapshot :

```txt
docs/shop-analysis/snapshots/outpost-product-sample-1.html
```

### Page 2

- URL : https://outpostbrussels.be/products/pokemon-me05-tripack-boosters-nuit-noire-opermine-fr
- Nom produit : Pokemon - ME05 - Tripack Boosters Nuit Noire - Opermine - FR
- Type produit : tripack
- Prix visible : oui, 19,99 EUR
- Stock detectable : oui via JSON-LD `offers.availability = http://schema.org/InStock`
- Bouton panier : oui, texte `Ajouter au panier`
- Texte rupture : badge `Epuisé` present dans le template HTML, mais non actif pour ce produit car le bouton panier n'est pas disabled et JSON-LD indique InStock
- Selecteur titre candidat : `main h1` ou JSON-LD `@type=Product.name`
- Selecteur prix candidat : JSON-LD `offers.price`, fallback `meta[property="og:price:amount"]`, fallback `.price-item--regular`
- Selecteur stock candidat : JSON-LD `offers.availability`, fallback `<pickup-availability available ...>`
- Donnees structurees : oui, JSON-LD Product + Offer
- Options / variantes : aucune variante visible, pas de `variant-selects`, `variant-radios` ou `variant-picker`; `data-has-only-default-variant="true"`
- Besoin headless browser : non pour titre/prix/availability
- Notes : page tres coherente avec la page 1

Snapshot :

```txt
docs/shop-analysis/snapshots/outpost-product-sample-2.html
```

### Page 3

- URL : https://outpostbrussels.be/products/pokemon-me3-etb-equilibre-parfait-fr
- Nom produit : Pokemon - ME3 - Coffret Dresseur d'Elite Equilibre Parfait - FR
- Type produit : ETB
- Prix visible : oui, 62,99 EUR
- Stock detectable : oui via JSON-LD `offers.availability = http://schema.org/InStock`
- Bouton panier : oui, texte `Ajouter au panier`
- Texte rupture : badge `Epuisé` present dans le template HTML, mais non actif pour ce produit car le bouton panier n'est pas disabled et JSON-LD indique InStock
- Selecteur titre candidat : `main h1` ou JSON-LD `@type=Product.name`
- Selecteur prix candidat : JSON-LD `offers.price`, fallback `meta[property="og:price:amount"]`, fallback `.price-item--regular`
- Selecteur stock candidat : JSON-LD `offers.availability`, fallback `<pickup-availability available ...>`
- Donnees structurees : oui, JSON-LD Product + Offer
- Options / variantes : aucune variante visible, pas de `variant-selects`, `variant-radios` ou `variant-picker`; `data-has-only-default-variant="true"`
- Besoin headless browser : non pour titre/prix/availability
- Notes : page coherent avec les deux autres pages

Snapshot :

```txt
docs/shop-analysis/snapshots/outpost-product-sample-3.html
```

## Comparaison des selecteurs

- Titre :
  - Candidat principal : JSON-LD Product `name`
  - Fallback : `main h1`
  - Stabilite apparente : bonne

- Prix :
  - Candidat principal : JSON-LD Product `offers.price`
  - Fallback : `meta[property="og:price:amount"]`
  - Fallback visuel : `#price-template--25513621487950__main .price-item--regular`
  - Stabilite apparente : bonne via JSON-LD et meta OpenGraph

- Stock :
  - Candidat principal : JSON-LD Product `offers.availability`
  - Valeur observee : `http://schema.org/InStock`
  - Fallback : balise `<pickup-availability available ...>`
  - Stabilite apparente : prometteuse, mais cas rupture non observe

- Disponibilite :
  - Bouton panier actif et non disabled sur les 3 pages
  - Texte `Ajouter au panier` visible
  - Badge `Epuisé` present dans le template HTML meme quand le produit est en stock, donc a ne pas utiliser seul

- Bouton panier :
  - Candidat : `button[name="add"]`
  - Attention : ne pas l'utiliser comme source principale si JSON-LD est present

- JSON-LD / meta :
  - JSON-LD Product present sur les 3 pages
  - `offers.price`, `offers.priceCurrency`, `offers.availability` presents
  - `meta[property="og:price:amount"]` et `meta[property="og:price:currency"]` presents

## Robots.txt, agents et conditions

Robots.txt accessible :

```txt
https://outpostbrussels.be/robots.txt
```

Constats :

- Les pages publiques produit/collection sont globalement autorisees.
- Les zones admin, cart, checkout, account et endpoints transactionnels sont bloquees ou a eviter.
- Le robots.txt indique que les agents doivent utiliser UCP/MCP ou Shop pour les flux de cart/checkout.
- Le test CardSnip doit rester limite a la lecture de pages produit publiques.
- Aucun checkout, ajout panier ou achat automatise ne doit etre effectue.

Agents instructions accessibles :

```txt
https://outpostbrussels.be/agents.md
```

Conditions accessibles :

```txt
https://outpostbrussels.be/policies/terms-of-service
```

## Risques identifies

- Badge `Epuisé` present dans le template meme pour les produits en stock : risque de faux negatif si le scraper lit le texte brut.
- Prix visuel avec virgule, mais JSON-LD donne un prix decimal propre.
- Le site etant Shopify, certains IDs comme `price-template--...` peuvent changer selon le theme ou la section.
- Le respect technique impose de ne pas toucher aux endpoints cart/checkout et de ne pas automatiser d'achat.
- Il faudra verifier les frais de livraison Belgique avant de transformer un prix Outpost en deal definitif.

## Analyse disponibilite avancee

### Page A - Stock a verifier

- URL : https://outpostbrussels.be/products/pokemon-collection-speciale-accessoires-evolutions-prismatiques-ev8-5-fr?_pos=1&_fid=27609c292&_ss=c
- Statut attendu : produit indique comme en stock ou a verifier
- Statut reellement observe : epuise / indisponible
- Product.name : Pokemon - Collection Speciale Accessoires - Evolutions Prismatiques - FR
- offers.price : 44.99
- offers.availability : `http://schema.org/OutOfStock`
- meta availability : non present (`product:availability` absent)
- meta price : `og:price:amount = 44,99`
- pickup-availability : present, sans attribut `available`
- bouton panier : present, disabled, texte `Epuisé`
- texte visible : `Epuisé`, `Non disponible` present dans les chaines/theme
- conclusion : le statut reel est clairement OutOfStock. Le JSON-LD, le bouton disabled et l'absence de `pickup-availability available` convergent.

Snapshot :

```txt
docs/shop-analysis/snapshots/outpost-product-stock-check.html
```

### Page B - Precommande

- URL : https://outpostbrussels.be/products/pokemon-me05-case-display-boosters-nuit-noire-fr
- Statut attendu : precommande disponible
- Statut reellement observe : disponible a l'achat/precommande
- Product.name : Pokemon - ME05 - Case Display Boosters Nuit Noire - FR
- offers.price : 1229.99
- offers.availability : `http://schema.org/InStock`
- meta availability : non present (`product:availability` absent)
- meta price : `og:price:amount = 1.229,99`
- pickup-availability : present avec attribut `available`
- bouton panier : present, non disabled, texte `Ajouter au panier`
- texte visible : `Ajouter au panier`; `precommande` apparait dans le contenu/theme
- conclusion : la precommande disponible est exposee comme `InStock`. Pour Outpost V1, `InStock` doit etre considere comme achetable/suivable, meme si le libelle produit indique une precommande.

Snapshot :

```txt
docs/shop-analysis/snapshots/outpost-product-preorder.html
```

### Page C - Precommande epuisee

- URL : https://outpostbrussels.be/products/pokemon-me05-display-boosters-nuit-noire-36-fr
- Statut attendu : precommande epuisee / indisponible
- Statut reellement observe : epuise / indisponible
- Product.name : Pokemon - ME05 - Display Boosters Nuit Noire (36) - FR
- offers.price : 204.99
- offers.availability : `http://schema.org/OutOfStock`
- meta availability : non present (`product:availability` absent)
- meta price : `og:price:amount = 204,99`
- pickup-availability : present, sans attribut `available`
- bouton panier : present, disabled, texte `Epuisé`
- texte visible : `Epuisé`, `Non disponible` present dans les chaines/theme
- conclusion : la precommande epuisee est correctement differenciable de la precommande disponible via JSON-LD, bouton disabled et pickup availability.

Snapshot :

```txt
docs/shop-analysis/snapshots/outpost-product-preorder-out-of-stock.html
```

## Strategie de detection stock V1

Source principale :

1. JSON-LD Product `offers.availability`
   - `http://schema.org/InStock` => `in_stock`
   - `http://schema.org/OutOfStock` => `out_of_stock`

Fallbacks :

2. `meta[property="og:price:amount"]` uniquement pour le prix si JSON-LD prix absent.
3. `<pickup-availability available ...>` comme confirmation positive de disponibilite.
4. `button[name="add"] disabled` + texte `Epuisé` comme confirmation negative si JSON-LD absent.
5. `main h1` comme fallback titre si JSON-LD Product absent.

Signaux a ignorer ou utiliser avec prudence :

- Badge `.price__badge-sold-out` / texte `Epuisé` seul : il existe dans le template meme quand le produit est disponible.
- Texte global `Non disponible` : peut venir des chaines JavaScript du theme.
- IDs de section Shopify comme `price-template--...` : utiles en fallback, mais moins stables que JSON-LD.
- Bouton panier seul : utile en fallback, mais pas source principale si JSON-LD est present.

## Differences observees

- Produit/precommande disponible :
  - JSON-LD `offers.availability = http://schema.org/InStock`
  - bouton panier non disabled
  - texte bouton `Ajouter au panier`
  - `<pickup-availability available ...>`

- Produit/precommande epuise :
  - JSON-LD `offers.availability = http://schema.org/OutOfStock`
  - bouton panier disabled
  - texte bouton `Epuisé`
  - `<pickup-availability ...>` present mais sans attribut `available`

## Decision finale pre-scraper

Decision :

```txt
pret a coder
```

Raison :

- Au moins 2 pages produit pertinentes sont accessibles, et 6 pages Outpost ont maintenant ete observees au total.
- Le titre est detectable proprement via JSON-LD Product `name`, fallback `main h1`.
- Le prix est detectable proprement via JSON-LD `offers.price`, fallback `og:price:amount`.
- La disponibilite est detectable proprement via JSON-LD `offers.availability`.
- Un cas disponible/precommande disponible et deux cas indisponibles sont differenciables.
- Le fallback pickup/button confirme les statuts JSON-LD.
- Pas besoin de navigateur headless pour les champs V1.
- Pas de blocage anti-bot evident pendant les analyses limitees.
- La strategie V1 peut rester limitee et sure : pages produit simples Shopify, lecture HTML publique, aucun panier/checkout.

## Recommandation

Outpost Brussels peut devenir le premier scraper BE-first V1.

Prochaine action recommandee :

1. Ne pas coder plusieurs boutiques.
2. Coder uniquement `OutpostScraper` V1 limite aux pages produit simples.
3. Utiliser JSON-LD comme source principale.
4. Ajouter des tests sur les snapshots crees.
5. Garder `scraper_key = not_configured` jusqu'a validation du scraper par tests, puis seulement ensuite passer a `outpost_brussels`.

Ne pas automatiser panier, checkout ou achat.

## Decision d'implementation V1

Statut : pret a coder V1 limitee

Perimetre :

- pages produit Shopify simples uniquement ;
- parsing prioritaire via JSON-LD ;
- titre via JSON-LD Product `name`, fallback `main h1` ;
- prix via JSON-LD `offers.price`, fallback `meta[property="og:price:amount"]` ;
- stock via JSON-LD `offers.availability` ;
- pas de crawl catalogue ;
- pas de panier ;
- pas de checkout ;
- pas de compte utilisateur ;
- pas de navigateur headless ;
- pas de contournement anti-bot.

scraper_key :

```txt
outpost_brussels
```

Implementation :

- fichier scraper : `scraper/scrapers/outpost_brussels.py` ;
- registry : `SCRAPER_REGISTRY["outpost_brussels"] = OutpostBrusselsScraper` ;
- tests : `scraper/tests/test_outpost_brussels_scraper.py` ;
- statut seed : `integration_status = functional`.

Outpost Brussels est passe en `functional` apres validation du flux complet `tracked_product -> scraper -> SQLite -> API -> dashboard`.

Note obligatoire :

```txt
Fonctionnel uniquement pour OutpostBrusselsScraper V1 : pages produit Shopify simples, parsing JSON-LD prioritaire, pas de crawl catalogue.
```
