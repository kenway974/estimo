import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { env } from '../config/env';

/**
 * En-têtes de sécurité + limitation de débit.
 * Note : frameguard et CSP sont désactivés car le widget est, par conception,
 * embarqué sur des sites tiers (script cross-origin + iframe de secours).
 * On conserve HSTS, noSniff, Referrer-Policy, etc.
 */
export default fp(async (app) => {
  await app.register(helmet, {
    contentSecurityPolicy: false,
    frameguard: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: '1 minute',
    allowList: (req) => req.url === '/health',
  });
});
