# Ajouter une nouvelle agence (tenant)

Aucune base de données : une agence = un fichier de config + ses secrets en env.

## 1. Créer `tenants/<id>.json`

Copier un tenant existant (`tenants/demo-idf.json` recommandé comme baseline IDF
calibrée) et adapter. `id` en minuscules (`a-z 0-9 _ -`),
le **nom de fichier doit valoir `<id>.json`**.

```jsonc
{
  "id": "acme",
  "name": "Agence Acme",
  "allowedDomains": [
    "https://www.acme-immo.fr",
    "https://acme-immo.fr"
  ],
  "branding": {
    "displayName": "Acme Immobilier",
    "primaryColor": "#0f766e",
    "accentColor": "#0d6e64",
    "logoUrl": "https://www.acme-immo.fr/logo.png"   // optionnel, affiché dans mail + PDF
  },
  "mail": {
    "provider": "brevo",                             // smtp | brevo | sendgrid | mailgun
    "fromEmail": "contact@acme-immo.fr",
    "fromName": "Acme Immobilier",
    "replyTo": "estimation@acme-immo.fr"             // optionnel
  },
  "crm": {
    "provider": "brevo",                             // none | brevo | mailchimp
    "listId": 5,                                     // id numérique de la liste Brevo (optionnel)
    "doubleOptIn": false
  },
  "estimation": { /* coefficients : voir §3 */ }
}
```

## 2. Renseigner les secrets (variables d'env)

Le préfixe est l'**id du tenant en MAJUSCULES**, avec les tirets remplacés par des
underscores. Exemple pour `id: "acme"` → préfixe `ACME_`. Pour `id: "demo-idf"`
→ préfixe `DEMO_IDF_`.

| Variable                  | Quand                                       |
|---------------------------|---------------------------------------------|
| `ACME_MAIL_API_KEY`       | si `mail.provider` ∈ {brevo, sendgrid, mailgun} |
| `ACME_SMTP_URL`           | si `mail.provider = smtp` (URL `smtps://user:pass@host:port`) |
| `ACME_CRM_API_KEY`        | si `crm.provider ≠ none`                    |
| `ACME_PUBLIC_KEY`         | optionnel (clé publique exigée du widget)   |

Sur Railway : onglet **Variables** du service. Tout changement déclenche un redéploiement automatique.

> 💡 Avec Brevo, la **même clé API** (`xkeysib-...`) peut servir aux deux usages
> (mail + CRM) — il suffit de la coller dans les deux variables. **Attention** :
> les clés SMTP Brevo (`xsmtpsib-...`) ne fonctionnent **pas** pour l'API ; il
> faut une vraie clé API depuis l'onglet "API Keys" de Brevo.

## 3. Régler les coefficients d'estimation

Bloc `estimation` (entièrement modifiable, sans toucher au code) :

- `basePricePerM2.sale` / `.rent` : prix de base au m² (vente / loyer mensuel).
- `propertyType`, `condition` : multiplicateurs (clés = `value` des options du widget).
- `zones` : multiplicateur par **code postal** ou **ville** (minuscule) ; `default` = 1.
- `features` : bonus **additif** (en %) par équipement coché (ex. `0.05` = +5 %).
- `rooms` : `{ reference, perRoomPct }` — bonus par pièce au-delà de la référence.
- `rangePct` : demi-fourchette (ex. `0.08` = ±8 %).

### Calibration automatique (Île-de-France, transposable)

Pour calibrer les coefficients à partir des **vraies transactions immobilières**
publiques (base DVF de data.gouv.fr) :

```bash
npm run calibrate:dvf
```

→ Télécharge ~30 MB (8 départements IDF × 3 ans), filtre les ventes Appart/Maison
mono-lot, calcule la médiane prix/m² par code postal, et écrit `tenants/demo-idf.json`
+ un rapport lisible `scripts/dvf-output/report.md`.

Pour calibrer un autre département (ex. 13 Bouches-du-Rhône) : éditer la constante
`DEPARTMENTS` dans `scripts/calibrate-dvf.ts` et relancer.

> Pour ajouter un nouveau type de bien / équipement : ajouter la `value` ici **et**
> dans `packages/widget/src/form-config.ts`, puis recompiler le widget.

## 4. Vérifier en local

```bash
npm run dev
# Test estimation + email + push CRM :
curl -X POST http://localhost:8080/api/estimate -H "content-type: application/json" -d '{
  "tenantId": "acme",
  "transaction": "sale",
  "propertyType": "appartement",
  "surface": 75, "rooms": 3, "condition": "bon",
  "postalCode": "75015", "city": "Paris",
  "features": ["balcon", "parking"],
  "firstName": "Jean", "lastName": "Test",
  "email": "test@example.com", "phone": "0612345678",
  "consent": true
}'
```

Réponse attendue : `{ "estimate": { ... }, "emailSent": true }`. Vérifier ensuite
la boîte mail destinataire (mail + PDF joint) et le contact créé dans le CRM.

## 5. Redéployer

Les tenants sont chargés au démarrage → push sur GitHub déclenche un redéploiement
automatique sur Railway.

## 6. Communiquer le snippet à l'agence

Lui envoyer son snippet d'intégration personnalisé (voir [INTEGRATION.md](./INTEGRATION.md))
avec son `data-tenant`, `data-primary` (sa couleur), et l'URL de votre backend.
