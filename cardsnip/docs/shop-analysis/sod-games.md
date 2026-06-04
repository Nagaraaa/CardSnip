# SOD Games - Analyse pre-scraper

## Identite boutique

- Nom : SOD Games
- URL du site : https://www.sodgames.be
- Type : tcg_specialist
- Pays : BE
- Priorite CardSnip : high
- Difficulte estimee : hard pour scraping HTML direct, a cause du blocage Cloudflare observe
- Statut actuel : to_analyze
- scraper_key actuel : not_configured
- Positionnement CardSnip : candidate BE-first prioritaire, mais a verifier avec prudence avant toute integration
- Technologie detectee : unknown

## Presence dans CardSnip

SOD Games est deja present dans le seed et dans la DB locale avec :

```txt
name = SOD Games
url = https://www.sodgames.be
country = BE
type = tcg_specialist
priority = high
difficulty = unknown
integration_status = to_analyze
scraper_key = not_configured
trusted = true
```

Le `scraper_key` reste volontairement `not_configured`. Aucun scraper SOD Games n'a ete code dans cette passe.

## Limites connues

- Les requetes HTTP simples vers le site renvoient `403 Forbidden`.
- Une ouverture via navigateur Playwright affiche une verification de securite Cloudflare.
- `robots.txt` renvoie egalement `403 Forbidden` depuis l'environnement local.
- Aucun snapshot HTML produit n'a pu etre sauvegarde sans contourner de protection.
- Les pages produit candidates ont ete identifiees via resultats de recherche publics, mais pas analysees en HTML brut.
- Ne pas tenter de contourner Cloudflare, captcha, challenge, panier, checkout ou compte utilisateur.

## Analyse multi-pages

### Page 1

- URL : https://www.sodgames.be/pokemon-tcg-coffret-premium-dracaufeu-ex-fr-f1318741.html
- Type produit : coffret / collection premium
- Prix detectable : non verifie en HTML live, page bloquee par Cloudflare
- Stock detectable : non verifie en HTML live
- Bouton panier : non verifie en HTML live
- Texte rupture : non verifie en HTML live
- JSON-LD Product : non verifie, HTML inaccessible sans challenge
- Selecteur titre candidat : inconnu
- Selecteur prix candidat : inconnu
- Selecteur stock candidat : inconnu
- Donnees structurees : inconnues
- Options / variantes : inconnues
- Notes : URL candidate pertinente issue des resultats de recherche publics, mais page non exploitable depuis l'environnement local sans passer par une verification Cloudflare.

### Page 2

- URL : https://www.sodgames.be/pokemon-tcg-coffret-amphinobi-hyporoi-francais-f1668325.html
- Type produit : coffret
- Prix detectable : non verifie en HTML live, page bloquee par Cloudflare
- Stock detectable : non verifie en HTML live
- Bouton panier : non verifie en HTML live
- Texte rupture : non verifie en HTML live
- JSON-LD Product : non verifie, HTML inaccessible sans challenge
- Selecteur titre candidat : inconnu
- Selecteur prix candidat : inconnu
- Selecteur stock candidat : inconnu
- Donnees structurees : inconnues
- Options / variantes : inconnues
- Notes : URL candidate pertinente issue des resultats de recherche publics, mais page non exploitable depuis l'environnement local sans passer par une verification Cloudflare.

### Page 3

- URL : https://www.sodgames.be/pokemon-coffret-dresseur-d-elite-flamme-blanche-francais-f1661981.html
- Type produit : ETB
- Prix detectable : non verifie en HTML live, page bloquee par Cloudflare
- Stock detectable : non verifie en HTML live
- Bouton panier : non verifie en HTML live
- Texte rupture : non verifie en HTML live
- JSON-LD Product : non verifie, HTML inaccessible sans challenge
- Selecteur titre candidat : inconnu
- Selecteur prix candidat : inconnu
- Selecteur stock candidat : inconnu
- Donnees structurees : inconnues
- Options / variantes : inconnues
- Notes : URL candidate pertinente issue des resultats de recherche publics, mais page non exploitable depuis l'environnement local sans passer par une verification Cloudflare.

## Compatibilite ShopifyProductScraper

- Compatible probable : incertain
- Raison : le HTML produit n'est pas accessible depuis l'environnement local a cause d'un blocage Cloudflare. Il est donc impossible de confirmer la presence de JSON-LD Product, de `offers.price`, de `offers.availability` ou de fallbacks Shopify.
- Champs JSON-LD detectes : aucun champ confirme.
- Fallbacks necessaires : inconnus.
- Limites : la protection Cloudflare empeche de verifier proprement la structure HTML sans contournement.

Si une analyse future confirme que SOD Games expose des pages Shopify simples compatibles JSON-LD, l'integration pourrait ensuite prendre la forme :

```python
class SodGamesScraper(ShopifyProductScraper):
    scraper_key = "sod_games"
    shop_name = "SOD Games"
```

Mais cette classe ne doit pas etre codee maintenant.

## Comparaison des selecteurs

- Titre : inconnu, HTML produit inaccessible
- Prix : inconnu, HTML produit inaccessible
- Stock : inconnu, HTML produit inaccessible
- Disponibilite : inconnu, HTML produit inaccessible
- Bouton panier : inconnu, HTML produit inaccessible
- JSON-LD / meta : inconnu, HTML produit inaccessible

## Robots.txt, conditions et protection

Robots.txt teste :

```txt
https://www.sodgames.be/robots.txt
```

Resultat observe :

```txt
403 Forbidden
```

Page publique testee via navigateur Playwright :

```txt
https://www.sodgames.be/pokemon-tcg-coffret-premium-dracaufeu-ex-fr-f1318741.html
```

Resultat observe :

```txt
Page Title: Un instant...
Verification de securite en cours
Performances et securite par Cloudflare
```

Conditions d'utilisation : non analysees, car l'acces public HTML est bloque avant inspection fiable.

## Risques identifies

- Blocage Cloudflare visible.
- Acces HTTP simple en `403 Forbidden`.
- Verification de securite dans un vrai navigateur automatise.
- Impossible de sauvegarder des snapshots produit sans passer une protection.
- Impossible de confirmer JSON-LD, prix, stock ou selecteurs.
- Integrer un scraper HTML direct necessiterait probablement du contournement ou un accord/source autorisee, ce qui est hors perimetre CardSnip MVP.

## Decision finale pre-scraper

Decision :

```txt
a eviter
```

Raison :

- anti-bot / verification Cloudflare evidente ;
- impossibilite de lire prix et stock proprement depuis l'environnement local ;
- snapshots HTML non crees ;
- compatibilite ShopifyProductScraper non verifiable ;
- besoin potentiel de contournement si on insistait, ce qui est interdit pour CardSnip.

## Recommandation

Ne pas coder de scraper SOD Games maintenant.

SOD Games peut rester dans CardSnip en `to_analyze` / `not_configured`, mais ne doit pas etre priorise pour le prochain scraper tant qu'une source autorisee ou une methode non intrusive n'est pas identifiee.

Prochaine action recommandee :

1. Passer a une autre boutique BE-first plus accessible, par exemple Dreamland BE ou une autre boutique TCG belge.
2. Continuer a privilegier les boutiques avec HTML public lisible, JSON-LD accessible et pas de challenge anti-bot.
3. Garder `ShopifyProductScraper` pour les futures boutiques Shopify qui ne bloquent pas l'analyse publique.
