# CardSnip

CardSnip est un MVP local pour surveiller des produits TCG/Pokemon sealed, suivre prix et stock, creer des observations, generer des alertes et preparer une future evolution SaaS.

Ce projet n'est plus seulement une maquette frontend. Il dispose maintenant d'un flux local fonctionnel :

```txt
Catalogue / tracked_products
-> FastAPI locale
-> SQLite locale
-> scraper registry
-> scrapers Python
-> price_observations
-> alerts
-> dashboard
-> shops/status
```

## Etat Actuel

CardSnip contient aujourd'hui :

- un frontend Next.js / TypeScript / TailwindCSS ;
- une API locale FastAPI ;
- une base SQLite locale ;
- un scraper registry Python ;
- une fake shop locale pour tests controles ;
- plusieurs vrais scrapers V1 valides en flux local ;
- une page Boutiques avec sante admin via `/shops/status` ;
- des checks manuels admin depuis `/products` et `/shops` ;
- une strategie de sources BE-first ;
- un mode demo explicite via `NEXT_PUBLIC_CARDSNIP_DEMO_MODE=true`.

Ce qui n'est pas branche maintenant :

- Supabase ;
- auth utilisateur ;
- Stripe ;
- scheduler/worker production ;
- crawl catalogue ;
- marketplaces comme source d'achat recommandee ;
- scraping anti-bot ou contournement Cloudflare/captcha.

## Architecture

```txt
web/ Next.js
  -> FastAPI locale
  -> SQLite locale
  <- scraper Python
  <- fake shop / boutiques analysees
```

Fichiers backend importants :

```txt
scraper/api.py
scraper/storage/schema.sql
scraper/storage/database.py
scraper/storage/repositories.py
scraper/services/tracked_check_service.py
scraper/scrapers/base.py
scraper/scrapers/registry.py
```

Fichiers frontend importants :

```txt
web/src/app/
web/src/components/pages/
web/src/lib/cardsnip-api.ts
web/src/types/local-api.ts
```

## Stack

Frontend :

- Next.js App Router
- TypeScript
- TailwindCSS
- Recharts pour le graphique de prix

Backend local :

- Python
- FastAPI
- SQLite
- `urllib` / parsers HTML standard pour les scrapers V1

Futur SaaS, non branche :

- Supabase
- Vercel
- Auth
- Stripe

## Boutiques Et Scrapers

| Boutique | Statut | scraper_key | Techno / notes |
| --- | --- | --- | --- |
| Fake Shop | functional | `fake_shop` | Source locale de test |
| Otakuland-Manga Passion | functional | `otakuland` | Pages produit simples sans options obligatoires |
| Outpost Brussels | functional | `outpost_brussels` | Shopify JSON-LD via `ShopifyProductScraper` |
| TCG PokAlex | functional | `tcg_pokalex` | Odoo / JSON-LD |
| Strategy Games | functional | `strategy_games` | WooCommerce / JSON-LD, stock ou precommandes avec prix |
| Dreamland BE | a revoir | `not_configured` | JSON-LD prometteur, sealed InStock non valide |
| SOD Games | a eviter MVP | `not_configured` | Cloudflare / 403 |

Une boutique passe `functional` uniquement apres validation du flux complet :

```txt
tracked_product
-> scraper_key
-> registry
-> scraper
-> SQLite
-> FastAPI
-> dashboard / shops status
```

## Strategie BE-First

CardSnip est pense d'abord pour un utilisateur belge.

Pourquoi :

- une boutique francaise peut afficher un bon prix mais devenir mauvaise avec les frais de port vers la Belgique ;
- le futur Deal Score devra prendre en compte le prix total reel : prix produit + frais de port estimes ;
- les boutiques BE-first sont donc prioritaires.

Sources BE-first deja validees ou analysees :

- Outpost Brussels : functional ;
- TCG PokAlex : functional ;
- Strategy Games : functional ;
- Dreamland BE : a revoir ;
- SOD Games : a eviter MVP.

Marketplaces non recommandees pour l'achat CardSnip MVP :

- eBay ;
- Vinted ;
- Leboncoin ;
- 2ememain ;
- Facebook Marketplace.

Cardmarket reste une reference marche possible plus tard, pas une source d'achat MVP.

## API FastAPI

Base URL locale :

```txt
http://localhost:8000
```

Endpoints actuels :

