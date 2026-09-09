/**
 * NOTYA-MEDULA P1 — "Medula'ya hazır reçete".
 *
 * Kaan direktifi (2026-09-09): özel hekimin en sevmediği günlük iş Medula'ya reçete girmek.
 * Sıfır maliyetli sürüm: doktor kendi Medula Doktor girişini ve kendi e-imzasını kullanmaya devam
 * eder; Notya o tıktan ÖNCEKİ her şeyi hazırlar — ilaç satırlarını Medula'nın istediği biçime
 * (doz1 x doz2, periyot, birim, kutu adedi) çevirir, tanıları ICD-10 olarak sıralar, SUT/güvenlik
 * uyarılarını Ayşe'nin diliyle söyler ve "📋 Medula için kopyala" metnini üretir.
 *
 * Bu modül LLM kullanmaz: deterministik parse + kural tablosu. Hastanın TC'si burada asla yer
 * almaz (Notya hash-only tutar); doktor Medula'da hastayı kendisi seçer.
 *
 * P3 için aynı taslak erecete.s1.xsd'ye uygun XML'e çevrilir (ereceteXml) — imza doktorun
 * cihazında atılır, Notya sunucusu asla imzalamaz.
 */
import type { MedulaEreceteBilgisi, MedulaIlac, MedulaTani } from './tipler'
import { PERIYOT_BIRIMI, KULLANIM_SEKLI, PROVIZYON_TIPI, RECETE_ALT_TURU, RECETE_TURU } from './tipler'

export interface IlacGirdisi {
  ilac_adi: string
  etken_madde?: string | null
  doz?: string | null            // "500 mg", "125 mg/5 ml", "90 mg/kg/gün"
  kullanim_sikli?: string | null // "2x1", "3x1 5 gün", "günde 2 kez", "12 saatte bir", "1x1 sabah aç"
  notlar?: string | null
  baslangic_tarihi?: string | null
  bitis_tarihi?: string | null
}

export interface HastaGirdisi { ad: string; soyad: string; dogumTarihi?: string | null; cinsiyet?: 'male' | 'female' | null; kiloKg?: number | null }
export interface DoktorGirdisi { ad: string; soyad: string; bransKodu?: number | null; sertifikaKodu?: number }
export interface TaniGirdisi { code: string; description?: string; is_primary?: boolean }

export interface MedulaTaslak {
  erecete: MedulaEreceteBilgisi
  satirlar: MedulaSatir[]
  uyarilar: string[]     // Ayşe'nin söyleyecekleri (SUT, yaş, süre)
  eksikler: string[]     // Medula'da doktorun tamamlayacakları (barkod, TC, tesis kodu)
  metin: string          // "Medula için kopyala"
}

export interface MedulaSatir {
  ilacAdi: string
  etkenMadde: string
  dozMetni: string
  kullanimOzeti: string  // "2x1, 7 gün"
  gunlukAlim: number
  gunSayisi: number | null
  kutu: number
  kutuNotu: string       // "kutu içeriği bilinmiyor — Medula'da adet kontrol et"
}

// ------------------------------------------------------------------
// Doz/kullanım ayrıştırma — "2x1", "3x1 5 gün", "günde 2 kez 7 gün", "12 saatte bir", "haftada 1"
// ------------------------------------------------------------------
export function kullanimCoz(metin: string | null | undefined): { doz1: number; doz2: number; periyot: number; birim: number; gunSayisi: number | null; ozet: string } {
  const t = (metin || '').toLowerCase().replace(/,/g, '.').trim()
  let doz1 = 1, doz2 = 1, periyot = 1, birim: number = PERIYOT_BIRIMI.gun
  const nxm = t.match(/(\d+)\s*[x×*]\s*(\d+(?:\.\d+)?|½|1\/2)/)
  if (nxm) {
    doz1 = Number(nxm[1])
    doz2 = nxm[2] === '½' || nxm[2] === '1/2' ? 0.5 : Number(nxm[2])
  } else {
    const gunde = t.match(/günde\s*(\d+)/) || t.match(/(\d+)\s*(?:kez|defa|kere)/)
    const saatte = t.match(/(\d+)\s*saatte\s*(?:bir|1)/)
    const haftada = t.match(/haftada\s*(\d+)/)
    if (saatte) { doz1 = Math.max(1, Math.round(24 / Number(saatte[1]))) }
    else if (gunde) { doz1 = Number(gunde[1]) }
    else if (haftada) { doz1 = Number(haftada[1]); birim = PERIYOT_BIRIMI.hafta }
    else if (/tek doz|1 doz|bir doz/.test(t)) { doz1 = 1 }
  }
  const sure = t.match(/(\d+)\s*gün/) 
  const hafta = t.match(/(\d+)\s*hafta/)
  const gunSayisi = sure ? Number(sure[1]) : hafta ? Number(hafta[1]) * 7 : null
  const birimAd = birim === PERIYOT_BIRIMI.hafta ? 'haftada' : 'günde'
  const ozet = `${doz1}x${doz2 === 0.5 ? '½' : doz2}${birim !== PERIYOT_BIRIMI.gun ? ` (${birimAd})` : ''}${gunSayisi ? `, ${gunSayisi} gün` : ''}`
  return { doz1, doz2, periyot, birim, gunSayisi, ozet }
}

