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
- Renseigner les secrets mailing/CRM en variables d'environnement.

> L'estimation est **indicative** (non contractuelle). Le prospect reçoit son
> estimation par email ; ses coordonnées sont poussées dans l'outil mailing de l'agence.
