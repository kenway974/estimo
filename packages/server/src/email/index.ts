import type { TenantConfig } from '../config/tenants';
import type { MailProvider } from './types';
import { SmtpProvider } from './providers/smtp';
import { BrevoMailProvider } from './providers/brevo';
import { SendgridProvider } from './providers/sendgrid';
import { MailgunProvider } from './providers/mailgun';

/** Fabrique le fournisseur d'email selon la config de l'agence. */
export function createMailProvider(t: TenantConfig): MailProvider {
  const from = `"${t.mail.fromName}" <${t.mail.fromEmail}>`;
  const key = t.secrets.mailApiKey;
  switch (t.mail.provider) {
    case 'smtp':
      if (!t.secrets.smtpUrl) throw new Error(`[${t.id}] SMTP_URL manquant`);
      return new SmtpProvider(t.secrets.smtpUrl, from);
    case 'brevo':
      if (!key) throw new Error(`[${t.id}] MAIL_API_KEY (Brevo) manquant`);
      return new BrevoMailProvider(key, t.mail.fromEmail, t.mail.fromName, t.mail.replyTo);
    case 'sendgrid':
      if (!key) throw new Error(`[${t.id}] MAIL_API_KEY (SendGrid) manquant`);
      return new SendgridProvider(key, t.mail.fromEmail, t.mail.fromName, t.mail.replyTo);
    case 'mailgun':
      if (!key || !t.mail.mailgunDomain) throw new Error(`[${t.id}] MAIL_API_KEY ou mailgunDomain manquant`);
      return new MailgunProvider(key, t.mail.mailgunDomain, from, t.mail.replyTo);
  }
}

export * from './types';
export { renderEstimationEmail } from './templates/estimation';
export { renderEstimationPdf } from './templates/estimation-pdf';
