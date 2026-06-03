# CardSnip

CardSnip est un MVP local d'application web pour surveiller des produits TCG/Pokemon sealed, suivre les prix et le stock, preparer des alertes, puis evoluer progressivement vers un SaaS.

Le projet est volontairement construit en deux temps :

1. **Prototype local stable** : frontend riche, fake shop, scraper simple, donnees mockees et persistance locale.
2. **Future vraie stack SaaS** : Supabase, Vercel, API backend, images produit stockees proprement, integrations autorisees.

Ce README sert de document de passation technique. Il decrit l'etat actuel exact du projet, les choix d'architecture, les limites volontaires et les prochaines etapes recommandees.

## Etat actuel du MVP

Le projet contient actuellement :

- une fake shop locale HTML/CSS/JS pour tester prix et stock ;
- un scraper Python simple qui lit la fake shop ;
- un frontend Next.js / TypeScript / TailwindCSS ;
- un dashboard SaaS dark premium ;
- des pages metier : Dashboard, Produits, Catalogue Admin, Boutiques, Deals, Veille, Alertes, Compte ;
- un graphique de prix avec Recharts ;
- un flux mocke d'ajout de produit ;
- une persistance locale via `localStorage` pour les produits ajoutes et le catalogue admin ;
- un draft de schema Supabase pret a convertir en migration plus tard.

Ce qui n'est PAS encore branche :

- pas de Supabase runtime ;
- pas d'auth utilisateur ;
- pas de Stripe ;
- pas de vraie API backend ;
- pas de scraping de vraies boutiques ;
- pas de Cardmarket, eBay, Fnac, Dealabs ou Twitter integres ;
- pas de workers, Celery, Docker ou queue system ;
- pas de stockage image distant.

## Stack technique

### Frontend

- Next.js App Router
- TypeScript
- TailwindCSS
- Recharts pour les graphiques
- State React local
- `localStorage` pour persister certains ajouts mockes

### Backend / Scraper MVP

- Python
- Architecture simple en classes
- FastAPI pour l'API locale
- SQLite pour la persistance serveur locale
- Fake shop locale comme source de test
- Alertes console
- Discord webhook optionnel via variable d'environnement

### Base de donnees future

- Supabase Postgres
- Supabase Storage pour les images produit
- RLS prevu dans le schema draft

### Deploiement futur

- Vercel pour le frontend
- Supabase pour DB + Storage
- GitHub pour versioning

## Structure du projet

```txt
cardsnip/
├── README.md
├── fake-shop/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── scraper/
│   ├── main.py
│   ├── scrapers/
│   │   ├── base.py
│   │   └── fake_shop.py
│   ├── services/
│   │   ├── alert_service.py
│   │   └── logger.py
│   ├── models/
│   │   └── product_check.py
│   ├── requirements.txt
│   └── .env.example
├── supabase/
│   ├── README.md
│   └── schema-draft.sql
└── web/
    ├── package.json
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx
    │   │   ├── dashboard/page.tsx
    │   │   ├── products/page.tsx
    │   │   ├── products/[id]/page.tsx
    │   │   ├── catalogue/page.tsx
    │   │   ├── shops/page.tsx
    │   │   ├── deals/page.tsx
    │   │   ├── watch/page.tsx
    │   │   ├── alerts/page.tsx
    │   │   └── settings/page.tsx
    │   ├── components/
    │   ├── data/
    │   └── types/
    └── ...
```

## Frontend : routes disponibles

### `/`

Page d'accueil / landing prototype.

Objectif :

- presenter CardSnip ;
- garder une experience plus marketing / theme TCG ;
- acces vers le dashboard.

### `/dashboard`

Dashboard principal CardSnip.

Contenu :

- cartes statistiques ;
- derniers bons deals ;
- alertes recentes ;
- activite des scrapers ;
- boutiques surveillees ;
- graphique de prix avec Recharts ;
- bouton d'ajout produit mocke.

Role produit :

- donner une vue globale de la surveillance ;
- comprendre rapidement les produits, alertes et economies potentielles.

### `/products`

Page de pilotage des produits surveilles.

Fonctionnalites actuelles :

- liste des produits suivis mockes ;
- recherche ;
- filtres boutique / score ;
- pause / reprise locale ;
- ajout de produit via modal ;
- target price ;
- statut `Surveille`, `A configurer`, `A verifier` ;
- persistance locale des produits ajoutes via `localStorage`.

Cle `localStorage` :

```txt
cardsnip.local-products.v1
```

Important :

- les produits ajoutes localement ne sont pas encore envoyes au scraper ;
- ils disparaitront si le `localStorage` du navigateur est nettoye ;
- cette logique est faite pour simuler le futur flux backend.

