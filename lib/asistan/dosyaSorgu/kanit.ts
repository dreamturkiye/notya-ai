/**
 * NOTYA-AYSE-STANDART-01 — soru başına KANIT BLOĞU (sorgu planı). Deterministik, LLM'siz.
 *
 * `kanitBlogu(tur, olaylar, hasta, ek)` olay dizininden (lib/doktor/dosyaOlaylari) o sorunun cevabı için gereken
 * kayıtları seçer, DURUMLARI açık yazar (planlandı ≠ uygulandı), tarihlerini koyar ve standarttaki cevap şablonunu
 * ekler. Model düzyazıyı bu bloktan kurar; blokta olmayan hiçbir şeyi söylemez (kurallar.ts).
 *
 * KVKK: hastanın adı bu bloğa yazılmaz (yaş + cinsiyet yeter); cevabın ilk cümlesindeki ad kurallar bloğundan gelir.
 * Branşa bağlı kısımlar (büyüme eğrisi, aşı takvimi, gelişim) BransSorguParametreleri'nden gelir.
 */
import type { DosyaHastasi, DosyaOlayi } from '@/lib/doktor/dosyaOlaylari'
import { trGun, gunEkleIso } from '@/lib/doktor/dosyaOlaylari'
import { acikIsleriBul, alerjiCatismalari, asiBeyanCeliskileri, tekrarlayanPaternler, type AcikIs } from '@/lib/doktor/acikIsler'
import { asiPlanSatiri, durumAdi, labAdlari, planKarsiligi, planOlaylari } from '@/lib/doktor/planTakibi'
import { eksikDozEtiketi, parametreSec, type BransSorguParametreleri } from '@/lib/asistan/dosyaSorgu/parametreler'
import { SORU_SABLONLARI } from '@/lib/asistan/dosyaSorgu/kurallar'
import type { SoruTuru } from '@/lib/asistan/dosyaSorgu/soruTuru'
import { esanlamGruplariBul, terimlerdenBiriGeciyor, type EsanlamGrubu } from '@/lib/klinik/sikayetEsanlam'
import { kanonikTr } from '@/core/lab/kanonik'

export interface KanitEki {
  /** Hekimin mesajı — Soru 7'de aranan şikayet buradan çıkar. */
  mesaj?: string
}

const DEMIR_PANELI = ['Hb', 'Hct', 'MCV', 'MCH', 'MCHC', 'RDW', 'Ferritin', 'Fe', 'TIBC']
const trS = (n: number, b = 2) => n.toLocaleString('tr-TR', { maximumFractionDigits: b })

function yasMetni(dogumIso: string | null, bugunIso: string): string {
  if (!dogumIso) return 'yaş: doğum tarihi kayıtlı değil'
  const [y1, m1, d1] = dogumIso.split('-').map(Number)
  const [y2, m2, d2] = bugunIso.split('-').map(Number)
  let ay = (y2 - y1) * 12 + (m2 - m1)
  if (d2 < d1) ay -= 1
  if (ay < 1) return `${Math.max(0, Math.round((Date.parse(bugunIso) - Date.parse(dogumIso)) / 86_400_000))} günlük`
  if (ay < 24) return `${ay} aylık`
  return ay % 12 ? `${Math.floor(ay / 12)} yaş ${ay % 12} ay` : `${Math.floor(ay / 12)} yaş`
}

export function yasAyHesapla(dogumIso: string | null, bugunIso: string): number | null {
  if (!dogumIso) return null
  const [y1, m1, d1] = dogumIso.split('-').map(Number)
  const [y2, m2, d2] = bugunIso.split('-').map(Number)
  return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0)
}

const vizitleri = (o: DosyaOlayi[]) => o.filter((x) => x.kaynak === 'not' && x.tur === 'vizit')
const oykuKismi = (v: DosyaOlayi) => v.metin.split(' | Plan:')[0]

function isSatirlari(isler: AcikIs[]): string[] {
  return isler.map((i) => `- ${i.guvenlik ? '⚠ ' : ''}${i.metin}`)
}

