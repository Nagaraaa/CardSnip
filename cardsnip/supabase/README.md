# CardSnip Supabase Draft

Ce dossier prépare la future base CardSnip, sans la brancher au MVP local pour l'instant.

## Pourquoi ce n'est pas encore une migration officielle

Le CLI Supabase n'est pas installé sur cette machine. Pour éviter une fausse migration, le fichier actuel est un draft :

```txt
supabase/schema-draft.sql
```

Quand le projet Supabase CardSnip sera créé et que le CLI sera disponible, on transformera ce draft en vraie migration avec :

```powershell
supabase migration new initial_cardsnip_schema
```

Puis on copiera le SQL validé dans le fichier généré.

## Tables prévues

- `products` : catalogue produit sealed, extension, catégorie, image principale.
- `product_assets` : images propres stockées dans Supabase Storage.
- `shops` : boutiques ou sources surveillées.
- `tracked_products` : produit + boutique + URL + target price.
- `price_observations` : historique des prix et du stock observés.
- `alerts` : alertes générées par les règles CardSnip.
- `watch_signals` : signaux de veille avant ajout au suivi.

## Images produit

Le plan propre :

1. Trouver ou importer une image fiable.
2. La valider côté admin.
3. La stocker dans Supabase Storage.
4. Enregistrer le chemin dans `product_assets`.
5. Utiliser `products.image_url` comme image principale affichée dans l'app.

## Sécurité

Toutes les tables du draft activent RLS.

Pour l'instant, aucune policy publique n'est ajoutée volontairement. La phase backend devra utiliser du code serveur de confiance. Les policies utilisateur arriveront avec l'auth.

## À ne pas faire maintenant

- Brancher le frontend directement à Supabase.
- Exposer une clé `service_role` côté navigateur.
- Ajouter Auth ou Stripe.
- Scraper de vraies boutiques sans validation des conditions d'utilisation.