### `/products/[id]`

Page detail produit.

Contenu :

- fiche produit ;
- prix actuel ;
- target price ;
- stock ;
- historique de prix ;
- offres mockees ;
- alertes / timeline produit.

Role futur :

- devenir la page centrale d'un produit suivi ;
- afficher l'historique reel des observations CardSnip.

### `/catalogue`

Page **Catalogue Admin**.

Objectif :

- preparer les fiches produits sealed independamment du suivi prix/stock ;
- gerer les images propres ;
- simuler la future table `products` + `product_assets`.

Fonctionnalites actuelles :

- liste catalogue locale ;
- ajout produit catalogue ;
- nom produit ;
- extension ;
- categorie ;
- langue ;
- date de sortie ;
- URL image propre ;
- statut image : `Validee`, `A verifier`, `Manquante` ;
- notes admin ;
- apercu fiche ;
- validation image ;
- retrait produit ;
- recherche et filtre categorie ;
- persistance locale via `localStorage`.

Cle `localStorage` :

```txt
cardsnip.catalogue-products.v1
```

Separation metier importante :

- `Catalogue` = identite produit + image propre ;
- `Produits` = surveillance prix/stock ;
- `Deals` = opportunites d'achat ;
- `Veille` = signaux avant ajout au suivi.

### `/shops`

Page boutiques.

Etat actuel :

- boutiques issues du seed SQLite local quand l'API est disponible ;
- fallback mock si l'API locale est indisponible ;
- statut de surveillance et sante du scraper ;
- distinction entre sources BE-first, sources secondaires FR/EU et marketplaces non recommandees via `country`, `priority`, `type`, `integration_status` et `notes`.

Sources fonctionnelles aujourd'hui :

- Fake Shop : source locale de test ;
- Otakuland-Manga Passion : scraper V1 fonctionnel mais source FR/EU secondaire.

Source BE-first validee en V1 :

- Outpost Brussels : scraper V1 `outpost_brussels` fonctionnel uniquement pour pages produit Shopify simples, parsing JSON-LD prioritaire, pas de crawl catalogue. Il reutilise maintenant la base commune `ShopifyProductScraper`.

Important :

- aucune autre vraie boutique n'est scrapee ;
- Otakuland V1 reste limite aux pages produit simples sans options obligatoires ;
- les boutiques belges sont prioritaires pour la suite car CardSnip vise d'abord un acheteur belge.

## Strategie sources BE-first

CardSnip adopte maintenant une strategie **BE-first**.

Raison produit :

- l'utilisateur vit en Belgique ;
- une boutique francaise peut afficher un prix attractif mais devenir mauvaise apres frais de port vers la Belgique ;
- un prix produit seul ne suffit pas a qualifier un deal.

Exemple :

```txt
ETB affichee a 58 EUR
-> livraison vers Belgique ajoutee a la caisse
-> prix total reel proche de 85 EUR
-> deal probablement mauvais
```

### Priorite 1 : BE-first prioritaires

Ces boutiques doivent etre analysees avant de continuer a ajouter des sources FR/EU :

- Outpost Brussels ;
- SOD Games ;
- TCG PokAlex ;
- Strategy Games ;
- Dreamland BE ;
- Fnac BE.

Toutes sont en `integration_status = to_analyze` et `scraper_key = not_configured`, sauf si une integration future est validee explicitement.

### Priorite 2 : BE a verifier

Ces sources restent pertinentes mais doivent etre confirmees avant scraper :

- Bol.com ;
- MediaMarkt BE ;
- Carrefour BE ;
- Trafic ;
- Le P'tit Poucet ;
- Cards Corner ;
- PokemonStore.be ;
- Collect Them All ;
- Pockinity ;
- Gamealot ;
- Spelonk ;
- CardWorld ;
- Coolblue.

Objectif de verification :

- presence de produits Pokemon sealed ;
- prix visible ;
- stock visible ;
- frais de port vers Belgique ;
- structure HTML stable ;
- conditions d'utilisation compatibles.

### Priorite 3 : FR/EU secondaires

Ces sources peuvent rester utiles, mais ne doivent pas piloter la strategie CardSnip :

- Otakuland-Manga Passion ;
- Kuro Star ;
- Pikastore ;
- UltraJeux ;
- Cultura ;
- Fnac FR.

Otakuland-Manga Passion reste `functional` car le scraper V1 fonctionne, mais elle est reclassee en priorite `medium`. Elle doit etre traitee comme source FR/EU secondaire, avec verification des frais de port vers Belgique avant de considerer un prix comme un vrai deal.

### Marketplaces exclues ou non recommandees

