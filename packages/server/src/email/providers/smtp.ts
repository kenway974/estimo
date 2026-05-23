import nodemailer from 'nodemailer';
import type { MailProvider, MailAttachment } from '../types';

/** Envoi via SMTP classique (compatible n'importe quel serveur mail). */
export class SmtpProvider implements MailProvider {
  private transport: nodemailer.Transporter;
  constructor(smtpUrl: string, private from: string) {
    // smtpUrl ex : smtps://user:pass@smtp.exemple.com:465
    this.transport = nodemailer.createTransport(smtpUrl);
  }
  async send(o: { to: string; subject: string; html: string; text: string; attachments?: MailAttachment[] }): Promise<void> {
    await this.transport.sendMail({
      from: this.from,
      to: o.to,
      subject: o.subject,
      html: o.html,
      text: o.text,
      attachments: o.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });
  }
}
