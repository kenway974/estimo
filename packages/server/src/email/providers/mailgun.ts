import type { MailProvider, MailAttachment } from '../types';

/** Envoi via l'API Mailgun (domaine + clé requis). */
export class MailgunProvider implements MailProvider {
  constructor(private apiKey: string, private domain: string, private from: string, private replyTo?: string) {}
  async send(o: {
    to: string;
    subject: string;
    html: string;
    text: string;
    attachments?: MailAttachment[];
  }): Promise<void> {
    const auth = Buffer.from(`api:${this.apiKey}`).toString('base64');
    // Mailgun supporte aussi le multipart/form-data, requis dès qu'il y a des
    // pièces jointes. On utilise FormData (natif Node 20+) pour gérer les deux cas.
    const form = new FormData();
    form.set('from', this.from);
    form.set('to', o.to);
    form.set('subject', o.subject);
    form.set('text', o.text);
    form.set('html', o.html);
    if (this.replyTo) form.set('h:Reply-To', this.replyTo);
    for (const a of o.attachments ?? []) {
      form.append(
        'attachment',
        new Blob([new Uint8Array(a.content)], { type: a.contentType ?? 'application/octet-stream' }),
        a.filename,
      );
    }
    const res = await fetch(`https://api.mailgun.net/v3/${this.domain}/messages`, {
      method: 'POST',
      headers: { authorization: `Basic ${auth}` },
      body: form,
    });
    if (!res.ok) throw new Error(`Mailgun ${res.status}: ${await res.text()}`);
  }
}