Les marketplaces de particuliers ne sont pas recommandees comme sources d'achat CardSnip :

- eBay ;
- Vinted ;
- Leboncoin ;
- 2ememain ;
- Facebook Marketplace.

Raisons :

- risque de faux produits ;
- risque de produits resealed ;
- vendeurs douteux ;
- frais caches ;
- fiabilite variable.

Amazon reste `later`/`hard` car marketplace complexe avec vendeurs tiers, invitations, stock et prix variables.

Cardmarket reste uniquement une reference marche potentielle plus tard, pas une source d'achat recommandee pour le MVP.

### Deal Score futur

Le futur `Deal Score` devra tenir compte du prix total reel :

```txt
prix produit + frais de port estimes vers Belgique
```

Tant que CardSnip ne connait pas les frais de port, un prix detecte doit etre considere comme un signal brut, pas comme un deal definitif.

### `/deals`

Page opportunites.

Fonctionnalites actuelles :

- liste des meilleurs deals mockes ;
- score de deal : `Excellent`, `Bon`, `Moyen`, `Faible` ;
- filtres par score ;
- filtres par source : boutiques / communaute ;
- tri par score, reduction, prix ;
- deal prioritaire ;
- signaux communautaires mockes ;
- explication des regles de scoring.

Role produit :

- aider a prioriser les achats ;
- eviter de se baser uniquement sur une baisse de prix brute ;
- preparer un futur moteur de scoring.

### `/watch`

Page veille TCG.

Fonctionnalites actuelles :

- signaux de sorties ;
- restocks ;
- precommandes ;
- signaux communautaires ;
- score de confiance ;
- priorite ;
- filtres categorie / source / priorite ;
- timeline ;
- encart APIs futures.

Role produit :

- reperer un produit avant meme de le suivre ;
- transformer ensuite un signal fiable en produit surveille.

### `/alerts`

Page alertes.

Etat actuel :

- alertes mockees basees sur les deals ;
- affichage prix / stock / retour en stock.

Role futur :

- afficher alertes console, Discord, email, push ;
- tracer les alertes envoyees.

### `/settings`

Page compte / parametres.

Etat actuel :

- mode admin local ;
- connexion utilisateur en pause.

Important :

- aucune auth reelle ;
- pas de gestion multi-user ;
- pas de SaaS encore.

## Composants frontend importants

### `CardSnipAppShell`

Fichier :

```txt
web/src/components/cardsnip-app-shell.tsx
```

Role :

- layout global app ;
- sidebar ;
- navigation ;
- header ;
- wrapper visuel des pages internes.

### `ProductThumb`

Fichier :

```txt
web/src/components/product-ui.tsx
```

Role :

- placeholder visuel pour produits sealed ;
- remplace temporairement les vraies images ;
- utilise des gradients et labels courts.

### `AddProductModal`

Fichier :

```txt
web/src/components/add-product-modal.tsx
```

Role :

- formulaire d'ajout produit ;
- preview produit ;
- target price ;
- URL image optionnelle ;
- pret a etre relie plus tard au backend.

### `PriceHistoryChart`

Fichier :

```txt
web/src/components/price-history-chart.tsx
```

Role :

- graphique Recharts ;
- affiche evolution prix ;
- affiche target price ;
- prepare l'affichage des futures observations reelles.

## Donnees mockees

Les donnees mockees sont principalement dans :

```txt
web/src/data/mock-dashboard.ts
web/src/data/mock-watch.ts
web/src/data/mock-catalogue.ts
```

Elles representent :

- statistiques dashboard ;
- deals ;
- boutiques ;
- series de prix ;
- signaux de veille ;
- catalogue produits sealed.

Ces donnees sont temporaires. Elles servent a construire l'UX avant de brancher la vraie base.

## Persistance locale

Le frontend utilise `localStorage` pour deux choses :

```txt
cardsnip.local-products.v1
cardsnip.catalogue-products.v1
```

Pourquoi :

- simuler un backend sans ajouter de complexite ;
- tester les flux utilisateur ;
- eviter que les ajouts disparaissent au refresh ;
- garder le MVP simple.

Limites :

- stockage lie au navigateur ;
- pas partage entre machines ;
- pas securise ;
- pas adapte a la production ;
- remplacable par Supabase plus tard.

## Fake shop locale

Dossier :

```txt
fake-shop/
```

Contenu :

- une page boutique fictive ;
- un produit TCG sealed ;
- prix ;
- stock ;
- bouton fictif ;
- panneau de test JS pour modifier prix / stock a la volee.

Lancer :

```powershell
cd fake-shop
python -m http.server 8080
```

Puis ouvrir :

```txt
http://localhost:8080
```

Exemple de scenario :

