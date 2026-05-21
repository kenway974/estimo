import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { env } from '../config/env';
import { allAllowedOrigins } from '../config/tenants';

/**
 * CORS dynamique : on n'autorise que l'union des domaines déclarés par les
 * agences. Les requêtes sans Origin (serveur, curl) sont laissées passer.
 */
export default fp(async (app) => {
  const allowed = allAllowedOrigins();
  await app.register(cors, {
    methods: ['POST', 'GET', 'OPTIONS'],
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (env.NODE_ENV === 'development') return cb(null, true);
      return cb(null, allowed.has(origin));
    },
  });
});
