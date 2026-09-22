/**
 * GOZ-EXCEPTIONAL-01 — /api/doktor/goz ek adımları (route.ts yalnız handler export edebilir). HER fonksiyon route.ts'te hasta()
 * sahiplik kontrolünden SONRA çağrılır: `h.id` hekime aittir; satır kimlikleri ayrıca doctor_id ile daraltılır.
 * Hekim kilitleri: evre / tanı / GİL gücü / doz üretilmez; motorlar doğrular, metin yazar, görev açar.
 *
 * POST adim: serit_nota | fundus_dr | lazer | biyomikroskopi | keratokonus | on_segment_nota | katarakt_postop | katarakt_nota
 *            | rop | acil_kayit | acil_nota | oct_olcum | hatirlatma
 *            + goruntu_okuma eylem belge_taslak | asistana_raporla (gozGoruntuKopru)
 */
import { NextResponse } from 'next/server'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { fundusBosMu, fundusNormalize, type FundusKayit } from '@/specialties/goz-hastaliklari/engines/fundus'
import { biyoNormalize, biyoMetni, keratokonusNormalize, keratokonusMetni, seritNotaMetni, type Biyomikroskopi, type Keratokonus, type OlcumSatiri } from '@/specialties/goz-hastaliklari/engines/muayene'
import { fundusDrGecisi, lazerDogrula, lazerNotaMetni, lazerOzeti, type Lazer } from '@/specialties/goz-hastaliklari/engines/dr'
import { postopNormalize, postopUyarilari, postopMetni, biyometriMetni, type PostopZaman, type Biyometri, type PostopKayit } from '@/specialties/goz-hastaliklari/engines/katarakt'
import { ropDogrula, ropMetni, ropTaramaEndikasyonu, pediatrikGorunum, type RopKayit } from '@/specialties/goz-hastaliklari/engines/rop'
import { yikamaDakika, ACIL_EYLEM_LISTESI, type AcilKod } from '@/specialties/goz-hastaliklari/engines/acil'
import { GLOKOM_ARALIK_ONERILERI, GLOKOM_ONERI_ETIKETI, SHAFFER_AD } from '@/specialties/goz-hastaliklari/engines/glokom'
import { IVT_KONTROL } from '@/specialties/goz-hastaliklari/engines/antiVegf'
import { gozKohortVerisi, type Sb } from './_kohort'
import { gozHatirlatmaGonder } from './_kohortHatirlatma'
import Anthropic from '@anthropic-ai/sdk'
import { tierAYazVeFuzyonla } from '@/core/belgeler/tierA'
import { bransKurali } from '@/core/belgeler/router'
import type { BelgeRaporu } from '@/core/belgeler/types'
import { belgeModaliteGoz, gozModaliteBelge, guvenUst, kopruGozDogrula, analizKopruyeUygun, belgeTaslakMetni } from '@/specialties/goz-hastaliklari/imaging/belgeKopru'
import { GOZ_GORUNTU_DISCLAIMER, taslakTaniDiliUyarisi } from '@/specialties/goz-hastaliklari/imaging/dualSign'
import { normalizeModalite, gozBolgeCoz } from '@/specialties/goz-hastaliklari/engines/kiyas'
import { ayseGoruntuTaslagi } from '@/specialties/goz-hastaliklari/engines/ayseGoruntu'

type Ctx = { sb: Sb; doktorId: string; h: { id: string; yasAy: number | null; dobIso: string | null }; b: Record<string, unknown>; T: string }
const hata = (m: string, s = 400) => NextResponse.json({ error: m }, { status: s })
const tarihMi = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
const num = (v: unknown) => (v == null || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null)
type EkRow = { id: string; tarih: string; ek: Record<string, unknown> | null }

