/**
 * NOTYA-AYSE-STANDART-01 (Kaan + Dr. Gökhan, 2026-09-26) — hasta dosyasının OLAY dizini.
 *
 * Ayşe'nin klinik dosya sorgulama standardı (docs/AYSE-STANDART.md) kaydı kelime olarak değil olay olarak okur: her
 * satır "ne, ne zaman, hangi kaynaktan, hangi DURUMDA" sorusuna cevap verir. Planlandı / önerildi / istendi / reçete
 * edildi ile uygulandı / sonuçlandı ayrı durumlardır; bir planın gerçekleştiği yalnız SONRAKİ bir kayıtla gösterilir.
 *
 * İki katman:
 *   - `olaylariKur(ham, bugunIso)` — SAF eşleyici. Denetim fikstürleri (lib/asistan/dosyaSorgu/denetim) ve canlı dosya
 *     aynı fonksiyondan geçer; durum okuma anında hesaplanır, tabloya durum kolonu eklenmez (migration yok).
 *   - `dosyaSorguVerisiDerle(sb, doktorId, patientId)` — okumalar. HASTA-IZOLASYON-01: hasta satırı doktora kapsanır ve
 *     her çocuk okuma hem hasta hem doktor kolonuyla süzülür. NOTYA-ARSIV-01/02: arşivlenmiş muayene, notu, ilacı ve
 *     aşısı görünmez (lib/doktor/arsiv.ts). Yalnız ONAYLI notlar (approved_at) plan cümlesi kaynağıdır.
 *
 * KVKK: hastanın adı olay metnine yazılmaz; ad yalnız `hasta.ad` alanındadır (cevap cümlesi adla başlar —
 * NOTYA-HASTA-ODAK-01). Kimlik / iletişim alanları okunmaz.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { decrypt } from '@/lib/security/encryption'
import { arsivsizAsilar, arsivsizIlaclar, arsivsizNotlar, arsivsizSeanslar } from '@/lib/doktor/arsiv'
import { hastaAdiCoz } from '@/lib/doktor/hastaCozumleyici'
import { planIfadeleriniCikar, asiTamBeyaniMi } from '@/lib/doktor/planIfadesi'
import { kayitSerisi } from '@/specialties/pediatri/engines/asiPlan'
import { kanonikTr } from '@/core/lab/kanonik'
import { trAramaNormalize } from '@/lib/utils/turkceArama'

export type OlayKaynagi = 'not' | 'ilac' | 'asi' | 'lab' | 'belge' | 'cihaz' | 'randevu' | 'konsultasyon' | 'intake' | 'olcum'
export type OlayDurumu =
  | 'planlandi' | 'onerildi' | 'istendi' | 'recete' | 'randevu'
  | 'uygulandi' | 'sonuclandi' | 'aktif' | 'kesildi' | 'tamamlandi' | 'belirsiz'

export interface DosyaOlayi {
  /** ISO tarih (YYYY-MM-DD). */
  tarih: string
  kaynak: OlayKaynagi
  /** 'vizit' | 'asi' | 'lab' | 'kontrol' | 'konsultasyon' | 'tarama' | 'goruntuleme' | 'ilac' | 'recete' | 'kilo' | 'boy' | … */
  tur: string
  durum: OlayDurumu
  metin: string
  deger?: number
  birim?: string
  /** Reçete / ilaç başlangıcı: o tarihteki (ya da öncesindeki en yakın) kilo. mg/kg güncel kiloyla hesaplanmaz. */
  kilo?: number
  kiloTarihi?: string
  kaynakId: string
  guven?: 'kayit' | 'metin'
  /** Aşı serisi (hepb, kkk…), lab kanonik anahtarı, tarama türü (mchat, gidr…). */
  anahtar?: string | null
  /** Lab istemi birden çok kalem anabilir ("hemogram ve ferritin istendi"). */
  anahtarlar?: string[]
  doz?: number | null
  /** Olayın geldiği vizit (not kaynaklı olaylar). */
  vizitId?: string
  /** Lab: laboratuvarın kendi referansı (yaşa uygunluğu doğrulanmadı — H/L işaretine güvenilmez). */
  refAlt?: number | null
  refUst?: number | null
  /** İlaç: planlanan süre (gün), kullanım, etken madde — Soru 6. */
  sureGun?: number | null
  etken?: string | null
}

