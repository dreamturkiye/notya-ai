/**
 * NOTYA-SUT-RAPOR-01i — pure merge logic for scripts/import-sgk-ilac.mjs (no file or spreadsheet access here, so
 * it can be tested: lib/ilac/sgkListe.test.ts).
 *
 * What the SGK list is: SUT 4.1.9(1) — "Kurumca bedeli ödenecek olan ilaçlar … 'Bedeli Ödenecek İlaçlar Listesi'nde
 * (EK-4/A) belirtilmiştir. Bu listede ticari isimleri ve barkod/karekod numaraları yer almayan ilaçların bedelleri
 * hiç bir koşulda Kurumca ödenmez." Source: SGK güncel SUT, 02.10.2026 (RG 33388) işlenmiş hali.
 *
 * Three rules the earlier import did not follow:
 *  (a) EK-4/A carries no active ingredient. A record's etkenMadde / atc / etkenKaynak / ruhsatAskida come from the
 *      TİTCK import (scripts/import-titck-etken.mjs) and are KEPT by barcode when the SGK list is re-imported. A
 *      product that is new on the list gets no ingredient here — nothing is guessed.
 *  (b) The list's "Aktiflenme Tarihi" / "Pasiflenme Tarihi" columns are read. A product whose latest passivation
 *      date is later than its latest activation date is passive on the list: it is stored as not reimbursed
 *      (sgk:false, sgkDurum:'pasif') with that date.
 *  (c) When the FULL list is imported, a product in the catalogue that is no longer on the list is stored as not
 *      reimbursed (sgk:false, sgkDurum:'cikarildi') instead of staying "covered". It is not deleted: the doctor
 *      can still find it, and sees that SGK does not pay for it.
 */

/** Fields that come from TİTCK, never from EK-4/A — carried over untouched. */
export const TITCK_ALANLARI = ['etkenMadde', 'atc', 'etkenKaynak', 'ruhsatAskida']

/** SGK writes "PAROL 500 MG 20 TABLET" — the brand is the leading word(s) before strength/form. */
export function parcala(ilacAdi) {
  const ad = String(ilacAdi || '').trim()
  // Strength marks the end of the brand: 500 MG, %2.32, 10 MG/5 ML …
  const m = ad.match(/^(.*?)(?=\s+(?:%|\d))/)
  const marka = (m ? m[1] : ad).trim()
  return { ad, marka: marka || ad }
}

const iki = (n) => String(n).padStart(2, '0')

/**
 * "E798D/ E798F/E798I" and "E887A E887B" → "E798D/E798F/E798I", "E887A/E887B": the group is a list of codes, and
 * SGK's separator (slash, slash + space, space) varies between lists and between rows. Order is kept as given.
 */
export function esdegerGrubuTemizle(v) {
  return String(v ?? '').split(/[\/\s]+/).filter(Boolean).join('/')
}

/** Same set of group codes? (For the difference report: a reordered or re-spaced cell is not a changed group.) */
const ayniGrup = (a, b) => esdegerGrubuTemizle(a).split('/').sort().join('/') === esdegerGrubuTemizle(b).split('/').sort().join('/')

/** For the difference report only: a name that differs just in spacing is not a renamed product. */
const bosluksuz = (s) => String(s || '').replace(/\s+/g, ' ').trim()

/**
 * Every date in one list cell, as YYYY-MM-DD. The cell is a spreadsheet date (already resolved to {y,m,d} by the
 * caller), a JS Date, or text: SGK keeps the history in one cell ("19.04.2024/\n17.05.2025/\n01.05.2026").
 * Anything that is not a calendar date is ignored.
 */
export function tarihleriCoz(hucre) {
  if (hucre == null || hucre === '') return []
  if (hucre instanceof Date) {
    return Number.isNaN(hucre.getTime()) ? [] : [`${hucre.getFullYear()}-${iki(hucre.getMonth() + 1)}-${iki(hucre.getDate())}`]
  }
  if (typeof hucre === 'object' && Number.isFinite(hucre.y) && Number.isFinite(hucre.m) && Number.isFinite(hucre.d)) {
    return [`${hucre.y}-${iki(hucre.m)}-${iki(hucre.d)}`]
  }
  const out = []
  const metin = String(hucre)
  for (const m of metin.matchAll(/(\d{1,2})\.(\d{1,2})\.(\d{4})/g)) {
    const g = Number(m[1]), a = Number(m[2])
    if (g >= 1 && g <= 31 && a >= 1 && a <= 12) out.push(`${m[3]}-${iki(a)}-${iki(g)}`)
  }
  for (const m of metin.matchAll(/(\d{4})-(\d{2})-(\d{2})/g)) out.push(`${m[1]}-${m[2]}-${m[3]}`)
  return out
}

/**
 * Passive on the list as of `listeTarihi`? Latest passivation later than latest activation (or never activated),
 * and not dated after the list. Equal dates cannot be ordered from the list: reported as 'belirsiz' and the
 * product is left as the list presents it (listed, covered).
 */
export function pasifDurumu(aktiflenme, pasiflenme, listeTarihi) {
  const sinir = listeTarihi || '9999-12-31'
  const a = aktiflenme.filter((t) => t <= sinir).sort().pop() || null
  const p = pasiflenme.filter((t) => t <= sinir).sort().pop() || null
  if (!p) return { pasif: false, belirsiz: false, tarih: null }
  if (a && a === p) return { pasif: false, belirsiz: true, tarih: p }
  if (a && a > p) return { pasif: false, belirsiz: false, tarih: null }
  return { pasif: true, belirsiz: false, tarih: p }
}

/** "8699…, 8680…" / "8699…\n8680…" → barcodes. */
export function barkodlar(hucre) {
  return String(hucre ?? '').match(/\d{8,14}/g) || []
}

