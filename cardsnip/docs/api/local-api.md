# CardSnip Local API

## Role

La CardSnip Local API est l'API FastAPI locale du MVP.

Elle relie :

```txt
Next.js -> FastAPI -> SQLite <- scraper Python
```

URL locale :

```txt
http://localhost:8000
```

Documentation FastAPI auto :

```txt
http://localhost:8000/docs
```

## Lancer l'API

Depuis le dossier scraper :

```powershell
cd "C:\Users\Nagara\Documents\New project\cardsnip\scraper"
python -m uvicorn api:app --reload --port 8000
```

Verifier :

```powershell
Invoke-WebRequest -UseBasicParsing "http://localhost:8000/health"
```

Reponse attendue :

```json
{"status":"ok"}
```

## Ajouter un suivi Otakuland V1 depuis le Catalogue

Pre-requis :

- FastAPI lancee ;
- SQLite initialisee ;
- Otakuland-Manga Passion presente dans `/shops` ;
- `scraper_key = otakuland` ;
- `integration_status = functional`.

Depuis l'interface :

1. ouvrir `http://localhost:3000/catalogue` ;
2. choisir ou creer un produit catalogue ;
3. cliquer sur `Creer un suivi` ;
4. choisir `Otakuland-Manga Passion` ;
5. mettre l'URL produit Otakuland ;
6. mettre une target price ;
7. garder le suivi actif ;
8. valider ;
9. lancer le scraper depuis le dashboard ou via `POST /scraper/run`.

URL Otakuland V1 validee :

```txt
https://otakuland-mangapassion.com/2208735-Pokemon-JCC-Tripack-Reptincel-Mega-Evolution-ME04-Chaos-Ascendant-FR
```

Target price de test :

```txt
22
```

Resultat attendu :

- prix : `19.99` ;
- stock : `in_stock` ;
- alerte : oui si `target_price >= 19.99`.

## Ajouter un suivi Otakuland V1 via API

### 1. Lister les boutiques

```powershell
Invoke-WebRequest -UseBasicParsing "http://localhost:8000/shops?limit=200"
```

Verifier dans la reponse :

```txt
name = Otakuland-Manga Passion
scraper_key = otakuland
integration_status = functional
```

Noter son `id`.

### 2. Creer un produit catalogue

```powershell
$productBody = @{
  name = "Pokemon JCC Tripack Reptincel Mega-Evolution ME04 Chaos Ascendant FR"
  category = "Tripack"
  language = "FR"
  extension = "Mega-Evolution ME04 Chaos Ascendant"
  image_url = $null
} | ConvertTo-Json

$product = Invoke-WebRequest `
  -UseBasicParsing `
  -Method Post `
  "http://localhost:8000/products" `
  -ContentType "application/json" `
  -Body $productBody

$product.Content
```

Noter le `id` du produit cree.

### 3. Creer le tracked_product

Remplacer :

- `PRODUCT_ID` par l'id produit ;
- `SHOP_ID` par l'id Otakuland-Manga Passion.

```powershell
$trackedBody = @{
  product_id = PRODUCT_ID
  shop_id = SHOP_ID
  source_url = "https://otakuland-mangapassion.com/2208735-Pokemon-JCC-Tripack-Reptincel-Mega-Evolution-ME04-Chaos-Ascendant-FR"
  target_price = 22
  active = $true
} | ConvertTo-Json

Invoke-WebRequest `
  -UseBasicParsing `
  -Method Post `
  "http://localhost:8000/tracked-products" `
  -ContentType "application/json" `
  -Body $trackedBody
```

Verifier que le suivi a :

```txt
shop_name = Otakuland-Manga Passion
scraper_key = otakuland
source_url = URL Tripack
target_price = 22
active = 1
```

### 4. Lancer le scraper

```powershell
Invoke-WebRequest -UseBasicParsing -Method Post "http://localhost:8000/scraper/run"
```

Reponse attendue au minimum :

```json
{
  "observations": 1,
  "errors": 0
}
```

Si plusieurs produits actifs existent, `observations` peut etre superieur a `1`.

### 5. Verifier les observations

```powershell
Invoke-WebRequest -UseBasicParsing "http://localhost:8000/observations/latest"
```

Resultat attendu pour le suivi Otakuland :

```txt
price = 19.99
stock_status = in_stock
shop_name = Otakuland-Manga Passion
```

### 6. Verifier les alertes

```powershell
Invoke-WebRequest -UseBasicParsing "http://localhost:8000/alerts"
```

Si `target_price >= 19.99`, alertes attendues au premier run :

```txt
price_below_target
in_stock
```

Les runs identiques suivants ne doivent pas recreer les memes alertes SQLite pour le meme `tracked_product`.

## Limites Otakuland V1

Otakuland-Manga Passion est `functional` uniquement pour le perimetre V1 limite.

Supporte :

- URLs produit simples ;
- HTML rendu serveur ;
- titre via `main.ProductPage h1[itemprop="name"]` ;
- prix via `main.ProductPage .Price-value[itemprop="price"][content]` ;
- stock via `main.ProductPage .ProductStock-info`.

Non supporte :

- `isOptionRequired: true` ;
- variantes ;
- options obligatoires ;
- crawl catalogue ;
- recherche interne ;
- pagination boutique ;
- headless browser ;
- appel panier/compte/checkout ;
- usage SaaS public sans clarification d'autorisation.

Erreur attendue si options obligatoires :

```txt
Page Otakuland non supportee en V1 : options obligatoires detectees.
```
