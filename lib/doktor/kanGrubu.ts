/**
 * KAN-GRUBU-SECIM-01 (beta feedback, 2026-11-21): "Kan grubuna girerken seçenek sunabilir." The doctor typed the blood
 * group as free text on the patient forms (B Rh+, B+, brh+, 0 pozitif …) while the patient's intake form already offers
 * radio options. Every doctor-side blood-group field now offers the 8 groups + "Bilinmiyor".
 *
 * Stored values stay compatible: the canonical form is exactly the intake form's option text (lib/intake/coreAlanlar.ts,
 * "A Rh+", "0 Rh-" …), which the file search, the summary card and the intake transfer already read. An old value that
 * is a recognisable blood group is SHOWN as its canonical option; a value that is not (anything else typed in the past)
 * is kept and offered as its own option, never dropped or rewritten silently.
 */

export const KAN_GRUPLARI = ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-'] as const;
export type KanGrubu = (typeof KAN_GRUPLARI)[number];
/** ABO alone — the pregnancy card keeps Rh in its own field. */
export const ABO_GRUPLARI = ['A', 'B', 'AB', '0'] as const;
export const KAN_GRUBU_BILINMIYOR = 'Bilinmiyor';

const BILINMIYOR = /^(bilinmiyor|bilmiyorum|bilinmez|unknown|i do not know|-|\?)$/i;

function aboCoz(t: string): { abo: (typeof ABO_GRUPLARI)[number]; kalan: string } | null {
  const m = t.match(/^(ab|a|b|0|o)(?!(?!rh|pozitif|negatif)[a-zçğıöşü])/i);
  if (!m) return null;
  const ham = m[1].toUpperCase();
  return { abo: (ham === 'O' ? '0' : ham) as (typeof ABO_GRUPLARI)[number], kalan: t.slice(m[0].length) };
}

/**
 * A stored or typed blood group → its canonical option ("B Rh+"), "Bilinmiyor", or null when the text is not a
 * recognisable blood group with a known Rh. Reads "B Rh+", "B+", "brh+", "B Rh(+)", "B pozitif", "0 Rh negatif", "O−".
 */
export function kanGrubuNormal(ham: unknown): KanGrubu | typeof KAN_GRUBU_BILINMIYOR | null {
  const t = String(ham ?? '').trim().replace(/\s+/g, ' ');
  if (!t) return null;
  if (BILINMIYOR.test(t)) return KAN_GRUBU_BILINMIYOR;
  const abo = aboCoz(t.replace(/^grup\s*/i, ''));
  if (!abo) return null;
  const k = abo.kalan.toLowerCase().replace(/[\s()]/g, '').replace(/^rh/, '').replace(/−|–/g, '-');
  let rh: '+' | '-' | null = null;
  if (k === '+' || k === 'pozitif' || k === 'positive' || k === 'pos') rh = '+';
  else if (k === '-' || k === 'negatif' || k === 'negative' || k === 'neg') rh = '-';
  if (!rh) return null;
  return `${abo.abo} Rh${rh}` as KanGrubu;
}

/** ABO only (pregnancy card): "A" / "AB" / "0", or null. Reads the full forms too ("AB Rh+" → "AB"). */
export function aboNormal(ham: unknown): (typeof ABO_GRUPLARI)[number] | null {
  const t = String(ham ?? '').trim();
  if (!t) return null;
  const abo = aboCoz(t);
  if (!abo) return null;
  return /^[\s()rh+\-−pozitifnegatif]*$/i.test(abo.kalan) ? abo.abo : null;
}

/**
 * The options a select shows for a stored value: the fixed list, plus the stored text itself when it is not one of them
 * (so an old free-text value is visible and kept until the doctor picks another).
 */
export function kanGrubuSecenekleri(mevcut: string, liste: readonly string[] = KAN_GRUPLARI, bilinmiyor = KAN_GRUBU_BILINMIYOR): { secili: string; secenekler: string[] } {
  const ham = String(mevcut ?? '').trim();
  const temel = [...liste, bilinmiyor];
  if (!ham) return { secili: '', secenekler: temel };
  const norm = liste === KAN_GRUPLARI ? kanGrubuNormal(ham) : (BILINMIYOR.test(ham) ? KAN_GRUBU_BILINMIYOR : aboNormal(ham));
  if (norm === KAN_GRUBU_BILINMIYOR) return { secili: bilinmiyor, secenekler: temel };
  if (norm) return { secili: norm, secenekler: temel };
  return { secili: ham, secenekler: [ham, ...temel] };
}
