/**
 * NOTYA-ILK10-ASI-01 (Dr. Gökhan, "İlk 10" standardı, 2026-10-02) — hastanın AŞI DURUMU kanıtı, tek yerden.
 *
 * Gerçek test hastasında Soru 4 dürüsttü ("kesin söyleyemem"; Hepatit B 1. ve 2. doz aynı tarihte) ama yaşa göre hangi
 * aşının eksik / zamanı gelmiş olduğunu, telafi gereğini ve rutin ile risk bazlı ayrımını söylemedi; Soru 1 ve Soru 9
 * aşıyı hiç anmadı. Kök neden: aşı durumu her soruda ayrı ayrı ve kısmen kuruluyordu.
 *
 * Bu modül hesap YAPMAZ, BAĞLAR (kopya yok):
 *   - takvim, telafi, minimum aralık: specialties/pediatri/engines/asiPlan.ts (branş parametresi `p.asi` üzerinden);
 *   - not metnindeki plan / öneri / randevu ve karşılığı: lib/doktor/planTakibi.ts;
 *   - tutarsız kayıt "gecikti" değil "kayıt tutarsız"dır: Fısıltı kuralı (engines/kohort.ts, NOTYA-FISILTI-GIZLE-01).
 *
 * Tek yapı (`asiKaniti`) dört soruyu besler: Soru 4 tam blok (asiKanitSatirlari), Soru 1 kısa özet
 * (asiOzetSatirlari), Soru 9 ve Soru 10 açık işler (lib/doktor/acikIsler.ts aynı yapıyı okur).
 *
 * Takvimi tanımlı olmayan branşta `asiKaniti` null döner; o branşların kanıtı değişmedi (kanit.ts eski yolu kullanır).
 * İfade standarttaki gibidir: kayıt yoksa "uygulandığına dair kayıt bulamadım"; planlanan aşı uygulanmış sayılmaz.
 * KVKK: hasta adı yazılmaz.
 */
import type { DosyaHastasi, DosyaOlayi } from '@/lib/doktor/dosyaOlaylari'
import { trGun } from '@/lib/doktor/dosyaOlaylari'
import { asiPlanSatiri, planKarsiligi, planOlaylari } from '@/lib/doktor/planTakibi'
import { seriAdi } from '@/lib/doktor/notAsilari'
import { eksikDozEtiketi, type AsiDoz, type AsiDurumu, type AsiTutarsizligi, type BransSorguParametreleri } from '@/lib/asistan/dosyaSorgu/parametreler'

/** Doğum tarihinden KESİN yaş: "2 yaş 1 ay 3 gün (25 ay)". */
export function kesinYas(dogumIso: string, bugunIso: string): string {
  const [y1, m1, d1] = dogumIso.split('-').map(Number)
  const [y2, m2] = bugunIso.split('-').map(Number)
  const bugunMs = Date.parse(`${bugunIso}T00:00:00Z`)
  // Doğum gününün n ay sonrası; ay o günü taşımıyorsa ayın son günü (31 Ocak + 1 ay = 28 Şubat).
  const aySonra = (n: number) => {
    const sonGun = new Date(Date.UTC(y1, m1 - 1 + n + 1, 0)).getUTCDate()
    return Date.UTC(y1, m1 - 1 + n, Math.min(d1, sonGun))
  }
  let ay = (y2 - y1) * 12 + (m2 - m1)
  if (aySonra(ay) > bugunMs) ay -= 1
  if (ay < 0) return 'doğum tarihi bugünden ileri — kayıt kontrol edilmeli'
  const gun = Math.round((bugunMs - aySonra(ay)) / 86_400_000)
  const yil = Math.floor(ay / 12), kalanAy = ay % 12
  const parca = [yil ? `${yil} yaş` : '', kalanAy ? `${kalanAy} ay` : '', gun || (!yil && !kalanAy) ? `${gun} gün` : ''].filter(Boolean).join(' ')
  return yil ? `${parca} (${ay} ay)` : parca
}

export interface AsiPlanKaydi {
  /** "Hepatit A 2. doz — planlandı (01.09.2026, not: "…")" */
  satir: string
  seri: string | null
  doz: number | null
  tarih: string
  /** Sonraki kayıttaki karşılığı: aşı tablosu satırı ('kayit'), yalnız sonraki not metni ('metin') ya da yok. */
  karsilik: 'kayit' | 'metin' | null
  karsilikTarihi: string | null
}