export function kullanimSekliBul(metin: string): number {
  const t = metin.toLowerCase()
  if (/inhal|nebül|nebul|püskürt/.test(t)) return KULLANIM_SEKLI.inhalasyon
  if (/i\.?m\b|kas içi|intramusk/.test(t)) return KULLANIM_SEKLI.intramuskuler
  if (/i\.?v\b|damar|intraven/.test(t)) return KULLANIM_SEKLI.intravenoz
  if (/burun|nazal|sprey/.test(t)) return KULLANIM_SEKLI.nazal
  if (/göz|oftalm|damla/.test(t)) return KULLANIM_SEKLI.oftalmik
  if (/supp|fitil|rektal/.test(t)) return KULLANIM_SEKLI.rektal
  if (/s\.?c\b|cilt altı|subkut/.test(t)) return KULLANIM_SEKLI.subkutan
  if (/krem|pomad|merhem|losyon|jel|topik|haricen/.test(t)) return KULLANIM_SEKLI.topikal
  return KULLANIM_SEKLI.agizdan
}

// ------------------------------------------------------------------
// SUT / güvenlik kuralları — Ayşe'nin reçete onayında söyleyecekleri.
// Tümü uyarıdır, engel değildir (yetki doktordadır). Klinik kurallar: pediatri yaş kısıtları
// (kaynak: prospektüs/AAP genel kabul), SUT: geri ödeme kısıt hatırlatmaları (SUT EK-4/E,F).
// ------------------------------------------------------------------
interface Kural { eslesme: RegExp; uyari: (b: { yasAy: number | null; gunSayisi: number | null; kutu: number }) => string | null }
const KURALLAR: Kural[] = [
  { eslesme: /tetrasiklin|doksisiklin|minosiklin/, uyari: ({ yasAy }) => yasAy !== null && yasAy < 96 ? '8 yaş altında tetrasiklin grubu diş/kemik etkisi nedeniyle önerilmez.' : null },
  { eslesme: /siprofloksasin|levofloksasin|moksifloksasin|florokinolon/, uyari: ({ yasAy }) => yasAy !== null && yasAy < 216 ? '18 yaş altında florokinolon yalnız sınırlı endikasyonda; SUT ayrıca EHU onayı isteyebilir.' : null },
  { eslesme: /asetilsalisilik|aspirin/, uyari: ({ yasAy }) => yasAy !== null && yasAy < 192 ? 'Viral tabloda 16 yaş altına aspirin — Reye sendromu riski.' : null },
  { eslesme: /kodein|tramadol/, uyari: ({ yasAy }) => yasAy !== null && yasAy < 144 ? '12 yaş altında kodein/tramadol kontrendike.' : null },
  { eslesme: /metoklopramid/, uyari: ({ yasAy }) => yasAy !== null && yasAy < 12 ? '1 yaş altında metoklopramid kontrendike; çocukta ekstrapiramidal risk.' : null },
  { eslesme: /amoksisilin|klavulan|sefuroksim|sefiksim|azitromisin|klaritromisin|sefdinir/, uyari: ({ gunSayisi }) => gunSayisi !== null && gunSayisi > 14 ? 'Antibiyotik süresi 14 günü aşıyor — SUT açıklama ister.' : 'Antibiyotik: SUT gereği reçetede ICD-10 tanı zorunlu; oral 3. kuşak sefalosporin/makrolid için endikasyon açıklaması eczaneye kolaylık sağlar.' },
  { eslesme: /montelukast/, uyari: () => 'Montelukast SUT EK-4/F: astım/alerjik rinit tanısı reçetede yer almalı; uzun süreli kullanımda rapor gerekebilir.' },
  { eslesme: /salbutamol|budesonid|flutikazon|beklometazon/, uyari: () => 'İnhaler/nebül: SUT’a göre astım/bronşiolit tanısı; ayda birden fazla kutu açıklama ister.' },
  { eslesme: /omeprazol|lansoprazol|pantoprazol|esomeprazol|rabeprazol/, uyari: ({ gunSayisi }) => gunSayisi !== null && gunSayisi > 56 ? 'PPİ 8 haftayı aşan kullanımda SUT rapor ister.' : null },
  { eslesme: /vitamin d|kolekalsiferol|d3/, uyari: () => 'D vitamini damla 0-1 yaş profilaksi SUT kapsamında; yüksek doz ampul için 25-OH-D düzeyi açıklaması gerekir.' },
  { eslesme: /demir|ferr/, uyari: () => 'Demir preparatı: SUT geri ödemesi için hemogram/ferritin bulgusu açıklamada yer almalı.' },
  { eslesme: /.*/, uyari: ({ kutu }) => kutu > 3 ? `${kutu} kutu — 3 kutuyu aşan miktar SUT’ta açıklama/rapor ister.` : null },
]

