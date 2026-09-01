import { describe, it, expect } from 'vitest';
import { checkTenantMail } from '../preflight';
import type { TenantConfig } from '../../config/tenants';

/** Tenant minimal valide, que chaque test dégrade sur un seul point. */
function tenant(patch: Record<string, unknown> = {}): TenantConfig {
  return {
    id: 'acme',
    name: 'Acme',
    allowedDomains: ['https://acme.fr'],
    branding: { displayName: 'Acme', primaryColor: '#000', accentColor: '#111' },
    mail: { provider: 'brevo', fromEmail: 'a@acme.fr', fromName: 'Acme' },
    crm: { provider: 'none', doubleOptIn: false },
    agencyEmail: 'leads@acme.fr',
    estimation: {} as never,
    secrets: { mailApiKey: 'xkeysib-abc' },
    ...patch,
  } as TenantConfig;
}

const errors = (t: TenantConfig) => checkTenantMail(t).filter((p) => p.level === 'error');
const warns = (t: TenantConfig) => checkTenantMail(t).filter((p) => p.level === 'warn');

describe('checkTenantMail', () => {
  it('ne signale rien sur une config correcte', () => {
    expect(checkTenantMail(tenant())).toHaveLength(0);
  });

  it('signale une cle Brevo absente', () => {
    const p = errors(tenant({ secrets: {} }));
    expect(p).toHaveLength(1);
    expect(p[0]?.fix).toContain('ACME_MAIL_API_KEY');
  });

  it('attrape le piege de la cle SMTP Brevo utilisee comme cle API', () => {
    const p = errors(tenant({ secrets: { mailApiKey: 'xsmtpsib-oups' } }));
    expect(p).toHaveLength(1);
    expect(p[0]?.message).toContain('xsmtpsib-');
  });

  it('derive le prefixe des variables depuis l id du tenant', () => {
    const p = errors(tenant({ id: 'demo-idf', secrets: {} }));
    expect(p[0]?.fix).toContain('DEMO_IDF_MAIL_API_KEY');
  });

  it('signale une SMTP_URL absente ou mal formee', () => {
    const sansUrl = { mail: { provider: 'smtp', fromEmail: 'a@acme.fr', fromName: 'A' }, secrets: {} };
    expect(errors(tenant(sansUrl))).toHaveLength(1);

    const urlCassee = { mail: { provider: 'smtp', fromEmail: 'a@acme.fr', fromName: 'A' }, secrets: { smtpUrl: 'pas-une-url' } };
    expect(errors(tenant(urlCassee))).toHaveLength(1);

    const urlOk = { mail: { provider: 'smtp', fromEmail: 'a@acme.fr', fromName: 'A' }, secrets: { smtpUrl: 'smtps://u:p@smtp.acme.fr:465' } };
    expect(errors(tenant(urlOk))).toHaveLength(0);
  });

  it('exige un domaine pour Mailgun', () => {
    const p = errors(tenant({ mail: { provider: 'mailgun', fromEmail: 'a@acme.fr', fromName: 'A' } }));
    expect(p.some((x) => x.message.includes('mailgunDomain'))).toBe(true);
  });

  it('alerte si agencyEmail manque, sans bloquer', () => {
    const t = tenant({ agencyEmail: undefined });
    expect(errors(t)).toHaveLength(0);
    expect(warns(t).some((p) => p.message.includes('agencyEmail'))).toBe(true);
  });

  it('alerte si un CRM est configure sans sa cle', () => {
    const t = tenant({ crm: { provider: 'brevo', doubleOptIn: false } });
    expect(warns(t).some((p) => p.message.includes('CRM'))).toBe(true);
  });
});
