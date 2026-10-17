/**
 * MUAYENE-EKLERI-01 — ek türü sınıflandırması (lab / aşı / foto / röntgen / EKG / epikriz / diğer). Saf + istemci-güvenli.
 *
 * Tasarım (basit, açıklanabilir, hekime özel):
 *  1) KANIT: dosya adı, MIME, (varsa) belgeden okunan metin, yükleme kaynağı (kamera/barkod), hekimin hatırlatıcıdan
 *     verdiği ipucu ve yapay zekâ görsel tahmini. Her kanıt bir tür için 0–1 ağırlık verir; kanıtlar noisy-OR ile birleşir.
 *  2) ÖĞRENME: bu hekimin (ve branşının) önceki onay/düzeltmelerinden gelen kayıtlar. Özellik = kontrollü sözlükten çıkan
 *     anahtarlar ("ad:tahlil", "mime:pdf", "ai:foto+kaynak:kamera" …) — serbest dosya adı parçaları SAKLANMAZ, bu yüzden
 *     hasta adı/TC gibi PII öğrenme tablosuna giremez. Aynı özellikte tutarlı bir tür seçimi varsa o türe kanıt eklenir
 *     ve rakip türler sönümlenir.
 *  3) KARAR: en yüksek puan ≥ ESIK_OTOMATIK ve ikinciyle fark ≥ ESIK_FARK ise otomatik; aksi halde `sor: true`
 *     (hekime "Bu nedir?" — sessiz yanlış sınıflandırma yok).
 */
import type { EkKaynak, EkTuru, SiniflandirmaSonucu } from './tipler'
import { EK_TURLERI, EK_TUR_ETIKETI } from './tipler'

export const ESIK_OTOMATIK = 0.75
export const ESIK_FARK = 0.2
/** Öğrenmenin tek başına verebileceği en yüksek kanıt (hekim düzeltmesi bile ardışık tutarsızlıkta sürekli kazanmasın). */
const OGRENME_TAVAN = 0.75
const AZAMI_OZELLIK = 14

export interface OgrenmeKaydi {
  ozellik: string
  tur: EkTuru
  onay: number
  duzeltme: number
}

export interface SiniflandirGirdi {
  dosyaAdi: string
  mime: string
  kaynak: EkKaynak
  /** PDF/CSV'den çıkarılan ilk metin (varsa). Saklanmaz. */
  metin?: string | null
  /** Hekimin hatırlatıcıdan "Yükle"ye basarak verdiği tür ipucu. */
  ipucuTur?: EkTuru | null
  /** Yapay zekâ görsel/belge tahmini (yalnız gerekirse çağrılır). */
  ai?: { tur: EkTuru; guven: number } | null
}

// ─── Kontrollü sözlük (dosya adı: ASCII-katlanmış; metin: tr-TR küçük harf) ──────────────────────────────────
type Sozluk = Record<Exclude<EkTuru, 'diger'>, { ad: string[]; metin: RegExp[] }>

