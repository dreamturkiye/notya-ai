/**
 * NOTYA-SES-BAGLAM-KUCULT-01 (Kaan, 2026-09-28) — sesli kanalın hasta dosyası: kısa ama güvenlik-tam özet.
 *
 * Ses gerçek zamanlıdır; yazı değildir. Uzmanlık bilgisinde aynı ayrım zaten var (personaEngine.ts, "Keep voice
 * prompts SHORT", 2026-08-14). Hasta dosyası tarafında ise `ayseCevapla` her sesli turda TAM dosyayı (`paket.metin`)
 * gönderiyordu — "nasılsınız" bile 6.700–20.000 girdi jetonu, ilk söz 4–14 sn.
 *
 * Bu modül, önbellekteki pakette ZATEN olan veriden (metin + HIZLI KART + olay dizini) daha küçük bir serileştirme
 * kurar — veritabanı okuması yok. Tam dosyadan AYNEN taşınanlar (kural → madde; ayrıntı rapor / PR'da):
 *   - HIZLI KART + son muayene bulgusu / planı          — personaEngine kural 11 ("HIZLI KART'ı AYNEN söyle")
 *   - HASTA KİMLİK ÖZETİ (yaş, cinsiyet, doktor notu)  — doz için yaş; doktor notu kronik / alerji taşır
 *   - SÜREKLİ / KAYITLI İLAÇLAR bölümünün TAMAMI       — ayseCevapla KURALLAR: "sürekli ilaçlarıyla etkileşimi
 *                                                        KENDİLİĞİNDEN kontrol et"; kural 5–6 (doz, kombinasyon)
 *   - İlk kayıt formunun güvenlik satırları            — alerji, kronik, ilaç, gebelik / emzirme, kanama, ameliyat,
 *                                                        risk, sigara / alkol (KURALLAR: "alerji, kronik hastalık")
 *   - DOSYADAN OKUNAN FORM BİLGİLERİ                   — formda olmayan alerji / kronik / ilaç notlardan
 *   - GÜNCEL KİLO                                       — kanıt kuralı: "mg/kg reçete tarihindeki kiloyla"
 *   - Alerji ile çelişen ilaç, aktif ilaçlar arası etkileşim / mükerrer etken (deterministik, ilacUyari.ts)
 *   - Her KRİTİK bulgu, acil bayraklı belge             — kural 9 ("kritik bulguyu asla geçme"), KURALLAR
 *                                                        ("önceki kritik bulgu ... kendiliğinden hatırlat")
 *   - Tanı listesi (ICD başına bir satır)                — kronik hastalık çoğu zaman yalnız vizit tanısında yazılı
 *   - Güvenlik sinyali geçen kayıt cümleleri (gebe, emzirme, warfarin, NSAİİ, isotretinoin, kontrendike …) — G3
 *     listesi (lib/ai/modeller.ts GUVENLIK_SINYALI), en yeni 12'si; yalnız "mg/kg" geçen geçmiş doz cümlesi hariç
 * Düşenler: vizit anlatıları, tam lab tablosu, tam aşı defteri, görüntüleme / belge listeleri, randevu listesi,
 * formun geri kalanı. Bunlara İlk-10 kanıt yolu (soruTuruBul → kanitBlogu) ya da ayrıntı sorusunda tam dosya ulaşır.
 */
import type { HastaDosyaKart } from '@/lib/doktor/hastaDosyaKart'
import { kartBosMu, kartMetin } from '@/lib/doktor/hastaDosyaKart'
import { alerjiCatismalari } from '@/lib/doktor/acikIsler'
import { bugunTRTIso, gunFarkiIso, trGun, type DosyaOlayi } from '@/lib/doktor/dosyaOlaylari'
import { etkilesimUyarilari, mukerrerEtkenUyarilari, type AktifIlacSatiri } from '@/core/eylemler/ilacUyari'
import { guvenlikSinyaliVar } from '@/lib/ai/modeller'

export const SES_OZET_BASLIK = '## SESLİ GÖRÜŞME DOSYA ÖZETİ (güvenlik bilgileri tam; ayrıntı tam dosyada)'

/** İlk kayıt formunda (anahtar adıyla) güvenlik satırı sayılan alanlar — core + branş formlarının id'leri. */
const FORM_GUVENLIK_ANAHTARI = /alerj|ilac|kronik|gebe|hamile|emzir|kanam|antikoag|kontrendik|risk|reaksiyon|nobet|ameliyat|kangrubu|kullaniyormu|kontrast|dogumkontrol|sigara|alkol/i

