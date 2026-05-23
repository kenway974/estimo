import type { CrmProvider, CrmContact } from '../types';

/** Ajoute / met à jour le contact dans une liste Brevo. */
export class BrevoCrmProvider implements CrmProvider {
  constructor(private apiKey: string, private listId?: number, private doubleOptIn = false) {}

  async upsertContact(c: CrmContact): Promise<void> {
    // Brevo exige le format E.164 pour l'attribut SMS (sinon 400 Invalid phone).
    // On normalise le téléphone et on retombe sur un champ TELEPHONE texte
    // si la conversion échoue (numéro étranger, format inattendu, etc.).
    const e164 = toE164(c.phone);
    const phoneAttrs: Record<string, string> = e164
      ? { SMS: e164, TELEPHONE: c.phone }
      : { TELEPHONE: c.phone };

    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'api-key': this.apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        email: c.email,
        updateEnabled: true,
        listIds: this.listId ? [this.listId] : undefined,
        attributes: { PRENOM: c.firstName, NOM: c.lastName, ...phoneAttrs, ...c.attributes },
      }),
    });
    // 201 (créé) ou 204 (mis à jour) = OK ; 400 "duplicate" toléré.
    if (!res.ok && res.status !== 204) {
      const body = await res.text();
      if (!body.includes('duplicate_parameter')) throw new Error(`Brevo CRM ${res.status}: ${body}`);
    }
  }
}

/**
 * Convertit un numéro de téléphone vers le format E.164 (+33612345678).
 * - Si déjà en +XX… → renvoyé tel quel (nettoyé des espaces/tirets).
 * - Si commence par 00 → remplacé par + (norme internationale).
 * - Si 10 chiffres commençant par 0 → supposé France : "+33" + reste.
 * - Sinon : null (le caller utilisera un champ texte libre).
 */
function toE164(raw: string | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[\s().-]/g, '');
  if (/^\+[1-9]\d{6,14}$/.test(cleaned)) return cleaned; // déjà E.164
  if (/^00[1-9]\d{6,14}$/.test(cleaned)) return '+' + cleaned.slice(2);
  if (/^0[1-9]\d{8}$/.test(cleaned)) return '+33' + cleaned.slice(1); // France 10 chiffres
  return null;
}