```txt
http://localhost:8080/index.html?price=39.99&stock=in
```

## Scraper Python

Dossier :

```txt
scraper/
```

Architecture :

```txt
scraper/
├── main.py
├── scrapers/
│   ├── base.py
│   └── fake_shop.py
├── services/
│   ├── alert_service.py
│   └── logger.py
├── models/
│   └── product_check.py
├── requirements.txt
└── .env.example
```

Principes :

- `BaseScraper` abstrait ;
- `FakeShopScraper` pour la fake shop ;
- modele `ProductCheck` ;
- service d'alerte ;
- logger simple ;
- pas de code spaghetti ;
- pas de dependance inutile.

Fonctionnalites :

- lit la page fake shop ;
- recupere nom produit, prix, stock, source URL, timestamp ;
- compare avec un target price ;
- detecte stock ;
- affiche logs console ;
- envoie une alerte console ;
- webhook Discord optionnel.

## Ajouter une nouvelle boutique plus tard

Pour l'instant, seule la fake shop est autorisee et fonctionnelle. Les vraies boutiques ne doivent pas etre integrees tant que les conditions d'utilisation, l'autorisation technique et le cadre legal ne sont pas valides.

La structure est toutefois prete pour ajouter un scraper plus tard.

### Contrat d'un scraper

Tous les scrapers doivent heriter de :

```txt
scraper/scrapers/base.py
```

Chaque scraper doit definir :

```python
scraper_key = "cle_unique"
```

et implementer :

```python
def scrape(self) -> ProductCheck:
    ...
```

Le retour doit toujours etre un `ProductCheck` normalise avec :

- nom produit ;
- prix ;
- stock ;
- URL source ;
- timestamp ;
- target price.

### Registry des scrapers

Le fichier :

```txt
scraper/scrapers/registry.py
```

associe chaque `scraper_key` a sa classe Python.

Exemple actuel :

```python
SCRAPER_REGISTRY = {
    "fake_shop": FakeShopScraper,
    "otakuland": OtakulandScraper,
}
```

### Lien boutique -> scraper

La table SQLite `shops` contient maintenant :

```txt
scraper_key
```

Ce champ dit au scraper quel connecteur utiliser pour une boutique.

Exemples :

```txt
Fake Shop                -> fake_shop
Otakuland-Manga Passion  -> otakuland
Cardmarket               -> not_configured
Kuro Star                -> not_configured
```

`not_configured` signifie volontairement : boutique visible dans le prototype, mais aucun scraper branche.

### Base Shopify reutilisable

Le fichier :

```txt
scraper/scrapers/shopify_product.py
```

contient `ShopifyProductScraper`, une base interne pour les pages produit Shopify simples.

Elle gere :

- titre via JSON-LD Product `name`, fallback `main h1` ;
- prix via JSON-LD `offers.price`, fallback `meta[property="og:price:amount"]` ;
- stock via JSON-LD `offers.availability` ;
- `InStock` et `PreOrder` comme disponible ;
- `OutOfStock` comme rupture ;
- fallbacks legers via `pickup-availability` et `button[name="add"]`.

Elle ne gere pas :

- crawl catalogue ;
- recherche interne ;
- panier ;
- checkout ;
- comptes utilisateur ;
- navigateur headless ;
- contournement anti-bot.

Cette classe n'a pas de `scraper_key` public dans le registry. Chaque boutique Shopify validee doit garder son scraper dedie, par exemple `OutpostBrusselsScraper`, pour conserver des notes, limites et tests propres par boutique.

### Statut Otakuland-Manga Passion

Otakuland-Manga Passion est marque `functional` uniquement pour le perimetre V1 limite :

- pages produit simples ;
- pas d'options obligatoires ;
- pas de variantes ;
- pas de crawl catalogue ;
- pas de scheduler ;
- pas de bouton panier comme source fiable de stock ;
- pas d'usage SaaS public sans clarification d'autorisation.

Les pages contenant `isOptionRequired: true` sont refusees proprement par le scraper V1.

### Etapes futures pour ajouter une boutique autorisee

1. Creer un fichier dans `scraper/scrapers/`, par exemple `ma_boutique.py`.
2. Heriter de `BaseScraper`.
3. Definir une cle stable, par exemple `scraper_key = "ma_boutique"`.
4. Retourner un `ProductCheck` depuis `scrape()`.
5. Ajouter la classe dans `scraper/scrapers/registry.py`.
6. Mettre `shops.scraper_key = "ma_boutique"` pour la boutique concernee.
7. Tester via `POST /scraper/run`.

Important :

