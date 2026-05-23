# Intégrer le widget d'estimation sur le site d'une agence

Le widget fonctionne sur **n'importe quel site** (WordPress, PrestaShop, framework,
sur-mesure). Deux méthodes : balise `<script>` (recommandée) ou `<iframe>` (repli).

## Méthode 1 — Script (recommandée)

Coller ce bloc là où le formulaire doit apparaître :

```html
<div id="estimo-widget"></div>
<script
  src="https://VOTRE-BACKEND.up.railway.app/widget.js"
  data-estimo
  data-tenant="demo"
  data-api="https://VOTRE-BACKEND.up.railway.app"
  data-primary="#2563eb"
  data-target="#estimo-widget"
  defer></script>
```

| Attribut       | Rôle                                                        |
|----------------|-------------------------------------------------------------|
| `data-estimo`  | marque le script à initialiser (obligatoire)                |
| `data-tenant`  | identifiant de l'agence (obligatoire)                       |
| `data-api`     | URL du backend (par défaut : l'origine du script)           |
| `data-primary` | couleur principale du widget (optionnel)                    |
| `data-target`  | sélecteur du conteneur (par défaut `#estimo-widget`)        |
| `data-key`     | clé publique si l'agence en a configuré une (optionnel)     |

Le style est isolé dans un **Shadow DOM** : aucune interférence avec le thème du site.

### WordPress
Coller le bloc dans un bloc « HTML personnalisé » (éditeur Gutenberg) ou via un
plugin type *Code Snippets*. Eviter le mode « éditeur visuel » qui peut filtrer les balises.

### PrestaShop
Ajouter le bloc dans un module HTML libre ou dans le template de la page concernée.

## Méthode 2 — iframe (repli)

```html
<iframe src="https://VOTRE-BACKEND.up.railway.app/?tenant=demo&primary=%232563eb"
        style="width:100%;max-width:560px;height:760px;border:0" title="Estimation"></iframe>
```

## Pré-requis côté backend (à faire une fois par agence)
- Déclarer le domaine du site dans `allowedDomains` (`tenants/<id>.json`).
- Renseigner les secrets mail / CRM en variables d'environnement (voir [ADDING-A-TENANT.md](./ADDING-A-TENANT.md)).

## Ce que le prospect reçoit

Après soumission du formulaire :
1. **Estimation à l'écran** (fourchette basse / haute / centrée).
2. **Email transactionnel** envoyé sous quelques secondes, avec :
   - Le récap HTML brandé aux couleurs de l'agence.
   - Un **PDF d'estimation A4 brandé** en pièce jointe (logo, sections "Votre bien" + "Notre estimation", disclaimer non-contractuel).
3. **Lead transmis au CRM de l'agence** avec attributs `PRENOM`, `NOM`, `SMS` (au format E.164), `TELEPHONE`, `VILLE`, `SURFACE`, `TYPE_BIEN`, `ESTIMATION` — prêts pour les campagnes de relance et la segmentation.

## RGPD et mentions légales

Le formulaire intègre une **case de consentement explicite** (obligatoire avant
soumission). L'agence (responsable de traitement) doit publier ses propres
mentions légales et politique de confidentialité ; Estimo fournit des **templates
à personnaliser** :

- [Mentions légales](./MENTIONS-LEGALES.md)
- [Politique de confidentialité](./CONFIDENTIALITE.md)

> L'estimation est **indicative** (non contractuelle). Ces points sont rappelés
> dans le mail HTML, dans le PDF joint, et dans la politique de confidentialité.
