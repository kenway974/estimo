import type { MailProvider, MailMessage } from '../types';

/** Envoi via l'API transactionnelle Brevo (ex-Sendinblue). */
export class BrevoMailProvider implements MailProvider {
  constructor(private apiKey: string, private fromEmail: string, private fromName: string, private replyTo?: string) {}
  async send(o: MailMessage): Promise<void> {
    const replyTo = o.replyTo ?? this.replyTo;
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': this.apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { email: this.fromEmail, name: this.fromName },
        to: [{ email: o.to }],
        replyTo: replyTo ? { email: replyTo } : undefined,
        subject: o.subject,
        htmlContent: o.html,
        textContent: o.text,
        // Brevo attend les pièces jointes au format { name, content (base64) }.
        attachment: o.attachments?.map((a) => ({
          name: a.filename,
          content: a.content.toString('base64'),
        })),
      }),
    });
    if (!res.ok) throw new Error(`Brevo email ${res.status}: ${await res.text()}`);
  }
}
