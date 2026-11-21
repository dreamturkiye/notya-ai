/**
 * SURE-SECIM-01 (beta feedback, 2026-11-21): a number field with a prefilled default is usually RETYPED, not edited.
 * Without selecting the old value first, the typed digits were appended ("20" + "30" → "2030"). Every such field in the
 * doctor app selects its whole content when it gets focus.
 *
 * iOS Safari drops a selection made inside the focus handler when the tap's mouseup lands, so it is made again right
 * after the event. `select()` works for type="number" too (setSelectionRange would throw there).
 */
type Secilebilir = { select: () => void };

export function tumunuSec(e: { currentTarget: Secilebilir }): void {
  const el = e.currentTarget;
  const sec = () => { try { el.select(); } catch { /* not selectable: leave it */ } };
  sec();
  if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') window.setTimeout(sec, 0);
}

type AlanBenzeri = { tagName?: string; type?: string; readOnly?: boolean; disabled?: boolean; getAttribute?: (a: string) => string | null; select?: () => void };

/** A number field: <input type="number">, or a text field that opens the number keypad (inputmode numeric / decimal). */
export function sayiAlaniMi(el: unknown): el is AlanBenzeri & Secilebilir {
  const a = el as AlanBenzeri | null;
  if (!a || String(a.tagName || '').toUpperCase() !== 'INPUT' || a.readOnly || a.disabled || typeof a.select !== 'function') return false;
  if (String(a.type || '').toLowerCase() === 'number') return true;
  const kip = String(a.getAttribute?.('inputmode') || '').toLowerCase();
  return kip === 'numeric' || kip === 'decimal';
}

/** One listener for the whole doctor frame (components/doktor/KabukGorunumu.tsx): every number field it hosts. */
export function sayiAlaniOdak(e: { target: unknown }): void {
  if (sayiAlaniMi(e.target)) tumunuSec({ currentTarget: e.target });
}
