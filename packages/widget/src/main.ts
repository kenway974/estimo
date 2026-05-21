import { EstimoWidget } from './widget';
import type { WidgetOptions } from './widget';

// document.currentScript doit être lu au chargement (null dans un handler).
const CURRENT = document.currentScript as HTMLScriptElement | null;

interface BootConfig extends WidgetOptions { target?: string; }

/** Lit la config par ordre de priorité : attributs data-* du script >
 *  window.EstimoConfig > paramètres d'URL (page de démo / iframe). */
function readConfig(script: HTMLScriptElement | null): BootConfig | null {
  const ds = script?.dataset;
  const q = new URLSearchParams(location.search);
  const g = (window as unknown as { EstimoConfig?: Partial<BootConfig> }).EstimoConfig;
  const tenantId = ds?.tenant ?? g?.tenantId ?? q.get('tenant') ?? undefined;
  if (!tenantId) return null;
  const api = ds?.api ?? g?.api ?? q.get('api') ?? (script ? new URL(script.src).origin : location.origin);
  return {
    tenantId,
    api,
    publicKey: ds?.key ?? g?.publicKey ?? q.get('key') ?? undefined,
    primaryColor: ds?.primary ?? g?.primaryColor ?? q.get('primary') ?? undefined,
    target: ds?.target ?? g?.target ?? '#estimo-widget',
  };
}

/** Trouve le conteneur cible, sinon en crée un juste après le script. */
function ensureContainer(script: HTMLScriptElement | null, target?: string): HTMLElement {
  if (target) {
    const found = document.querySelector<HTMLElement>(target);
    if (found) return found;
  }
  const div = document.createElement('div');
  if (script?.parentNode) script.parentNode.insertBefore(div, script.nextSibling);
  else document.body.appendChild(div);
  return div;
}

function boot(): void {
  const script = CURRENT ?? document.querySelector<HTMLScriptElement>('script[data-estimo]');
  const cfg = readConfig(script);
  if (!cfg) return; // pas de tenant : montage programmatique possible via window.Estimo.mount
  new EstimoWidget(ensureContainer(script, cfg.target), cfg);
}

// API programmatique : window.Estimo.mount(element, options)
(window as unknown as { Estimo: { mount: (el: HTMLElement, o: WidgetOptions) => EstimoWidget } }).Estimo = {
  mount: (el, o) => new EstimoWidget(el, o),
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
