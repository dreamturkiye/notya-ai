/** Açılışta özgeçmiş okuyan cümle. Selam bu değil; ikinci kez söylenmez. */
export function ozgecmisAcilisiMi(metin: string): boolean {
  const t = String(metin || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ')
  if (!t) return false
  return /ben\s+prof/.test(t) && /uzman/.test(t)
}

/**
 * Bizim açılış cümlemiz. Fish / ElevenLabs bunu bazen doktorun sözü sanıp beyne geri yollar;
 * o tur cevaplanmaz — yoksa asistan kendi selamına "İyiyim" deyip eldeki dosyadan vaka uydurur.
 */
export function kendiSelamiMi(metin: string): boolean {
  const t = String(metin || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim()
  if (!t || t.length > 180) return false
  return /^merhaba\b/.test(t) && /nasıl yardımcı olabilirim\??$/.test(t)
}

/** Agent opening (bio or our Merhaba) — Fish must not replay it on top of ElevenLabs. */
export function acilisAjanSozuMu(metin: string): boolean {
  return ozgecmisAcilisiMi(metin) || kendiSelamiMi(metin)
}