export interface AsiKaniti {
  dogumIso: string
  bugunIso: string
  yas: string
  surum: string
  /** Aşı tablosunda satırı olan takvim dozları — "uygulandığı belgelenmiş" (tutarsız seriler hariç). */
  belgeli: AsiDoz[]
  /** Tutarsız serilerin aşı tablosundaki satırları, kayıttaki doz numarası ve tarihiyle — yeniden numaralanmadan. */
  tutarsizSeriSatirlari: { seri: string; ad: string; adet: number; metin: string }[]
  /** Not metninde planlandı / önerildi / randevu verildi — belgelenmiş uygulama DEĞİL. */
  planlar: AsiPlanKaydi[]
  /** Not metninde reçete edildi (özel aşı) — uygulama kaydı ayrı aranır. */
  receteler: DosyaOlayi[]
  /** Notta uygulandığı yazıyor, aşı tablosunda satır yok — "uygulandığı söylendi", belirsiz. */
  soylenen: DosyaOlayi[]
  /** Notta ertelendiği / yapılamadığı yazıyor — durumu belirsiz. */
  ertelenen: DosyaOlayi[]
  /** Kendi içinde tutarsız kayıtlar — bu serilerde "gecikti" denmez. */
  tutarsiz: AsiTutarsizligi[]
  /** Zamanı gelmiş / geçmiş, uygulama kaydı yok (tutarsız seriler hariç). */
  eksik: AsiDoz[]
  /** Tutarsız serilerde takvime göre açık görünen dozlar — durumu bilinmiyor. */
  bilinmeyen: AsiDoz[]
  yaklasan: AsiDoz[]
  /** Telafi (catch-up) planı gereken dozlar. */
  telafi: AsiDoz[]
  /** Takvim dışı / risk bazlı / özel aşılar (ör. mevsimsel influenza) — rutinden AYRI, eksik sayılmaz. */
  riskBazli: string[]
  eslesmeyen: string[]
  notlar: string[]
  /** Aşı tablosunda hiç satır yok: "tam" da "eksik" de denmez. */
  kayitYok: boolean
}

const ACIK = new Set(['gecikti', 'zamani_geldi', 'bugun'])

/** Branşın takvimi yoksa (ya da doğum tarihi yoksa) null — çağıran eski yolu kullanır. */
export function asiKaniti(olaylar: DosyaOlayi[], hasta: DosyaHastasi, p: BransSorguParametreleri, hazir?: AsiDurumu | null): AsiKaniti | null {
  const asi = hazir === undefined ? p.asi(olaylar, hasta) : hazir
  if (!asi || !hasta.dogumIso) return null
  const kayitlar = olaylar.filter((o) => o.kaynak === 'asi')
  const tutarsiz = asi.tutarsiz || []
  const tutarsizSeri = new Set(tutarsiz.map((t) => t.seri))
  const acik = asi.dozlar.filter((d) => ACIK.has(d.durum))
  const eksik = acik.filter((d) => !tutarsizSeri.has(d.seri))
  const notAsi = olaylar.filter((o) => o.kaynak === 'not' && o.tur === 'asi')
  return {
    dogumIso: hasta.dogumIso, bugunIso: hasta.bugunIso, yas: kesinYas(hasta.dogumIso, hasta.bugunIso), surum: asi.surum,
    // Tutarsız seride takvim motorunun doz eşleştirmesi güvenilmez (3. doz satırı 2. doz yerine sayılır): o serinin
    // satırları olduğu gibi gösterilir, "X. doz uygulandı" diye yeniden numaralanmaz.
    belgeli: asi.dozlar.filter((d) => d.durum === 'uygulandi' && !tutarsizSeri.has(d.seri)),
    tutarsizSeriSatirlari: [...tutarsizSeri].map((seri) => {
      const satirlar = kayitlar.filter((k) => k.anahtar === seri)
      return { seri, ad: seriAdi(seri), adet: satirlar.length, metin: satirlar.map((k) => `${k.doz ? `${k.doz}. doz` : 'doz numarası yazılmamış'} ${trGun(k.tarih)}`).join('; ') }
    }),
    planlar: planOlaylari(olaylar).filter((o) => o.tur === 'asi').map((pl) => {
      const k = planKarsiligi(pl, olaylar)
      return { satir: asiPlanSatiri(pl), seri: pl.anahtar ?? null, doz: pl.doz ?? null, tarih: pl.tarih, karsilik: k ? (k.guven === 'kayit' ? 'kayit' : 'metin') : null, karsilikTarihi: k?.tarih ?? null }
    }),
    receteler: notAsi.filter((o) => o.durum === 'recete'),
    soylenen: notAsi.filter((o) => o.durum === 'uygulandi' && !kayitlar.some((k) => k.tarih >= o.tarih && (!o.anahtar || k.anahtar === o.anahtar))),
    ertelenen: notAsi.filter((o) => o.durum === 'belirsiz'),
    tutarsiz,
    eksik,
    bilinmeyen: acik.filter((d) => tutarsizSeri.has(d.seri)),
    yaklasan: asi.dozlar.filter((d) => d.durum === 'yaklasiyor'),
    telafi: eksik.filter((d) => d.telafi),
    riskBazli: asi.riskBazli, eslesmeyen: asi.eslesmeyen, notlar: asi.notlar,
    kayitYok: kayitlar.length === 0,
  }
}

