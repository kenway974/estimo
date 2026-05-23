import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { env } from './env';
import { EstimationConfigSchema } from '../estimation/types';

/**
 * Configuration d'une agence (tenant). Les valeurs NON sensibles vivent dans
 * tenants/<id>.json (versionné). Les SECRETS (clés API mailing/CRM, SMTP) sont
 * injectés via variables d'environnement, par convention :
 *   <ID_MAJUSCULE>_MAIL_API_KEY, <ID>_SMTP_URL, <ID>_CRM_API_KEY, <ID>_PUBLIC_KEY
 * Exemple pour l'agence "demo" -> DEMO_MAIL_API_KEY, DEMO_SMTP_URL, ...
 */
export const TenantFileSchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]+$/, 'id en minuscules: a-z 0-9 _ -'),
  name: z.string().min(1),
  // Domaines autorisés à appeler l'API (Origin). C'est LE garde-fou principal
  // car la clé publique du widget est, par nature, visible côté navigateur.
  allowedDomains: z.array(z.string().url()).min(1),
  branding: z.object({
    displayName: z.string().min(1),
    primaryColor: z.string().default('#2563eb'),
    accentColor: z.string().default('#1e40af'),
    logoUrl: z.string().url().optional(),
  }),
  mail: z.object({
    provider: z.enum(['smtp', 'brevo', 'sendgrid', 'mailgun']),
    fromEmail: z.string().email(),
    fromName: z.string().min(1),
    replyTo: z.string().email().optional(),
    mailgunDomain: z.string().optional(), // requis si provider = mailgun
  }),
  crm: z.object({
    provider: z.enum(['brevo', 'mailchimp', 'none']).default('none'),
    listId: z.union([z.string(), z.number()]).optional(),
    mailchimpServerPrefix: z.string().optional(), // ex "us21", requis si mailchimp
    doubleOptIn: z.boolean().default(false),
  }),
  estimation: EstimationConfigSchema,
});

export type TenantConfig = z.infer<typeof TenantFileSchema> & { secrets: TenantSecrets };

export interface TenantSecrets {
  publicKey?: string;
  mailApiKey?: string;
  smtpUrl?: string;
  crmApiKey?: string;
}

function readSecrets(id: string): TenantSecrets {
  const p = id.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  return {
    publicKey: process.env[`${p}_PUBLIC_KEY`],
    mailApiKey: process.env[`${p}_MAIL_API_KEY`],
    smtpUrl: process.env[`${p}_SMTP_URL`],
    crmApiKey: process.env[`${p}_CRM_API_KEY`],
  };
}

const tenants = new Map<string, TenantConfig>();

/** Charge et valide tous les fichiers tenants/<id>.json au démarrage. */
export function loadTenants(): TenantConfig[] {
  const dir = env.TENANTS_DIR;
  if (!fs.existsSync(dir)) {
    throw new Error(`[tenants] Dossier introuvable : ${dir}`);
  }
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && !f.endsWith('.secret.json') && !f.endsWith('.market-stats.json'));
  tenants.clear();
  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const cfg = TenantFileSchema.parse(raw);
    if (file !== `${cfg.id}.json`) {
      throw new Error(`[tenants] ${file} : le nom de fichier doit valoir ${cfg.id}.json`);
    }
    tenants.set(cfg.id, { ...cfg, secrets: readSecrets(cfg.id) });
  }
  if (tenants.size === 0) throw new Error(`[tenants] Aucune agence configurée dans ${dir}`);
  return [...tenants.values()];
}

export function getTenant(id: string): TenantConfig | undefined {
  return tenants.get(id);
}

/** Union de tous les domaines autorisés (pour la politique CORS globale). */
export function allAllowedOrigins(): Set<string> {
  const set = new Set<string>();
  for (const t of tenants.values()) for (const d of t.allowedDomains) set.add(new URL(d).origin);
  return set;
}