- ne pas coder de vraie boutique sans validation prealable ;
- ne pas contourner d'anti-bot ;
- preferer API officielle, partenariat ou source explicitement autorisee ;
- garder la fake shop comme source de test locale.

## API locale FastAPI + SQLite

L'etape backend locale utilise une seule API Python FastAPI et une base SQLite partagee avec le scraper.

Fichiers principaux :

```txt
scraper/
├── api.py
├── scripts/
│   └── init_db.py
└── storage/
    ├── database.py
    ├── repositories.py
    └── schema.sql
```

Base locale :

```txt
data/cardsnip.local.sqlite3
```

Cette base est ignoree par Git.

Installer les dependances backend :

```powershell
cd scraper
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Initialiser la base :

```powershell
python scripts/init_db.py
```

Lancer l'API :

```powershell
uvicorn api:app --reload --port 8000
```

Endpoints disponibles pour l'etape A :

```txt
GET  http://localhost:8000/health
GET  http://localhost:8000/products
POST http://localhost:8000/products
GET  http://localhost:8000/shops
POST http://localhost:8000/shops
GET  http://localhost:8000/tracked-products
POST http://localhost:8000/tracked-products
GET  http://localhost:8000/observations
GET  http://localhost:8000/observations/latest
GET  http://localhost:8000/alerts
```

Schema SQLite minimal :

- `products`
- `shops`
- `tracked_products`
- `price_observations`
- `alerts`

Important :

- FastAPI ne remplace pas Supabase ;
- SQLite sert uniquement de persistance locale MVP ;
- le frontend n'est pas encore branche massivement sur cette API dans l'etape A ;
- le scraper sera connecte a SQLite dans l'etape B.

## Flux metier local connecte

L'etape B connecte progressivement le frontend, l'API locale, SQLite et le scraper.

Flux actuel vise :

```txt
Catalogue
-> Creer un suivi
-> tracked_products dans SQLite
-> python main.py
-> price_observations dans SQLite
-> alerts dans SQLite
-> Dashboard
```

### Catalogue vers produit surveille

Quand l'API locale est lancee, la page `/catalogue` charge les produits depuis SQLite.

Depuis une fiche catalogue, le bouton :

```txt
Creer un suivi
```

ouvre une modal avec :

- boutique ;
- URL source ;
- target price ;
- statut actif/inactif.

La creation ecrit dans `tracked_products`.

Si l'API n'est pas disponible, la page garde son fallback localStorage, mais la creation de suivi serveur demande l'API locale.

### Ajouter un suivi Otakuland-Manga Passion V1

Otakuland-Manga Passion est disponible via :

```txt
scraper_key = otakuland
integration_status = functional
```

Perimetre strict :

- pages produit simples uniquement ;
- pas d'options obligatoires ;
- pas de variantes ;
- pas de crawl catalogue ;
- pas de bouton panier comme source fiable de stock.

Depuis `/catalogue` :

1. choisir ou creer un produit catalogue ;
2. cliquer sur `Creer un suivi` ;
3. choisir `Otakuland-Manga Passion` ;
4. renseigner une URL produit simple Otakuland ;
5. definir une target price ;
6. laisser le suivi actif ;
7. lancer ensuite `POST /scraper/run`.

URL test validee :

```txt
https://otakuland-mangapassion.com/2208735-Pokemon-JCC-Tripack-Reptincel-Mega-Evolution-ME04-Chaos-Ascendant-FR
```

Target price de test :

```txt
22
```

Plus de details API :

```txt
docs/api/local-api.md
```

### Produits surveilles

La page `/products` tente de lire :

```txt
GET http://localhost:8000/tracked-products
```

Si l'API repond, les suivis SQLite sont affiches.

Si l'API ne repond pas, la page conserve le fallback mock/localStorage.

### Scraper connecte a SQLite

Commande principale :

```powershell
cd scraper
python main.py
```

Comportement :

1. lit les `tracked_products` actifs ;
2. scrape chaque `source_url` avec le scraper lie a `shops.scraper_key` ;
3. ecrit une ligne dans `price_observations` ;
4. cree une alerte dans `alerts` si le prix est sous la target price ou si un retour en stock est detecte ;
5. garde aussi les alertes console existantes.

Mode historique encore disponible :

```powershell
python main.py --single --source "http://localhost:8080/index.html?price=39.99&stock=in" --target-price 45
```

### Dashboard

Le dashboard tente de lire :

```txt
GET http://localhost:8000/observations/latest
GET http://localhost:8000/alerts
```

Si des observations existent, un panneau `Derniers checks reels` apparait.

Si des alertes SQLite existent, elles remplacent les alertes mockees dans le panneau `Alertes recentes`.

Si l'API ou les donnees reelles sont absentes, le dashboard garde les mocks.

### Scenario de test complet

Terminal 1 :

```powershell
cd fake-shop
python -m http.server 8080
```

Terminal 2 :

```powershell
cd scraper
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python scripts/init_db.py
uvicorn api:app --reload --port 8000
```

Terminal 3 :

```powershell
cd web
npm.cmd install
npm.cmd run dev
```

Dans le navigateur :

```txt
http://localhost:3000/catalogue
```

Puis :

1. choisir ou creer un produit catalogue ;
2. cliquer sur `Creer un suivi` ;
3. choisir `Fake Shop` ;
4. utiliser une URL de test :

```txt
http://localhost:8080/index.html?price=39.99&stock=in
```

5. mettre une target price superieure ou egale a `39.99` ;
6. valider.

Terminal 4 :

```powershell
cd scraper
.\.venv\Scripts\Activate.ps1
python main.py
```

Verifier ensuite :

- `/products` affiche le suivi SQLite ;
- `/dashboard` affiche le dernier check reel ;
- `/dashboard` affiche une alerte si le prix est sous la target price.

## Test end-to-end local

Ce test valide le flux local complet :

```txt
fake-shop -> scraper -> SQLite -> FastAPI -> dashboard -> alertes
```

Script de verification rapide, a lancer quand la fake shop et FastAPI tournent deja :

```powershell
cd "C:\Users\Nagara\Documents\New project\cardsnip"
.\scripts\test-end-to-end-local.ps1
```

Le script initialise SQLite, teste `price=39.99&stock=in`, teste `price=99.99&stock=out`, puis restaure le scenario demo.

### 1. Initialiser SQLite

Terminal 1 :

```powershell
cd "C:\Users\Nagara\Documents\New project\cardsnip\scraper"
.\.venv\Scripts\Activate.ps1
python scripts\init_db.py
```

Si le venv n'existe pas encore :

```powershell
cd "C:\Users\Nagara\Documents\New project\cardsnip\scraper"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python scripts\init_db.py
```

### 2. Lancer la fake shop

Terminal 2 :

```powershell
cd "C:\Users\Nagara\Documents\New project\cardsnip\fake-shop"
python -m http.server 8080
```

Verifier :

```powershell
Invoke-WebRequest -UseBasicParsing "http://localhost:8080/index.html?price=39.99&stock=in"
```

Resultat attendu : status `200`.

### 3. Lancer FastAPI

```powershell
cd "C:\Users\Nagara\Documents\New project\cardsnip\scraper"
.\.venv\Scripts\Activate.ps1
python -m uvicorn api:app --reload --port 8000
```

Verifier :

```powershell
Invoke-WebRequest -UseBasicParsing "http://localhost:8000/health"
```

Resultat attendu :

```json
{"status":"ok"}
```

Verifier aussi que les endpoints supportent une absence de donnees :

```powershell
Invoke-WebRequest -UseBasicParsing "http://localhost:8000/observations/latest"
Invoke-WebRequest -UseBasicParsing "http://localhost:8000/alerts"
```

Resultat attendu si aucune observation/alerte n'existe encore :

```json
[]
```

### 4. Lancer Next.js

Terminal 3 :

```powershell
cd "C:\Users\Nagara\Documents\New project\cardsnip\web"
npm.cmd run dev
```

Ouvrir :

```txt
http://localhost:3000/dashboard
```

### 5. Scenario A : prix bas et en stock

URL fake shop attendue dans le suivi demo :

```txt
http://localhost:8080/index.html?price=39.99&stock=in
```

Depuis le dashboard, cliquer sur :

```txt
Lancer un check
```

Ou lancer le scraper via API :

```powershell
Invoke-WebRequest -UseBasicParsing -Method Post "http://localhost:8000/scraper/run"
```

Resultat attendu :

```json
{"tracked_products":1,"observations":1,"alerts":1,"errors":0,"messages":[]}
```

Verifier SQLite via l'API :

Derniere observation :

```powershell
Invoke-WebRequest -UseBasicParsing "http://localhost:8000/observations/latest"
```

Alertes :

```powershell
Invoke-WebRequest -UseBasicParsing "http://localhost:8000/alerts"
```

Resultat attendu :

- une observation avec `price` a `39.99` ;
- un `stock_status` a `in_stock` ;
- une alerte `price_below_target` si le prix est sous la cible.

### 6. Scenario B : prix haut et rupture

Pour tester une rupture sans vraie boutique, changer temporairement l'URL du suivi demo :

```powershell
cd "C:\Users\Nagara\Documents\New project\cardsnip\scraper"
python -c "from storage.database import connect; c=connect(); c.execute('update tracked_products set source_url=? where id=1', ('http://localhost:8080/index.html?price=99.99&stock=out',)); c.commit(); c.close()"
Invoke-WebRequest -UseBasicParsing -Method Post "http://localhost:8000/scraper/run"
Invoke-WebRequest -UseBasicParsing "http://localhost:8000/observations/latest"
```

Resultat attendu :

- une observation avec `price` a `99.99` ;
- un `stock_status` a `out_of_stock` ;
- pas de nouvelle alerte `price_below_target`.

Remettre ensuite le scenario demo initial :

```powershell
cd "C:\Users\Nagara\Documents\New project\cardsnip\scraper"
python -c "from storage.database import connect; c=connect(); c.execute('update tracked_products set source_url=? where id=1', ('http://localhost:8080/index.html?price=39.99&stock=in',)); c.commit(); c.close()"
```

### 7. Verifier le dashboard

Sur `http://localhost:3000/dashboard`, verifier :

