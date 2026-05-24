import { css } from './styles';
import { postEstimate, postBooking, type EstimatePayload, type EstimateResponse } from './api';
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

/** Widget d'estimation : formulaire en plusieurs étapes rendu dans un Shadow DOM. */
export class EstimoWidget {
  private root: ShadowRoot;
  private features = new Set<string>();
  /** Dernier payload d'estimation soumis — réutilisé pour la prise de RDV. */
  private lastPayload: EstimatePayload | null = null;
  /** Dernier résultat d'estimation — réutilisé pour la prise de RDV. */
  private lastResult: EstimateResponse['estimate'] | null = null;

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
        <div class="info-card">
          <p class="info-title">📎 Vous recevrez un dossier complet par email</p>
          <ul>
            <li>Estimation chiffrée + fourchette basse / haute</li>
            <li>Repères du marché local (médiane du quartier, source DVF)</li>
            <li>3 ventes récentes comparables dans votre secteur</li>
            <li>Frais à prévoir (notaire, diagnostics, plus-value)</li>
          </ul>
        </div>
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
        <div class="result">
          <div class="result-card">
            <div class="result-label">Estimation</div>
            <div class="amount"></div>
            <div class="range"></div>
            <div class="per-m2" data-per-m2 hidden></div>
            <div class="property-recap" data-property-recap></div>
          </div>
          <div class="email-note" data-email-note hidden>
            📎 <strong>Votre dossier complet vous attend dans votre boîte mail</strong>, avec les repères du marché local, les ventes récentes du quartier et les frais à prévoir.
          </div>
          <div class="cta-row">
            <button type="button" class="primary" data-book-rdv>Réserver un rendez-vous</button>
          </div>
          <p class="legal" data-legal></p>
        </div>
      </section>

      <section data-step="booking" hidden>
        <h2>Réserver un rendez-vous</h2>
        <p class="sub">L'agence vous reconfirmera par téléphone, email ou SMS.</p>

        <p class="group-label">Type de rendez-vous</p>
        <div class="radio-group" data-rdv-type-group>
          <label class="radio-card" data-rdv-type="telephone">
            <input type="radio" name="rdvType" value="telephone" checked>
            <div class="rc-title">📞 Téléphonique</div>
            <div class="rc-sub">Un appel rapide</div>
          </label>
          <label class="radio-card" data-rdv-type="agency">
            <input type="radio" name="rdvType" value="agency">
            <div class="rc-title">🏢 En agence</div>
            <div class="rc-sub">Sur place</div>
          </label>
          <label class="radio-card" data-rdv-type="home">
            <input type="radio" name="rdvType" value="home">
            <div class="rc-title">🏠 Chez vous</div>
            <div class="rc-sub">Visite du bien</div>
          </label>
        </div>

        <div class="field" data-address-field hidden>
          <label for="e-addr">Adresse du bien</label>
          <input id="e-addr" name="address" placeholder="N° et nom de rue">
        </div>

        <p class="group-label">Jour souhaité</p>
        <div class="slot-row" data-day-group>
          <div class="slot-card" data-day="today">Aujourd'hui</div>
          <div class="slot-card selected" data-day="tomorrow">Demain</div>
          <div class="slot-card" data-day="this-week">Cette semaine</div>
          <div class="slot-card" data-day="next-week">Semaine prochaine</div>
          <div class="slot-card" data-day="flexible">Flexible</div>
        </div>

        <p class="group-label">Créneau horaire</p>
        <div class="slot-row" data-time-group>
          <div class="slot-card" data-time="morning">Matin<br><small>9h–12h</small></div>
          <div class="slot-card" data-time="midday">Midi<br><small>12h–14h</small></div>
          <div class="slot-card selected" data-time="afternoon">Après-midi<br><small>14h–18h</small></div>
          <div class="slot-card" data-time="evening">Soir<br><small>18h–20h</small></div>
          <div class="slot-card" data-time="flexible">Flexible</div>
        </div>

        <div class="actions">
          <button type="button" class="ghost" data-back-result>Retour</button>
          <button type="button" class="primary" data-confirm-booking>Confirmer la demande</button>
        </div>
        <p class="err" data-booking-err hidden></p>
      </section>