| Methode | Route | Role |
| --- | --- | --- |
| GET | `/health` | Verifier que l'API repond |
| GET | `/products` | Lister le catalogue produit |
| POST | `/products` | Creer un produit catalogue |
| GET | `/shops` | Lister les boutiques |
| POST | `/shops` | Creer une boutique locale |
| GET | `/shops/status` | Lire la sante admin des boutiques/scrapers |
| GET | `/tracked-products` | Lister les produits surveilles |
| POST | `/tracked-products` | Creer un suivi boutique + URL + target price |
| GET | `/observations` | Lister les observations prix/stock |
| GET | `/observations/latest` | Lister la derniere observation par suivi |
| GET | `/alerts` | Lister les alertes |
| POST | `/scraper/run` | Lancer manuellement les scrapers actifs |
| POST | `/tracked-products/{tracked_product_id}/check` | Tester un seul produit suivi |
| POST | `/shops/{shop_id}/check` | Tester les produits suivis actifs d'une boutique |

`/shops/status` sert a afficher :

- `scraper_key` ;
- `integration_status` ;
- dernier check ;
- dernier prix ;
- dernier stock ;
- nombre d'observations recentes ;
- nombre d'alertes recentes ;
- `health_status`.

### Checks Admin Manuels

CardSnip permet maintenant de tester les scrapers depuis l'interface admin, sans curl ni PowerShell.

Depuis `/products` :

- chaque produit surveille reel affiche `Tester maintenant` ;
- le bouton appelle `POST /tracked-products/{tracked_product_id}/check` ;
- le check lance uniquement le scraper associe au suivi ;
- le resultat s'affiche dans la carte produit :
  - OK ou erreur ;
  - prix detecte ;
  - stock detecte ;
  - observation creee oui/non ;
  - nombre d'alertes creees ;
  - messages d'erreur eventuels.

Depuis `/shops` :

- la vue par defaut affiche les boutiques `functional` ;
- des filtres avec compteurs permettent de voir :
  - Fonctionnelles ;
  - En cours ;
  - A analyser ;
  - A revoir ;
  - A eviter / plus tard ;
  - Toutes ;
- les boutiques `functional` affichent `Tester cette boutique` ;
- le bouton appelle `POST /shops/{shop_id}/check` ;
- le check lance les produits suivis actifs de cette boutique uniquement.

Exemple de reponse `POST /tracked-products/{id}/check` :

```json
{
  "tracked_product_id": 7,
  "shop_name": "Strategy Games",
  "source_url": "https://strategygames.be/blister-me02-flammes-fantasmagoriques-fr/",
  "price": 7.5,
  "stock_status": "in_stock",
  "observation_created": true,
  "alerts_created": 0,
  "errors": 0,
  "messages": []
}
```

Exemple de reponse `POST /shops/{id}/check` :

```json
{
  "shop_id": 15,
  "shop_name": "Strategy Games",
  "tracked_products": 1,
  "observations": 1,
  "alerts": 0,
  "errors": 0,
  "messages": []
}
```

Important :

- une erreur scraper ne doit pas casser l'API ;
- aucune observation incomplete ne doit etre creee si le scraper echoue ;
- `ProductCheck.price` reste non nullable cote scraper ;
- `price: null` est reserve a la reponse API d'erreur.

## Ajouter Un Suivi

Methode via API :

1. Creer ou choisir un produit catalogue.
2. Choisir une boutique.
3. Creer un `tracked_product` avec :
   - `product_id`
   - `shop_id`
   - `source_url`
   - `target_price`
   - `active = true`
4. Lancer :

```powershell
Invoke-WebRequest -UseBasicParsing -Method Post "http://localhost:8000/scraper/run"
```

5. Verifier :

```powershell
Invoke-WebRequest -UseBasicParsing "http://localhost:8000/observations/latest"
Invoke-WebRequest -UseBasicParsing "http://localhost:8000/alerts"
Invoke-WebRequest -UseBasicParsing "http://localhost:8000/shops/status"
```

Methode via UI :

- `/catalogue` permet de creer/choisir un produit catalogue ;
- l'action `Creer un suivi` permet de relier produit catalogue, boutique, URL source, target price et statut actif ;
- `/products` permet de tester un suivi reel avec `Tester maintenant` ;
- `/shops` permet de tester une boutique functional avec `Tester cette boutique` ;
- le dashboard et les pages admin utilisent l'API locale quand elle est disponible.

## Mode Demo Frontend

Les mocks admin ne doivent pas etre silencieux.

Par defaut :