/** Aynı günün son muayene satırının ek'ine yazar (yoksa yeni satır). fundus kaydıyla aynı desen. */
async function ekYaz(c: Ctx, tarih: string, anahtar: string, deger: unknown) {
  const { data: son } = await c.sb.from('goz_muayeneler').select('id, ek').eq('patient_id', c.h.id).eq('doctor_id', c.doktorId).eq('tarih', tarih).order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (son?.id) {
    const once = (son.ek && typeof son.ek === 'object' ? son.ek : {}) as Record<string, unknown>
    const { error } = await c.sb.from('goz_muayeneler').update({ ek: { ...once, [anahtar]: deger } }).eq('id', son.id).eq('doctor_id', c.doktorId)
    return error ? error.message : null
  }
  const { error } = await c.sb.from('goz_muayeneler').insert({ patient_id: c.h.id, doctor_id: c.doktorId, tarih, va: {}, ek: { [anahtar]: deger }, kaynak: 'hekim' })
  return error ? error.message : null
}

async function sonEk<T>(c: Ctx, anahtar: string): Promise<T | null> {
  const { data } = await c.sb.from('goz_muayeneler').select('id, tarih, ek').eq('patient_id', c.h.id).eq('doctor_id', c.doktorId).order('tarih', { ascending: false }).order('created_at', { ascending: false }).limit(30)
  for (const r of (data || []) as EkRow[]) { const v = r.ek?.[anahtar]; if (v && typeof v === 'object') return v as T }
  return null
}

const nota = async (c: Ctx, satir: string, alan: 'content_objektif' | 'content_subjektif' = 'content_objektif') => {
  const r = await gununNotunaEkle(c.sb, c.doktorId, c.h.id, satir, alan)
  return NextResponse.json({ ok: r.eklendi, sebep: r.sebep, satir, notId: r.eklendi ? r.notId : null })
}

