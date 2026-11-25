'use client'
/**
 * PORTAL-REGRESYON-2026-11-25 — a 24-hour time picker for Sağlığım (quiet hours, dose times, a patient's own medicine).
 * A native <input type="time"> draws in the PHONE's own locale: on an English-set phone it showed "11:00 PM", and its
 * width pushed the quiet-hours pair out of the card. This is a plain <select> of "HH:MM" values (15-minute steps; the
 * current value is always kept even when it is off the grid), so it reads 23:00 / 07:00 everywhere and stays narrow.
 * No words here: the label arrives as a prop (gorunum-paritesi-ulke).
 */
const ADIM_DK = 15

/** "HH:MM" values of the day, 15-minute steps, plus `mevcut` when it is a valid time off the grid (sorted). */
export function saatSecenekleri(mevcut?: string | null): string[] {
  const liste: string[] = []
  for (let dk = 0; dk < 24 * 60; dk += ADIM_DK) liste.push(`${String(Math.floor(dk / 60)).padStart(2, '0')}:${String(dk % 60).padStart(2, '0')}`)
  const m = typeof mevcut === 'string' ? mevcut.slice(0, 5) : ''
  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(m) && !liste.includes(m)) { liste.push(m); liste.sort() }
  return liste
}

export function SaatSecici({ deger, degistir, etiket, className }: { deger: string; degistir: (v: string) => void; etiket: string; className?: string }) {
  const v = (deger || '').slice(0, 5)
  return (
    <select className={`sge-saat-sec${className ? ` ${className}` : ''}`} value={v} aria-label={etiket} onChange={(e) => e.target.value && degistir(e.target.value)}>
      {saatSecenekleri(v).map((x) => <option key={x} value={x}>{x}</option>)}
    </select>
  )
}
