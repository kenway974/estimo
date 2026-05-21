import crypto from 'node:crypto';
import type { CrmProvider, CrmContact } from '../types';

/** Ajoute / met à jour le membre dans une audience Mailchimp. */
export class MailchimpCrmProvider implements CrmProvider {
  constructor(private apiKey: string, private listId: string, private serverPrefix: string, private doubleOptIn = false) {}
  async upsertContact(c: CrmContact): Promise<void> {
    const hash = crypto.createHash('md5').update(c.email.toLowerCase()).digest('hex');
    const url = `https://${this.serverPrefix}.api.mailchimp.com/3.0/lists/${this.listId}/members/${hash}`;
    const auth = Buffer.from(`anystring:${this.apiKey}`).toString('base64');
    const res = await fetch(url, {
      method: 'PUT',
      headers: { authorization: `Basic ${auth}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        email_address: c.email,
        status_if_new: this.doubleOptIn ? 'pending' : 'subscribed',
        merge_fields: { FNAME: c.firstName, LNAME: c.lastName, PHONE: c.phone },
      }),
    });
    if (!res.ok) throw new Error(`Mailchimp ${res.status}: ${await res.text()}`);
  }
}