export async function gozEkAdim(adim: string, c: Ctx): Promise<NextResponse | null> {
  const { sb, doktorId, h, b, T } = c
  const ortak = { patient_id: h.id, doctor_id: doktorId }

  if (adim === 'serit_nota') {
    const { data: rows } = await sb.from('goz_muayeneler').select('tarih, va, gib_sag, gib_sol, gib_yontem, rapd, ek').eq('patient_id', h.id).eq('doctor_id', doktorId).order('tarih', { ascending: false }).order('created_at', { ascending: false }).limit(30)
    const liste = (rows || []) as OlcumSatiri[]
    const sonOlcum = liste.find((m) => (m.va && ((m.va as Record<string, unknown>).sag || (m.va as Record<string, unknown>).sol)) || m.gib_sag != null || m.gib_sol != null) || null
    let sonFundus: FundusKayit | null = null
    for (const r of liste) { const f = (r.ek as { fundus?: FundusKayit } | null)?.fundus; if (f && !fundusBosMu(fundusNormalize(f))) { sonFundus = fundusNormalize(f); break } }
    const satir = seritNotaMetni({ sonOlcum, sonFundus })
    if (!satir) return hata('Şeritte yazılacak ölçüm veya göz dibi kaydı yok.')
    return nota(c, satir)
  }

  if (adim === 'fundus_dr') {
    const g = fundusDrGecisi({ hekimOnay: b.hekimOnay, evreSag: b.evreSag, evreSol: b.evreSol, dmoSag: b.dmoSag, dmoSol: b.dmoSol, fundusTarihi: b.fundusTarihi })
    if (!g.ok) return hata(g.hata)
    const { data: once } = await sb.from('goz_dr').select('id').eq('patient_id', h.id).eq('doctor_id', doktorId).maybeSingle()
    const alanlar = { evre_sag: g.evreSag, evre_sol: g.evreSol, dmo_sag: g.dmoSag, dmo_sol: g.dmoSol, son_fundus: g.sonFundus, updated_at: new Date().toISOString() }
    const { error } = once
      ? await sb.from('goz_dr').update(alanlar).eq('id', once.id).eq('doctor_id', doktorId)
      : await sb.from('goz_dr').insert({ ...ortak, ...alanlar })
    if (error) return hata(error.message, 500)
    await sb.from('goz_gorevler').update({ durum: 'tamam', tamam_at: new Date().toISOString() }).eq('patient_id', h.id).eq('doctor_id', doktorId).eq('kod', 'dr_tarama').eq('durum', 'acik')
    return NextResponse.json({ ok: true, kaynak: 'hekim_fundus' })
  }

  if (adim === 'lazer') {
    const v = lazerDogrula(b)
    if (!v.ok) return hata(v.hata)
    const l = v.lazer
    let hekimAdi = l.hekimAdi
    if (!hekimAdi) { const { data: u } = await sb.from('users').select('full_name').eq('id', doktorId).maybeSingle(); hekimAdi = (u?.full_name as string) || null }
    let kontrolId: string | null = null
    if (l.kontrolTarihi) {
      const { data: k, error: ke } = await sb.from('goz_kontroller').insert({ ...ortak, tarih: l.kontrolTarihi, neden: `Lazer sonrası kontrol (${l.goz === 'sag' ? 'OD' : 'OS'})`, dilatasyon: true }).select('id').single()
      if (ke) return hata(ke.message, 500)
      kontrolId = k.id
    }
    const { error } = await sb.from('goz_lazerler').insert({ ...ortak, goz: l.goz, tip: l.tip, tarih: l.tarih, seans_no: l.seansNo, hekim_adi: hekimAdi, not_hekim: l.not, kontrol_id: kontrolId })
    if (error) return hata(error.message, 500)
    if (b.notaEkle === true) return nota(c, lazerNotaMetni({ ...l, hekimAdi }))
    return NextResponse.json({ ok: true, kontrolId })
  }

  if (adim === 'biyomikroskopi' || adim === 'keratokonus') {
    const tarih = tarihMi(b.tarih) ? b.tarih : T
    if (adim === 'biyomikroskopi') {
      const bio = biyoNormalize(b.biyomikroskopi as Record<string, unknown>)
      if (!bio) return hata('En az bir göz için biyomikroskopi alanı girin veya «her iki göz doğal» kullanın.')
      const e = await ekYaz(c, tarih, 'biyomikroskopi', bio)
      return e ? hata(e, 500) : NextResponse.json({ ok: true, metin: biyoMetni(bio) })
    }
    const k = keratokonusNormalize(b.keratokonus as Record<string, unknown>)
    if (k.hatalar.length) return hata(k.hatalar.join('; '))
    if (!k.keratokonus) return hata('Topografi notu, Kmax veya CXL tarihi girin.')
    const e = await ekYaz(c, tarih, 'keratokonus', k.keratokonus)
    return e ? hata(e, 500) : NextResponse.json({ ok: true, metin: keratokonusMetni(k.keratokonus) })
  }

  if (adim === 'on_segment_nota') {
    const bio = await sonEk<Biyomikroskopi>(c, 'biyomikroskopi'), ker = await sonEk<Keratokonus>(c, 'keratokonus')
    const satir = [biyoMetni(bio), ker ? keratokonusMetni(ker) : null].filter(Boolean).join(' ')
    if (!satir) return hata('Kayıtlı biyomikroskopi / keratokonus bulgusu yok.')
    return nota(c, satir)
  }

  if (adim === 'katarakt_postop' || adim === 'katarakt_nota') {
    const { data: k } = await sb.from('goz_katarakt').select('id, goz, biyometri, postop, gil_tipi_hekim, ek3g_kod').eq('id', String(b.id || '')).eq('patient_id', h.id).eq('doctor_id', doktorId).maybeSingle()
    if (!k) return hata('Katarakt kaydı bulunamadı.', 404)
    const gozAd = k.goz === 'sol' ? 'Sol göz' : 'Sağ göz'
    const postop = ((k.postop && typeof k.postop === 'object') ? k.postop : {}) as Partial<Record<PostopZaman, PostopKayit>>
    if (adim === 'katarakt_postop') {
      const zaman = b.zaman === 'hafta1' ? 'hafta1' : b.zaman === 'gun1' ? 'gun1' : null
      if (!zaman) return hata('Post-op zamanı seçin (1. gün / 1. hafta).')
      const kayit = postopNormalize(b.kayit as Record<string, unknown>)
      if (!kayit.va && kayit.gib == null && !kayit.kornea && !kayit.endoftalmiBayrak && !kayit.not) return hata('En az bir post-op alanı girin.')
      const yeni = { ...postop, [zaman]: kayit }
      const { error } = await sb.from('goz_katarakt').update({ postop: yeni, durum: 'yapildi', updated_at: new Date().toISOString() }).eq('id', k.id).eq('doctor_id', doktorId)
      if (error) return hata(error.message, 500)
      return NextResponse.json({ ok: true, uyarilar: postopUyarilari(yeni).acil })
    }
    const satirlar = [biyometriMetni(k.biyometri as Biyometri | null, gozAd), ...(['gun1', 'hafta1'] as const).filter((z) => postop[z]).map((z) => postopMetni(z, postop[z]!, gozAd))]
    return nota(c, satirlar.join(' '))
  }

  if (adim === 'rop') {
    if (h.yasAy != null && h.yasAy >= 216) return hata('ROP kartı erişkin hastada açılmaz.')
    const v = ropDogrula(b, h.dobIso)
    if (!v.ok) return hata(v.hata)
    const k = v.kayit
    const { error } = await sb.from('goz_rop_taramalari').insert({ ...ortak, tarih: k.tarih, dogum_haftasi: k.dogumHaftasi, dogum_agirligi_g: k.dogumAgirligiG, pma_hafta: k.pmaHafta, zon_sag: k.zonSag, zon_sol: k.zonSol, evre_sag: k.evreSag, evre_sol: k.evreSol, plus_sag: k.plusSag, plus_sol: k.plusSol, sonraki_tarama: k.sonrakiTarama, not_hekim: k.not })
    if (error) return hata(error.message, 500)
    if (k.sonrakiTarama) await sb.from('goz_kontroller').insert({ ...ortak, tarih: k.sonrakiTarama, neden: 'ROP tarama kontrolü', dilatasyon: true })
    if (b.notaEkle === true) return nota(c, ropMetni(k))
    return NextResponse.json({ ok: true, uyarilar: v.uyarilar })
  }

  if (adim === 'acil_kayit') {
    const eylem = String(b.eylem || '')
    if (eylem === 'baslat') {
      const { data, error } = await sb.from('goz_acil_kayitlari').insert({ ...ortak, tip: 'kimyasal_yikama', baslangic: new Date().toISOString(), ph_once: b.phOnce ? String(b.phOnce).slice(0, 10) : null }).select('id, baslangic').single()
      if (error) return hata(error.message, 500)
      return NextResponse.json({ ok: true, id: data.id, baslangic: data.baslangic })
    }
    const { data: r } = await sb.from('goz_acil_kayitlari').select('id, baslangic, bitis, kontrol, va').eq('id', String(b.id || '')).eq('patient_id', h.id).eq('doctor_id', doktorId).maybeSingle()
    if (!r) return hata('Acil kaydı bulunamadı.', 404)
    const g: Record<string, unknown> = {}
    if (eylem === 'bitir') { if (r.bitis) return hata('Yıkama zaten bitirildi.'); const bitis = new Date().toISOString(); g.bitis = bitis; g.dakika = yikamaDakika(String(r.baslangic), bitis) }
    else if (eylem !== 'kaydet') return hata('Bilinmeyen acil eylemi.')
    if (b.phSonra != null) g.ph_sonra = String(b.phSonra).slice(0, 10) || null
    if (b.phOnce != null) g.ph_once = String(b.phOnce).slice(0, 10) || null
    if (b.va && typeof b.va === 'object') { const v = b.va as Record<string, unknown>; g.va = { sag: v.sag ? String(v.sag).slice(0, 20) : null, sol: v.sol ? String(v.sol).slice(0, 20) : null, saat: typeof v.saat === 'string' ? v.saat.slice(0, 5) : null } }
    if (b.kontrol && typeof b.kontrol === 'object') g.kontrol = Object.fromEntries(Object.entries(b.kontrol as Record<string, unknown>).slice(0, 12).map(([k, v]) => [k.slice(0, 120), v === true]))
    if (b.notHekim != null) g.not_hekim = String(b.notHekim).slice(0, 300) || null
    const { error } = await sb.from('goz_acil_kayitlari').update(g).eq('id', r.id).eq('doctor_id', doktorId)
    if (error) return hata(error.message, 500)
    return NextResponse.json({ ok: true, dakika: g.dakika ?? null })
  }

  if (adim === 'acil_nota') {
    const { data: r } = await sb.from('goz_acil_kayitlari').select('baslangic, bitis, dakika, ph_once, ph_sonra, va, kontrol').eq('id', String(b.id || '')).eq('patient_id', h.id).eq('doctor_id', doktorId).maybeSingle()
    if (!r) return hata('Acil kaydı bulunamadı.', 404)
    const saat = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }) : '—')
    const va = (r.va || {}) as { sag?: string | null; sol?: string | null; saat?: string | null }
    const yapilan = Object.entries((r.kontrol || {}) as Record<string, boolean>).filter(([, v]) => v).map(([k]) => k)
    const satir = `Kimyasal temas — göz yıkaması ${saat(r.baslangic)}–${saat(r.bitis)}${r.dakika != null ? ` (${String(r.dakika).replace('.', ',')} dk)` : ' (devam ediyor)'}${r.ph_once || r.ph_sonra ? `; pH önce ${r.ph_once || '—'} / sonra ${r.ph_sonra || '—'}` : ''}${va.sag || va.sol ? `; VA${va.saat ? ` (${va.saat})` : ''} OD ${va.sag || '—'}, OS ${va.sol || '—'}` : ''}.${yapilan.length ? ` Yapılanlar: ${yapilan.join('; ')}.` : ''}`
    return nota(c, satir)
  }

  if (adim === 'oct_olcum') {
    const { data: img } = await sb.from('hasta_goruntulemeler').select('id, modalite, vucut_bolgesi').eq('id', String(b.goruntuId || '')).eq('patient_id', h.id).eq('doctor_id', doktorId).maybeSingle()
    if (!img) return hata('Görüntü bulunamadı.', 404)
    if (String(img.modalite) !== 'oct') return hata('Kalınlık yalnız OCT görüntüsüne girilir.')
    const mfk = num(b.mfkMikron), rnfl = num(b.rnflMikron)
    if (mfk != null && (!Number.isInteger(mfk) || mfk < 50 || mfk > 1500)) return hata('MFK 50–1500 µm tam sayı olmalı.')
    if (rnfl != null && (!Number.isInteger(rnfl) || rnfl < 20 || rnfl > 250)) return hata('RNFL 20–250 µm tam sayı olmalı.')
    if (mfk == null && rnfl == null) return hata('MFK veya RNFL kalınlığı girin.')
    const goz = b.goz === 'sag' || b.goz === 'sol' ? b.goz : null
    if (!goz) return hata('Göz seçin (OD / OS) — kalınlık göz başına girilir.')
    const satir = { ...ortak, goruntu_id: img.id, goz, mfk_mikron: mfk, rnfl_mikron: rnfl, not_hekim: b.notHekim ? String(b.notHekim).slice(0, 200) : null }
    const { data: once } = await sb.from('goz_oct_olcumleri').select('id').eq('goruntu_id', img.id).eq('doctor_id', doktorId).maybeSingle()
    const { error } = once ? await sb.from('goz_oct_olcumleri').update(satir).eq('id', once.id).eq('doctor_id', doktorId) : await sb.from('goz_oct_olcumleri').insert(satir)
    if (error) return hata(error.message, 500)
    return NextResponse.json({ ok: true })
  }

  if (adim === 'hatirlatma') {
    const { satirlar } = await gozKohortVerisi(sb, doktorId, T, [h.id])
    const s = satirlar[0]
    if (!s) return hata('Bu hastada geciken göz takibi yok — hatırlatma gerekmiyor.')
    const r = await gozHatirlatmaGonder(sb, doktorId, h.id, s.bayraklar, T)
    if (r === 'yakin') return hata('Son 7 gün içinde hatırlatma gönderilmiş.')
    if (r === 'hata') return hata('Hatırlatma gönderilemedi.', 500)
    return NextResponse.json({ ok: true, bayraklar: s.bayraklar })
  }

  return null
}

