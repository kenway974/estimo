import Fastify, { type FastifyInstance } from 'fastify';
import fs from 'node:fs';
import path from 'node:path';
import fastifyStatic from '@fastify/static';
import { env } from './config/env';
import { loadTenants } from './config/tenants';
import security from './plugins/security';
import corsPlugin from './plugins/cors';
import healthRoutes from './routes/health';
import estimateRoutes from './routes/estimate';
import bookingRoutes from './routes/booking';

/** Construit l'instance Fastify (réutilisable en tests). */
export async function buildApp(): Promise<FastifyInstance> {
  const tenants = loadTenants();

  const app = Fastify({
    trustProxy: true, // Railway/proxy : IP réelle pour la limitation de débit
    logger:
      env.NODE_ENV === 'development'
        ? { level: env.LOG_LEVEL, transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } } }
        : { level: env.LOG_LEVEL },
  });
  app.log.info({ count: tenants.length, ids: tenants.map((t) => t.id) }, 'agences chargees');

  await app.register(security);
  await app.register(corsPlugin);
  await app.register(healthRoutes);
  await app.register(estimateRoutes);
  await app.register(bookingRoutes);

  // Sert le widget compilé : https://<backend>/widget.js + page de démo.
  const widgetDist = process.env.WIDGET_DIST ?? path.resolve(process.cwd(), 'packages/widget/dist');
  if (fs.existsSync(widgetDist)) {
    await app.register(fastifyStatic, { root: widgetDist, prefix: '/' });
    app.log.info({ widgetDist }, 'widget statique servi');
  } else {
    app.log.warn({ widgetDist }, 'widget non compile (npm run build:widget) - assets non servis');
  }

  return app;
}
