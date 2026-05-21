import type { TenantConfig } from '../config/tenants';
import type { CrmProvider } from './types';
import { NoopCrmProvider } from './providers/noop';
import { BrevoCrmProvider } from './providers/brevo';
import { MailchimpCrmProvider } from './providers/mailchimp';

/** Fabrique le connecteur CRM selon la config de l'agence. */
export function createCrmProvider(t: TenantConfig): CrmProvider {
  const key = t.secrets.crmApiKey;
  switch (t.crm.provider) {
    case 'none':
      return new NoopCrmProvider();
    case 'brevo':
      if (!key) throw new Error(`[${t.id}] CRM_API_KEY (Brevo) manquant`);
      return new BrevoCrmProvider(key, t.crm.listId ? Number(t.crm.listId) : undefined, t.crm.doubleOptIn);
    case 'mailchimp':
      if (!key || !t.crm.listId || !t.crm.mailchimpServerPrefix)
        throw new Error(`[${t.id}] CRM_API_KEY, listId ou mailchimpServerPrefix manquant`);
      return new MailchimpCrmProvider(key, String(t.crm.listId), t.crm.mailchimpServerPrefix, t.crm.doubleOptIn);
  }
}

export * from './types';