- le panneau `Derniers checks reels` apparait ;
- le prix detecte vient de SQLite ;
- le stock affiche `En stock` ;
- le panneau `Alertes recentes` affiche les alertes SQLite.

### Erreurs attendues et lisibles

Si FastAPI ne repond pas, le frontend affiche un message demandant de lancer :

```powershell
python -m uvicorn api:app --reload --port 8000
```

Si la fake shop ne repond pas, `POST /scraper/run` renvoie `errors: 1` avec un message demandant de verifier :

```txt
http://localhost:8080
```

## Alertes Discord

Discord webhook optionnel via :

```txt
scraper/.env
```

Exemple :

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

Si aucun webhook n'est configure :

- le scraper continue ;
- aucune erreur bloquante ;
- seules les alertes console sont affichees.

## Supabase : schema futur

Dossier :

```txt
supabase/
├── README.md
└── schema-draft.sql
```

Important :

- ce n'est pas encore une migration officielle ;
- le CLI Supabase n'etait pas installe localement lors de la creation ;
- le fichier est un draft propre, pret a convertir en migration.

Tables prevues :

- `products` : catalogue produit sealed ;
- `product_assets` : images propres ;
- `shops` : boutiques / sources ;
- `tracked_products` : produit + boutique + URL + target price ;
- `price_observations` : historique prix / stock ;
- `alerts` : alertes generees ;
- `watch_signals` : signaux de veille.