function alerjiSatiri(olaylar: DosyaOlayi[]): string {
  const a = olaylar.filter((o) => o.tur === 'alerji')
  return a.length ? a.map((o) => `${o.metin} (kayıt ${trGun(o.tarih)})`).join('; ') : 'Alerji kaydı yok (alan boş — "alerjisi yok" anlamına gelmez).'
}

function ilacBolumleri(olaylar: DosyaOlayi[], hasta: DosyaHastasi): string[] {
  const ilac = olaylar.filter((o) => o.kaynak === 'ilac' && o.tur === 'ilac')
  const guncelKilo = [...olaylar].reverse().find((o) => o.tur === 'kilo' && o.deger != null)
  const kiloSoz = (o: DosyaOlayi) => (o.kilo != null ? `başlangıç/reçete tarihindeki kilo ${trS(o.kilo)} kg (${trGun(o.kiloTarihi)})` : 'reçete tarihinde kilo kaydı yok')
  const satir = (o: DosyaOlayi) => `- ${o.metin} — başlangıç ${trGun(o.tarih)}${o.sureGun ? `, planlanan süre ${o.sureGun} gün` : ''}; ${kiloSoz(o)}`
  const out: string[] = []
  const grup = (baslik: string, s: DosyaOlayi[]) => { out.push(baslik); out.push(...(s.length ? s.map(satir) : ['- (yok)'])) }
  grup('AKTİF İLAÇLAR (ilaç kaydında aktif ve süresi dolmamış):', ilac.filter((o) => o.durum === 'aktif'))
  grup('SÜRESİ DOLMUŞ / TAMAMLANMIŞ — aktif sayılmadı:', ilac.filter((o) => o.durum === 'tamamlandi'))
  grup('KESİLMİŞ:', ilac.filter((o) => o.durum === 'kesildi'))
  grup('BELİRSİZ (kısa süreli ilaç, hâlâ kullanıldığına dair güncel kayıt yok):', ilac.filter((o) => o.durum === 'belirsiz'))
  const sinir = gunEkleIso(hasta.bugunIso, -90)
  const receteler = olaylar.filter((o) => o.kaynak === 'ilac' && o.tur === 'recete' && o.tarih >= sinir)
  out.push('SON 90 GÜNÜN REÇETELERİ (vizit notundan — reçete edildi ≠ aktif kullanım):')
  out.push(...(receteler.length ? receteler.map((o) => {
    const bitis = o.sureGun ? gunEkleIso(o.tarih, o.sureGun) : null
    return `- ${o.metin} — reçete ${trGun(o.tarih)}${bitis ? `, planlanan süre ${bitis <= hasta.bugunIso ? `${trGun(bitis)} tarihinde doldu` : `${trGun(bitis)} tarihine kadar`}` : ''}; ${o.kilo != null ? `reçete tarihindeki kilo ${trS(o.kilo)} kg (${trGun(o.kiloTarihi)})` : 'reçete tarihinde kilo kaydı yok'}`
  }) : ['- (yok)']))
  out.push(guncelKilo ? `GÜNCEL KİLO: ${trS(guncelKilo.deger!)} kg (${trGun(guncelKilo.tarih)}) — mg/kg hesabı reçete tarihindeki kiloyla yapılır, bununla karıştırma.` : 'GÜNCEL KİLO: kayıt yok.')
  return out
}

