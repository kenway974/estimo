import type { MailProvider } from '../types';

/** Envoi via l'API Mailgun (domaine + clé requis). */
export class MailgunProvider implements MailProvider {
  constructor(private apiKey: string, private domain: string, private from: string, private replyTo?: string) {}
  async send(o: { to: string; subject: string; html: string; text: string }): Promise<void> {
    const form = new URLSearchParams();
    form.set('from', this.from);
    form.set('to', o.to);
    form.set('subject', o.subject);
    form.set('text', o.text);
    form.set('html', o.html);
    if (this.replyTo) form.set('h:Reply-To', this.replyTo);
    const auth = Buffer.from(`api:${this.apiKey}`).toString('base64');
    const res = await fetch(`https://api.mailgun.net/v3/${this.domain}/messages`, {
      method: 'POST',
      headers: { authorization: `Basic ${auth}`, 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    if (!res.ok) throw new Error(`Mailgun ${res.status}: ${await res.text()}`);
  }
}
