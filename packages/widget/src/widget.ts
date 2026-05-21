import { css } from './styles';
import { postEstimate, type EstimatePayload } from './api';
import { TRANSACTIONS, PROPERTY_TYPES, CONDITIONS, FEATURES } from './form-config';

export interface WidgetOptions {
  tenantId: string;
  api: string;
  publicKey?: string;
  primaryColor?: string;
}

const opt = (o: { value: string; label: string }[]) =>
  o.map((x) => `<option value="${x.value}">${x.label}</option>`).join('');
const money = (n: number, c: string) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(n);

/** Widget d'estimation : formulaire en 2 étapes rendu dans un Shadow DOM. */
export class EstimoWidget {
  private root: ShadowRoot;
  private features = new Set<string>();

  constructor(host: HTMLElement, private o: WidgetOptions) {
    this.root = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = css;
    const wrap = document.createElement('div');
    wrap.className = 'estimo';
    if (o.primaryColor) wrap.style.setProperty('--estimo-primary', o.primaryColor);
    wrap.innerHTML = this.template();
    this.root.append(style, wrap);
    this.bind(wrap);
  }

  private template(): string {
    return `
    <form novalidate>
      <section data-step="1">
        <h2>Estimez votre bien</h2>
        <p class="sub">Réponse immédiate, gratuite et sans engagement.</p>
        <div class="grid">
          <div class="field"><label for="e-tx">Projet</label><select id="e-tx" name="transaction">${opt(TRANSACTIONS)}</select></div>
          <div class="field"><label for="e-type">Type de bien</label><select id="e-type" name="propertyType">${opt(PROPERTY_TYPES)}</select></div>
          <div class="field"><label for="e-surf">Surface (m²)</label><input id="e-surf" name="surface" type="number" min="1" inputmode="numeric" required></div>
          <div class="field"><label for="e-rooms">Nombre de pièces</label><input id="e-rooms" name="rooms" type="number" min="0" inputmode="numeric" required></div>
          <div class="field"><label for="e-cp">Code postal</label><input id="e-cp" name="postalCode" required></div>
          <div class="field"><label for="e-city">Ville</label><input id="e-city" name="city" required></div>
        </div>
        <div class="field"><label for="e-cond">État du bien</label><select id="e-cond" name="condition">${opt(CONDITIONS)}</select></div>
        <div class="field"><label>Équipements</label>
          <div class="chips" role="group" aria-label="Équipements">
            ${FEATURES.map((f) => `<span class="chip" role="button" tabindex="0" aria-pressed="false" data-feat="${f.value}">${f.label}</span>`).join('')}
          </div>
        </div>
        <div class="actions"><span></span><button type="button" class="primary" data-next>Continuer</button></div>
      </section>

      <section data-step="2" hidden>
        <h2>Recevez votre estimation</h2>
        <p class="sub">On vous l'envoie par email tout de suite.</p>
        <div class="grid">
          <div class="field"><label for="e-fn">Prénom</label><input id="e-fn" name="firstName" required></div>
          <div class="field"><label for="e-ln">Nom</label><input id="e-ln" name="lastName" required></div>
          <div class="field"><label for="e-mail">Email</label><input id="e-mail" name="email" type="email" required></div>
          <div class="field"><label for="e-tel">Téléphone</label><input id="e-tel" name="phone" type="tel" required></div>
        </div>
        <label class="consent"><input type="checkbox" name="consent" required>
          J'accepte d'être recontacté(e) et que mes données soient traitées pour cette estimation.</label>
        <div class="actions"><button type="button" class="ghost" data-back>Retour</button><button type="submit" class="primary">Obtenir mon estimation</button></div>
        <p class="err" hidden></p>
      </section>

      <section data-step="result" hidden>
        <h2>Votre estimation</h2>
        <div class="result"><div class="amount"></div><div class="range"></div></div>
        <p class="legal"></p>
      </section>
    </form>`;
  }

  private bind(wrap: HTMLElement): void {
    const form = wrap.querySelector('form') as HTMLFormElement;
    const show = (step: string) =>
      wrap.querySelectorAll('section').forEach((s) => ((s as HTMLElement).hidden = s.getAttribute('data-step') !== step));

    wrap.querySelectorAll<HTMLElement>('.chip').forEach((chip) => {
      const toggle = () => {
        const v = chip.dataset.feat as string;
        const on = chip.getAttribute('aria-pressed') === 'true';
        chip.setAttribute('aria-pressed', String(!on));
        on ? this.features.delete(v) : this.features.add(v);
      };
      chip.addEventListener('click', toggle);
      chip.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    });

    wrap.querySelector('[data-next]')?.addEventListener('click', () => {
      const s1 = wrap.querySelector('[data-step="1"]') as HTMLElement;
      if (!this.validStep(s1)) return;
      show('2');
    });
    wrap.querySelector('[data-back]')?.addEventListener('click', () => show('1'));

    form.addEventListener('submit', (e) => { e.preventDefault(); void this.submit(wrap, form, show); });
  }

  private validStep(section: HTMLElement): boolean {
    for (const el of section.querySelectorAll<HTMLInputElement>('input[required]')) {
      if (!el.reportValidity()) return false;
    }
    return true;
  }

  private async submit(wrap: HTMLElement, form: HTMLFormElement, show: (s: string) => void): Promise<void> {
    const errBox = wrap.querySelector('.err') as HTMLElement;
    const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (!this.validStep(wrap.querySelector('[data-step="2"]') as HTMLElement)) return;
    const fd = new FormData(form);
    const payload: EstimatePayload = {
      tenantId: this.o.tenantId,
      publicKey: this.o.publicKey,
      transaction: fd.get('transaction') as 'sale' | 'rent',
      propertyType: String(fd.get('propertyType')),
      surface: Number(fd.get('surface')),
      rooms: Number(fd.get('rooms')),
      condition: String(fd.get('condition')),
      postalCode: String(fd.get('postalCode')).trim(),
      city: String(fd.get('city')).trim(),
      features: [...this.features],
      firstName: String(fd.get('firstName')).trim(),
      lastName: String(fd.get('lastName')).trim(),
      email: String(fd.get('email')).trim(),
      phone: String(fd.get('phone')).trim(),
      consent: true,
    };
    errBox.hidden = true;
    btn.disabled = true;
    btn.textContent = 'Calcul en cours…';
    try {
      const { estimate: r, emailSent } = await postEstimate(this.o.api, payload);
      const suffix = r.transaction === 'rent' ? ' / mois' : '';
      (wrap.querySelector('.amount') as HTMLElement).textContent = money(r.mid, r.currency) + suffix;
      (wrap.querySelector('.range') as HTMLElement).textContent =
        `Fourchette : ${money(r.low, r.currency)} – ${money(r.high, r.currency)}${suffix}`;
      (wrap.querySelector('.legal') as HTMLElement).textContent = emailSent
        ? 'Estimation indicative envoyée par email. Non contractuelle.'
        : 'Estimation indicative, non contractuelle.';
      show('result');
    } catch {
      errBox.hidden = false;
      errBox.textContent = "Une erreur est survenue. Merci de réessayer dans un instant.";
      btn.disabled = false;
      btn.textContent = 'Obtenir mon estimation';
    }
  }
}
