/** CSS injecté dans le Shadow DOM -> isolation totale du style du site hôte.
 *  Couleur pilotée par la variable --estimo-primary (attribut data-primary). */
export const css = `
:host { all: initial; }
* { box-sizing: border-box; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
.estimo {
  --primary: var(--estimo-primary, #2563eb);
  --radius: 12px; --border: #e5e7eb; --text: #1f2937; --muted: #6b7280;
  max-width: 520px; color: var(--text); background: #fff; border: 1px solid var(--border);
  border-radius: var(--radius); padding: 22px; line-height: 1.45;
}
.estimo h2 { font-size: 18px; margin: 0 0 4px; }
.estimo .sub { color: var(--muted); font-size: 13px; margin: 0 0 16px; }
.estimo .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.estimo .field { margin-bottom: 12px; display: flex; flex-direction: column; gap: 5px; }
.estimo label { font-size: 13px; font-weight: 600; }
.estimo input, .estimo select {
  width: 100%; padding: 10px 11px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; background: #fff; color: var(--text);
}
.estimo input:focus, .estimo select:focus { outline: 2px solid var(--primary); outline-offset: 1px; border-color: var(--primary); }
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
.estimo .result { text-align: center; padding: 8px 0; }
.estimo .result .amount { font-size: 30px; font-weight: 800; color: var(--primary); margin: 6px 0; }
.estimo .result .range { color: var(--muted); font-size: 14px; }
.estimo .legal { font-size: 11px; color: var(--muted); margin-top: 14px; }
@media (max-width: 480px) { .estimo .grid { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: no-preference) { .estimo { transition: none; } }
`;