function odenmiyor(kayit, durum, tarih) {
  const yeni = { ...kayit, sgk: false, sgkDurum: durum }
  if (tarih) yeni.sgkDurumTarihi = tarih
  else delete yeni.sgkDurumTarihi
  return yeni
}

/**
 * Merge list rows into the catalogue.
 *
 * @param mevcut  existing catalogue records
 * @param satirlar  rows read from the spreadsheet(s), in file order:
 *   { kamuNo, barkod, ad, esdegerGrubu, eskiBarkodlar: string[], aktiflenme: string[], pasiflenme: string[], cikarma: boolean }
 * @param secenek  { tamListe: boolean, listeTarihi: 'YYYY-MM-DD' }
 * @returns { ilaclar, rapor }
 */
export function listeyiBirlestir(mevcut, satirlar, secenek = {}) {
  const tamListe = !!secenek.tamListe
  const listeTarihi = secenek.listeTarihi || null
  const anahtar = (k) => k.barkod || k.ad

  const harita = new Map()
  for (const k of mevcut) harita.set(anahtar(k), k)

  const rapor = {
    oncekiKayit: harita.size,
    eklenen: [], cikarilan: [], yenidenBarkodlanan: [], pasif: [], pasifBelirsiz: [],
    adiDegisen: [], esdegerDegisen: [], yenidenOdenen: [], etkenKorunan: 0, etkensizYeni: [],
  }
  const gorulen = new Set()
  // A former barcode that the list still names as a current barcode is a product of its own, not a move.
  const guncelBarkodlar = new Set(satirlar.filter((s) => !s.cikarma).map(anahtar))

  for (const s of satirlar) {
    const k = anahtar(s)
    if (!k) continue
    if (s.cikarma) {
      const eski = harita.get(k)
      if (eski && eski.sgk !== false) {
        harita.set(k, odenmiyor(eski, 'cikarildi', listeTarihi))
        rapor.cikarilan.push({ barkod: eski.barkod, ad: eski.ad })
      }
      gorulen.add(k)
      continue
    }

    const { ad, marka } = parcala(s.ad)
    let eski = harita.get(k)
    let etkenKaynagi = eski

    // Re-barcoded product: SGK's own "Eski Barkodlar" column names the former barcode. Same Kamu No = same list
    // entry, so the TİTCK ingredient recorded under the former barcode still describes this product.
    if (!eski) {
      for (const eb of s.eskiBarkodlar || []) {
        const onceki = harita.get(eb)
        if (onceki && !guncelBarkodlar.has(eb) && onceki.kamuNo && onceki.kamuNo === s.kamuNo) {
          etkenKaynagi = onceki
          harita.delete(eb)
          rapor.yenidenBarkodlanan.push({ eskiBarkod: eb, barkod: s.barkod, ad })
          break
        }
      }
    }

    const esdegerGrubu = esdegerGrubuTemizle(s.esdegerGrubu)
    let yeni = { kamuNo: s.kamuNo, barkod: s.barkod, ad, marka, esdegerGrubu, sgk: true }
    if (etkenKaynagi) {
      for (const alan of TITCK_ALANLARI) if (etkenKaynagi[alan] !== undefined) yeni[alan] = etkenKaynagi[alan]
      if (etkenKaynagi !== eski && yeni.etkenMadde) yeni.etkenKaynak = 'eski-barkod'
      if (yeni.etkenMadde) rapor.etkenKorunan++
    }

    const durum = pasifDurumu(s.aktiflenme || [], s.pasiflenme || [], listeTarihi)
    if (durum.belirsiz) rapor.pasifBelirsiz.push({ barkod: s.barkod, ad, tarih: durum.tarih })
    if (durum.pasif) {
      yeni = odenmiyor(yeni, 'pasif', durum.tarih)
      rapor.pasif.push({ barkod: s.barkod, ad, tarih: durum.tarih })
    }

    if (!eski && etkenKaynagi === undefined) {
      rapor.eklenen.push({ barkod: s.barkod, ad })
      if (!yeni.etkenMadde) rapor.etkensizYeni.push({ barkod: s.barkod, ad })
    } else if (eski) {
      if (bosluksuz(eski.ad) !== bosluksuz(ad)) rapor.adiDegisen.push({ barkod: s.barkod, once: eski.ad, sonra: ad })
      if (!ayniGrup(eski.esdegerGrubu, esdegerGrubu)) rapor.esdegerDegisen.push({ barkod: s.barkod, ad, once: eski.esdegerGrubu || '', sonra: esdegerGrubu })
      if (eski.sgk === false && yeni.sgk) rapor.yenidenOdenen.push({ barkod: s.barkod, ad })
    }

    harita.set(k, yeni)
    gorulen.add(k)
  }

  // (c) Full list only: what the catalogue has and the list no longer names is not reimbursed (SUT 4.1.9(1)).
  if (tamListe) {
    for (const [k, eski] of harita) {
      if (gorulen.has(k)) continue
      if (eski.sgk === false && eski.sgkDurum === 'cikarildi') continue
      harita.set(k, odenmiyor(eski, 'cikarildi', listeTarihi))
      rapor.cikarilan.push({ barkod: eski.barkod, ad: eski.ad })
    }
  }

  const ilaclar = [...harita.values()].sort((a, b) => a.ad.localeCompare(b.ad, 'tr'))
  rapor.toplam = ilaclar.length
  rapor.odenen = ilaclar.filter((d) => d.sgk !== false).length
  rapor.odenmeyen = rapor.toplam - rapor.odenen
  rapor.etkenli = ilaclar.filter((d) => d.etkenMadde).length
  return { ilaclar, rapor }
}