Types SQL prevus :

- `product_category`
- `observation_source`
- `stock_status`
- `alert_kind`

RLS :

- RLS activee dans le draft sur toutes les tables publiques ;
- aucune policy publique pour l'instant ;
- les policies viendront avec l'auth.

Quand Supabase sera pret :

```powershell
supabase migration new initial_cardsnip_schema
```

Puis copier le contenu valide de :

```txt
supabase/schema-draft.sql
```

dans la migration generee.

## Images produit : strategie prevue

Le but est d'avoir des images propres pour ETB, displays, bundles, boosters, collections.

Approche recommandee :

1. Ajouter le produit dans `Catalogue Admin`.
2. Renseigner une URL image propre ou importer une image.
3. Marquer l'image comme `A verifier`.
4. Validation admin.
5. Plus tard : upload dans Supabase Storage.
6. Stocker le chemin dans `product_assets`.
7. Utiliser l'image principale dans dashboard / produits / deals.

Pourquoi ne pas tout scraper maintenant :

- droits d'utilisation des images a verifier ;
- conditions d'utilisation variables selon les sites ;
- besoin d'eviter les images floues, crops, watermarks ;
- besoin d'un workflow admin de validation.

## APIs envisagees

### Supabase Database + Storage

Priorite haute.

Usage :

- stocker produits ;
- stocker observations prix / stock ;
- stocker alertes ;
- stocker images ;
- preparer le multi-user plus tard.

### Discord Webhooks

Priorite haute.

Usage :

- alertes prix sous target ;
- retour en stock ;
- deal prioritaire.

### API catalogue sealed

Priorite moyenne.

Usage :

- aider a remplir noms, extensions, images ;
- eviter trop de saisie manuelle.

Piste identifiee :

- Scrydex pour produits sealed, a verifier avant integration.

### Pokemon TCG API

Priorite moyenne/faible pour le sealed.

Utile pour :

- cartes ;
- extensions ;
- metadata TCG.

Limite :

- ne couvre pas forcement correctement ETB / displays / bundles sealed.

### Cardmarket API

Priorite plus tard.

Usage potentiel :

- prix marche ;
- donnees produits ;
- tendances.

Condition :

- verifier acces API ;
- verifier conditions d'utilisation ;
- ne pas integrer tant que le backend et la legalite du flux ne sont pas clairs.