function labBolumu(olaylar: DosyaOlayi[]): string[] {
  const seri = new Map<string, DosyaOlayi[]>()
  for (const o of olaylar) if (o.kaynak === 'lab' && o.anahtar) seri.set(o.anahtar, [...(seri.get(o.anahtar) || []), o])
  const satir = (k: string) => {
    const s = seri.get(k)!
    const son = s[s.length - 1]
    const iz = s.slice(-4).map((o) => `${o.deger != null ? trS(o.deger) : o.metin.split(': ')[1]} ${o.birim || ''} (${trGun(o.tarih)})`.replace(/\s+\(/, ' (')).join(' → ')
    let yon = ''
    if (s.length >= 2 && son.deger != null && s[s.length - 2].deger != null) {
      const f = son.deger - s[s.length - 2].deger!
      yon = f > 0 ? ' — yükseliş' : f < 0 ? ' — düşüş' : ' — değişmedi'
    }
    const ref = son.refAlt != null || son.refUst != null ? `; laboratuvar referansı ${son.refAlt ?? '—'}–${son.refUst ?? '—'} (yaşa / cinsiyete uygunluğu doğrulanmadı — H/L işaretine güvenme)` : ''
    return `- ${kanonikTr(k)}: ${iz}${yon}${ref}`
  }
  const out: string[] = []
  const demir = DEMIR_PANELI.filter((k) => seri.has(k))
  if (demir.length) {
    out.push('DEMİR PANELİ (birlikte değerlendir):')
    out.push(...demir.map(satir))
    const eksik = DEMIR_PANELI.filter((k) => !seri.has(k)).map(kanonikTr)
    if (eksik.length) out.push(`- Panelde kayıtlı olmayan: ${eksik.join(', ')}; transferrin satürasyonu dosyada ayrı kalem olarak yok.`)
  }
  const diger = [...seri.keys()].filter((k) => !DEMIR_PANELI.includes(k))
  if (diger.length) { out.push('DİĞER SONUÇLAR (en yeni + önceki):'); out.push(...diger.map(satir)) }
  if (!seri.size) out.push('Onaylı lab sonucu yok.')
  const istem = planOlaylari(olaylar).filter((p) => p.tur === 'lab')
  if (istem.length) {
    out.push('İSTENEN TETKİKLER (not metninden):')
    for (const p of istem) {
      const k = planKarsiligi(p, olaylar)
      out.push(k ? `- ${labAdlari(p.anahtarlar)} — istendi (${trGun(p.tarih)}) → sonuç ${trGun(k.tarih)}` : `- ${labAdlari(p.anahtarlar)} — istendi, sonuç yok (istem ${trGun(p.tarih)}, not: "${p.metin}")`)
    }
  }
  return out
}

function asiBolumu(olaylar: DosyaOlayi[], hasta: DosyaHastasi, p: BransSorguParametreleri): string[] {
  const out: string[] = []
  const asi = p.asi(olaylar, hasta)
  const kayitlar = olaylar.filter((o) => o.kaynak === 'asi')
  if (!asi) {
    out.push(p.asiTakvimiYok)
    out.push('UYGULANDIĞI BELGELENMİŞ (aşı tablosu):')
    out.push(...(kayitlar.length ? kayitlar.map((o) => `- ${o.metin} — uygulandı (${trGun(o.tarih)}, aşı kaydı)`) : ['- (aşı tablosunda kayıt yok)']))
  } else {
    out.push(`Takvim: ${asi.surum}. Doğum tarihi ${trGun(hasta.dogumIso)} → bugün ${yasMetni(hasta.dogumIso, hasta.bugunIso)}.`)
    out.push('UYGULANDIĞI BELGELENMİŞ (aşı tablosu):')
    const yapilan = asi.dozlar.filter((d) => d.durum === 'uygulandi')
    out.push(...(yapilan.length ? yapilan.map((d) => `- ${d.ad} — uygulandı (${trGun(d.uygulamaTarihi)}, aşı kaydı)`) : ['- (aşı tablosunda takvim dozu yok)']))
  }
  const planlar = planOlaylari(olaylar).filter((o) => o.tur === 'asi')
  out.push('NOT METNİNDE PLAN / ÖNERİ / RANDEVU (belgelenmiş uygulama DEĞİL):')
  out.push(...(planlar.length ? planlar.map((pl) => {
    const k = planKarsiligi(pl, olaylar)
    return `- ${asiPlanSatiri(pl)}${k ? (k.guven === 'kayit' ? ` → aşı kaydı var (${trGun(k.tarih)})` : ` → sonraki notta uygulandığı yazıyor (${trGun(k.tarih)}); aşı tablosunda satır yok — belirsiz`) : '; uygulandığına dair kayıt bulamadım'}`
  }) : ['- (yok)']))
  const metinUygulandi = olaylar.filter((o) => o.kaynak === 'not' && o.tur === 'asi' && o.durum === 'uygulandi' && !kayitlar.some((k) => k.tarih >= o.tarih && (!o.anahtar || k.anahtar === o.anahtar)))
  if (metinUygulandi.length) {
    out.push('BELİRSİZ (notta uygulandığı yazıyor, aşı tablosunda satır yok):')
    out.push(...metinUygulandi.map((o) => `- ${trGun(o.tarih)}: "${o.metin}"`))
  }
  if (asi) {
    const eksik = asi.dozlar.filter((d) => d.durum === 'gecikti' || d.durum === 'zamani_geldi' || d.durum === 'bugun')
    out.push('EKSİK / ZAMANI GELMİŞ (takvime göre, aşı tablosunda kayıt yok):')
    out.push(...(eksik.length ? eksik.map((d) => `- ${d.ad} — ${eksikDozEtiketi(d, hasta.bugunIso)} (önerilen ${trGun(d.onerilen)})${d.telafi ? ', telafi planı gerekir' : ''}`) : ['- (yok)']))
    const yakin = asi.dozlar.filter((d) => d.durum === 'yaklasiyor')
    if (yakin.length) { out.push('YAKLAŞAN:'); out.push(...yakin.map((d) => `- ${d.ad} — önerilen ${trGun(d.onerilen)}`)) }
    if (asi.eslesmeyen.length) out.push(`Takvimle eşleşmeyen kayıtlar: ${asi.eslesmeyen.join('; ')}.`)
    if (asi.riskBazli.length) { out.push('RİSK BAZLI / TAKVİM DIŞI (rutinden ayrı):'); out.push(...asi.riskBazli.map((r) => `- ${r}`)) }
    if (asi.notlar.length) out.push(`Takvim notları: ${asi.notlar.slice(0, 3).join(' ')}`)
    for (const c of asiBeyanCeliskileri(olaylar, asi)) out.push(`⚠ ${c.metin}`)
  }
  return out
}

function benzerBolumu(olaylar: DosyaOlayi[], mesaj: string): string[] {
  const vizitler = vizitleri(olaylar)
  let gruplar: EsanlamGrubu[] = esanlamGruplariBul(mesaj)
  let kaynak = 'hekimin sorusundaki şikayet'
  if (!gruplar.length && vizitler.length) {
    gruplar = esanlamGruplariBul(oykuKismi(vizitler[vizitler.length - 1]))
    kaynak = `son vizitin (${trGun(vizitler[vizitler.length - 1].tarih)}) şikayet / tanısı`
  }
  if (!gruplar.length) return ['Aranacak şikayet belirlenemedi (soruda ya da son vizitte tanınan bir klinik tablo yok) — hekime hangi şikayeti kastettiğini sor.']
  const out: string[] = [`Aranan: ${kaynak} → ${gruplar.map((g) => g.ad).join(', ')}. Arama eşdeğer terimlerle, onaylı not metninde yapıldı (anlamsal arama bu sürümde yok).`]
  for (const g of gruplar) {
    out.push(`${g.ad.toLocaleUpperCase('tr-TR')} — eşdeğer terimler: ${g.terimler.slice(0, 12).join(', ')}${g.terimler.length > 12 ? '…' : ''}`)
    const eslesen = vizitler.map((v) => ({ v, t: terimlerdenBiriGeciyor(v.metin, g.terimler) })).filter((x) => x.t)
    if (!eslesen.length) { out.push('- Bu tabloyla (eşdeğer terimler dahil) vizit kaydı bulamadım.'); continue }
    for (const { v, t } of eslesen) {
      const recete = olaylar.filter((o) => o.tur === 'recete' && o.vizitId === v.vizitId).map((o) => o.metin)
      out.push(`- ${trGun(v.tarih)} [eşleşen: "${t}"] ${v.metin}${recete.length ? ` | Reçete: ${recete.join('; ')}` : ''}`)
    }
    out.push(`Toplam: ${eslesen.length} vizit (${eslesen.map((x) => trGun(x.v.tarih)).join(', ')}).`)
  }
  for (const t of tekrarlayanPaternler(olaylar, olaylar.length ? olaylar[olaylar.length - 1].tarih : '')) out.push(`Tekrarlayan patern (son 12 ay): ${t.grup} — ${t.tarihler.length} vizit.`)
  return out
}

function degisimBolumu(olaylar: DosyaOlayi[], hasta: DosyaHastasi, p: BransSorguParametreleri): string[] {
  const v = vizitleri(olaylar)
  if (!v.length) return ['Dosyada onaylı vizit notu yok; karşılaştırma yapılamaz.']
  const son = v[v.length - 1]
  if (v.length === 1) return [`Tek vizit var (${trGun(son.tarih)}); karşılaştırılacak önceki muayene yok.`, `SON VİZİT: ${son.metin}`]
  const onceki = v[v.length - 2]
  const out: string[] = [`SON VİZİT (${trGun(son.tarih)}): ${son.metin}`, `ÖNCEKİ VİZİT (${trGun(onceki.tarih)}): ${onceki.metin}`]
  const arada = (o: DosyaOlayi) => o.tarih > onceki.tarih && o.tarih <= hasta.bugunIso
  const olcum = (tur: string, ad: string) => {
    const a = olaylar.find((o) => o.tur === tur && o.vizitId === onceki.vizitId && o.deger != null)
    const b = olaylar.find((o) => o.tur === tur && o.vizitId === son.vizitId && o.deger != null)
    if (a && b) return `- ${ad}: ${trS(a.deger!)} → ${trS(b.deger!)} ${b.birim || ''} (${b.deger! - a.deger! >= 0 ? '+' : '−'}${trS(Math.abs(b.deger! - a.deger!))})`
    if (b) return `- ${ad}: son vizitte ${trS(b.deger!)} ${b.birim || ''}; önceki vizitte ölçüm yok`
    return null
  }
  out.push('ÖLÇÜM DEĞİŞİMİ (önceki → son vizit):')
  const ol = [olcum('kilo', 'Kilo'), olcum('boy', 'Boy'), olcum('basCevresi', 'Baş çevresi')].filter(Boolean) as string[]
  out.push(...(ol.length ? ol : ['- İki vizitte karşılaştırılabilir ölçüm yok.']))
  for (const b of p.buyume(olaylar, hasta).bayraklar) out.push(`- ${b.metin}`)
  out.push(`ÖNCEKİ VİZİTTE (${trGun(onceki.tarih)}) PLANLANANLAR → sonraki kayıtta karşılık:`)
  const planlar = planOlaylari(olaylar).filter((o) => o.vizitId === onceki.vizitId)
  out.push(...(planlar.length ? planlar.map((pl) => {
    const k = planKarsiligi(pl, olaylar)
    const ad = pl.tur === 'asi' ? asiPlanSatiri(pl) : pl.tur === 'lab' ? `${labAdlari(pl.anahtarlar)} — ${durumAdi(pl.durum)} ("${pl.metin}")` : `${pl.tur} — ${durumAdi(pl.durum)} ("${pl.metin}")`
    return `- ${ad} → ${k ? `${k.guven === 'metin' ? 'yalnız not metninde' : 'kayıt'}: ${k.metin.slice(0, 120)} (${trGun(k.tarih)})` : 'gerçekleştiğine dair kayıt bulamadım'}`
  }) : ['- Önceki vizit notunda plan cümlesi (aşı / lab / kontrol / konsültasyon / tarama) bulunamadı.']))
  const yeni = olaylar.filter((o) => arada(o) && ['lab', 'asi', 'konsultasyon', 'belge'].includes(o.kaynak))
  out.push('ARADA / SON VİZİTTE YENİ KAYITLAR (lab, aşı, konsültasyon, belge):')
  out.push(...(yeni.length ? yeni.map((o) => `- ${trGun(o.tarih)} ${o.kaynak}: ${o.metin} — ${durumAdi(o.durum)}`) : ['- (yok)']))
  const receteSon = olaylar.filter((o) => o.tur === 'recete' && o.vizitId === son.vizitId)
  const receteOnceki = olaylar.filter((o) => o.tur === 'recete' && o.vizitId === onceki.vizitId)
  out.push(`REÇETE: son vizit — ${receteSon.map((o) => o.metin).join('; ') || 'yok'}; önceki vizit — ${receteOnceki.map((o) => o.metin).join('; ') || 'yok'}.`)
  const ilacDegisen = olaylar.filter((o) => o.kaynak === 'ilac' && o.tur === 'ilac' && o.tarih > onceki.tarih)
  if (ilacDegisen.length) out.push(`İLAÇ KAYDINDA ÖNCEKİ VİZİTTEN SONRA BAŞLAYANLAR: ${ilacDegisen.map((o) => `${o.metin} (${durumAdi(o.durum)})`).join('; ')}.`)
  const tamamlanan = olaylar.filter((o) => o.kaynak === 'ilac' && o.tur === 'ilac' && (o.durum === 'tamamlandi' || o.durum === 'kesildi' || o.durum === 'belirsiz'))
  if (tamamlanan.length) out.push(`KESİLEN / TAMAMLANAN / BELİRSİZ İLAÇLAR: ${tamamlanan.map((o) => o.metin).join('; ')}.`)
  const alerjiYeni = olaylar.filter((o) => o.tur === 'alerji' && arada(o))
  if (alerjiYeni.length) out.push(`YENİ ALERJİ KAYDI: ${alerjiYeni.map((o) => o.metin).join('; ')}.`)
  return out
}

function ozetBolumu(olaylar: DosyaOlayi[], hasta: DosyaHastasi, p: BransSorguParametreleri): string[] {
  const v = vizitleri(olaylar)
  const out: string[] = []
  const perinatal = olaylar.find((o) => o.tur === 'perinatal')
  if (perinatal) out.push(perinatal.metin)
  out.push(`ALERJİ: ${alerjiSatiri(olaylar)}`)
  const kronik = olaylar.filter((o) => o.tur === 'kronik')
  out.push(`KRONİK / ÖZGEÇMİŞ: ${kronik.length ? kronik.map((o) => o.metin.replace(/^Kronik \/ özgeçmiş:\s*/, '')).join('; ') : 'kayıt yok'}.`)
  const aktif = olaylar.filter((o) => o.kaynak === 'ilac' && o.tur === 'ilac' && o.durum === 'aktif')
  out.push(`AKTİF İLAÇ: ${aktif.length ? aktif.map((o) => o.metin.replace(/\s*\[.*$/, '')).join('; ') : 'aktif ilaç kaydı yok'}.`)
  // Tanılar: tekrar sayısıyla (her viziti anlatma).
  const tanilar = new Map<string, string[]>()
  for (const x of v) {
    const m = x.metin.match(/Tanı: ([^|]+)/)
    if (m) { const t = m[1].trim(); tanilar.set(t, [...(tanilar.get(t) || []), x.tarih]) }
  }
  out.push(`VİZİTLER: ${v.length} onaylı vizit${v.length ? ` (${trGun(v[0].tarih)} – ${trGun(v[v.length - 1].tarih)})` : ''}.`)
  if (tanilar.size) out.push(`TANILAR (vizit sayısı, tarih): ${[...tanilar.entries()].map(([t, d]) => `${t} ×${d.length} (${d.map(trGun).join(', ')})`).join('; ')}.`)
  for (const t of tekrarlayanPaternler(olaylar, hasta.bugunIso)) out.push(`TEKRARLAYAN PATERN: ${t.grup} — son 12 ayda ${t.tarihler.length} vizit (${t.tarihler.map(trGun).join(', ')}).`)
  const demirVizit = v.filter((x) => esanlamGruplariBul(oykuKismi(x)).some((g) => g.id === 'demir'))
  if (demirVizit.length) out.push(`DEMİR EKSİKLİĞİ / ANEMİ notlarda: ${demirVizit.map((x) => trGun(x.tarih)).join(', ')}.`)
  const b = p.buyume(olaylar, hasta)
  const olcumSatirlari = b.satirlar.filter((x) => /^- \d{2}\.\d{2}\.\d{4} \(/.test(x))
  out.push('BÜYÜME:', ...(olcumSatirlari.length ? [olcumSatirlari[olcumSatirlari.length - 1]] : b.satirlar.slice(0, 1)), ...b.satirlar.filter((x) => /Kayma|Hedef boy|Tek ölçüm/.test(x)))
  if (p.gelisim) {
    const g = p.gelisim(olaylar, hasta)
    out.push('GELİŞİM:', ...g.satirlar.filter((s) => /Tarama durumu|planlanmış|kaygı|Regresyon|Kayıtlı tarama/.test(s)).slice(0, 5))
  }
  const asi = p.asi(olaylar, hasta)
  if (asi) {
    const eksik = asi.dozlar.filter((d) => d.durum === 'gecikti' || d.durum === 'zamani_geldi' || d.durum === 'bugun')
    out.push(`AŞI: aşı tablosunda ${asi.dozlar.filter((d) => d.durum === 'uygulandi').length} takvim dozu kayıtlı; eksik / zamanı gelmiş: ${eksik.length ? eksik.map((d) => d.ad).join(', ') : 'yok'}.`)
  } else out.push(`AŞI: ${p.asiTakvimiYok}`)
  const planAsi = planOlaylari(olaylar).filter((o) => o.tur === 'asi' && !planKarsiligi(o, olaylar))
  if (planAsi.length) out.push(`AŞI (planlanmış, uygulama kaydı yok): ${planAsi.map(asiPlanSatiri).join('; ')}.`)
  const lab = labBolumu(olaylar).filter((s) => s.startsWith('- ') || /İSTENEN|DEMİR/.test(s)).slice(0, 8)
  if (lab.length) out.push('ÖNEMLİ LAB:', ...lab)
  const kons = olaylar.filter((o) => o.kaynak === 'konsultasyon')
  if (kons.length) out.push(`KONSÜLTASYON: ${kons.map((o) => `${o.metin} — ${durumAdi(o.durum)} (${trGun(o.tarih)})`).join('; ')}.`)
  const isler = acikIsleriBul(olaylar, yasAyHesapla(hasta.dogumIso, hasta.bugunIso), hasta.brans, hasta)
  out.push('TAKİP GEREKTİRENLER:', ...(isSatirlari([...isler.bugun, ...isler.yakinda]).length ? isSatirlari([...isler.bugun, ...isler.yakinda]) : ['- Açık iş saptanmadı.']))
  return out
}

/**
 * Brief imzası: `kanitBlogu(intent, olaylar, hasta)` → soru için kanıt + cevap şablonu (Türkçe). Blok hasta adını
 * içermez; kurallar bloğu (dosyaSorguKuralBlogu) adı ilk cümleye koyar.
 */
export function kanitBlogu(tur: SoruTuru, olaylar: DosyaOlayi[], hasta: DosyaHastasi, ek: KanitEki = {}): string {
  const p = parametreSec(hasta.brans, hasta.dogumIso, hasta.bugunIso)
  const s = SORU_SABLONLARI[tur]
  const v = vizitleri(olaylar)
  const yasAy = yasAyHesapla(hasta.dogumIso, hasta.bugunIso)
  const bas = [
    `=== DOSYA SORGUSU — Soru ${s.no}: "${s.soru}" ===`,
    `Hasta: ${yasMetni(hasta.dogumIso, hasta.bugunIso)}${hasta.cinsiyet ? `, ${hasta.cinsiyet === 'male' ? (yasAy != null && yasAy < 216 ? 'erkek çocuk' : 'erkek') : (yasAy != null && yasAy < 216 ? 'kız çocuk' : 'kadın')}` : ''}; bugün ${trGun(hasta.bugunIso)}; parametre seti: ${p.ad}.`,
    `Kaynak: ${v.length} onaylı vizit${v.length ? ` (${trGun(v[0].tarih)} – ${trGun(v[v.length - 1].tarih)})` : ''}, ${olaylar.filter((o) => o.kaynak === 'lab').length} lab satırı, ${olaylar.filter((o) => o.kaynak === 'asi').length} aşı kaydı, ${olaylar.filter((o) => o.kaynak === 'ilac' && o.tur === 'ilac').length} ilaç kaydı.`,
    '[KANIT — durumlar açık: planlandı / önerildi / istendi / reçete edildi ≠ uygulandı / sonuçlandı]',
  ]
  let govde: string[] = []
  switch (tur) {
    case 'ozet': govde = ozetBolumu(olaylar, hasta, p); break
    case 'degisim': govde = degisimBolumu(olaylar, hasta, p); break
    case 'buyume': { const b = p.buyume(olaylar, hasta); govde = [...b.satirlar, ...(b.bayraklar.length ? ['DİKKAT:', ...isSatirlari(b.bayraklar)] : [])]; break }
    case 'asi': govde = asiBolumu(olaylar, hasta, p); break
    case 'lab': {
      govde = labBolumu(olaylar)
      const ilgili = olaylar.filter((o) => o.kaynak === 'ilac' && o.tur === 'ilac' && /demir|ferro|fer\b|ferrum|maltofer|d vitamini|kolekalsiferol/i.test(o.metin))
      if (ilgili.length) govde.push(`İLGİLİ İLAÇLAR (yorum için): ${ilgili.map((o) => `${o.metin} (${trGun(o.tarih)})`).join('; ')}.`)
      const tani = v.filter((x) => esanlamGruplariBul(oykuKismi(x)).some((g) => g.id === 'demir'))
      if (tani.length) govde.push(`İLGİLİ TANI / NOT: demir eksikliği / anemi ${tani.map((x) => trGun(x.tarih)).join(', ')} notlarında geçiyor.`)
      break
    }
    case 'ilac': govde = [...ilacBolumleri(olaylar, hasta), `ALERJİ: ${alerjiSatiri(olaylar)}`, ...alerjiCatismalari(olaylar, hasta.bugunIso).map((a) => `⚠ ${a.metin}`)]; break
    case 'benzer': govde = benzerBolumu(olaylar, ek.mesaj || ''); break
    case 'gelisim': {
      if (!p.gelisim) { govde = ['Gelişim / GİDR / M-CHAT sorusu bu branşın bölüm sorusu değil (pediatriye özgü); bu hasta için gelişimsel tarama verisi değerlendirilmedi. Hekime bunu açıkça söyle.']; break }
      const g = p.gelisim(olaylar, hasta)
      govde = [...g.satirlar, ...(g.bayraklar.length ? ['DİKKAT:', ...isSatirlari(g.bayraklar)] : [])]
      break
    }
    case 'takip':
    case 'gozden-kacan': {
      const isler = acikIsleriBul(olaylar, yasAy, hasta.brans, hasta)
      const hepsi = [...isler.bugun, ...isler.yakinda, ...isler.rutin]
      if (tur === 'takip') {
        govde = [
          '1) BUGÜN:', ...(isler.bugun.length ? isSatirlari(isler.bugun) : ['- (yok)']),
          '2) YAKIN ZAMANDA:', ...(isler.yakinda.length ? isSatirlari(isler.yakinda) : ['- (yok)']),
          '3) RUTİN:', ...(isler.rutin.length ? isSatirlari(isler.rutin) : ['- (yok)']),
        ]
      } else {
        const grup = (baslik: string, f: (i: AcikIs) => boolean) => { const x = hepsi.filter(f); return x.length ? [baslik, ...isSatirlari(x)] : [] }
        govde = [
          ...grup('HASTA GÜVENLİĞİ:', (i) => Boolean(i.guvenlik)),
          ...grup('ÇELİŞEN KAYIT:', (i) => i.tur === 'celiski'),
          ...grup('AŞI (eksik / planlanmış-uygulanmamış):', (i) => i.tur.startsWith('asi-') && i.tur !== 'asi-yaklasan'),
          ...grup('SONUCU OLMAYAN / TAKİPSİZ TEST:', (i) => i.tur === 'lab-sonuc-yok' || i.tur === 'lab-anormal-tekrar-yok' || i.tur === 'goruntuleme-sonuc-yok'),
          ...grup('BÜYÜME / GELİŞİM:', (i) => i.tur === 'buyume' || i.tur === 'gelisim' || i.tur.startsWith('tarama')),
          ...grup('TEKRARLAYAN PATERN:', (i) => i.tur === 'tekrarlayan'),
          ...grup('BEKLEYEN KONSÜLTASYON / KONTROL:', (i) => i.tur === 'konsultasyon-bekliyor' || (i.tur === 'kontrol-planli' && i.oncelik !== 'rutin')),
        ]
        if (!govde.length) govde = ['Dosyada şu anda belirgin bir açık güvenlik problemi veya takip edilmemiş önemli bulgu saptamadım.']
      }
      if (!v.length) govde.push('VERİ EKSİKLİĞİ: onaylı vizit notu yok — değerlendirme yalnız yapılandırılmış kayıtlara dayanıyor.')
      break
    }
  }
  return [...bas, ...govde, `[CEVAP ŞABLONU — Soru ${s.no}] ${s.sablon}`, '=== SORGU SONU ==='].join('\n')
}
