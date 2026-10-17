/**
 * MUAYENE-EKLERI-01 — mevcut motor çıktılarını (lab raporu, belge raporu, aşı karnesi okuması, genel belge) tek EkSonuc
 * şemasına çevirir. Saf: ağ/DB yok, bu yüzden uydurma-değer güvenceleri burada birim testle kanıtlanır.
 *
 * Ortak ilke: sistemin belgeden çıkardığı şey (kaynak 'belge') ile modelin yorumu (kaynak 'yorum') ayrı işaretlenir;
 * hiçbir alan belgede olmayan değerle doldurulmaz; model yorumundaki desteklenmeyen sayı cümleleri atılır.
 */
import type { LabSatir } from '@/core/lab/trend'
import { trendCumlesi } from '@/core/lab/trend'
import { KANONIK } from '@/core/lab/kanonik'
import type { LabRapor } from '@/core/lab/yorum'
import type { BelgeRaporu } from '@/core/belgeler/types'
import type { KarneSatiri } from '@/lib/asi/karneOkuma'
import { takvimEslestir } from '@/lib/asi/karneOkuma'
import { izinliKume, sayisalGuvence } from './guvence'
import { EK_DEGERLENDIRME_SURUMU, type EkAsiSatiri, type EkBulgu, type EkLabDegeri, type EkSonuc, type EkTuru } from './tipler'

const b = (metin: string, kaynak: EkBulgu['kaynak'], duzey: EkBulgu['duzey'] = 'bilgi'): EkBulgu => ({ id: '', metin, kaynak, duzey })
const bos = (tur: EkTuru): EkSonuc => ({ tur, durum: 'tamam', baslik: '', ozet: '', bulgular: [], uyarilar: [], sinirlar: [], izinliSayilar: [], surum: EK_DEGERLENDIRME_SURUMU })

export function hataSonucu(tur: EkTuru, neden: string): EkSonuc {
  return { ...bos(tur), durum: 'hata', hataNedeni: neden }
}
export function atlandiSonucu(tur: EkTuru, neden: string): EkSonuc {
  return { ...bos(tur), durum: 'atlandi', hataNedeni: neden }
}

// ─── Laboratuvar ────────────────────────────────────────────────────────────────────────────────────────
const sayiMetni = (s: LabSatir): string => (s.value_text != null && s.value_num == null ? s.value_text : String(s.value_num ?? s.value_text ?? ''))
const testAdi = (s: LabSatir): string => (s.canonical_key && KANONIK[s.canonical_key] ? KANONIK[s.canonical_key].tr : s.raw_name)