## Commandes Windows utiles

### Aller dans le frontend

CMD :

```cmd
cd /d "C:\Users\Nagara\Documents\New project\cardsnip\web"
```

PowerShell :

```powershell
Set-Location "C:\Users\Nagara\Documents\New project\cardsnip\web"
```

### Installer les dependances frontend

```cmd
npm.cmd install
```

### Lancer en dev

```cmd
npm.cmd run dev
```

### Build production

```cmd
npm.cmd run build
```

### Start production local

```cmd
npm.cmd run start -- --port 3000
```

### URL locale

```txt
http://localhost:3000
```

## Verification actuelle

Les dernieres verifications effectuees :

```powershell
npm.cmd run lint
npm.cmd run build
```

Statut :

- lint OK ;
- build OK ;
- route `/catalogue` OK ;
- route `/products` OK ;
- route `/watch` OK ;
- route `/deals` OK.

## Decisions produit importantes

### Ne pas coder tout le SaaS maintenant

CardSnip reste un MVP local.

Ce choix evite :

- complexite auth ;
- facturation ;
- multi-tenant ;
- jobs asynchrones ;
- dette technique precoce.

### Separer catalogue et surveillance

Decision importante :

- le catalogue gere l'identite produit ;
- la surveillance gere prix / stock / target price.

Cela permet plus tard :

- plusieurs boutiques pour un meme produit ;
- une image propre partagee ;
- un historique prix par boutique ;
- un scoring de deal plus fiable.

### Ne pas scraper de vraies boutiques maintenant

Raisons :

- conditions d'utilisation ;
- anti-bot ;
- stabilite ;
- risque juridique ;
- besoin d'une architecture backend plus propre.

### Utiliser des mocks riches

Les mocks ne sont pas la pour tricher, mais pour valider :

- UX ;
- logique metier ;
- navigation ;
- priorisation produit ;
- structure de donnees.

## Prochaines etapes recommandees

### Etape 1 : relier Catalogue et Produits

Ajouter un bouton dans `/catalogue` :

```txt
Créer un suivi
```

Objectif :

- partir d'une fiche catalogue ;
- pre-remplir l'ajout produit ;
- choisir boutique + target price ;
- creer un produit surveille local.

### Etape 2 : mini backend local

Creer une persistance plus robuste que `localStorage`.

Options :

- fichier JSON local ;
- SQLite ;
- petite API Next route handler ;
- petit backend Python.

Objectif :

- que le scraper lise les produits surveilles ;
- que le dashboard affiche les derniers vrais checks locaux.

### Etape 3 : connecter scraper et frontend

Flux vise :

```txt
Produit surveille -> scraper -> observation prix/stock -> alertes -> dashboard
```

### Etape 4 : Supabase

Quand le schema est valide :

- creer le projet Supabase CardSnip ;
- installer/configurer CLI ;
- convertir `schema-draft.sql` en migration ;
- creer bucket Storage ;
- ajouter policies RLS ;
- brancher le backend.

### Etape 5 : images produit

Mettre en place :

- upload admin ;
- preview ;
- validation image ;
- stockage Supabase Storage ;
- fallback placeholder si image absente.

### Etape 6 : integrations externes autorisees

Uniquement apres validation :

- APIs officielles ;
- partenariats ;
- imports CSV ;
- pages boutiques autorisees ;
- pas de scraping sauvage.

## Definition actuelle du MVP

Le MVP actuel est considere comme un **prototype local frontend-first**.

Il valide :

- l'ergonomie de surveillance ;
- le dashboard ;
- la notion de catalogue ;
- l'ajout produit ;
- le scoring deal ;
- la veille ;
- le graphique de prix ;
- la future structure Supabase.

Il ne valide pas encore :

- ingestion de vraies donnees ;
- persistance serveur ;
- multi-user ;
- alerting production ;
- deploiement SaaS ;
- integrations marchandes.

## Resume pour un autre assistant IA

CardSnip est un MVP local Next.js/TypeScript/Tailwind + Python pour surveiller produits TCG/Pokemon sealed. Le frontend est deja avance avec dashboard premium, pages produits, details produit, catalogue admin, boutiques, deals, veille, alertes et compte admin local. Les donnees sont mockees, avec `localStorage` pour les produits ajoutes et le catalogue admin. Le scraper Python lit seulement une fake shop locale. Aucun vrai site marchand n'est integre. Supabase n'est pas encore branche, mais un `schema-draft.sql` existe avec tables produits, assets, boutiques, tracked products, observations, alerts et watch signals. La prochaine etape conseillee est de relier `Catalogue` et `Produits` via un bouton `Creer un suivi`, puis de creer un mini backend local avant Supabase.
