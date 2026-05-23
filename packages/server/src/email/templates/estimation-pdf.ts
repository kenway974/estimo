// puppeteer-core est ESM-only : on l'importe dynamiquement pour rester
// compatible avec notre build CommonJS. On définit ici l'interface minimale
// dont on a besoin pour ne pas avoir à importer les types puppeteer (qui
// ne passent pas la validation NodeNext depuis un module CJS).
import { existsSync } from 'node:fs';
import type { EstimationEmailData } from '../types';
import { renderEstimationHtml } from './estimation-html';

interface PdfPage {
  setContent(html: string, opts?: { waitUntil?: 'load' | 'domcontentloaded' }): Promise<unknown>;
  pdf(opts: { format: 'A4'; printBackground: boolean; margin: { top: string; right: string; bottom: string; left: string } }): Promise<Uint8Array>;
  close(): Promise<void>;
}
interface Browser {
  newPage(): Promise<PdfPage>;
  on(event: 'disconnected', cb: () => void): unknown;
  close(): Promise<void>;
}

/**
 * Génère le PDF d'estimation via Puppeteer + template HTML/CSS.
 *
 * Le rendu HTML offre BEAUCOUP plus de liberté visuelle que PDFKit
 * (flexbox, gradients, SVG inline, polices web) tout en gardant un
 * pipeline maîtrisé. On garde un Browser singleton pour éviter de
 * relancer Chromium à chaque requête (~500ms gagnés par PDF).
 */
export async function renderEstimationPdf(d: EstimationEmailData): Promise<Buffer> {
  const html = renderEstimationHtml(d);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close().catch(() => {
      /* ignore */
    });
  }
}

// ─── Browser singleton ────────────────────────────────────────────

let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = launchBrowser();
    // Si Chromium plante, on autorise une nouvelle tentative.
    browserPromise
      .then((browser) => {
        browser.on('disconnected', () => {
          browserPromise = null;
        });
      })
      .catch(() => {
        browserPromise = null;
      });
  }
  return browserPromise;
}

async function launchBrowser(): Promise<Browser> {
  const { default: puppeteer } = await import('puppeteer-core');
  return puppeteer.launch({
    executablePath: findChromiumPath(),
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
    ],
  });
}

/** Trouve Chromium : env var prioritaire, sinon chemins courants Linux/macOS/Windows. */
function findChromiumPath(): string {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const candidates = [
    // Linux (Alpine / Debian)
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(
    'Chromium introuvable. Installer chromium (ou Chrome) ou définir PUPPETEER_EXECUTABLE_PATH.',
  );
}

/** À appeler à l'arrêt du serveur pour libérer Chromium proprement. */
export async function closePdfRenderer(): Promise<void> {
  if (browserPromise) {
    const browser = await browserPromise.catch(() => null);
    if (browser) await browser.close().catch(() => undefined);
    browserPromise = null;
  }
}
