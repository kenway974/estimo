import type { TenantConfig } from '../config/tenants';
import { createEstimator, type Estimator } from '../estimation';
import { createMailProvider, type MailProvider } from '../email';
import { createCrmProvider, type CrmProvider } from '../crm';

/**
 * Caches par agence : on construit estimateur / mailer / connecteur CRM une
 * seule fois (ex: le transport SMTP n'est pas recréé à chaque requête).
 */
const estimators = new Map<string, Estimator>();
const mailers = new Map<string, MailProvider>();
const crms = new Map<string, CrmProvider>();

export function getEstimator(t: TenantConfig): Estimator {
  let e = estimators.get(t.id);
  if (!e) { e = createEstimator(t); estimators.set(t.id, e); }
  return e;
}
export function getMailProvider(t: TenantConfig): MailProvider {
  let m = mailers.get(t.id);
  if (!m) { m = createMailProvider(t); mailers.set(t.id, m); }
  return m;
}
export function getCrmProvider(t: TenantConfig): CrmProvider {
  let c = crms.get(t.id);
  if (!c) { c = createCrmProvider(t); crms.set(t.id, c); }
  return c;
}
