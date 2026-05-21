import type { MailProvider } from '../types';

/** Envoi via l'API transactionnelle Brevo (ex-Sendinblue). */
export class BrevoMailProvider implements MailProvider {
  constructor(private apiKey: string, private fromEmail: string, private fromName: string, private replyTo?: string) {}
  async send(o: { to: string; subject: string; html: string; text: string }): Promise<void> {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': this.apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: this.fromEmail, name: this.fromName },
        to: [{ email: o.to }],
        replyTo: this.replyTo ? { email: this.replyTo } : undefined,
        subject: o.subject,
        htmlContent: o.html,
        textContent: o.text,
      }),
    });
    if (!res.ok) throw new Error(`Brevo email ${res.status}: ${await res.text()}`);
  }
}
