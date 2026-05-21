# Dossier `tenants/`

Un fichier `<id>.json` = une agence. Le nom du fichier **doit** valoir `<id>.json`
(ex : agence `demo` → `demo.json`). Ces fichiers ne contiennent **aucun secret**
(uniquement coefficients, branding, domaines, choix de providers).

Les **secrets** (clés API mailing/CRM, URL SMTP) sont fournis par variables
d'environnement, par convention `ID_EN_MAJUSCULES_*` :

| Variable                | Quand                          |
|-------------------------|--------------------------------|
| `DEMO_PUBLIC_KEY`       | optionnel (clé publique widget)|
| `DEMO_SMTP_URL`         | si `mail.provider = smtp`      |
| `DEMO_MAIL_API_KEY`     | si Brevo / SendGrid / Mailgun  |
| `DEMO_CRM_API_KEY`      | si `crm.provider` ≠ none       |

➡️ Pour ajouter une agence : voir `../docs/ADDING-A-TENANT.md`.