export interface DosyaHastasi {
  /** Yalnız cevap cümlesinin başı için (NOTYA-HASTA-ODAK-01) — kanıt metnine yazılmaz. */
  ad: string
  dogumIso: string | null
  cinsiyet: 'male' | 'female' | null
  /** users.specialty (ham) — parametre seçimi (lib/asistan/dosyaSorgu/parametreler.ts). */
  brans: string | null
  bugunIso: string
}

// ─── Ham dosya (DB satırları ya da fikstür) ─────────────────────────────────────────────────────────────
export interface HamVizit {
  id: string
  tarih: string
  subjektif?: string | null
  objektif?: string | null
  degerlendirme?: string | null
  plan?: string | null
  tani?: string | null
  icd?: { code?: string; description_tr?: string }[] | null
  ilaclar?: { ad?: string; doz?: string; kullanim?: string }[] | null
  vitaller?: Record<string, unknown> | null
}

export interface HamDosya {
  hasta: { ad: string; dogumIso: string | null; cinsiyet: string | null }
  brans: string | null
  /** Çözülmüş ilk kayıt formu yanıtları + patients.notes_encrypted JSON (kimlik anahtarları çıkarılmış). */
  intake?: Record<string, unknown> | null
  intakeTarih?: string | null
  vizitler: HamVizit[]
  asilar?: { id: string; asi_adi: string | null; doz_no: number | null; uygulama_tarihi: string | null; kaynak?: string | null }[]
  ilaclar?: { id: string; ilac_adi: string; etken_madde?: string | null; doz?: string | null; kullanim_sikli?: string | null; baslangic_tarihi?: string | null; bitis_tarihi?: string | null; aktif?: boolean | null; notlar?: string | null; created_at?: string | null }[]
  lablar?: { id: string; canonical_key: string; kanonik_deger?: number | null; kanonik_birim?: string | null; value_text?: string | null; numune_tarihi: string | null; ref_low?: number | null; ref_high?: number | null }[]
  randevular?: { id: string; baslangic: string; tur?: string | null; durum?: string | null }[]
  sevkler?: { id: string; hedef?: string | null; hedef_brans?: string | null; klinik_soru?: string | null; durum?: string | null; istem_tarihi?: string | null; yanit_tarihi?: string | null; yanit_ozeti?: string | null; created_at?: string | null }[]
  mchat?: { id: string; created_at: string; risk_seviyesi: string; toplam_puan?: number | null }[]
  gidr?: { id: string; created_at: string; ay_yas?: number | null; yas_basamak_etiket?: string | null; sevk_onerisi?: boolean | null }[]
  taramalar?: { id: string; tur: string; tarih: string; sonuc: string; not_metni?: string | null }[]
  cihaz?: { id: string; tur: string; deger: string | null; birim: string | null; alindi: string }[]
  belgeler?: { id: string; modality_final?: string | null; hekim_ozet?: string | null; onaylandi_at?: string | null }[]
}

const gun = (iso: string | null | undefined) => String(iso || '').slice(0, 10)
const kisalt = (s: unknown, n = 280) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n)

export function trGun(iso: string | null | undefined): string {
  const t = gun(iso)
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? `${t.slice(8, 10)}.${t.slice(5, 7)}.${t.slice(0, 4)}` : 'tarihsiz'
}

function sayi(v: unknown): number | null {
  if (v == null || v === '') return null
  const m = String(v).replace(',', '.').match(/-?\d+(?:\.\d+)?/)
  return m ? Number(m[0]) : null
}