- `/dashboard`, `/products`, `/shops` et `/alerts` privilegient les donnees reelles FastAPI/SQLite ;
- si l'API est indisponible, un message clair est affiche ;
- si l'API repond mais que la DB est vide, un etat vide explicite est affiche.

Pour afficher volontairement les donnees de demonstration :

```powershell
cd "C:\Users\Nagara\Documents\New project\cardsnip\web"
$env:NEXT_PUBLIC_CARDSNIP_DEMO_MODE="true"
npm.cmd run dev -- --port 3000
```

Le mode demo est uniquement un outil de presentation locale. Il ne doit pas masquer une API down comme si les donnees etaient reelles.

## Scraper Registry

Chaque scraper herite de :

```txt
scraper/scrapers/base.py
```

Le registry se trouve dans :

```txt
scraper/scrapers/registry.py
```

Scraper keys actuelles :

```python
fake_shop
otakuland
outpost_brussels
tcg_pokalex
strategy_games
```

`not_configured` signifie : boutique visible dans CardSnip, mais aucun scraper branche.

## Bases Reutilisables

### ShopifyProductScraper

Fichier :

```txt
scraper/scrapers/shopify_product.py
```

Role :

- base interne pour pages produit Shopify simples ;
- JSON-LD prioritaire ;
- utilise par Outpost Brussels ;
- pas de `scraper_key` public ;
- chaque boutique Shopify validee doit garder une classe dediee pour ses limites/tests.

### StrategyGamesScraper

Fichier :

```txt
scraper/scrapers/strategy_games.py
```

Perimetre V1 :

- pages produit WooCommerce simples ;
- produits en stock avec prix ;
- precommandes avec prix ;
- JSON-LD prioritaire ;
- fallback WooCommerce leger ;
- ruptures sans prix refusees proprement ;
- pas de crawl catalogue ;
- pas de panier ;
- pas de checkout.

## Fake Shop

Dossier :

```txt
fake-shop/
```

Lancer :

```powershell
cd "C:\Users\Nagara\Documents\New project\cardsnip\fake-shop"
python -m http.server 8080
```

Exemples :

```txt
http://localhost:8080/index.html?price=39.99&stock=in
http://localhost:8080/index.html?price=99.99&stock=out
```

## Commandes De Lancement

Initialiser SQLite :

```powershell
cd "C:\Users\Nagara\Documents\New project\cardsnip\scraper"
python scripts\init_db.py
```

Lancer FastAPI :

```powershell
cd "C:\Users\Nagara\Documents\New project\cardsnip\scraper"
python -m uvicorn api:app --reload --port 8000
```

Lancer Next.js :

```powershell
cd "C:\Users\Nagara\Documents\New project\cardsnip\web"
npm.cmd install
npm.cmd run dev -- --port 3000
```

Lancer le scraper manuellement :

```powershell
cd "C:\Users\Nagara\Documents\New project\cardsnip\scraper"
python main.py
```

Lancer le scraper via API :

```powershell
Invoke-WebRequest -UseBasicParsing -Method Post "http://localhost:8000/scraper/run"
```

Tester un produit suivi depuis l'API :

```powershell
Invoke-WebRequest -UseBasicParsing -Method Post "http://localhost:8000/tracked-products/7/check"
```

Tester une boutique depuis l'API :

```powershell
Invoke-WebRequest -UseBasicParsing -Method Post "http://localhost:8000/shops/15/check"
```

URLs locales :

```txt
Frontend : http://localhost:3000
FastAPI  : http://localhost:8000
FakeShop : http://localhost:8080
```

## Tests

Depuis `scraper/` :

```powershell
python -m unittest discover -s tests -p "test_*.py" -v
python -m py_compile api.py main.py storage/database.py storage/repositories.py services/tracked_check_service.py scrapers/base.py scrapers/fake_shop.py scrapers/registry.py scrapers/otakuland.py scrapers/outpost_brussels.py scrapers/shopify_product.py scrapers/tcg_pokalex.py scrapers/strategy_games.py
```

Depuis la racine `cardsnip/` :

```powershell
.\scripts\test-end-to-end-local.ps1
```

Depuis `web/` :

```powershell
npm.cmd run lint
npm.cmd run build
```

Si un scraper n'existe pas encore dans une branche ancienne, retirer son fichier de la commande `py_compile`.

## Test End-To-End Local

Le test principal valide :

```txt
fake-shop -> scraper -> SQLite -> FastAPI -> dashboard -> alertes
```