/** GET ek verisi — hasta() geçtikten sonra; tüm okumalar patient_id + doctor_id. */
export async function gozEkVeri(sb: Sb, doktorId: string, h: { id: string; yasAy: number | null }, T: string, ped: Record<string, unknown> | null) {
  const [lzQ, ropQ, acilQ, octQ] = await Promise.all([
    sb.from('goz_lazerler').select('id, goz, tip, tarih, seans_no, hekim_adi, not_hekim, kontrol_id').eq('patient_id', h.id).eq('doctor_id', doktorId).order('tarih', { ascending: false }).limit(60),
    sb.from('goz_rop_taramalari').select('*').eq('patient_id', h.id).eq('doctor_id', doktorId).order('tarih', { ascending: false }).limit(20),
    sb.from('goz_acil_kayitlari').select('id, tip, baslangic, bitis, dakika, ph_once, ph_sonra, va, kontrol, not_hekim, created_at').eq('patient_id', h.id).eq('doctor_id', doktorId).order('created_at', { ascending: false }).limit(10),
    sb.from('goz_oct_olcumleri').select('goruntu_id, goz, mfk_mikron, rnfl_mikron, not_hekim').eq('patient_id', h.id).eq('doctor_id', doktorId).limit(200),
  ])
  const lazerler: Lazer[] = (lzQ.data || []).map((l) => ({ id: l.id, goz: l.goz, tip: l.tip, tarih: l.tarih, seansNo: l.seans_no, hekimAdi: l.hekim_adi, not: l.not_hekim }))
  const rop = (ropQ.data || []).map((r) => ({ id: r.id as string, kayit: { tarih: r.tarih, dogumHaftasi: num(r.dogum_haftasi), dogumAgirligiG: num(r.dogum_agirligi_g), pmaHafta: num(r.pma_hafta), zonSag: r.zon_sag, zonSol: r.zon_sol, evreSag: r.evre_sag, evreSol: r.evre_sol, plusSag: r.plus_sag, plusSol: r.plus_sol, sonrakiTarama: r.sonraki_tarama, not: r.not_hekim } as RopKayit }))
  const gorunum = pediatrikGorunum({ yasAy: h.yasAy, pedVeriVar: !!ped, ropVeriVar: rop.length > 0 })
  const sonRop = rop[0]?.kayit
  const { satirlar } = await gozKohortVerisi(sb, doktorId, T, [h.id])
  const { data: sonHat } = await sb.from('hasta_mesaj_konulari').select('son_mesaj_at').eq('doctor_id', doktorId).eq('patient_id', h.id).eq('konu', 'Göz kontrol hatırlatması').order('son_mesaj_at', { ascending: false }).limit(1).maybeSingle()
  return {
    lazerler, lazerOzeti: lazerOzeti(lazerler),
    rop: rop.map((r) => ({ id: r.id, ...r.kayit, metin: ropMetni(r.kayit) })),
    ropEndikasyon: sonRop ? ropTaramaEndikasyonu(sonRop.dogumHaftasi, sonRop.dogumAgirligiG) : null,
    pediatrikGorunum: gorunum,
    acilKayitlari: (acilQ.data || []).map((a) => ({ ...a, canliDakika: a.bitis ? num(a.dakika) : yikamaDakika(a.baslangic, null) })),
    acilEylemListesi: ACIL_EYLEM_LISTESI as Record<AcilKod, string[]>,
    octOlcumleri: octQ.data || [],
    glokomOnerileri: GLOKOM_ARALIK_ONERILERI, glokomOneriEtiketi: GLOKOM_ONERI_ETIKETI, shafferAd: SHAFFER_AD,
    ivtKontrol: IVT_KONTROL,
    hatirlatma: { bayraklar: satirlar[0]?.bayraklar || [], detay: satirlar[0]?.detay || [], sonGonderim: sonHat?.son_mesaj_at ? String(sonHat.son_mesaj_at).slice(0, 10) : null },
  }
}