const SOZLUK: Sozluk = {
  lab: {
    ad: ['tahlil', 'lab', 'laboratuvar', 'laboratuar', 'hemogram', 'biyokimya', 'idrar', 'cbc', 'urine', 'kan', 'crp', 'tsh', 'ferritin', 'hba1c', 'sonuc'],
    metin: [/hemogram|hemoglobin|lökosit|trombosit|eritrosit|hematokrit/u, /biyokimya|kreatinin|glukoz|üre\b|alt\b|ast\b/u, /referans\s+aral|ref\.?\s+aral|birim\b|mg\/dl|g\/dl|u\/l|10\^?3/u, /numune|laboratuvar|laboratuar|barkod\s+no/u],
  },
  asi: {
    ad: ['asi', 'karne', 'barkod', 'hexaxim', 'pentaxim', 'prevenar', 'kpa', 'kkk', 'bcg', 'rota', 'flakon', 'lot'],
    metin: [/aşı\s+karnesi|aşı\s+kartı|aşı\s+takvim/u, /\blot\b|parti\s+no|skt|son\s+kullanma|uygulama\s+yeri/u, /hexaxim|pentaxim|infanrix|prevenar|synflorix|rotarix|dabt|kpa\b|kkk\b|hepatit\s*[ab]|bcg|menveo|bexsero/u, /\bdoz\b.*(?:tarih|uygulama)/u],
  },
  foto: {
    ad: ['foto', 'fotograf', 'photo', 'resim', 'lezyon', 'onces', 'sonras', 'before', 'after', 'yara', 'dokuntu'],
    metin: [],
  },
  rontgen: {
    ad: ['rontgen', 'grafi', 'xray', 'x-ray', 'cxr', 'akciger', 'usg', 'ultrason', 'tomografi', 'dicom', 'dcm', 'radyoloji', 'mrg', 'pa'],
    metin: [/radyoloji|toraks|akciğer\s+grafi|opasite|konsolidasyon|plevral|izlenim|bulgular\b.*grafi/u, /ultrasonografi|usg\b|tomografi|manyetik\s+rezonans/u],
  },
  ekg: {
    ad: ['ekg', 'ecg', 'elektrokardiyografi', 'kardiyogram'],
    metin: [/\bekg\b|elektrokardiyografi|pr\s+aralığı|qrs|qt[c]?\b|bpm|sinüs\s+ritm/u],
  },
  epikriz: {
    ad: ['epikriz', 'taburcu', 'discharge', 'epicrisis', 'rapor', 'sevk', 'konsultasyon'],
    metin: [/epikriz|taburcu|yatış\s+tarihi|çıkış\s+tarihi|hastaneye\s+yatış|konsültasyon\s+sonucu/u],
  },
}

