import { z } from 'zod';
import path from 'node:path';

/**
 * Validation des variables d'environnement au démarrage.
 * Le process s'arrête immédiatement si une variable obligatoire manque
 * ou est mal formée -> on échoue tôt plutôt qu'en pleine requête.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(8080),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  // Dossier contenant les fichiers de configuration des agences (1 .json par agence).
  TENANTS_DIR: z.string().default(path.resolve(process.cwd(), 'tenants')),
  // Limite de requêtes par IP et par minute sur l'API publique.
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console -- avant que le logger ne soit prêt
  console.error('[env] Configuration invalide :', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
