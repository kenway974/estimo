# Ajouter une nouvelle agence (tenant)

Aucune base de données : une agence = un fichier de config + ses secrets en env.

## 1. Créer `tenants/<id>.json`
Copier `tenants/demo.json` et adapter. `id` en minuscules (`a-z 0-9 _ -`),
le **nom de fichier doit valoir `<id>.json`**.

```jsonc
{
  "id": "acme",
  "name": "Agence Acme",
  "allowedDomains": ["https://www.acme-immo.re"],   // domaines autorisés à appeler l'API
  "branding": { "displayName": "Acme Immobilier", "primaryColor": "#0f766e" },
  "mail": { "provider": "brevo", "fromEmail": "contact@acme-immo.re", "fromName": "Acme Immobilier" },
  "crm":  { "provider": "mailchimp", "listId": "abc123", "mailchimpServerPrefix": "us21" },
  "estimation": { /* coefficients : voir ci-dessous */ }
}
```

## 2. Renseigner les secrets (variables d'env, préfixe = ID en MAJUSCULES)
- `ACME_MAIL_API_KEY` (Brevo/SendGrid/Mailgun) **ou** `ACME_SMTP_URL` (SMTP)
- `ACME_CRM_API_KEY` (si CRM ≠ none)
- `ACME_PUBLIC_KEY` (optionnel)

Sur Railway : onglet **Variables** du service.

## 3. Régler les coefficients d'estimation
Bloc `estimation` (entièrement modifiable, sans toucher au code) :

- `basePricePerM2.sale` / `.rent` : prix de base au m² (vente / loyer mensuel).
- `propertyType`, `condition` : multiplicateurs (clés = `value` des options du widget).
- `zones` : multiplicateur par **code postal** ou **ville** (minuscule) ; `default` = 1.
- `features` : bonus **additif** (en %) par équipement coché (ex. `0.05` = +5 %).
- `rooms` : `{ reference, perRoomPct }` — bonus par pièce au-delà de la référence.
- `rangePct` : demi-fourchette (ex. `0.08` = ±8 %).

> Pour ajouter un nouveau type de bien / équipement : ajouter la `value` ici **et**
> dans `packages/widget/src/form-config.ts`, puis recompiler le widget.

## 4. Redémarrer
Les tenants sont chargés au démarrage → redéployer / relancer le service.
