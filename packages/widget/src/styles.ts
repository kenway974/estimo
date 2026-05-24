/** CSS injecté dans le Shadow DOM -> isolation totale du style du site hôte.
 *  Couleur pilotée par la variable --estimo-primary (attribut data-primary). */
export const css = `
:host { all: initial; }
* { box-sizing: border-box; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
.estimo {
  --primary: var(--estimo-primary, #2563eb);
  --radius: 12px; --border: #e5e7eb; --text: #1f2937; --muted: #6b7280; --surface: #f9fafb;
  max-width: 520px; color: var(--text); background: #fff; border: 1px solid var(--border);
  border-radius: var(--radius); padding: 22px; line-height: 1.45;
}
.estimo h2 { font-size: 18px; margin: 0 0 4px; }
.estimo .sub { color: var(--muted); font-size: 13px; margin: 0 0 16px; }
.estimo .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.estimo .field { margin-bottom: 12px; display: flex; flex-direction: column; gap: 5px; }
.estimo label { font-size: 13px; font-weight: 600; }
.estimo input, .estimo select, .estimo textarea {
  width: 100%; padding: 10px 11px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; background: #fff; color: var(--text); font-family: inherit;
}
.estimo input:focus, .estimo select:focus, .estimo textarea:focus { outline: 2px solid var(--primary); outline-offset: 1px; border-color: var(--primary); }
.estimo .chips { display: flex; flex-wrap: wrap; gap: 8px; }
.estimo .chip { border: 1px solid var(--border); border-radius: 999px; padding: 7px 12px; font-size: 13px; cursor: pointer; user-select: none; }
.estimo .chip[aria-pressed="true"] { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 12%, #fff); color: var(--primary); }
.estimo .consent { display: flex; gap: 8px; align-items: flex-start; font-size: 12px; color: var(--muted); }
.estimo .consent input { width: auto; margin-top: 2px; }
.estimo .actions { display: flex; justify-content: space-between; gap: 10px; margin-top: 16px; }
.estimo button {
  appearance: none; border: 0; border-radius: 8px; padding: 11px 18px; font-size: 14px; font-weight: 600; cursor: pointer;
}
.estimo .primary { background: var(--primary); color: #fff; }
.estimo .primary:disabled { opacity: .55; cursor: not-allowed; }
.estimo .ghost { background: #f3f4f6; color: var(--text); }
.estimo .err { color: #b91c1c; font-size: 13px; margin-top: 10px; }

/* Encart "Ce que vous recevez" (step contact) */
.estimo .info-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; margin: 0 0 16px;
  font-size: 12.5px; color: var(--text); line-height: 1.5;
}
.estimo .info-card .info-title { font-weight: 700; font-size: 13px; margin: 0 0 4px; display: flex; gap: 6px; align-items: center; }
.estimo .info-card ul { margin: 6px 0 0; padding-left: 18px; color: var(--muted); }
.estimo .info-card li { margin-bottom: 2px; }

/* Résultat — cadre enrichi */
.estimo .result { padding: 4px 0 0; }
.estimo .result .result-card {
  background: color-mix(in srgb, var(--primary) 6%, #fff);
  border: 1px solid color-mix(in srgb, var(--primary) 25%, var(--border));
  border-radius: 12px; padding: 20px 18px; text-align: center;
}
.estimo .result .result-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--muted); font-weight: 700; }
.estimo .result .amount { font-size: 32px; font-weight: 800; color: var(--primary); margin: 6px 0 4px; line-height: 1.1; }
.estimo .result .range { color: var(--muted); font-size: 13px; }
.estimo .result .per-m2 { color: var(--muted); font-size: 12px; margin-top: 4px; }
.estimo .result .property-recap {
  margin-top: 14px; padding-top: 12px; border-top: 1px solid color-mix(in srgb, var(--primary) 15%, var(--border));
  font-size: 12.5px; color: var(--text); display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;
}
.estimo .result .property-recap span { color: var(--muted); }
.estimo .result .email-note {
  margin: 14px 0 0; padding: 10px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
  font-size: 12px; color: var(--text); line-height: 1.5;
}
.estimo .result .email-note strong { color: var(--text); }
.estimo .result .cta-row { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
.estimo .result .cta-row .primary { width: 100%; padding: 13px 18px; font-size: 15px; }
.estimo .legal { font-size: 11px; color: var(--muted); margin-top: 14px; text-align: center; }

/* Booking — choix RDV avec radios stylées comme cards */
.estimo .radio-group { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 14px; }
.estimo .radio-card {
  position: relative; border: 1px solid var(--border); border-radius: 8px; padding: 12px 10px; cursor: pointer;
  text-align: center; transition: all .15s ease; background: #fff;
}
.estimo .radio-card input { position: absolute; opacity: 0; pointer-events: none; }
.estimo .radio-card .rc-title { font-size: 13px; font-weight: 600; color: var(--text); }
.estimo .radio-card .rc-sub { font-size: 11px; color: var(--muted); margin-top: 2px; }
.estimo .radio-card:hover { border-color: color-mix(in srgb, var(--primary) 50%, var(--border)); }
.estimo .radio-card.selected {
  border-color: var(--primary); background: color-mix(in srgb, var(--primary) 8%, #fff);
}
.estimo .radio-card.selected .rc-title { color: var(--primary); }

.estimo .slot-row {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-bottom: 14px;
}
.estimo .slot-card { padding: 10px 4px; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; text-align: center; font-size: 12px; font-weight: 600; background: #fff; }
.estimo .slot-card:hover { border-color: color-mix(in srgb, var(--primary) 50%, var(--border)); }
.estimo .slot-card.selected { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 8%, #fff); color: var(--primary); }

.estimo .group-label { font-size: 12.5px; font-weight: 700; color: var(--text); margin: 0 0 6px; text-transform: uppercase; letter-spacing: .4px; }
.estimo .group-label .opt { font-weight: 400; color: var(--muted); text-transform: none; letter-spacing: 0; margin-left: 4px; }

.estimo .booking-success {
  text-align: center; padding: 24px 8px;
}
.estimo .booking-success .check {
  width: 56px; height: 56px; border-radius: 50%; background: color-mix(in srgb, var(--primary) 15%, #fff);
  color: var(--primary); display: inline-flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; margin: 0 auto 12px;
}
.estimo .booking-success h3 { margin: 0 0 6px; font-size: 17px; color: var(--text); }
.estimo .booking-success p { color: var(--muted); font-size: 13.5px; margin: 0; }

@media (max-width: 480px) {
  .estimo .grid { grid-template-columns: 1fr; }
  .estimo .radio-group { grid-template-columns: 1fr; }
  .estimo .slot-row { grid-template-columns: repeat(2, 1fr); }
}
@media (prefers-reduced-motion: no-preference) { .estimo { transition: none; } }
`;