/** Sesli özete tek kayıttan girecek en uzun cümle — bir paragraf tek başına dosyayı geri büyütmesin. */
const CUMLE_SINIRI = 300
/** Güvenlik sinyali geçen tarihli kayıt cümleleri: en yeni bu kadarı (G3 yönlendirmesi zaten tam dosyayı okur). */
const SINYAL_CUMLE_SAYISI = 12
/** G3 listesinin yalnız doz biçimi olan terimleri. */
const DOZ_IFADESI = /mg\/kg|pediatrik doz|çocuk doz/giu

export interface KisaOzetPaketi {
  metin: string
  kart: HastaDosyaKart | Record<string, unknown>
  olaylar?: DosyaOlayi[] | unknown[]
}

/** Tam dosya metnini `## ` bölümlerine ayırır (başlık → satırlar). Sıra korunur. */
function bolumler(metin: string): { baslik: string; satirlar: string[] }[] {
  const out: { baslik: string; satirlar: string[] }[] = []
  let aktif: { baslik: string; satirlar: string[] } | null = null
  for (const satir of String(metin || '').split('\n')) {
    if (satir.startsWith('## ')) {
      aktif = { baslik: satir.slice(3).trim(), satirlar: [] }
      out.push(aktif)
    } else if (aktif && satir.trim()) {
      aktif.satirlar.push(satir)
    }
  }
  return out
}

const bolumBul = (b: { baslik: string; satirlar: string[] }[], bas: string) => b.find((x) => x.baslik.startsWith(bas))

function cumleler(satir: string): string[] {
  return satir.split(/(?<=[.!?;])\s+/).map((s) => s.trim()).filter(Boolean)
}