export function labSonucu(g: {
  satirlar: LabSatir[]
  rapor: LabRapor | null
  labAdi?: string | null
  numuneTarihi?: string | null
  kimlikUyarisi?: string | null
}): EkSonuc {
  const s = bos('lab')
  const tr = g.numuneTarihi ? g.numuneTarihi.split('-').reverse().join('.') : ''
  s.baslik = [g.labAdi || 'Laboratuvar', tr].filter(Boolean).join(' — ').slice(0, 120)

  const degerler: EkLabDegeri[] = g.satirlar.slice(0, 120).map((x) => ({
    test: testAdi(x).slice(0, 80),
    deger: sayiMetni(x).slice(0, 40),
    birim: x.unit,
    referans: x.ref_low != null || x.ref_high != null ? `${x.ref_low ?? '—'}–${x.ref_high ?? '—'}` : null,
    bayrak: x.flag,
    dogrulanacak: x.dogrulanacak,
  })).filter((v) => v.deger)
  s.labDegerleri = degerler

  const trendCumleleri = g.satirlar.map(trendCumlesi).filter((c): c is string => !!c)
  s.izinliSayilar = Array.from(izinliKume([
    ...degerler.flatMap((v) => [v.deger, v.referans]),
    ...g.satirlar.flatMap((x) => [x.value_num, x.ref_low, x.ref_high, x.kanonik_deger, x.prior_value, x.delta, x.delta_pct, ...x.prior_series.map((p) => p.deger)]),
    ...trendCumleleri,
  ]))

  // Sistem bulguları (kural/tablo): model yazmadı.
  for (const x of g.satirlar) {
    if (x.flag === 'normal' || x.flag === 'unknown') continue
    const yon = x.flag === 'H' ? 'yüksek' : x.flag === 'L' ? 'düşük' : 'kritik aralıkta'
    const ref = x.ref_low != null || x.ref_high != null ? ` (ref ${x.ref_low ?? '—'}–${x.ref_high ?? '—'})` : ''
    s.bulgular.push(b(`${testAdi(x)}: ${sayiMetni(x)}${x.unit ? ` ${x.unit}` : ''}${ref} — ${yon}.${x.kritik && x.kritik_neden ? ` KRİTİK: ${x.kritik_neden}.` : ''}`, 'belge', x.kritik || x.flag === 'critical' ? 'kritik' : 'uyari'))
  }
  for (const c of trendCumleleri.slice(0, 8)) if (/Δ|yükseliyor|düşüyor|yeni bozulan/.test(c)) s.bulgular.push(b(c, 'belge'))

  const dogrulanacak = degerler.filter((v) => v.dogrulanacak).length
  if (dogrulanacak) s.uyarilar.push(`${dogrulanacak} değerin okuması belirsiz — özgün belgeyle karşılaştırın.`)
  const refYok = g.satirlar.filter((x) => x.ref_low == null && x.ref_high == null && x.value_num != null).length
  if (refYok) s.uyarilar.push(`${refYok} sayısal değerde belgede basılı referans aralığı yok; bu değerler için yaş/cinsiyete özgü aralık sistem tarafından uydurulmadı.`)
  if (g.kimlikUyarisi) s.uyarilar.unshift(g.kimlikUyarisi)
  if (!g.satirlar.length) s.uyarilar.push('Belgeden okunabilir bir değer çıkarılamadı.')

  const izinli = new Set(s.izinliSayilar)
  if (!g.rapor) {
    s.ozet = 'Klinik yorum üretilemedi; yalnızca belgeden çıkarılan değerler gösteriliyor.'
    s.uyarilar.push('Yorum adımı tamamlanamadı — "Yeniden değerlendir" ile tekrar deneyebilirsiniz.')
    return s
  }
  let atilan = 0
  const suz = (m: string): string => {
    const r = sayisalGuvence([m], izinli)
    atilan += r.atilan.length
    return r.tutulan.join(' ').trim()
  }
  s.ozet = suz(g.rapor.ozet)
  const ekle = (m: string, duzey: EkBulgu['duzey'] = 'bilgi') => { const t = suz(m); if (t) s.bulgular.push(b(t, 'yorum', duzey)) }
  for (const m of g.rapor.yeni_bozulanlar) ekle(`Yeni bozulan: ${m}`, 'uyari')
  for (const m of g.rapor.kronik) ekle(`Kronik/süregelen: ${m}`)
  for (const m of g.rapor.duzelenler) ekle(`Düzelen: ${m}`)
  if (g.rapor.klinik_iliski) ekle(`Değerler arası ilişki: ${g.rapor.klinik_iliski}`)
  for (const t of g.rapor.tanilar.slice(0, 3)) {
    const destek = t.destek.length ? ` (${suz(t.destek.join('; '))})` : ''
    ekle(`${t.ad} ile uyumlu olabilir${destek}; kesin tanı değildir.`)
  }
  if (g.rapor.oneri) ekle(`Öneri (hekim kararına tabidir): ${g.rapor.oneri}`)
  if (atilan) s.uyarilar.push(`Yorumdaki ${atilan} cümle, belgedeki değerlerle doğrulanamayan sayı içerdiği için çıkarıldı.`)
  s.sinirlar = [...g.rapor.sinirlar.slice(0, 4), 'Yapay zekâ yorumu tanı değildir; yaş ve cinsiyete özgü aralıklar için belgede basılı referans esas alınmıştır.'].slice(0, 5)
  if (g.rapor.acil_bayrak) s.uyarilar.unshift('Acil bayrağı: kritik değer var — önce klinik durumu değerlendirin.')
  return s
}

// ─── Görüntüleme / EKG / fotoğraf ────────────────────────────────────────────────────────────────────────
export const GORUNTU_SINIRI = 'Yapay zekâ görüntü gözlemi tanı değildir; yalnızca gözlem ve olası uyum bildirir. Değerlendirme ve tanı hekime aittir.'

export function goruntuSonucu(tur: 'rontgen' | 'ekg' | 'foto', rapor: BelgeRaporu): EkSonuc {
  const s = bos(tur)
  s.baslik = (rapor.modalite || '').slice(0, 120)
  s.ozet = rapor.ozet
  for (const m of rapor.bulgular) s.bulgular.push(b(m, 'yorum'))
  // Yalnız gözlemle uyum: kesin tanı dili yok. Düşük güvenli olası durumlar da çekinceli sunulur.
  for (const t of rapor.tanilar.slice(0, 3)) s.bulgular.push(b(`Gözlemle uyumlu olabilecek durum: ${t.ad} (kesin tanı değildir; hekim değerlendirmesi gerekir).`, 'yorum'))
  if (rapor.oneri) s.bulgular.push(b(`Öneri (hekim kararına tabidir): ${rapor.oneri}`, 'yorum'))
  if (rapor.acil_bayrak) s.uyarilar.push('Acil bayrağı: görüntüde acil değerlendirme gerektirebilecek bir bulgu belirtildi.')
  if (rapor.kalite !== 'iyi') s.uyarilar.push(`Görüntü kalitesi ${rapor.kalite === 'dusuk' ? 'düşük' : 'orta'} — gözlemler sınırlı olabilir.`)
  s.uyarilar.push('Görüntüden okunan ölçüm ve sayılar doğrulanamaz; kendi ölçümünüzle karşılaştırın.')
  s.sinirlar = [GORUNTU_SINIRI, ...rapor.sinirlar.slice(0, 4)]
  s.izinliSayilar = Array.from(izinliKume([s.ozet, ...s.bulgular.map((x) => x.metin)]))
  return s
}

