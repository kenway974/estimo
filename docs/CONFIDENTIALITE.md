# Politique de confidentialité — Estimo

> ⚠️ **Document à personnaliser** : remplace les `[À REMPLIR : …]` par tes informations
> avant publication. Conforme au RGPD (UE 2016/679) et à la Loi Informatique et Libertés
> modifiée (FR).

_Dernière mise à jour : [À REMPLIR : JJ/MM/AAAA]_

## 1. Qui fait quoi (rôles RGPD)

Le widget Estimo collecte des données personnelles dans un cadre précis :

| Rôle RGPD | Qui ? | Pour quoi ? |
|---|---|---|
| **Personne concernée** | Le prospect qui remplit le formulaire d'estimation | Obtenir une estimation indicative |
| **Responsable de traitement** | L'**agence immobilière** qui intègre le widget sur son site | Capter et exploiter le lead commercial |
| **Sous-traitant (art. 28)** | **Estimo** (cet outil) | Calculer l'estimation, envoyer l'email au prospect, transmettre le lead au CRM de l'agence |
| **Sous-traitants ultérieurs** | Le prestataire mail/CRM choisi par l'agence : **Brevo**, SendGrid, Mailchimp, Mailgun, ou autre SMTP | Délivrer l'email d'estimation et stocker le contact |
| **Hébergeur** | **Railway Corporation** (USA), région [À REMPLIR : europe-west4 / …] | Hébergement de l'API et du widget |

> Si tu utilises Brevo (par défaut chez Estimo) : les données sont stockées **dans l'Union Européenne** (datacenters Brevo France/Allemagne).

## 2. Données collectées

Lors de la soumission du formulaire, sont transmises au serveur :

| Catégorie | Champ | Origine |
|---|---|---|
| Identité | Prénom, nom | Saisie prospect |
| Contact | Email, téléphone | Saisie prospect |
| Bien | Type, transaction (vente/location), surface, nombre de pièces, état, code postal, ville, équipements | Saisie prospect |
| Métadonnée | Adresse IP, User-Agent (logs serveur), horodatage | Automatique |

Aucune donnée sensible au sens du RGPD (santé, opinions politiques, etc.) n'est collectée.

## 3. Finalités et base légale

| Finalité | Base légale (art. 6 RGPD) |
|---|---|
| Calculer et envoyer l'estimation par email | **Consentement** explicite (case à cocher du formulaire) |
| Transmettre le lead au CRM de l'agence pour relances commerciales | **Consentement** explicite (même case à cocher) |
| Journalisation technique (logs serveur) | **Intérêt légitime** d'Estimo (sécurité, debug, lutte contre l'abus) |

## 4. Destinataires

Les données sont accessibles à :

1. **L'agence immobilière** destinataire (responsable de traitement) — par email puis via son CRM.
2. **Estimo** (sous-traitant) — uniquement le temps de traiter la requête (calcul + transmission). Aucun stockage persistant côté Estimo en dehors des logs techniques.
3. **Le prestataire d'envoi mail/CRM** choisi par l'agence (Brevo, etc.) — selon ses propres politiques de confidentialité.

Les données ne sont **jamais revendues** à des tiers.

## 5. Transferts hors UE

- **Brevo (par défaut)** : stockage en **UE** — pas de transfert hors UE.
- **Railway (hébergeur)** : société américaine, mais le déploiement peut être configuré en région européenne. Le transfert vers les USA, si applicable, est encadré par les **clauses contractuelles types** de la Commission européenne et le cadre **Data Privacy Framework** UE-US.

> Si tu choisis un autre provider (SendGrid US, Mailchimp US, etc.), mentionne-le ici explicitement et mets à jour le mécanisme de transfert.

## 6. Durée de conservation

| Donnée | Durée |
|---|---|
| Lead dans le CRM de l'agence | **3 ans** à compter du dernier contact (recommandation CNIL pour la prospection commerciale B2C) |
| Email d'estimation côté prospect | À la discrétion du prospect |
| Logs serveur Estimo | **30 jours** glissants, anonymisés au-delà |
| Sauvegardes hébergeur | Selon la politique Railway (≤ 30 jours) |

À l'issue de ces durées, les données sont supprimées ou anonymisées de façon irréversible.

## 7. Tes droits

En tant que personne concernée, tu disposes des droits suivants (art. 15 à 22 RGPD) :

- **Accès** : obtenir copie des données te concernant.
- **Rectification** : corriger une donnée inexacte.
- **Effacement** (« droit à l'oubli ») : demander la suppression.
- **Limitation** : geler le traitement.
- **Opposition** : refuser un traitement basé sur l'intérêt légitime.
- **Portabilité** : récupérer tes données dans un format structuré.
- **Retrait du consentement** : à tout moment, sans effet rétroactif.
- **Réclamation** auprès de la **CNIL** : <https://www.cnil.fr/fr/plaintes>.

### Comment exercer ces droits

**Pour les leads collectés par une agence** : adresse-toi directement à l'agence concernée (responsable de traitement).

**Pour des questions techniques sur le fonctionnement d'Estimo** :
- Email : [À REMPLIR : dpo@votre-domaine.fr]
- Courrier : [À REMPLIR : adresse postale]

Délai de réponse : **1 mois** à compter de la réception de la demande (prolongeable de 2 mois si la demande est complexe).

## 8. Sécurité

- Transport chiffré **HTTPS/TLS** systématique entre le widget, le serveur, et les prestataires mail/CRM.
- En-têtes de sécurité HTTP (HSTS, Content-Type, Referrer-Policy) via Helmet.
- Validation systématique des entrées côté serveur (Zod).
- Allowlist d'origines par agence : seul un domaine déclaré peut soumettre des leads via le widget.
- Rate-limiting (30 requêtes/minute/IP par défaut) contre l'abus.
- Secrets (clés API, mots de passe SMTP) **jamais en clair** dans le code, uniquement en variables d'environnement.

## 9. Modifications

La présente politique peut être modifiée à tout moment pour refléter une évolution réglementaire ou technique. La date de dernière mise à jour figure en tête de document.

---

📄 Voir aussi : [Mentions légales](./MENTIONS-LEGALES.md) · [CGV B2B](./CGV.md)