// ────────────────────────────── Belge Tier A ↔ dual-sign köprüsü ──────────────────────────────
/**
 * goruntu_okuma eylem:
 *  - belge_taslak     { analizId, goz, tekAlan? } → Belge kasası analizi (belge_analizleri: id + doctor_id + patient_id) → asistan taslağı
 *  - asistana_raporla { goruntuId, goz, deid{mime,base64,hash}, kimlikYok: true, tekAlanFundus?, klinikNot? } → Göz görüntüsü için aynı
 *                     Tier A yolu (core/belgeler/tierA). Görsel istemcide kimliksizleştirilir; hekim kimlik bilgisi olmadığını onaylar.
 * İkisi de dual-sign 'draft' yazar (taslak_yazan='asistan'); onay yalnız uzman (okumaGecisi). DR evresi / goz_dr'ye yazılmaz.
 * Model hatası veya düşük kalite → kontrol listesi iskeleti (ayseGoruntu) yedek taslak olarak eklenir.
 */
export async function gozGoruntuKopru(eylem: string, c: Ctx): Promise<NextResponse | null> {
  const { sb, doktorId, h, b } = c
  const ortak = { patient_id: h.id, doctor_id: doktorId }
  if (eylem === 'belge_taslak') {
    const g = kopruGozDogrula(b.goz)
    if (!g.ok) return hata(g.hata)
    const { data: a } = await sb.from('belge_analizleri').select('id, belge_id, modality_final, durum, sonuc, fusion').eq('id', String(b.analizId || '')).eq('doctor_id', doktorId).eq('patient_id', h.id).maybeSingle()
    if (!a) return hata('Analiz bulunamadı.', 404)
    const mod = belgeModaliteGoz(String(a.modality_final))
    if (!mod) return hata('Yalnız fundus / OCT / ön segment (dış göz) analizi göz okumasına aktarılır.')
    const rapor = a.sonuc as BelgeRaporu | null
    const uygun = analizKopruyeUygun(String(a.durum), rapor)
    if (!uygun.ok) return hata(uygun.hata)
    const { data: once } = await sb.from('goz_goruntu_okumalari').select('id').eq('belge_analiz_id', a.id).eq('doctor_id', doktorId).eq('durum', 'draft').limit(1).maybeSingle()
    if (once) return hata('Bu analiz zaten onay bekleyen bir göz okuma taslağı olarak aktarıldı.', 409)
    const tekAlan = mod === 'fundus' && b.tekAlan !== false
    const ust = guvenUst((a.fusion as { capPct?: number } | null)?.capPct, mod, tekAlan)
    const taslak = belgeTaslakMetni({ rapor: rapor!, modalite: mod, goz: g.goz, guvenUstPct: ust, tekAlan })
    const { error } = await sb.from('goz_goruntu_okumalari').insert({ ...ortak, goruntu_id: null, belge_id: a.belge_id, belge_analiz_id: a.id, kaynak: 'belge_tier_a', modalite: mod, tek_alan: mod === 'fundus' ? tekAlan : null, guven_ust_pct: ust, asistan_rapor: rapor, goz: g.goz, taslak, taslak_yazan: 'asistan', durum: 'draft', disclaimer: GOZ_GORUNTU_DISCLAIMER })
    if (error) return hata(error.message, 500)
    return NextResponse.json({ ok: true, guvenUst: ust, uyari: taslakTaniDiliUyarisi(taslak) })
  }
  if (eylem === 'asistana_raporla') {
    const { data: img } = await sb.from('hasta_goruntulemeler').select('id, modalite, vucut_bolgesi').eq('id', String(b.goruntuId || '')).eq('patient_id', h.id).eq('doctor_id', doktorId).maybeSingle()
    if (!img) return hata('Görüntü bulunamadı.', 404)
    const mod = normalizeModalite(String(img.modalite || ''))
    if (!mod) return hata('Yalnız OCT / fundus / ön segment görüntüsü raporlanır.')
    const g = kopruGozDogrula(b.goz || gozBolgeCoz(img.vucut_bolgesi))
    if (!g.ok) return hata(g.hata)
    if (b.kimlikYok !== true) return hata('Göndermeden önce görüntüde hasta adı / T.C. / doğum tarihi olmadığını onaylayın (KVKK).')
    const d = (b.deid || {}) as { mime?: string; base64?: string }
    if (!d.base64 || typeof d.base64 !== 'string' || d.base64.length > 12_000_000) return hata('Kimliksizleştirilmiş görüntü gerekli.')
    const mime = (['image/jpeg', 'image/png', 'image/webp'].includes(String(d.mime)) ? d.mime : 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp'
    const tekAlan = mod === 'fundus' && b.tekAlanFundus !== false
    const kural = bransKurali('goz')
    const belgeMod = gozModaliteBelge(mod)
    const iskelet = async (neden: string) => {
      const s = ayseGoruntuTaslagi({ modalite: mod, goz: g.goz })
      await sb.from('goz_goruntu_okumalari').insert({ ...ortak, goruntu_id: img.id, goz: g.goz, modalite: mod, kaynak: 'ayse_iskelet', taslak: s.taslak, taslak_yazan: 'asistan', durum: 'draft', disclaimer: s.disclaimer })
      return NextResponse.json({ ok: true, yedek: true, uyari: `${neden} — kontrol listesi taslağı eklendi (uzman onayı bekler).` })
    }
    let sonuc
    try {
      sonuc = await tierAYazVeFuzyonla({ anthropic: new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }), persona: kural.persona, girdi: { brans: kural.ad, modality_final: belgeMod, yasAy: h.yasAy, cinsiyet: null, klinikNot: [`Göz: ${g.goz === 'sag' ? 'OD (sağ)' : 'OS (sol)'}.`, b.klinikNot ? String(b.klinikNot).slice(0, 300) : ''].filter(Boolean).join(' ') }, gorsel: { tip: 'image', mime, base64: d.base64 }, tierB: [], modalite: belgeMod, yasAy: h.yasAy, tekAlanFundus: mod === 'fundus' ? tekAlan : undefined, doctorId: doktorId })
    } catch { return iskelet('Görüntü asistan tarafından okunamadı') }
    const uygun = analizKopruyeUygun('taslak', sonuc.rapor)
    if (!uygun.ok) return iskelet('Görüntü kalitesi düşük')
    const ust = guvenUst(sonuc.fusion.capPct, mod, tekAlan)
    const taslak = belgeTaslakMetni({ rapor: sonuc.rapor, modalite: mod, goz: g.goz, guvenUstPct: ust, tekAlan })
    const { error } = await sb.from('goz_goruntu_okumalari').insert({ ...ortak, goruntu_id: img.id, goz: g.goz, modalite: mod, kaynak: 'belge_tier_a', tek_alan: mod === 'fundus' ? tekAlan : null, guven_ust_pct: ust, asistan_rapor: sonuc.rapor, taslak, taslak_yazan: 'asistan', durum: 'draft', disclaimer: GOZ_GORUNTU_DISCLAIMER })
    if (error) return hata(error.message, 500)
    return NextResponse.json({ ok: true, guvenUst: ust, uyari: taslakTaniDiliUyarisi(taslak) })
  }
  return null
}
