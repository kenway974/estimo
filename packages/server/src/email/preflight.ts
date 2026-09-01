import type { TenantConfig } from '../config/tenants';

export interface MailProblem {
  tenantId: string;
  /** `error` : aucun mail ne partira. `warn` : ça part, mais quelque chose cloche. */
  level: 'error' | 'warn';
  message: string;
  /** Ce que l'exploitant doit faire, concrètement. */
  fix: string;
}

/**
 * Contrôle de la configuration mail d'une agence, SANS rien envoyer.
 *
 * Sans ce contrôle, une clé absente ou mal formée ne se manifestait qu'à la
 * première estimation, dans une erreur avalée par le `try` de la route : le
 * prospect voyait son prix, personne ne recevait de mail, et rien ne le disait.
 * On veut savoir au démarrage.
 */
export function checkTenantMail(t: TenantConfig): MailProblem[] {
  const out: MailProblem[] = [];
  const prefix = t.id.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  const { mailApiKey, smtpUrl } = t.secrets;

  const err = (message: string, fix: string) => out.push({ tenantId: t.id, level: 'error', message, fix });
  const warn = (message: string, fix: string) => out.push({ tenantId: t.id, level: 'warn', message, fix });

  switch (t.mail.provider) {
    case 'smtp':
      if (!smtpUrl) {
        err(`SMTP_URL absent`, `définir ${prefix}_SMTP_URL (smtps://user:pass@hote:465)`);
      } else if (!/^smtps?:\/\/.+@.+/.test(smtpUrl)) {
        err(`SMTP_URL mal formée`, `format attendu : smtps://utilisateur:motdepasse@hote:port`);
      }
      break;

    case 'brevo':
      if (!mailApiKey) {
        err(`clé API Brevo absente`, `définir ${prefix}_MAIL_API_KEY depuis l'onglet "API Keys" de Brevo`);
      } else if (mailApiKey.startsWith('xsmtpsib-')) {
        // Le piège classique : les clés SMTP Brevo ne fonctionnent pas sur l'API.
        err(
          `clé SMTP Brevo (xsmtpsib-) utilisée à la place d'une clé API`,
          `récupérer une clé "xkeysib-..." dans Brevo > SMTP & API > API Keys`,
        );
      } else if (!mailApiKey.startsWith('xkeysib-')) {
        warn(`la clé Brevo ne commence pas par "xkeysib-"`, `vérifier qu'il s'agit bien d'une clé API Brevo`);
      }
      break;

    case 'sendgrid':
      if (!mailApiKey) err(`clé API SendGrid absente`, `définir ${prefix}_MAIL_API_KEY`);
      break;

    case 'mailgun':
      if (!mailApiKey) err(`clé API Mailgun absente`, `définir ${prefix}_MAIL_API_KEY`);
      if (!t.mail.mailgunDomain) err(`mailgunDomain absent`, `ajouter "mailgunDomain" au bloc mail du tenant`);
      break;
  }

  if (!t.agencyEmail) {
    warn(
      `agencyEmail absent — les leads partiront sur ${t.mail.fromEmail}`,
      `ajouter "agencyEmail" au tenant pour router les leads vers une boîte relevée`,
    );
  }

  if (t.crm.provider !== 'none' && !t.secrets.crmApiKey) {
    warn(`CRM ${t.crm.provider} configuré mais clé absente`, `définir ${prefix}_CRM_API_KEY`);
  }

  return out;
}

/** Contrôle toutes les agences d'un coup. */
export function checkAllTenantsMail(tenants: TenantConfig[]): MailProblem[] {
  return tenants.flatMap(checkTenantMail);
}
