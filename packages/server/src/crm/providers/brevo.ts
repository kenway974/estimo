import type { CrmProvider, CrmContact } from '../types';

/** Ajoute / met à jour le contact dans une liste Brevo. */
export class BrevoCrmProvider implements CrmProvider {
  constructor(private apiKey: string, private listId?: number, private doubleOptIn = false) {}
  async upsertContact(c: CrmContact): Promise<void> {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': this.apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        email: c.email,
        updateEnabled: true,
        listIds: this.listId ? [this.listId] : undefined,
        attributes: { PRENOM: c.firstName, NOM: c.lastName, SMS: c.phone, ...c.attributes },
      }),
    });
    // 201 (créé) ou 204 (mis à jour) = OK ; 400 "duplicate" toléré.
    if (!res.ok && res.status !== 204) {
      const body = await res.text();
      if (!body.includes('duplicate_parameter')) throw new Error(`Brevo CRM ${res.status}: ${body}`);
    }
  }
}