      <section data-step="booking-success" hidden>
        <div class="booking-success">
          <div class="check">✓</div>
          <h3>Demande de rendez-vous envoyée</h3>
          <p>L'agence vous recontactera sous 24h pour confirmer le créneau exact.</p>
        </div>
      </section>
    </form>`;
  }

  private bind(wrap: HTMLElement): void {
    const form = wrap.querySelector('form') as HTMLFormElement;
    const show = (step: string) =>
      wrap.querySelectorAll('section').forEach((s) => ((s as HTMLElement).hidden = s.getAttribute('data-step') !== step));

    // ── Step 1 : chips équipements ──
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

    // ── Nav step 1 → 2 → result ──
    wrap.querySelector('[data-next]')?.addEventListener('click', () => {
      const s1 = wrap.querySelector('[data-step="1"]') as HTMLElement;
      if (!this.validStep(s1)) return;
      show('2');
    });
    wrap.querySelector('[data-back]')?.addEventListener('click', () => show('1'));

    form.addEventListener('submit', (e) => { e.preventDefault(); void this.submit(wrap, form, show); });

    // ── Result → Booking ──
    wrap.querySelector('[data-book-rdv]')?.addEventListener('click', () => show('booking'));
    wrap.querySelector('[data-back-result]')?.addEventListener('click', () => show('result'));

    // ── Booking : radios type + slot cards ──
    this.bindBookingControls(wrap);
    wrap.querySelector('[data-confirm-booking]')?.addEventListener('click', () => void this.submitBooking(wrap, show));
  }

  private bindBookingControls(wrap: HTMLElement): void {
    // Cartes "type de RDV" (sélection visuelle + show/hide adresse)
    const typeCards = wrap.querySelectorAll<HTMLElement>('[data-rdv-type]');
    const addressField = wrap.querySelector<HTMLElement>('[data-address-field]');
    const updateTypeUI = (selected: string) => {
      typeCards.forEach((c) => c.classList.toggle('selected', c.dataset.rdvType === selected));
      if (addressField) addressField.hidden = selected !== 'home';
    };
    typeCards.forEach((card) => {
      card.addEventListener('click', () => {
        const v = card.dataset.rdvType as string;
        const input = card.querySelector<HTMLInputElement>('input[type="radio"]');
        if (input) input.checked = true;
        updateTypeUI(v);
      });
    });
    updateTypeUI('telephone'); // état initial

    // Cartes "jour" et "créneau" (sélection unique par groupe)
    const bindSlotGroup = (selector: string) => {
      const cards = wrap.querySelectorAll<HTMLElement>(selector);
      cards.forEach((card) => {
        card.addEventListener('click', () => {
          cards.forEach((c) => c.classList.remove('selected'));
          card.classList.add('selected');
        });
      });
    };
    bindSlotGroup('[data-day-group] .slot-card');
    bindSlotGroup('[data-time-group] .slot-card');
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
      this.lastPayload = payload;
      this.lastResult = r;
      const suffix = r.transaction === 'rent' ? ' / mois' : '';

      // Cadre résultat enrichi
      (wrap.querySelector('.amount') as HTMLElement).textContent = money(r.mid, r.currency) + suffix;
      (wrap.querySelector('.range') as HTMLElement).textContent =
        `Fourchette : ${money(r.low, r.currency)} – ${money(r.high, r.currency)}${suffix}`;
      const perM2El = wrap.querySelector('[data-per-m2]') as HTMLElement;
      if (r.pricePerM2) {
        perM2El.textContent = `Soit ${money(r.pricePerM2, r.currency)} / m²`;
        perM2El.hidden = false;
      } else {
        perM2El.hidden = true;
      }
      // Rappel du bien estimé
      const propTypeLabel = PROPERTY_TYPES.find((p) => p.value === payload.propertyType)?.label ?? payload.propertyType;
      (wrap.querySelector('[data-property-recap]') as HTMLElement).innerHTML =
        `<strong>${propTypeLabel} ${payload.surface} m²</strong> <span>·</span> <span>${payload.city}${payload.postalCode ? ` (${payload.postalCode})` : ''}</span>`;
      // Email reçu : on affiche la mention dossier complet
      (wrap.querySelector('[data-email-note]') as HTMLElement).hidden = !emailSent;
      (wrap.querySelector('[data-legal]') as HTMLElement).textContent = emailSent
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

  private async submitBooking(wrap: HTMLElement, show: (s: string) => void): Promise<void> {
    if (!this.lastPayload || !this.lastResult) return; // sécurité : pas d'estimation préalable
    const errBox = wrap.querySelector('[data-booking-err]') as HTMLElement;
    const btn = wrap.querySelector('[data-confirm-booking]') as HTMLButtonElement;

    // Lecture des sélections
    const checkedRadio = wrap.querySelector<HTMLInputElement>('input[name="rdvType"]:checked');
    const rdvType = (checkedRadio?.value ?? 'telephone') as 'telephone' | 'agency' | 'home';
    const day = (wrap.querySelector('[data-day-group] .slot-card.selected') as HTMLElement | null)?.dataset.day ?? 'flexible';
    const time = (wrap.querySelector('[data-time-group] .slot-card.selected') as HTMLElement | null)?.dataset.time ?? 'flexible';
    const addressInput = wrap.querySelector<HTMLInputElement>('#e-addr');
    const address = addressInput?.value.trim() || undefined;

    if (rdvType === 'home' && (!address || address.length < 4)) {
      errBox.hidden = false;
      errBox.textContent = 'Merci d\'indiquer l\'adresse du bien pour un rendez-vous à domicile.';
      return;
    }

    errBox.hidden = true;
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = 'Envoi en cours…';
    try {
      await postBooking(this.o.api, {
        tenantId: this.o.tenantId,
        publicKey: this.o.publicKey,
        rdvType,
        preferredDay: day as 'today' | 'tomorrow' | 'this-week' | 'next-week' | 'flexible',
        preferredTime: time as 'morning' | 'midday' | 'afternoon' | 'evening' | 'flexible',
        address,
        firstName: this.lastPayload.firstName,
        lastName: this.lastPayload.lastName,
        email: this.lastPayload.email,
        phone: this.lastPayload.phone,
        property: {
          transaction: this.lastPayload.transaction,
          propertyType: this.lastPayload.propertyType,
          surface: this.lastPayload.surface,
          city: this.lastPayload.city,
          postalCode: this.lastPayload.postalCode,
          estimation: this.lastResult.mid,
          currency: this.lastResult.currency,
        },
      });
      show('booking-success');
    } catch {
      errBox.hidden = false;
      errBox.textContent = "L'envoi de la demande a échoué. Merci de réessayer dans un instant.";
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
}
