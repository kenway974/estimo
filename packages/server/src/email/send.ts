import type { FastifyBaseLogger } from 'fastify';
import type { MailMessage, MailProvider } from './types';

/** Erreur de configuration (clé invalide, expéditeur refusé) : réessayer ne sert à rien. */
function isPermanent(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  // Les providers remontent "Brevo email 401: ...", "SendGrid 403: ...", etc.
  if (/\b(400|401|402|403|404|422)\b/.test(msg)) return true;
  if (/manquant|invalid.?api.?key|unauthorized|forbidden/i.test(msg)) return true;
  return false;
}

/**
 * Envoie un mail avec UN réessai sur échec transitoire (réseau coupé, 5xx du
 * provider, timeout). On ne réessaie pas une erreur de configuration : la
 * deuxième tentative échouerait pareil et retarderait la réponse pour rien.
 *
 * Renvoie true si le mail est parti. Ne lève jamais : l'appelant décide quoi
 * faire d'un échec, et une estimation reste due au prospect même sans mail.
 */
export async function sendMail(
  provider: MailProvider,
  message: MailMessage,
  log: FastifyBaseLogger,
  contexte: Record<string, unknown> = {},
): Promise<boolean> {
  try {
    await provider.send(message);
    return true;
  } catch (err) {
    if (isPermanent(err)) {
      log.error({ err, ...contexte, destinataire: message.to }, 'envoi mail impossible (configuration) - pas de reessai');
      return false;
    }
    log.warn({ err, ...contexte, destinataire: message.to }, 'envoi mail en echec - nouvelle tentative');
    await new Promise((r) => setTimeout(r, 500));
    try {
      await provider.send(message);
      log.info({ ...contexte, destinataire: message.to }, 'envoi mail reussi au 2e essai');
      return true;
    } catch (err2) {
      log.error({ err: err2, ...contexte, destinataire: message.to }, 'envoi mail definitivement en echec');
      return false;
    }
  }
}