export function gunEkleIso(iso: string, n: number): string {
  const d = new Date(`${gun(iso)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function gunFarkiIso(a: string, b: string): number {
  return Math.round((Date.parse(`${gun(b)}T00:00:00Z`) - Date.parse(`${gun(a)}T00:00:00Z`)) / 86_400_000)
}

// ─── İlaç durumu (okuma anında) ─────────────────────────────────────────────────────────────────────────
/** Kısa süreli verilen, aylar sonra "aktif" gösterilmemesi gereken ilaçlar (akut antibiyotik / semptomatik). */
const AKUT_ILAC = /amoksisilin|amoxicillin|klavulan|augmentin|sefdinir|sefuroksim|sefiksim|sefaklor|sefprozil|azitromisin|klaritromisin|penisilin|ampisilin|trimetoprim|nitrofurantoin|fosfomisin|oseltamivir|ibuprofen|parasetamol|metronidazol|prednizolon|deksametazon|ondansetron/i
/** Akut ilacın süresi yazmıyorsa bu kadar gün sonra "aktif olduğuna dair güncel kayıt yok" sayılır. */
export const AKUT_ILAC_AKTIF_GUN = 14

export function sureGunCoz(...metinler: (string | null | undefined)[]): number | null {
  for (const m of metinler) {
    const n = trAramaNormalize(m)
    const g = n.match(/(\d{1,3})\s*gun(?:\s*(?:boyunca|sure(?:yle)?|sureli))?/)
    if (g) return Number(g[1])
    const h = n.match(/(\d{1,2})\s*hafta/)
    if (h) return Number(h[1]) * 7
    const a = n.match(/(\d{1,2})\s*ay\b(?!\s*sonra)/)
    if (a) return Number(a[1]) * 30
  }
  return null
}

export function ilacDurumu(
  i: { ilac_adi: string; etken_madde?: string | null; aktif?: boolean | null; baslangic_tarihi?: string | null; bitis_tarihi?: string | null; kullanim_sikli?: string | null; doz?: string | null; notlar?: string | null; created_at?: string | null },
  bugunIso: string,
): { durum: OlayDurumu; neden: string; sureGun: number | null } {
  const bas = gun(i.baslangic_tarihi || i.created_at)
  const sureGun = sureGunCoz(i.kullanim_sikli, i.doz, i.notlar)
  if (i.aktif === false) return { durum: 'kesildi', neden: i.bitis_tarihi ? `sonlandırıldı (${trGun(i.bitis_tarihi)})` : 'kayıtta aktif değil', sureGun }
  if (i.bitis_tarihi && gun(i.bitis_tarihi) < bugunIso) return { durum: 'tamamlandi', neden: `bitiş tarihi geçti (${trGun(i.bitis_tarihi)})`, sureGun }
  if (bas && sureGun && gunEkleIso(bas, sureGun) <= bugunIso) {
    return { durum: 'tamamlandi', neden: `planlanan süre (${sureGun} gün) ${trGun(gunEkleIso(bas, sureGun))} tarihinde doldu — aktif sayılmadı; kesildiğine / tamamlandığına dair ayrı kayıt yok`, sureGun }
  }
  if (bas && AKUT_ILAC.test(`${i.ilac_adi} ${i.etken_madde || ''}`) && gunFarkiIso(bas, bugunIso) > AKUT_ILAC_AKTIF_GUN) {
    return { durum: 'belirsiz', neden: `kısa süreli (akut) ilaç, ${gunFarkiIso(bas, bugunIso)} gün önce başlandı; hâlâ kullanıldığına dair güncel kayıt yok`, sureGun }
  }
  return { durum: 'aktif', neden: 'kayıtta aktif', sureGun }
}

// ─── Olaylar ─────────────────────────────────────────────────────────────────────────────────────────────
const VITAL_OLCUM: Record<string, string> = { kilo: 'kg', boy: 'cm', basCevresi: 'cm', ates: '°C', nabiz: '/dk', spo2: '%' }
const ALERJI_YOK = /^(yok|hayir|hayır|bilinen alerji yok|bilinen yok|-|none)$/i

/** Bir tarihteki (ya da öncesindeki en yakın) kilo. */
export function tarihtekiKilo(olaylar: DosyaOlayi[], tarihIso: string): { kilo: number; tarih: string } | null {
  let en: DosyaOlayi | null = null
  for (const o of olaylar) {
    if (o.tur !== 'kilo' || o.deger == null || o.tarih > gun(tarihIso)) continue
    if (!en || o.tarih >= en.tarih) en = o
  }
  return en ? { kilo: en.deger!, tarih: en.tarih } : null
}

export function olaylariKur(ham: HamDosya, bugunIso: string): DosyaOlayi[] {
  const o: DosyaOlayi[] = []
  const y = ham.intake || {}

  // İlk kayıt / hasta kartı: alerji, kronik, perinatal, anne-baba boyu.
  const itarih = gun(ham.intakeTarih) || gun(ham.vizitler[0]?.tarih) || bugunIso
  const alerji = String(y.alerjiAciklama || y.alerji || '').trim()
  if (alerji && !ALERJI_YOK.test(alerji) && !/^hay/i.test(String(y.alerjiVarMi || ''))) {
    o.push({ tarih: itarih, kaynak: 'intake', tur: 'alerji', durum: 'aktif', metin: `Alerji: ${kisalt(alerji, 160)}`, kaynakId: 'intake:alerji', guven: 'kayit' })
  }
  const kronikHam = y.kronikHastaliklar ?? y.kronik
  const kronik = Array.isArray(kronikHam) ? kronikHam.map(String).filter((s) => s.trim()).join(', ') : String(kronikHam || '').trim()
  if (kronik && !ALERJI_YOK.test(kronik)) o.push({ tarih: itarih, kaynak: 'intake', tur: 'kronik', durum: 'aktif', metin: `Kronik / özgeçmiş: ${kisalt(kronik, 200)}`, kaynakId: 'intake:kronik', guven: 'kayit' })
  const perinatal = [
    y.gebelikHaftasiPed || y.gebelikHaftasi ? `gebelik haftası ${y.gebelikHaftasiPed || y.gebelikHaftasi}` : '',
    y.dogumKilosuPed ? `doğum kilosu ${y.dogumKilosuPed}` : '',
    y.dogumBoyuPed ? `doğum boyu ${y.dogumBoyuPed}` : '',
    y.dogumSekliPed ? `doğum şekli ${y.dogumSekliPed}` : '',
    y.gebelikKomplikasyonuPed ? `gebelik komplikasyonu: ${y.gebelikKomplikasyonuPed}` : '',
    y.dogumSonrasiAciklamaPed || y.dogumSonrasiPed ? `doğum sonrası: ${y.dogumSonrasiAciklamaPed || y.dogumSonrasiPed}` : '',
  ].filter(Boolean)
  if (perinatal.length) o.push({ tarih: itarih, kaynak: 'intake', tur: 'perinatal', durum: 'belirsiz', metin: `Prenatal / natal (beyan): ${kisalt(perinatal.join('; '), 300)}`, kaynakId: 'intake:perinatal', guven: 'kayit', deger: sayi(y.gebelikHaftasiPed || y.gebelikHaftasi) ?? undefined })
  const anneBoy = sayi(y.anneBoyu ?? y.anneBoy), babaBoy = sayi(y.babaBoyu ?? y.babaBoy)
  if (anneBoy) o.push({ tarih: itarih, kaynak: 'intake', tur: 'anne-boy', durum: 'belirsiz', metin: `Anne boyu ${anneBoy} cm`, deger: anneBoy, birim: 'cm', kaynakId: 'intake:anne-boy', guven: 'kayit' })
  if (babaBoy) o.push({ tarih: itarih, kaynak: 'intake', tur: 'baba-boy', durum: 'belirsiz', metin: `Baba boyu ${babaBoy} cm`, deger: babaBoy, birim: 'cm', kaynakId: 'intake:baba-boy', guven: 'kayit' })

  // Ölçümler önce: reçetenin "o tarihteki kilo"su bunlardan bulunur.
  for (const v of ham.vizitler) {
    const vt = v.vitaller || {}
    for (const [k, birim] of Object.entries(VITAL_OLCUM)) {
      const d = sayi((vt as Record<string, unknown>)[k])
      if (d != null && d > 0) o.push({ tarih: gun(v.tarih), kaynak: 'olcum', tur: k, durum: 'sonuclandi', metin: `${k} ${d} ${birim}`, deger: d, birim, kaynakId: `${v.id}:${k}`, guven: 'kayit', vizitId: v.id })
    }
    const ta = (vt as Record<string, unknown>).tansiyon
    if (ta) o.push({ tarih: gun(v.tarih), kaynak: 'olcum', tur: 'tansiyon', durum: 'sonuclandi', metin: `tansiyon ${ta} mmHg`, kaynakId: `${v.id}:tansiyon`, guven: 'kayit', vizitId: v.id })
  }
  for (const c of ham.cihaz || []) {
    const d = sayi(c.deger)
    if (d == null) continue
    o.push({ tarih: gun(c.alindi), kaynak: 'cihaz', tur: c.tur, durum: 'sonuclandi', metin: `${c.tur} ${d} ${c.birim || ''} (cihaz)`.trim(), deger: d, birim: c.birim || undefined, kaynakId: c.id, guven: 'kayit' })
  }
  const kiloAt = (t: string) => tarihtekiKilo(o, t)

  // Vizitler + plan cümleleri + reçeteler.
  for (const v of ham.vizitler) {
    const t = gun(v.tarih)
    const icd = (v.icd || []).map((k) => [k.code, k.description_tr].filter(Boolean).join(' ')).filter(Boolean).join('; ')
    const parca = [
      v.subjektif ? `Şikayet/öykü: ${kisalt(v.subjektif, 300)}` : '',
      v.objektif ? `Bulgu: ${kisalt(v.objektif, 260)}` : '',
      v.degerlendirme ? `Değerlendirme: ${kisalt(v.degerlendirme, 220)}` : '',
      v.tani || icd ? `Tanı: ${kisalt([v.tani, icd].filter(Boolean).join(' — '), 200)}` : '',
      v.plan ? `Plan: ${kisalt(v.plan, 320)}` : '',
    ].filter(Boolean)
    o.push({ tarih: t, kaynak: 'not', tur: 'vizit', durum: 'tamamlandi', metin: parca.join(' | ') || 'Vizit (not içeriği yok)', kaynakId: v.id, guven: 'kayit', vizitId: v.id })

    for (const bolum of [v.plan, v.degerlendirme, v.subjektif]) {
      for (const p of planIfadeleriniCikar(bolum)) {
        o.push({
          tarih: t, kaynak: 'not', tur: p.konu, durum: p.durum, metin: p.cumle, kaynakId: `${v.id}:${p.konu}:${o.length}`, guven: 'metin', vizitId: v.id,
          anahtar: p.konu === 'asi' ? p.seri ?? null : p.konu === 'tarama' ? p.tarama ?? null : null,
          anahtarlar: p.labAnahtarlari, doz: p.doz ?? null,
        })
      }
      if (asiTamBeyaniMi(bolum)) {
        o.push({ tarih: t, kaynak: 'not', tur: 'asi-beyan', durum: 'belirsiz', metin: `Notta beyan: "aşıları tam" — ${kisalt(bolum, 160)}`, kaynakId: `${v.id}:asi-beyan`, guven: 'metin', vizitId: v.id })
      }
    }
    for (const r of v.ilaclar || []) {
      const ad = String(r?.ad || '').trim()
      if (!ad) continue
      const k = kiloAt(t)
      o.push({
        tarih: t, kaynak: 'ilac', tur: 'recete', durum: 'recete', metin: [ad, r.doz, r.kullanim].filter(Boolean).join(' — '),
        kaynakId: `${v.id}:recete:${ad}`, guven: 'kayit', vizitId: v.id, sureGun: sureGunCoz(r.kullanim, r.doz),
        ...(k ? { kilo: k.kilo, kiloTarihi: k.tarih } : {}),
      })
    }
  }

  for (const a of ham.asilar || []) {
    const ad = String(a.asi_adi || '').trim() || 'Aşı'
    const beyan = /beyan|karne|asm|dis|baska/i.test(String(a.kaynak || ''))
    o.push({
      tarih: gun(a.uygulama_tarihi) || '0000-00-00', kaynak: 'asi', tur: 'asi', durum: 'uygulandi',
      metin: `${ad}${a.doz_no ? ` ${a.doz_no}. doz` : ''}${beyan ? ' (karne / beyan kaydı)' : ''}${a.uygulama_tarihi ? '' : ' (tarihsiz)'}`,
      anahtar: kayitSerisi(ad), doz: a.doz_no ?? null, kaynakId: a.id, guven: 'kayit',
    })
  }

  for (const i of ham.ilaclar || []) {
    const d = ilacDurumu(i, bugunIso)
    const bas = gun(i.baslangic_tarihi || i.created_at) || bugunIso
    const k = kiloAt(bas)
    o.push({
      tarih: bas, kaynak: 'ilac', tur: 'ilac', durum: d.durum,
      metin: `${[i.ilac_adi, i.doz, i.kullanim_sikli].filter(Boolean).join(' — ')} [${d.neden}]`,
      kaynakId: i.id, guven: 'kayit', sureGun: d.sureGun, etken: i.etken_madde || null,
      ...(k ? { kilo: k.kilo, kiloTarihi: k.tarih } : {}),
    })
  }

  for (const l of ham.lablar || []) {
    const deger = l.kanonik_deger != null ? Number(l.kanonik_deger) : sayi(l.value_text)
    const birim = l.kanonik_birim || ''
    o.push({
      tarih: gun(l.numune_tarihi) || '0000-00-00', kaynak: 'lab', tur: 'lab', durum: 'sonuclandi',
      metin: `${kanonikTr(l.canonical_key)}: ${deger != null ? deger.toLocaleString('tr-TR', { maximumFractionDigits: 2 }) : l.value_text ?? '?'} ${birim}`.trim(),
      anahtar: l.canonical_key, kaynakId: l.id, guven: 'kayit', refAlt: l.ref_low ?? null, refUst: l.ref_high ?? null,
      ...(deger != null ? { deger } : {}), ...(birim ? { birim } : {}),
    })
  }

  for (const r of ham.randevular || []) {
    const t = gun(r.baslangic)
    const durum: OlayDurumu = r.durum === 'iptal' ? 'belirsiz' : t >= bugunIso ? 'randevu' : r.durum === 'tamamlandi' ? 'tamamlandi' : 'belirsiz'
    if (r.durum === 'iptal') continue
    o.push({ tarih: t, kaynak: 'randevu', tur: 'randevu', durum, metin: `Randevu${r.tur ? ` — ${r.tur}` : ''}${r.durum === 'gelmedi' ? ' (gelmedi)' : durum === 'belirsiz' ? ' (geldiğine dair randevu kaydı yok)' : ''}`, kaynakId: r.id, guven: 'kayit' })
  }

  for (const s of ham.sevkler || []) {
    const d = String(s.durum || 'acik')
    const durum: OlayDurumu = d === 'yanitlandi' ? 'sonuclandi' : d === 'kapandi' ? 'tamamlandi' : d === 'kapandi_yanitsiz' ? 'belirsiz' : 'istendi'
    o.push({
      tarih: gun(s.istem_tarihi || s.created_at), kaynak: 'konsultasyon', tur: 'konsultasyon', durum,
      metin: `Konsültasyon: ${s.hedef_brans || s.hedef || '?'}${s.klinik_soru ? ` — soru: ${kisalt(s.klinik_soru, 160)}` : ''}${s.yanit_ozeti ? ` — yanıt (${trGun(s.yanit_tarihi)}): ${kisalt(s.yanit_ozeti, 200)}` : ''}`,
      anahtar: s.hedef_brans || s.hedef || null, kaynakId: s.id, guven: 'kayit',
    })
  }

  for (const m of ham.mchat || []) {
    o.push({ tarih: gun(m.created_at), kaynak: 'olcum', tur: 'tarama', anahtar: 'mchat', durum: 'sonuclandi', metin: `M-CHAT-R/F: ${m.risk_seviyesi} risk${m.toplam_puan != null ? ` (puan ${m.toplam_puan})` : ''}`, kaynakId: m.id, guven: 'kayit' })
  }
  for (const g of ham.gidr || []) {
    o.push({ tarih: gun(g.created_at), kaynak: 'olcum', tur: 'tarama', anahtar: 'gidr', durum: 'sonuclandi', metin: `GİDR${g.yas_basamak_etiket ? ` (${g.yas_basamak_etiket})` : ''}: ${g.sevk_onerisi ? 'ileri değerlendirme / sevk önerildi' : 'sevk önerilmedi'}`, kaynakId: g.id, guven: 'kayit' })
  }
  for (const t of ham.taramalar || []) {
    o.push({ tarih: gun(t.tarih), kaynak: 'olcum', tur: 'tarama', anahtar: t.tur === 'otizm' ? 'otizm' : t.tur, durum: 'sonuclandi', metin: `Tarama (${t.tur}): ${t.sonuc.replace('_', ' ')}${t.not_metni ? ` — ${kisalt(t.not_metni, 120)}` : ''}`, kaynakId: t.id, guven: 'kayit' })
  }
  for (const b of ham.belgeler || []) {
    o.push({ tarih: gun(b.onaylandi_at) || bugunIso, kaynak: 'belge', tur: b.modality_final || 'belge', durum: 'sonuclandi', metin: `Belge (${b.modality_final || '?'}): ${kisalt(b.hekim_ozet, 220)}`, kaynakId: b.id, guven: 'kayit' })
  }

  return o.sort((a, b) => a.tarih.localeCompare(b.tarih))
}

export function hastaKur(ham: HamDosya, bugunIso: string): DosyaHastasi {
  const c = trAramaNormalize(ham.hasta.cinsiyet)
  return {
    ad: ham.hasta.ad,
    dogumIso: gun(ham.hasta.dogumIso) || null,
    cinsiyet: /^(erk|male|e$|m$)/.test(c) ? 'male' : /^(kad|kiz|female|k$|f$)/.test(c) ? 'female' : null,
    brans: ham.brans,
    bugunIso,
  }
}

// ─── Okumalar ────────────────────────────────────────────────────────────────────────────────────────────
function coz(v: string | null | undefined): string {
  if (!v) return ''
  try { return decrypt(v) } catch { return '' }
}

/** Kimlik / iletişim anahtarları okunmaz (hastaDosyaDerleyici ile aynı ilke). */
const KIMLIK = /^(tcKimlik|ad|soyad|telefon|eposta|adres|acilKisi|policeNo|kurumAdi|veli|anneAdi|babaAdi|dogumYeri|sehir|anneId|anneGebelikId)/

export function bugunTRTIso(now = new Date()): string {
  return new Date(now.getTime() + 3 * 3600_000).toISOString().slice(0, 10)
}

/**
 * HASTA-IZOLASYON-01: hasta `doctor_id` ile okunur; yoksa null (yabancı id = yok). Tüm çocuk okumalar hasta + doktor
 * kolonuyla süzülür. Tablo henüz yoksa (ör. sevkler eski ortamda) o kaynak boş kalır — dosya yine derlenir.
 */
export async function dosyaSorguHamDerle(sb: SupabaseClient, doktorId: string, patientId: string): Promise<HamDosya | null> {
  const { data: hasta } = await sb.from('patients').select('*').eq('id', patientId).eq('doctor_id', doktorId).maybeSingle()
  if (!hasta) return null
  const h = hasta as Record<string, string | null>
  const bos = { data: [] as unknown[] }
  const yut = <T,>(p: PromiseLike<T>) => Promise.resolve(p).catch(() => bos as unknown as T)
  const [seansQ, ilacQ, asiQ, intakeQ, labQ, randevuQ, sevkQ, mchatQ, gidrQ, taramaQ, cihazQ, belgeQ, hekimQ] = await Promise.all([
    yut(arsivsizSeanslar(sb, 'id, created_at').eq('patient_id', patientId).eq('doctor_id', doktorId).order('created_at', { ascending: true })),
    yut(arsivsizIlaclar(sb, 'id, ilac_adi, etken_madde, doz, kullanim_sikli, baslangic_tarihi, bitis_tarihi, aktif, notlar, created_at').eq('patient_id', patientId).eq('doctor_id', doktorId)),
    yut(arsivsizAsilar(sb, 'id, asi_adi, doz_no, uygulama_tarihi, kaynak').eq('patient_id', patientId).eq('doktor_id', doktorId)),
    yut(sb.from('hasta_intake_formlari').select('form_data_encrypted, created_at').eq('patient_id', patientId).eq('doktor_id', doktorId).order('created_at', { ascending: false }).limit(1)),
    yut(sb.from('lab_satirlar').select('id, canonical_key, kanonik_deger, kanonik_birim, value_text, numune_tarihi, ref_low, ref_high').eq('patient_id', patientId).eq('doctor_id', doktorId).eq('onayli', true).not('canonical_key', 'is', null).order('numune_tarihi', { ascending: true }).limit(300)),
    yut(sb.from('randevular').select('id, baslangic, tur, durum').eq('patient_id', patientId).eq('doktor_id', doktorId).order('baslangic', { ascending: true }).limit(60)),
    yut(sb.from('sevkler').select('id, hedef, hedef_brans, klinik_soru, durum, istem_tarihi, yanit_tarihi, yanit_ozeti, created_at').eq('patient_id', patientId).eq('doctor_id', doktorId).limit(60)),
    yut(sb.from('mchat_testleri').select('id, created_at, risk_seviyesi, toplam_puan').eq('patient_id', patientId).eq('doctor_id', doktorId)),
    yut(sb.from('gelisim_taramalari').select('id, created_at, ay_yas, yas_basamak_etiket, sevk_onerisi').eq('patient_id', patientId).eq('doctor_id', doktorId)),
    yut(sb.from('pedi_taramalar').select('id, tur, tarih, sonuc, not_metni').eq('patient_id', patientId).eq('doctor_id', doktorId)),
    yut(sb.from('cihaz_olcumleri').select('id, tur, deger, birim, alindi').eq('patient_id', patientId).eq('doctor_id', doktorId).eq('onaylandi', true).limit(60)),
    yut(sb.from('belge_analizleri').select('id, modality_final, hekim_ozet, onaylandi_at').eq('patient_id', patientId).eq('doctor_id', doktorId).in('durum', ['onaylandi', 'muayene_onaylandi']).limit(20)),
    yut(sb.from('users').select('specialty').eq('id', doktorId).maybeSingle()),
  ])

  const seanslar = ((seansQ as { data: unknown[] | null }).data || []) as { id: string; created_at: string }[]
  let notlar: Record<string, unknown>[] = []
  if (seanslar.length) {
    const { data } = await yut(arsivsizNotlar(sb, 'session_id, created_at, approved_at, content_subjektif, content_objektif, content_degerlendirme, content_plan, content_tani, icd10_codes, content_ilaclar, vitaller')
      .eq('doctor_id', doktorId).in('session_id', seanslar.map((s) => s.id)).not('approved_at', 'is', null))
    notlar = (data || []) as Record<string, unknown>[]
  }
  const notHarita = new Map(notlar.map((n) => [String(n.session_id), n]))
  const vizitler: HamVizit[] = []
  for (const s of seanslar) {
    const n = notHarita.get(String(s.id))
    if (!n) continue
    vizitler.push({
      id: String(s.id), tarih: String(s.created_at),
      subjektif: n.content_subjektif as string, objektif: n.content_objektif as string, degerlendirme: n.content_degerlendirme as string,
      plan: n.content_plan as string, tani: n.content_tani as string,
      icd: Array.isArray(n.icd10_codes) ? n.icd10_codes as HamVizit['icd'] : null,
      ilaclar: Array.isArray(n.content_ilaclar) ? (n.content_ilaclar as unknown[]).map((x) => (typeof x === 'string' ? { ad: x } : x as { ad?: string })) : null,
      vitaller: n.vitaller && typeof n.vitaller === 'object' ? n.vitaller as Record<string, unknown> : null,
    })
  }

  let intake: Record<string, unknown> = {}
  const intakeSatir = ((intakeQ as { data: unknown[] | null }).data || [])[0] as { form_data_encrypted?: string; created_at?: string } | undefined
  if (intakeSatir?.form_data_encrypted) {
    try { intake = JSON.parse(decrypt(intakeSatir.form_data_encrypted)) as Record<string, unknown> } catch { intake = {} }
  }
  // patients.notes_encrypted: hasta kartı JSON'u (kan grubu, kronik, alerji…) — formda yoksa buradan.
  const kartNotu = coz(h.notes_encrypted)
  if (kartNotu.trim().startsWith('{')) {
    try {
      for (const [k, v] of Object.entries(JSON.parse(kartNotu) as Record<string, unknown>)) if (intake[k] == null || intake[k] === '') intake[k] = v
    } catch { /* düz metin not — okunmaz */ }
  }
  for (const k of Object.keys(intake)) if (KIMLIK.test(k)) delete intake[k]

  const veri = <T,>(q: unknown) => (((q as { data: unknown }).data || []) as T[])
  return {
    hasta: { ad: hastaAdiCoz(h.name_encrypted), dogumIso: coz(h.dob_encrypted) || null, cinsiyet: coz(h.gender_encrypted) || null },
    brans: ((hekimQ as { data: { specialty?: string } | null }).data?.specialty) || null,
    intake, intakeTarih: intakeSatir?.created_at || null,
    vizitler,
    asilar: veri(asiQ), ilaclar: veri(ilacQ), lablar: veri(labQ), randevular: veri(randevuQ), sevkler: veri(sevkQ),
    mchat: veri(mchatQ), gidr: veri(gidrQ), taramalar: veri(taramaQ), cihaz: veri(cihazQ), belgeler: veri(belgeQ),
  }
}

export async function dosyaSorguVerisiDerle(
  sb: SupabaseClient, doktorId: string, patientId: string, bugunIso = bugunTRTIso(),
): Promise<{ hasta: DosyaHastasi; olaylar: DosyaOlayi[] } | null> {
  const ham = await dosyaSorguHamDerle(sb, doktorId, patientId)
  if (!ham) return null
  return { hasta: hastaKur(ham, bugunIso), olaylar: olaylariKur(ham, bugunIso) }
}

/** Brief imzası: hastanın olay dizini (doktora kapsanmış). Yabancı / bulunmayan hasta → boş liste. */
export async function hastaOlaylariniDerle(sb: SupabaseClient, doktorId: string, patientId: string): Promise<DosyaOlayi[]> {
  return (await dosyaSorguVerisiDerle(sb, doktorId, patientId))?.olaylar ?? []
}
