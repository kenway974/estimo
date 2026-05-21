import type { MailProvider } from '../types';

/** Envoi via l'API SendGrid v3. */
export class SendgridProvider implements MailProvider {
  constructor(private apiKey: string, private fromEmail: string, private fromName: string, private replyTo?: string) {}
  async send(o: { to: string; subject: string; html: string; text: string }): Promise<void> {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: o.to }] }],
        from: { email: this.fromEmail, name: this.fromName },
        reply_to: this.replyTo ? { email: this.replyTo } : undefined,
        subject: o.subject,
        content: [
          { type: 'text/plain', value: o.text },
          { type: 'text/html', value: o.html },
        ],
      }),
    });
    if (!res.ok) throw new Error(`SendGrid ${res.status}: ${await res.text()}`);
  }
}