function kirp(s: string, n = CUMLE_SINIRI): string {
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n - 1)}…` : t
}

function kartOku(k: KisaOzetPaketi['kart']): HastaDosyaKart | null {
  const x = k as Partial<HastaDosyaKart>
  return x && typeof x === 'object' && 'alerji' in x && 'ilaclar' in x ? (x as HastaDosyaKart) : null
}

/** Aktif / belirsiz ilaç kaydı + son 90 günün reçetesi — alerjiCatismalari ile aynı aday kümesi. */
function aktifIlaclar(olaylar: DosyaOlayi[], bugunIso: string): AktifIlacSatiri[] {
  const out: AktifIlacSatiri[] = []
  const gorulen = new Set<string>()
  for (const o of olaylar) {
    const aday = (o.kaynak === 'ilac' && o.tur === 'ilac' && (o.durum === 'aktif' || o.durum === 'belirsiz'))
      || (o.kaynak === 'ilac' && o.tur === 'recete' && gunFarkiIso(o.tarih, bugunIso) <= 90)
    if (!aday) continue
    const ad = o.metin.split(' — ')[0].replace(/\s*\[.*$/, '').trim()
    const k = ad.toLocaleLowerCase('tr-TR')
    if (!ad || gorulen.has(k)) continue
    gorulen.add(k)
    out.push({ id: o.kaynakId, ilac_adi: ad, etken_madde: o.etken ?? null })
  }
  return out
}

/** Aktif ilaçların birbiriyle etkileşimi + aynı etken madde (deterministik tablo; model değil). */
function ilacArasiUyarilar(aktif: AktifIlacSatiri[]): string[] {
  const out: string[] = []
  const gorulen = new Set<string>()
  aktif.forEach((ilac, i) => {
    const digerleri = aktif.slice(i + 1)
    const uyarilar = [
      ...etkilesimUyarilari(digerleri, String(ilac.ilac_adi || ''), ilac.etken_madde),
      ...mukerrerEtkenUyarilari(digerleri, String(ilac.ilac_adi || ''), ilac.etken_madde),
    ]
    for (const u of uyarilar) {
      const satir = `⚠ ${u.baslik}: ${u.metin}`
      if (!gorulen.has(satir)) { gorulen.add(satir); out.push(satir) }
    }
  })
  return out
}

/** ICD kodu başına bir satır: "- G40.9 Epilepsi — 2 vizit, son 28.10.2024". Kodsuz tanı adıyla gruplanır. */
function taniListesi(olaylar: DosyaOlayi[], vizitSatirlari: string[]): string[] {
  const harita = new Map<string, { adlar: string[]; sayi: number; son: string }>()
  const ekle = (ham: string, tarih: string) => {
    const t = ham.replace(/\s+/g, ' ').trim()
    if (!t) return
    // Olay dizini "Tanı — KOD açıklama", tam dosya "Tanı" + ayrı ICD satırı verir; kod varsa anahtar koddur.
    const kod = /\b([A-Z]\d{2}(?:\.\d{1,2})?)\b/.exec(t)?.[1]
    const ad = t.split(' — ')[0].trim()
    const k = kod || ad.toLocaleLowerCase('tr-TR')
    const v = harita.get(k) || { adlar: [], sayi: 0, son: '' }
    if (!v.adlar.includes(ad)) v.adlar.push(ad)
    harita.set(k, { adlar: v.adlar, sayi: v.sayi + 1, son: tarih })
  }
  const vizitler = olaylar.filter((o) => o.kaynak === 'not' && o.tur === 'vizit')
  if (vizitler.length) {
    for (const v of vizitler) {
      const m = /(?:^|\| )Tanı: ([^|]+)/.exec(v.metin)
      if (m) ekle(m[1], trGun(v.tarih))
    }
  } else {
    let tarih = ''
    for (const s of vizitSatirlari) {
      const v = /^### Vizit \d+ — ([^[]+)/.exec(s)
      if (v) { tarih = v[1].trim(); continue }
      if (s.startsWith('Tanı: ')) ekle(s.slice(6), tarih)
    }
  }
  return [...harita.entries()].map(([k, t]) => `- ${/^[A-Z]\d/.test(k) ? `${k} ` : ''}${kirp(t.adlar.join(' / '), 200)} — ${t.sayi} vizit, son ${t.son}`)
}

/**
 * Sesli kanal için kısa, güvenlik-tam hasta dosyası. `paket` dosyaPaketOnbellekli'nin döndürdüğüdür (önbellek ya
 * da taze derleme); yeni okuma yapılmaz. Kart ya da olay dizini yoksa (eski önbellek satırı) metinden kurulan
 * bölümler yine gelir — ilaç, alerji, kritik bulgu tam dosya metninden taşınır.
 */
export function hastaOzetiKisa(paket: KisaOzetPaketi, bugunIso: string = bugunTRTIso()): string {
  const b = bolumler(paket.metin)
  const kart = kartOku(paket.kart)
  const olaylar = (Array.isArray(paket.olaylar) ? paket.olaylar : []) as DosyaOlayi[]
  const out: string[] = [SES_OZET_BASLIK]

  // 1 · HIZLI KART (tam dosyadakiyle aynı) + son muayenenin bulgusu ve planı.
  if (kart) {
    out.push(kartMetin(kart))
    if (!kartBosMu(kart.sonBulgu)) out.push(`- Son muayene bulgusu: ${kart.sonBulgu}`)
    if (!kartBosMu(kart.sonPlan)) out.push(`- Son plan / takip: ${kart.sonPlan}`)
  } else {
    const hk = bolumBul(b, 'HIZLI KART')
    if (hk) out.push(`## ${hk.baslik}`, ...hk.satirlar)
  }

  // 2 · Kimlik özeti (yaş, cinsiyet, doktor notu — kimlik değeri zaten derleyicide atılmış).
  const kimlik = bolumBul(b, 'HASTA KİMLİK ÖZETİ')
  if (kimlik) out.push('\n## HASTA KİMLİK ÖZETİ', ...kimlik.satirlar)

  // 3 · Doz için güncel kilo.
  const kilo = [...olaylar].reverse().find((o) => o.tur === 'kilo' && o.deger != null)
  if (kilo) out.push(`- Güncel kilo: ${String(kilo.deger).replace('.', ',')} kg (${trGun(kilo.tarih)}) — mg/kg reçete tarihindeki kiloyla hesaplanır`)

  // 3b · Tanı listesi — kronik hastalık çoğu zaman formda değil, vizit tanısında yazılı (epilepsi, astım…).
  const tanilar = taniListesi(olaylar, bolumBul(b, 'VİZİT GEÇMİŞİ')?.satirlar || [])
  if (tanilar.length) out.push('\n## TANI LİSTESİ (bütün onaylı vizitlerden, tekrarsız — en yeni tarih)', ...tanilar)

  // 4 · Sürekli / kayıtlı ilaçlar — bölümün tamamı.
  const ilac = bolumBul(b, 'SÜREKLİ / KAYITLI İLAÇLAR')
  if (ilac) out.push(`\n## ${ilac.baslik}`, ...ilac.satirlar)
  const receteler = olaylar.filter((o) => o.kaynak === 'ilac' && o.tur === 'recete' && gunFarkiIso(o.tarih, bugunIso) <= 90)
  if (receteler.length) {
    out.push('Son 90 günün reçeteleri (reçete edildi ≠ aktif kullanım):')
    for (const r of receteler) out.push(`- ${kirp(r.metin, 160)} (${trGun(r.tarih)})`)
  }

  // 5 · İlk kayıt formunun güvenlik satırları + dosyadan okunan form bilgileri.
  const form = bolumBul(b, 'EN SON HASTA FORMU')
  if (form) {
    const guvenlik = form.satirlar.filter((s) => {
      const m = /^- ([^:]+):/.exec(s)
      return (m && FORM_GUVENLIK_ANAHTARI.test(m[1])) || guvenlikSinyaliVar(s)
    })
    if (guvenlik.length) out.push(`\n## ${form.baslik} — güvenlik satırları`, ...guvenlik.map((s) => kirp(s, 400)))
  }
  const okunan = bolumBul(b, 'DOSYADAN OKUNAN FORM BİLGİLERİ')
  if (okunan) out.push(`\n## ${okunan.baslik}`, ...okunan.satirlar)

  // 6 · Alarm / güvenlik: alerji çatışması, ilaç-ilaç etkileşimi, kritik bulgu, acil bayrak, güvenlik sinyali.
  const alarm: string[] = []
  for (const a of alerjiCatismalari(olaylar, bugunIso)) alarm.push(`⚠ ${a.metin}`)
  alarm.push(...ilacArasiUyarilar(aktifIlaclar(olaylar, bugunIso)))

  const vizit = bolumBul(b, 'VİZİT GEÇMİŞİ')
  const sinyal: string[] = []
  const gorulenSinyal = new Set<string>()
  const sinyalEkle = (etiket: string, s: string) => {
    for (const c of cumleler(s)) {
      // Yalnız doz ifadesi (mg/kg) olan geçmiş cümle alınmaz — doz dayanağı (kilo, aktif ilaç, 90 günün reçetesi) yukarıda.
      if (!guvenlikSinyaliVar(c.replace(DOZ_IFADESI, ' '))) continue
      const satir = `- ${etiket}: ${kirp(c)}`
      if (!gorulenSinyal.has(satir)) { gorulenSinyal.add(satir); sinyal.push(satir) }
    }
  }
  if (vizit) {
    let etiket = 'Vizit'
    for (const s of vizit.satirlar) {
      const v = /^### (Vizit \d+ — [^[]+?)(?:\s*\[TAM SOAP\])?$/.exec(s)
      if (v) { etiket = v[1].trim(); continue }
      if (s.startsWith('KRİTİK:')) {
        if (s.slice(7).trim()) alarm.push(`⚠ KRİTİK (${etiket}): ${kirp(s.slice(7), 400)}`)
        continue
      }
      sinyalEkle(etiket, s.replace(/^(- Özet:|[SOAP] \([^)]+\):|Tanı:|Verilen ilaçlar:)\s*/, ''))
    }
  }
  // The section is 'BELGE DEĞERLENDİRMELERİ' since the device bridge was removed (it was 'CİHAZ VE BELGE
  // DEĞERLENDİRMELERİ'); the old heading is still accepted so a cached file text keeps its emergency flag.
  const belgeDegerlendirme = bolumBul(b, 'BELGE DEĞERLENDİRMELERİ') || bolumBul(b, 'CİHAZ VE BELGE DEĞERLENDİRMELERİ')
  for (const s of belgeDegerlendirme?.satirlar || []) if (s.includes('⚠ acil bayrak')) alarm.push(kirp(s.replace(/^- /, '⚠ '), 500))
  for (const baslik of ['BELGE DEĞERLENDİRMELERİ', 'CİHAZ VE BELGE', 'ONAYLI LAB', 'GÖRÜNTÜLEME', 'BELGELER']) {
    for (const s of bolumBul(b, baslik)?.satirlar || []) if (!s.includes('⚠ acil bayrak')) sinyalEkle(baslik.toLocaleLowerCase('tr-TR'), s.replace(/^- /, ''))
  }

  out.push('\n## ALARM / GÜVENLİK (tam dosyadan — hiçbiri atlanmadı)')
  out.push(...(alarm.length ? alarm.map((s) => (s.startsWith('- ') ? s : `- ${s}`)) : ['- Kayıtlı kritik bulgu, acil bayrak ya da tablodaki alerji çatışması / etkileşim yok (tablo dışı ilaç için bu, etkileşim olmadığı anlamına gelmez).']))
  if (sinyal.length) {
    // En yeni kayıt en sonda (vizitler kronolojik) — en yeni 12'si.
    const secilen = sinyal.slice(-SINYAL_CUMLE_SAYISI)
    out.push('Güvenlik sinyali geçen kayıtlar (gebelik, emzirme, antikoagülan, NSAİİ, isotretinoin, kontrendikasyon):', ...secilen)
    if (sinyal.length > secilen.length) out.push(`- (${sinyal.length - secilen.length} daha eski kayıt tam dosyada)`)
  }
  return out.join('\n')
}
