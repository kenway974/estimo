import { describe, it, expect, vi } from 'vitest';
import { sendMail } from '../send';
import type { MailMessage, MailProvider } from '../types';

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() } as never;
const msg: MailMessage = { to: 'prospect@example.com', subject: 's', html: '<p>h</p>', text: 't' };

/** Provider qui échoue les `failures` premiers appels, puis réussit. */
function provider(failures: number, error = new Error('socket hang up')) {
  let calls = 0;
  const p: MailProvider = {
    send: async () => {
      calls += 1;
      if (calls <= failures) throw error;
    },
  };
  return { p, calls: () => calls };
}

describe('sendMail', () => {
  it('renvoie true quand le premier envoi passe', async () => {
    const { p, calls } = provider(0);
    expect(await sendMail(p, msg, log)).toBe(true);
    expect(calls()).toBe(1);
  });

  it('reessaie une fois sur echec transitoire, et reussit', async () => {
    const { p, calls } = provider(1);
    expect(await sendMail(p, msg, log)).toBe(true);
    expect(calls()).toBe(2);
  });

  it('abandonne apres le deuxieme echec, sans lever', async () => {
    const { p, calls } = provider(9);
    expect(await sendMail(p, msg, log)).toBe(false);
    expect(calls()).toBe(2);
  });

  it('ne reessaie pas une erreur de configuration', async () => {
    // Une cle invalide echouera pareil au 2e essai : inutile d'attendre.
    for (const message of ['Brevo email 401: unauthorized', 'SendGrid 403: forbidden', '[demo] MAIL_API_KEY (Brevo) manquant']) {
      const { p, calls } = provider(9, new Error(message));
      expect(await sendMail(p, msg, log), message).toBe(false);
      expect(calls(), message).toBe(1);
    }
  });

  it('reessaie bien un 5xx du provider', async () => {
    const { p, calls } = provider(1, new Error('Brevo email 503: service unavailable'));
    expect(await sendMail(p, msg, log)).toBe(true);
    expect(calls()).toBe(2);
  });

  it('transmet le message tel quel au provider, piece jointe comprise', async () => {
    const recu: MailMessage[] = [];
    const p: MailProvider = { send: async (m) => { recu.push(m); } };
    const avecPj: MailMessage = {
      ...msg,
      replyTo: 'prospect@example.com',
      attachments: [{ filename: 'estimation.pdf', content: Buffer.from('pdf'), contentType: 'application/pdf' }],
    };
    await sendMail(p, avecPj, log);
    expect(recu[0]?.replyTo).toBe('prospect@example.com');
    expect(recu[0]?.attachments?.[0]?.filename).toBe('estimation.pdf');
  });
});