const seriAdiKisa = (o: DosyaOlayi) => `${o.anahtar ? seriAdi(o.anahtar) : 'Aşı'}${o.doz ? ` ${o.doz}. doz` : ''}`
const eksikSatiri = (d: AsiDoz, bugunIso: string) => `${d.ad} — ${eksikDozEtiketi(d, bugunIso)} (önerilen ${trGun(d.onerilen)})${d.telafi ? ', telafi planı gerekir' : ''}`
export const tutarsizSatiri = (t: AsiTutarsizligi) => `${t.ad}: ${trGun(t.tarih)} tarihli kayıt ${t.neden}`

/** Kayda göre tek cümlelik sonuç — cevabın ilk cümlesi bundan kurulur. */
export function asiSonucu(k: AsiKaniti): string {
  if (k.kayitYok) return 'Aşı tablosunda hiç uygulama kaydı yok; aşılar başka merkezde uygulanmış olabilir — karne / e-Nabız kaydı görülmeden "tam" ya da "eksik" denmez.'
  if (k.tutarsiz.length) {
    return `Kesin söylenemez: ${k.tutarsiz.length} aşı kaydı tutarsız (aşağıda); bu serilerde "tam" da "gecikti" de denmez, kayıt kontrol edilmeli.${k.eksik.length ? ` Ayrıca ${k.eksik.length} takvim dozu için uygulama kaydı yok.` : ''}`
  }
  const plansiz = k.planlar.filter((p) => p.karsilik !== 'kayit').length
  if (k.eksik.length) return `Yaşına göre ${k.eksik.length} takvim dozu için uygulandığına dair kayıt yok (aşağıda)${plansiz ? `; ${plansiz} doz notta planlanmış ama uygulama kaydı görünmüyor` : ''}.`
  if (plansiz) return `Takvime göre zamanı gelmiş açık doz yok; ancak ${plansiz} doz notta planlanmış / önerilmiş, uygulandığına dair kayıt görünmüyor.`
  return 'Aşı tablosuna göre bugüne kadar önerilen rutin takvim dozlarının hepsi belgelenmiş; eksik ya da zamanı gelmiş doz saptanmadı.'
}