Commande :

```powershell
cd "C:\Users\Nagara\Documents\New project\cardsnip"
.\scripts\test-end-to-end-local.ps1
```

Ce test suppose que la fake shop et FastAPI sont accessibles.

## Scenario De Test Admin

1. Initialiser SQLite :

```powershell
cd "C:\Users\Nagara\Documents\New project\cardsnip\scraper"
python scripts\init_db.py
```

2. Lancer FastAPI :

```powershell
cd "C:\Users\Nagara\Documents\New project\cardsnip\scraper"
python -m uvicorn api:app --reload --port 8000
```

3. Lancer Next.js :

```powershell
cd "C:\Users\Nagara\Documents\New project\cardsnip\web"
npm.cmd run dev -- --port 3000
```

4. Ouvrir :

```txt
http://localhost:3000/products
```

5. Cliquer sur `Tester maintenant` sur un produit suivi reel.

6. Verifier que la carte affiche :

```txt
Dernier test manuel
OK - prix - stock - observation creee - alertes
```

7. Ouvrir :

```txt
http://localhost:3000/shops
```

8. Filtrer sur `Fonctionnelles`, puis cliquer sur `Tester cette boutique`.

9. Verifier que le resultat indique :

```txt
suivis, observations, alertes, erreurs
```

## Supabase

Supabase n'est pas branche maintenant.

Etat actuel :

- SQLite sert de persistance locale ;
- un draft Supabase peut exister pour preparer le futur schema ;
- aucune auth Supabase ;
- aucun storage produit branche ;
- aucune migration SaaS active.

## Regles A Ne Pas Casser

- Pas de marketplace particuliers comme source recommandee.
- Pas de contournement Cloudflare / captcha.
- Pas de crawl catalogue pour l'instant.
- Pas de Supabase maintenant.
- Pas d'auth/Stripe maintenant.
- Pas de scheduler/worker production maintenant.
- Un scraper V1 doit rester limite, teste et documente.
- Une boutique ne passe `functional` qu'apres validation flux complet.
- Les pages avec prix introuvable doivent echouer proprement, pas creer une observation incomplete.

## Roadmap Actuelle

1. Stabiliser l'experience admin autour des checks manuels.
2. Ajouter des tests API cibles pour `/tracked-products/{id}/check` et `/shops/{id}/check`.
3. Continuer les sources BE-first fiables, une boutique a la fois.
4. Garder Dreamland BE en `a revoir` jusqu'a validation d'un produit Pokemon sealed `InStock`.
5. Ne pas integrer SOD Games au MVP a cause de Cloudflare / 403.
6. Plus tard : scheduler, Supabase, auth, Stripe, SEO.
7. Plus tard : discovery catalogue, mais pas maintenant.

## Resume Pour Un Autre Assistant IA

CardSnip est un MVP local fonctionnel Next.js + FastAPI + SQLite pour surveiller des produits TCG/Pokemon sealed. Le frontend contient dashboard, produits, details, catalogue admin, boutiques, deals, veille, alertes et compte local. Le backend local expose une API FastAPI et une base SQLite partagee avec le scraper Python.

Le flux metier reel existe : catalogue/tracked_products -> FastAPI -> SQLite -> scraper registry -> scrapers -> price_observations -> alerts -> dashboard et `/shops/status`.

Scrapers functional :

- Fake Shop : `fake_shop`
- Otakuland-Manga Passion : `otakuland`
- Outpost Brussels : `outpost_brussels`
- TCG PokAlex : `tcg_pokalex`
- Strategy Games : `strategy_games`

Sources analysees :

- Dreamland BE : a revoir, JSON-LD prometteur mais sealed InStock non valide.
- SOD Games : a eviter MVP, Cloudflare / 403.

Supabase, auth, Stripe, scheduler, workers et crawl catalogue ne sont pas branches. La strategie actuelle est BE-first. Le repo GitHub contient maintenant les scrapers functional et les checks manuels admin.

La derniere evolution ajoute les checks manuels admin :

- `/products` -> `Tester maintenant` sur un suivi reel ;
- `/shops` -> filtres de boutiques et `Tester cette boutique` sur une source functional ;
- endpoints `POST /tracked-products/{id}/check` et `POST /shops/{id}/check`.

La prochaine action saine est de stabiliser cette experience admin, puis d'ajouter des tests API dedies avant de lancer l'analyse d'une nouvelle boutique.