function yasAyHesapla(dogum: string | null | undefined): number | null {
  if (!dogum) return null
  const d = new Date(dogum)
  if (isNaN(d.getTime())) return null
  return Math.floor((Date.now() - d.getTime()) / (30.44 * 86400000))
}

function ddMMyyyy(d: Date): string {
  return d.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ------------------------------------------------------------------
// Taslak
// ------------------------------------------------------------------
export function medulaTaslagiHazirla(g: {
  ilaclar: IlacGirdisi[]
  tanilar: TaniGirdisi[]
  hasta: HastaGirdisi
  doktor: DoktorGirdisi
  protokolNo: string
  receteTarihi?: Date
}): MedulaTaslak {
  const uyarilar = new Set<string>()
  const eksikler = new Set<string>()
  const yasAy = yasAyHesapla(g.hasta.dogumTarihi)

  const satirlar: MedulaSatir[] = []
  const ilacBilgisi: MedulaIlac[] = g.ilaclar.map((i) => {
    const k = kullanimCoz(`${i.kullanim_sikli || ''} ${i.notlar || ''}`)
    const gunlukAlim = k.birim === PERIYOT_BIRIMI.gun ? k.doz1 * k.doz2 : (k.doz1 * k.doz2) / 7
    // Kutu içeriği (tablet/ml) Notya'da bilinmiyor → 1 kutu varsayılır, adet doktor kontrolüne bırakılır
    const kutu = 1
    const etken = (i.etken_madde || '').toLowerCase()
    const metin = `${i.ilac_adi} ${etken} ${i.doz || ''} ${i.kullanim_sikli || ''} ${i.notlar || ''}`.toLowerCase()
    for (const kural of KURALLAR) {
      if (kural.eslesme.test(metin)) {
        const u = kural.uyari({ yasAy, gunSayisi: k.gunSayisi, kutu })
        if (u) uyarilar.add(`${i.ilac_adi}: ${u}`)
      }
    }
    eksikler.add(`${i.ilac_adi}: barkod eşleşmedi — Medula'da ilaç listesinden seçilecek`)
    satirlar.push({
      ilacAdi: i.ilac_adi, etkenMadde: i.etken_madde || '', dozMetni: i.doz || '', kullanimOzeti: k.ozet,
      gunlukAlim, gunSayisi: k.gunSayisi, kutu, kutuNotu: 'kutu içeriği Notya\'da yok — adedi Medula\'da kontrol et',
    })
    return {
      barkod: null, ilacAdi: i.ilac_adi, adet: kutu,
      kullanimDoz1: k.doz1, kullanimDoz2: k.doz2, kullanimPeriyot: k.periyot, kullanimPeriyotBirimi: k.birim,
      kullanimSekli: kullanimSekliBul(metin),
      aciklamalar: i.notlar ? [{ aciklamaTuru: 1, aciklama: i.notlar.slice(0, 200) }] : undefined,
    }
  })

  const tanilar: MedulaTani[] = g.tanilar
    .filter((t) => t.code)
    .sort((a, b) => Number(!!b.is_primary) - Number(!!a.is_primary))
    .map((t) => ({ taniKodu: t.code.trim().toUpperCase(), taniAdi: t.description }))
  if (tanilar.length === 0) uyarilar.add('Reçetede ICD-10 tanı yok — Medula tanısız reçete kabul etmez.')
  if (!g.doktor.bransKodu) eksikler.add('SGK branş kodu profilde tanımlı değil')
  eksikler.add('Hasta TC kimlik no Medula\'da girilecek (Notya TC saklamaz)')
  eksikler.add('Tesis kodu / doktor TC: Medula oturumundan gelir')

  const tarih = g.receteTarihi || new Date()
  const erecete: MedulaEreceteBilgisi = {
    tesisKodu: null, tcKimlikNo: null, protokolNo: g.protokolNo,
    provizyonTipi: PROVIZYON_TIPI.normal, receteAltTuru: RECETE_ALT_TURU.ayaktan,
    receteTarihi: ddMMyyyy(tarih), receteTuru: RECETE_TURU.normal,
    doktorTcKimlikNo: null, doktorAdi: g.doktor.ad, doktorSoyadi: g.doktor.soyad,
    doktorBransKodu: g.doktor.bransKodu || null, doktorSertifikaKodu: g.doktor.sertifikaKodu ?? 0,
    kisiBilgisi: {
      tcKimlikNo: null, adi: g.hasta.ad, soyadi: g.hasta.soyad,
      cinsiyeti: g.hasta.cinsiyet === 'male' ? 'E' : g.hasta.cinsiyet === 'female' ? 'K' : undefined,
      dogumTarihi: g.hasta.dogumTarihi ? ddMMyyyy(new Date(g.hasta.dogumTarihi)) : undefined,
    },
    ereceteIlacBilgisi: ilacBilgisi, ereceteTaniBilgisi: tanilar, ereceteAciklamaBilgisi: [],
  }

  return { erecete, satirlar, uyarilar: [...uyarilar], eksikler: [...eksikler], metin: medulaMetni(erecete, satirlar) }
}

/** "📋 Medula için kopyala" — Medula Doktor ekranındaki sırayla, satır satır. TC yok. */
export function medulaMetni(e: MedulaEreceteBilgisi, satirlar: MedulaSatir[]): string {
  const c: string[] = []
  c.push(`MEDULA E-REÇETE — ${e.receteTarihi}`)
  c.push(`Hasta: ${e.kisiBilgisi.adi} ${e.kisiBilgisi.soyadi}${e.kisiBilgisi.dogumTarihi ? ` · Doğum ${e.kisiBilgisi.dogumTarihi}` : ''}${e.kisiBilgisi.cinsiyeti ? ` · ${e.kisiBilgisi.cinsiyeti}` : ''}`)
  c.push(`Protokol: ${e.protokolNo} · Reçete türü: Normal · Alt tür: Ayaktan · Provizyon: Normal`)
  c.push('')
  c.push('TANILAR (ICD-10)')
  for (const t of e.ereceteTaniBilgisi) c.push(`  ${t.taniKodu}${t.taniAdi ? ` — ${t.taniAdi}` : ''}`)
  c.push('')
  c.push('İLAÇLAR')
  e.ereceteIlacBilgisi.forEach((i, n) => {
    const s = satirlar[n]
    const doz2 = i.kullanimDoz2 === 0.5 ? '½' : String(i.kullanimDoz2)
    c.push(`  ${n + 1}. ${i.ilacAdi}${s?.dozMetni ? ` ${s.dozMetni}` : ''}`)
    c.push(`     Doz: ${i.kullanimDoz1} x ${doz2} · Periyot: ${i.kullanimPeriyot} ${i.kullanimPeriyotBirimi === PERIYOT_BIRIMI.hafta ? 'hafta' : 'gün'} · Adet: ${i.adet} kutu${s?.gunSayisi ? ` · Süre: ${s.gunSayisi} gün` : ''}`)
    if (i.aciklamalar?.length) c.push(`     Açıklama: ${i.aciklamalar[0].aciklama}`)
  })
  c.push('')
  c.push(`Hekim: Dr. ${e.doktorAdi} ${e.doktorSoyadi}${e.doktorBransKodu ? ` · Branş ${e.doktorBransKodu}` : ''}`)
  c.push('Notya AI ile hazırlandı — hasta TC ve ilaç barkodu Medula\'da seçilir; e-imza hekime aittir.')
  return c.join('\n')
}

/** erecete.s1.xsd sırasıyla XML (P3 — imzalanacak veri). Şema: ereceteBilgisi kökü. */
export function ereceteXml(e: MedulaEreceteBilgisi): string {
  const x = (s: string | number | null | undefined) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const opt = (ad: string, v: string | number | null | undefined) => (v === null || v === undefined || v === '' ? '' : `<${ad}>${x(v)}</${ad}>`)
  const ilaclar = e.ereceteIlacBilgisi.map((i) =>
    `<ereceteIlacBilgisi><adet>${i.adet}</adet><barkod>${i.barkod ?? 0}</barkod>${opt('ilacAdi', i.ilacAdi)}<kullanimDoz1>${i.kullanimDoz1}</kullanimDoz1><kullanimDoz2>${i.kullanimDoz2}</kullanimDoz2><kullanimPeriyot>${i.kullanimPeriyot}</kullanimPeriyot><kullanimPeriyotBirimi>${i.kullanimPeriyotBirimi}</kullanimPeriyotBirimi><kullanimSekli>${i.kullanimSekli}</kullanimSekli>${(i.aciklamalar || []).map((a) => `<ereceteIlacAciklamaBilgisi>${opt('aciklama', a.aciklama)}<aciklamaTuru>${a.aciklamaTuru}</aciklamaTuru></ereceteIlacAciklamaBilgisi>`).join('')}</ereceteIlacBilgisi>`).join('')
  const tanilar = e.ereceteTaniBilgisi.map((t) => `<ereceteTaniBilgisi>${opt('taniAdi', t.taniAdi)}${opt('taniKodu', t.taniKodu)}</ereceteTaniBilgisi>`).join('')
  const aciklamalar = e.ereceteAciklamaBilgisi.map((a) => `<ereceteAciklamaBilgisi>${opt('aciklama', a.aciklama)}<aciklamaTuru>${a.aciklamaTuru}</aciklamaTuru></ereceteAciklamaBilgisi>`).join('')
  const k = e.kisiBilgisi
  return `<?xml version="1.0" encoding="UTF-8"?><ereceteBilgisi><tesisKodu>${e.tesisKodu ?? 0}</tesisKodu><tcKimlikNo>${e.tcKimlikNo ?? 0}</tcKimlikNo>${opt('protokolNo', e.protokolNo)}<provizyonTipi>${e.provizyonTipi}</provizyonTipi><receteAltTuru>${e.receteAltTuru}</receteAltTuru>${opt('receteTarihi', e.receteTarihi)}<receteTuru>${e.receteTuru}</receteTuru>${opt('seriNo', e.seriNo)}${opt('takipNo', e.takipNo)}<doktorTcKimlikNo>${e.doktorTcKimlikNo ?? 0}</doktorTcKimlikNo>${opt('doktorAdi', e.doktorAdi)}${opt('doktorSoyadi', e.doktorSoyadi)}<doktorBransKodu>${e.doktorBransKodu ?? 0}</doktorBransKodu><doktorSertifikaKodu>${e.doktorSertifikaKodu}</doktorSertifikaKodu><kisiBilgisi><tcKimlikNo>${k.tcKimlikNo ?? 0}</tcKimlikNo>${opt('adi', k.adi)}${opt('soyadi', k.soyadi)}${opt('cinsiyeti', k.cinsiyeti)}${opt('dogumTarihi', k.dogumTarihi)}</kisiBilgisi>${ilaclar}${tanilar}${aciklamalar}</ereceteBilgisi>`
}