/** Soru 4 — tam aşı kanıtı (kategoriler ayrı, standarttaki sırayla). */
export function asiKanitSatirlari(k: AsiKaniti): string[] {
  const out: string[] = []
  out.push(`Takvim: ${k.surum}. Doğum tarihi ${trGun(k.dogumIso)} → bugün (${trGun(k.bugunIso)}) kesin yaş: ${k.yas}.`)
  out.push(`SONUÇ (kayda göre): ${asiSonucu(k)}`)
  out.push('Karşılaştırılan kaynaklar: aşı tablosu (aşı kartı / elektronik kayıt), vizit notlarının metni, yüklenen belgeler. Kategoriler AYRIDIR — planlandı / önerildi / reçete edildi / randevu verildi / uygulandığı söylendi / uygulandığı belgelenmiş / durumu belirsiz.')
  out.push('UYGULANDIĞI BELGELENMİŞ (aşı tablosu):')
  out.push(...(k.belgeli.length || k.tutarsizSeriSatirlari.length ? k.belgeli.map((d) => `- ${d.ad} — uygulandı (${trGun(d.uygulamaTarihi)}, aşı kaydı)`) : ['- (aşı tablosunda takvim dozu yok)']))
  out.push(...k.tutarsizSeriSatirlari.map((s) => `- ${s.ad} — aşı tablosundaki satırlar: ${s.metin} (kayıt tutarsız; dozlar takvimle eşleştirilmeden, kayıttaki haliyle — aşağıya bakın)`))
  out.push('NOT METNİNDE PLAN / ÖNERİ / RANDEVU (belgelenmiş uygulama DEĞİL):')
  out.push(...(k.planlar.length ? k.planlar.map((p) => `- ${p.satir}${p.karsilik === 'kayit' ? ` → aşı kaydı var (${trGun(p.karsilikTarihi)})` : p.karsilik === 'metin' ? ` → sonraki notta uygulandığı yazıyor (${trGun(p.karsilikTarihi)}); aşı tablosunda satır yok — belirsiz` : '; uygulandığına dair kayıt bulamadım'}`) : ['- (yok)']))
  if (k.receteler.length) {
    out.push('REÇETE EDİLDİ (not metni — reçete edilmesi uygulandığı anlamına gelmez):')
    out.push(...k.receteler.map((o) => `- ${seriAdiKisa(o)} — reçete edildi (${trGun(o.tarih)}, not: "${o.metin}")`))
  }
  if (k.soylenen.length) {
    out.push('BELİRSİZ (notta uygulandığı yazıyor, aşı tablosunda satır yok):')
    out.push(...k.soylenen.map((o) => `- ${trGun(o.tarih)}: "${o.metin}"`))
  }
  if (k.ertelenen.length) {
    out.push('DURUMU BELİRSİZ (notta ertelendiği / o gün yapılamadığı yazıyor; sonrası için kayıt aranmalı):')
    out.push(...k.ertelenen.map((o) => `- ${seriAdiKisa(o)} — ${trGun(o.tarih)} notu`))
  }
  if (k.tutarsiz.length) {
    out.push('KAYIT TUTARSIZ ("gecikti" DEĞİL — tarih / doz numarası kontrol edilmeli):')
    out.push(...k.tutarsiz.map((t) => `- ${tutarsizSatiri(t)}.`))
    if (k.bilinmeyen.length) out.push(`- Bu serilerde takvime göre açık görünen dozlar: ${k.bilinmeyen.map((d) => d.ad).join(', ')} — durumu BİLİNMİYOR; kayıt düzeltilmeden "eksik" ya da "gecikti" deme.`)
  }
  out.push('EKSİK / ZAMANI GELMİŞ (takvime göre, aşı tablosunda kayıt yok):')
  out.push(...(k.eksik.length ? k.eksik.map((d) => `- ${eksikSatiri(d, k.bugunIso)}`) : ['- (yok)']))
  if (k.yaklasan.length) { out.push('YAKLAŞAN:'); out.push(...k.yaklasan.map((d) => `- ${d.ad} — önerilen ${trGun(d.onerilen)}`)) }
  out.push(k.telafi.length
    ? `TELAFİ (catch-up) GEREKSİNİMİ: var — ${k.telafi.map((d) => d.ad).join(', ')}. Seri baştan başlatılmaz; kalan dozlar takvimdeki minimum aralıklarla planlanır (hekim onaylar).`
    : `TELAFİ (catch-up) GEREKSİNİMİ: ${k.eksik.length ? 'zamanı gelmiş dozlar önerilen tarihinde / bugün uygulanabilir; ayrıca aralık kaydırması gerekmiyor' : k.tutarsiz.length ? 'kayıt düzeltilmeden hesaplanmadı' : 'yok'}.`)
  if (k.eslesmeyen.length) out.push(`Takvimle eşleşmeyen kayıtlar: ${k.eslesmeyen.join('; ')}.`)
  if (k.riskBazli.length) { out.push('RİSK BAZLI / TAKVİM DIŞI (rutinden ayrı):'); out.push(...k.riskBazli.map((r) => `- ${r}`)); out.push('- Bu aşılar rutin takvimin parçası değildir; kaydı yoksa "eksik aşı" sayılmaz, hekim kararıdır.') }
  if (k.notlar.length) out.push(`Takvim notları: ${k.notlar.slice(0, 3).join(' ')}`)
  return out
}

/** Soru 1 — özet içindeki aşı durumu (kısa; ayrıntı Soru 4'te). */
export function asiOzetSatirlari(k: AsiKaniti): string[] {
  const out: string[] = []
  // Hiç satır yoksa takvimin bütün dozlarını "eksik" diye saymak yanıltır: aşılar başka merkezde uygulanmış olabilir.
  out.push(k.kayitYok
    ? `AŞI: kesin yaş ${k.yas}; aşı tablosunda hiç uygulama kaydı yok — "tam" ya da "eksik" denmez, karne / e-Nabız kaydı istenmeli.`
    : `AŞI: kesin yaş ${k.yas}; aşı tablosunda ${k.belgeli.length + k.tutarsizSeriSatirlari.reduce((t, s) => t + s.adet, 0)} takvim dozu kayıtlı; eksik / zamanı gelmiş: ${k.eksik.length ? k.eksik.map((d) => d.ad).join(', ') : 'yok'}.`)
  const plansiz = k.planlar.filter((p) => !p.karsilik)
  if (plansiz.length) out.push(`AŞI (planlanmış, uygulama kaydı yok): ${plansiz.map((p) => p.satir).join('; ')}.`)
  if (k.tutarsiz.length) out.push(`AŞI (kayıt tutarsız — "gecikti" değil): ${k.tutarsiz.map(tutarsizSatiri).join('; ')}.`)
  if (k.telafi.length) out.push(`AŞI (telafi gerekir): ${k.telafi.map((d) => d.ad).join(', ')}.`)
  if (k.yaklasan.length) out.push(`AŞI (yaklaşan): ${k.yaklasan.map((d) => `${d.ad} (${trGun(d.onerilen)})`).join(', ')}.`)
  return out
}
