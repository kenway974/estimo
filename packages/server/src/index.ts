import { buildApp } from './app';
import { env } from './config/env';

async function main(): Promise<void> {
  const app = await buildApp();
  try {
    await app.listen({ host: env.HOST, port: env.PORT });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
  for (const sig of ['SIGINT', 'SIGTERM'] as const) {
    process.on(sig, () => {
      app.log.info('arret en cours...');
      void app.close().then(() => process.exit(0));
    });
  }
}

void main();
