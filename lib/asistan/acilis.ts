/** Açılışta özgeçmiş okuyan cümle. Selam bu değil; ikinci kez söylenmez. */
export function ozgecmisAcilisiMi(metin: string): boolean {
  const t = String(metin || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ')
  if (!t) return false
  return /ben\s+prof/.test(t) && /uzman/.test(t)
}