const MIME_KANIT: { test: (m: string) => boolean; tur: EkTuru; w: number; ozellik: string }[] = [
  { test: (m) => /csv|excel|spreadsheet/.test(m), tur: 'lab', w: 0.75, ozellik: 'mime:tablo' },
  { test: (m) => /dicom/.test(m), tur: 'rontgen', w: 0.95, ozellik: 'mime:dicom' },
  { test: (m) => /^text\/plain/.test(m), tur: 'diger', w: 0.3, ozellik: 'mime:metin' },
  { test: (m) => /^audio\//.test(m), tur: 'diger', w: 0.6, ozellik: 'mime:ses' },
]

/** Dosya adını ASCII'ye katlayıp kelime parçalarına böler (yalnız sözlük eşleşmesi için; parçalar saklanmaz). */
export function adParcalari(dosyaAdi: string): string[] {
  const katlanmis = String(dosyaAdi || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/İ/g, 'i')
    .replace(/\.[a-z0-9]{2,5}$/, '')
  return katlanmis.split(/[^a-z0-9\-]+/).filter(Boolean)
}

function adIsabetleri(parcalar: string[], tur: Exclude<EkTuru, 'diger'>): string[] {
  const sozluk = SOZLUK[tur].ad
  const isabet = new Set<string>()
  for (const p of parcalar) {
    for (const s of sozluk) {
      // Kısa anahtarlar ("pa", "kan", "lab", "lot") yalnız tam parça olarak; uzunlar öneklenebilir (asi → asi_karnesi).
      if (s.length <= 3 ? p === s : p === s || p.startsWith(s)) isabet.add(s)
    }
  }
  return Array.from(isabet)
}

function metinIsabeti(metin: string, tur: Exclude<EkTuru, 'diger'>): number {
  const m = metin.toLocaleLowerCase('tr-TR')
  return SOZLUK[tur].metin.filter((r) => r.test(m)).length
}

function mimeAilesi(mime: string): string {
  const m = String(mime || '').toLowerCase()
  if (m === 'application/pdf') return 'pdf'
  if (m.startsWith('image/')) return 'gorsel'
  if (m.startsWith('audio/')) return 'ses'
  if (/csv|excel|spreadsheet/.test(m)) return 'tablo'
  return 'diger'
}

/** Öğrenme özellikleri — YALNIZ kontrollü sözlükten türeyen anahtarlar. PII taşıyamaz. */
export function ozellikleriCikar(g: SiniflandirGirdi): string[] {
  const o = new Set<string>()
  o.add(`mime:${mimeAilesi(g.mime)}`)
  o.add(`kaynak:${g.kaynak}`)
  const parcalar = adParcalari(g.dosyaAdi)
  for (const tur of Object.keys(SOZLUK) as Exclude<EkTuru, 'diger'>[]) {
    for (const s of adIsabetleri(parcalar, tur)) o.add(`ad:${s}`)
    if (g.metin && metinIsabeti(g.metin, tur) > 0) o.add(`metin:${tur}`)
  }
  if (/^img[_-]?\d+/i.test(String(g.dosyaAdi || ''))) o.add('ad:kamera-adi')
  if (g.ai) {
    o.add(`ai:${g.ai.tur}`)
    o.add(`ai:${g.ai.tur}+kaynak:${g.kaynak}`)
    o.add(`ai:${g.ai.tur}+mime:${mimeAilesi(g.mime)}`)
  }
  return Array.from(o).slice(0, AZAMI_OZELLIK)
}

const noisyOr = (xs: number[]) => 1 - xs.reduce((p, x) => p * (1 - Math.min(0.99, Math.max(0, x))), 1)

interface Kanit { w: number; neden: string }

export function sinifla(g: SiniflandirGirdi, ogrenme: OgrenmeKaydi[] = []): SiniflandirmaSonucu {
  const kanit: Record<EkTuru, Kanit[]> = { lab: [], asi: [], foto: [], rontgen: [], ekg: [], epikriz: [], diger: [] }
  const ekle = (t: EkTuru, w: number, neden: string) => { if (w > 0) kanit[t].push({ w, neden }) }

  const parcalar = adParcalari(g.dosyaAdi)
  for (const tur of Object.keys(SOZLUK) as Exclude<EkTuru, 'diger'>[]) {
    const ad = adIsabetleri(parcalar, tur)
    if (ad.length) ekle(tur, Math.min(0.75, 0.55 + 0.1 * (ad.length - 1)), `dosya adı ipucu (${EK_TUR_ETIKETI[tur]})`)
    if (g.metin) {
      const n = metinIsabeti(g.metin, tur)
      if (n > 0) ekle(tur, Math.min(0.93, 0.5 + 0.15 * n), `belge metni (${EK_TUR_ETIKETI[tur]} terimleri)`)
    }
  }
  const mime = String(g.mime || '').toLowerCase()
  for (const m of MIME_KANIT) if (m.test(mime)) ekle(m.tur, m.w, `dosya biçimi (${m.ozellik})`)
  if (g.kaynak === 'barkod') ekle('asi', 0.92, 'barkod ile yüklendi')
  if (g.ipucuTur) ekle(g.ipucuTur, 0.65, 'hatırlatıcıdan yüklendi')
  if (g.ai) ekle(g.ai.tur, Math.min(0.9, Math.max(0, g.ai.guven) * 0.9), 'yapay zekâ görsel tahmini')
  // Hiçbir şey yoksa: bir görüntü dosyası çoğunlukla fotoğraftır ama bu çok zayıf bir ipucudur (asla tek başına otomatik olmaz).
  if (/^image\//.test(mime) && !EK_TURLERI.some((t) => t !== 'diger' && kanit[t].length)) ekle('foto', 0.3, 'görüntü dosyası (zayıf ipucu)')
  if (!EK_TURLERI.some((t) => kanit[t].length)) ekle('diger', 0.2, 'tanıyıcı ipucu yok')

  // ── Öğrenme ───────────────────────────────────────────────────────────────────────────────────────────
  const ozellikler = new Set(ozellikleriCikar(g))
  const kayitlar = new Map<string, OgrenmeKaydi[]>()
  for (const k of ogrenme) {
    if (!ozellikler.has(k.ozellik)) continue
    const l = kayitlar.get(k.ozellik) || []
    l.push(k)
    kayitlar.set(k.ozellik, l)
  }
  const sonum: Record<EkTuru, number> = { lab: 1, asi: 1, foto: 1, rontgen: 1, ekg: 1, epikriz: 1, diger: 1 }
  const ogrenilen: Record<EkTuru, { w: number; adet: number }> = { lab: { w: 0, adet: 0 }, asi: { w: 0, adet: 0 }, foto: { w: 0, adet: 0 }, rontgen: { w: 0, adet: 0 }, ekg: { w: 0, adet: 0 }, epikriz: { w: 0, adet: 0 }, diger: { w: 0, adet: 0 } }
  for (const [, liste] of kayitlar) {
    // Düzeltme, onaydan daha güçlü sinyal (hekim açıkça "hayır, şu" dedi).
    const toplam = liste.reduce((n, k) => n + k.onay + 2 * k.duzeltme, 0)
    if (toplam < 2) continue
    const baskin = liste.slice().sort((a, b) => (b.onay + 2 * b.duzeltme) - (a.onay + 2 * a.duzeltme))[0]
    const pay = (baskin.onay + 2 * baskin.duzeltme) / toplam
    if (pay < 0.6) continue
    const guc = Math.min(1, toplam / 6) * pay
    const w = 0.2 + 0.55 * guc
    if (w > ogrenilen[baskin.tur].w) ogrenilen[baskin.tur] = { w, adet: baskin.onay + baskin.duzeltme }
    for (const t of EK_TURLERI) if (t !== baskin.tur) sonum[t] = Math.min(sonum[t], 1 - 0.5 * guc)
  }
  for (const t of EK_TURLERI) if (ogrenilen[t].w > 0) ekle(t, Math.min(OGRENME_TAVAN, ogrenilen[t].w), `bu hekimin önceki tercihleri (${ogrenilen[t].adet} kayıt)`)

  const puan: Record<EkTuru, number> = { lab: 0, asi: 0, foto: 0, rontgen: 0, ekg: 0, epikriz: 0, diger: 0 }
  for (const t of EK_TURLERI) puan[t] = noisyOr(kanit[t].map((k) => k.w)) * sonum[t]

  const sirali = EK_TURLERI.map((t) => ({ tur: t, guven: Math.round(puan[t] * 100) / 100 })).sort((a, b) => b.guven - a.guven)
  const ilk = sirali[0], ikinci = sirali[1]
  const sor = ilk.guven < ESIK_OTOMATIK || ilk.guven - ikinci.guven < ESIK_FARK
  const adaylar = sirali.filter((a) => a.guven > 0.05).slice(0, 3)
  while (adaylar.length < 2) {
    const sonraki = sirali.find((s) => !adaylar.some((a) => a.tur === s.tur))
    if (!sonraki) break
    adaylar.push(sonraki)
  }
  return {
    tur: ilk.tur,
    guven: ilk.guven,
    adaylar,
    sor,
    nedenler: kanit[ilk.tur].map((k) => k.neden).slice(0, 4),
  }
}

// ─── Öğrenme sinyalleri (kalıcılaştırma: saklama.ts) ───────────────────────────────────────────────────────
export interface OgrenmeArtisi { ozellik: string; tur: EkTuru; onayEk: number; duzeltmeEk: number }

/**
 * Hekim bir türü onayladı (`onceki === secilen`) ya da düzeltti (`onceki !== secilen`).
 * Sinyal, dosyanın özelliklerine HEKİMİN SEÇTİĞİ tür için yazılır; düzeltmede ayrıca "yapay zekâ X dedi" özellikleri
 * (ai:X…) seçilen türe bağlanır — hekim "AI foto der ama benim için aşı" öğretebilsin.
 */
export function ogrenmeSinyali(g: SiniflandirGirdi, secilen: EkTuru, onceki: EkTuru | null): OgrenmeArtisi[] {
  const duzeltme = !!onceki && onceki !== secilen
  const ozellikler = ozellikleriCikar(g).filter((o) => !o.startsWith('mime:diger'))
  return ozellikler.map((ozellik) => ({ ozellik, tur: secilen, onayEk: duzeltme ? 0 : 1, duzeltmeEk: duzeltme ? 1 : 0 }))
}
