# Estimo — Widget d'estimation immobilière multi-agences

Solution clé en main, revendable à des agences immobilières : un **formulaire
d'estimation embarquable** sur n'importe quel site + un **backend Node.js** qui
calcule l'estimation, l'**envoie par email au prospect**, et **pousse le lead**
dans l'outil de mailing de l'agence (Brevo, Mailchimp, SendGrid, Mailgun, SMTP).

- **Multi-agences** : un seul backend pour toutes les agences (1 fichier de config par agence, pas de base de données).
- **Intégrable partout** : balise `<script>` (Shadow DOM, zéro conflit CSS/JS) ou `<iframe>`.
- **Coefficients d'estimation 100 % configurables** sans toucher au code.
- **Déploiement Railway** en un seul service.

## Stack
- **Backend** : Node 20 + Fastify 5 + TypeScript, validation **Zod**, logs **pino**, `helmet` + CORS allowlist + rate-limit.
- **Widget** : TypeScript vanilla, build **Vite** (bundle IIFE autonome), rendu en Shadow DOM.
- **Email / CRM** : architecture *provider* (adaptateurs interchangeables).

## Structure
```
estimo/
├─ packages/
│  ├─ server/      # API Fastify (estimation, email, CRM, multi-tenant)
│  └─ widget/      # widget embarquable (Vite) + page de démo
├─ tenants/        # 1 config .json par agence (sans secrets)
├─ docs/           # INTEGRATION.md (agences) · ADDING-A-TENANT.md
├─ Dockerfile · railway.json · .env.example
```

## Comment ça marche
1. L'utilisateur remplit le formulaire (bien + coordonnées + consentement RGPD).
2. Le widget envoie les données à `POST /api/estimate`.
3. Le backend identifie l'agence (`tenantId` + contrôle de l'`Origin`), valide, **calcule** l'estimation à partir des coefficients de l'agence.
4. Il **envoie l'estimation par email au prospect**.
5. Il **pousse le lead** dans le CRM/mailing de l'agence (pour relances, campagnes, segmentation).
6. Réponse JSON `{ estimate, emailSent }` → le widget affiche la fourchette.

## Démarrage local
Pré-requis : Node ≥ 20.

```bash
npm install
cp .env.example .env        # renseigner au moins DEMO_SMTP_URL
npm run build:widget        # génère packages/widget/dist/widget.js
npm run dev                 # API sur http://localhost:8080
```
Démo du widget : http://localhost:8080/ (tenant `demo`).
Dev du widget avec rechargement : `npm run dev:widget`.

### Scripts
| Commande              | Effet                                   |
|-----------------------|-----------------------------------------|
| `npm run dev`         | API en watch (tsx)                      |
| `npm run dev:widget`  | widget en watch (Vite)                  |
| `npm run build`       | build widget + serveur                  |
| `npm start`           | lance l'API compilée                    |
| `npm run typecheck`   | vérifie les types (serveur + widget)    |

## Variables d'environnement
Voir `.env.example`. Variables serveur (`PORT`, `LOG_LEVEL`, `TENANTS_DIR`,
`RATE_LIMIT_MAX`…) + **secrets par agence** préfixés par l'id en MAJUSCULES
(`DEMO_SMTP_URL`, `ACME_MAIL_API_KEY`, `ACME_CRM_API_KEY`…). Détail dans `tenants/README.md`.

## Déploiement Railway
1. Pousser le repo, puis sur Railway : **New Project → Deploy from GitHub**.
2. Railway détecte le `Dockerfile` (cf. `railway.json`, healthcheck `/health`).
3. Onglet **Variables** : ajouter `NODE_ENV=production` + les secrets de chaque agence.
4. Déployer. Le widget est servi sur `https://<service>.up.railway.app/widget.js`.

> **Alternatives** : Render / Fly.io (Docker identique) ou tout hôte Node
> (`npm install && npm run build && npm start`). Le `Dockerfile` est standard.

## Intégration côté agence
Voir **`docs/INTEGRATION.md`** (script + iframe, WordPress, PrestaShop).
Ajouter une agence : **`docs/ADDING-A-TENANT.md`**.

## Personnaliser le calcul
Tout est dans le bloc `estimation` de `tenants/<id>.json` (prix au m², zones,
types, état, équipements, fourchette). L'estimateur est *pluggable* : on peut
brancher une API externe (DVF…) dans `packages/server/src/estimation/` sans rien
changer d'autre.

## Sécurité
- Validation systématique des entrées (Zod), côté serveur.
- CORS en allowlist (domaines déclarés par agence) + rate-limiting par IP.
- En-têtes `helmet` (HSTS, noSniff, Referrer-Policy…). `frameguard`/CSP désactivés volontairement car le widget est embarqué sur des sites tiers.
- Aucun secret en clair dans le code : tout passe par les variables d'environnement.
- La clé publique du widget est visible côté navigateur **par conception** : le vrai garde-fou est la liste de domaines autorisés.

## Dépannage
- **Le widget ne s'affiche pas** : vérifier que `widget.js` est bien servi (`npm run build:widget`) et le sélecteur `data-target`.
- **403 `origine_non_autorisee`** : ajouter le domaine du site dans `allowedDomains`.
- **Email non reçu** : vérifier les secrets du provider ; les erreurs d'envoi sont loguées (l'estimation reste renvoyée).

## Licence
MIT — voir `LICENSE`.
