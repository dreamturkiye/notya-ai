/**
 * ASI-TAKVIM-TEK-01 (grounding guard, Kaan's go 2026-11-20) — Ayşe must never claim a source that is not in the
 * patient's record.
 *
 * Live, 2026-11-20 (demo pediatri patient, typed "aşı durumu nedir?"): the patient had no documents, no medication
 * and no allergy record, and the answer said medication and allergy information "exists in documents". The evidence
 * now names what is not on file (kanit.ts `kayitSiniriSatiri`, asiKaniti.ts sources line); this guard is the last
 * line: when the chart this turn says "Kayıtlı belge yok" and has no approved document evaluation, any sentence of
 * the answer that claims something is in the documents is replaced with the true sentence. Pure, no model call.
 */

/** "belge", "belgelerde", "belgesinde", "dokümanlarda", "evrakta" — not "belgelenmiş" / "belgeli" (documented). */
const BELGE_SOZU = /(?<!\p{L})(?:belge(?:ler)?(?:i|si|de|den|inde|sinde|ye|yi|nin)?|dok[uü]man\p{L}*|evrak\p{L}*)(?!\p{L})/iu
/** The sentence already says the documents are absent — it is true, keep it. */
const OLUMSUZ = /(?<!\p{L})(?:yok|yoktur|bulunmuyor|bulunmamaktad[ıi]r|bulunamad[ıi]|bulamad[ıi]m|görünmüyor|gorunmuyor|kay[ıi]tl[ıi] de[ğg]il|mevcut de[ğg]il|yer alm[ıi]yor|eklenmemi[şs])(?!\p{L})/iu
/** Leading list marker / bold label that stays in front of the replaced sentence. */
const BAS = /^\s*(?:[-*•]\s+)?(?:\*\*[^*\n]+\*\*:?\s*)?/

/** A clause names the documents and does not negate them ("…belgelerde mevcut", not "…belge yok"). */
function iddiaMi(cumle: string): boolean {
  return cumle.split(/[,;:]|(?<!\p{L})(?:ve|ama|ancak|fakat|ile)(?!\p{L})/u).some((p) => BELGE_SOZU.test(p) && !OLUMSUZ.test(p))
}

/** The chart text (hastaDosyaDerleyici) says the patient has no uploaded document and no approved evaluation. */
export function belgeYokMu(dosyaMetni: string | null | undefined): boolean {
  const m = String(dosyaMetni || '')
  return m.includes('- Kayıtlı belge yok.') && !m.includes('## BELGE DEĞERLENDİRMELERİ')
}

export function kayitsizKaynakGuvencesi(metin: string, dosyaMetni: string | null | undefined): { metin: string; degisti: boolean } {
  if (!metin || !belgeYokMu(dosyaMetni)) return { metin, degisti: false }
  const m = String(dosyaMetni)
  const ilacYok = m.includes('- Sürekli ilaç: kayıtlı ilaç yok')
  const alerjiYok = m.includes('- Alerji: kayıt yok')
  let degisti = false
  const yazilan = new Set<string>()
  const yeni = metin.replace(/[^.!?\n]+[.!?]*/g, (cumle) => {
    if (!iddiaMi(cumle)) return cumle
    degisti = true
    const kucuk = cumle.toLocaleLowerCase('tr-TR')
    const ek = [ilacYok && /ila[çc]/u.test(kucuk) ? 'ilaç' : '', alerjiYok && /alerji/u.test(kucuk) ? 'alerji' : ''].filter(Boolean)
    const dogru = `Dosyada yüklenen belge yok${ek.length ? `; ${ek.join(' ve ')} bilgisi de kayıtlı değil` : ''}.`
    if (yazilan.has(dogru)) return ''
    yazilan.add(dogru)
    return `${cumle.match(BAS)?.[0] ?? ''}${dogru}`
  })
  return degisti ? { metin: yeni.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+\n/g, '\n').trim(), degisti } : { metin, degisti }
}
