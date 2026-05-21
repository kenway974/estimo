import type { CrmProvider, CrmContact } from '../types';

/** Aucun CRM configuré : on ne fait rien (le lead reste dans les logs). */
export class NoopCrmProvider implements CrmProvider {
  async upsertContact(_c: CrmContact): Promise<void> {
    /* intentionnellement vide */
  }
}