// ─── Aşı ────────────────────────────────────────────────────────────────────────────────────────────────
export function karneSatirlariniCevir(satirlar: KarneSatiri[], kaynakTuru: EkAsiSatiri['kaynakTuru'], bugunIso: string): EkAsiSatiri[] {
  return satirlar.map((x, i) => ({
    anahtar: x.anahtar || `a${i + 1}`,
    asiAdi: x.asiAdi,
    dozNo: x.dozNo,
    uygulamaTarihi: x.uygulamaTarihi,
    lotNo: null,
    skt: null,
    okunamadi: x.okunamadi,
    neden: x.okunamadiNedeni,
    hamMetin: x.hamMetin,
    eslesme: x.asiAdi ? takvimEslestir(x.asiAdi).etiket : 'Takvim dışı aşı',
    kaynakTuru: kaynakTuru,
  })).map((x) => ({ ...x, neden: x.uygulamaTarihi && x.uygulamaTarihi > bugunIso ? 'gelecekte bir tarih' : x.neden }))
}

export function asiSonucu(g: { satirlar: EkAsiSatiri[]; bugunIso: string; not?: string | null; okunabilirlik?: string | null; kimlikUyarisi?: string | null }): EkSonuc {
  const s = bos('asi')
  s.baslik = g.satirlar.length ? `${g.satirlar.length} aşı satırı` : 'Aşı bilgisi'
  s.asiSatirlari = g.satirlar
  s.ozet = g.satirlar.length
    ? 'Aşı bilgisi belgeden okundu. Aşı karnesine/nota hiçbir şey, siz onaylamadan yazılmaz.'
    : 'Belgeden aşı bilgisi okunamadı.'
  for (const x of g.satirlar) {
    const parca = [x.asiAdi || 'Aşı adı okunamadı', x.dozNo ? `${x.dozNo}. doz` : null, x.uygulamaTarihi, x.lotNo ? `lot ${x.lotNo}` : null, x.skt ? `SKT ${x.skt}` : null].filter(Boolean).join(' · ')
    s.bulgular.push(b(`${parca} — ${x.eslesme}${x.okunamadi && x.neden ? ` (${x.neden})` : ''}`, 'belge', x.okunamadi ? 'uyari' : 'bilgi'))
    if (x.skt && x.skt < g.bugunIso) s.uyarilar.push(`${x.asiAdi || 'Aşı'}: son kullanma tarihi (${x.skt}) geçmiş görünüyor — lotu kontrol edin.`)
  }
  if (g.kimlikUyarisi) s.uyarilar.unshift(g.kimlikUyarisi)
  if (g.okunabilirlik && g.okunabilirlik !== 'iyi') s.uyarilar.push('Okunabilirlik düşük/kısmi — satırları belgeyle karşılaştırarak onaylayın.')
  if (g.not) s.uyarilar.push(g.not)
  s.sinirlar = ['Okunamayan alanlar tahmin edilmedi; doz ve tarih yalnız belgede yazıyorsa aktarılır.']
  s.izinliSayilar = Array.from(izinliKume(g.satirlar.flatMap((x) => [x.dozNo, x.uygulamaTarihi, x.lotNo, x.skt])))
  return s
}

// ─── Diğer belgeler (epikriz dâhil) ─────────────────────────────────────────────────────────────────────
export interface GenelBelgeJson {
  belge_turu?: unknown; tarih?: unknown; ozet?: unknown; onemli_bulgular?: unknown; ilaclar?: unknown; takip?: unknown; okunamayan?: unknown
}
const dizi = (x: unknown): string[] => (Array.isArray(x) ? x.map((y) => String(y ?? '').trim()).filter(Boolean) : [])

export function genelSonucu(tur: 'epikriz' | 'diger', j: GenelBelgeJson): EkSonuc {
  const s = bos(tur)
  const bt = String(j.belge_turu ?? '').trim()
  const tarih = String(j.tarih ?? '').trim()
  s.baslik = [bt || (tur === 'epikriz' ? 'Epikriz' : 'Belge'), tarih].filter(Boolean).join(' — ').slice(0, 120)
  s.ozet = String(j.ozet ?? '').trim().slice(0, 1800)
  for (const m of dizi(j.onemli_bulgular).slice(0, 12)) s.bulgular.push(b(m, 'belge'))
  for (const m of dizi(j.ilaclar).slice(0, 10)) s.bulgular.push(b(`Belgede geçen ilaç: ${m}`, 'belge'))
  for (const m of dizi(j.takip).slice(0, 6)) s.bulgular.push(b(`Belgedeki takip/öneri: ${m}`, 'belge'))
  const oku = dizi(j.okunamayan)
  if (oku.length) s.uyarilar.push(`Okunamayan bölümler: ${oku.slice(0, 5).join('; ')}.`)
  s.sinirlar = ['Yalnızca belgede yazan bilgiler aktarıldı; yorum ve tanı hekime aittir.']
  s.izinliSayilar = Array.from(izinliKume([s.ozet, ...s.bulgular.map((x) => x.metin)]))
  return s
}
