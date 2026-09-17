/**
 * NOTYA-DAH-WOW Wave 2 — bakım döngüleri sunucu katmanı (route.ts çağırır).
 * GET verisi: DM döngü · anemi · obezite · KETEM tarama · aşı takvimi · HT panel istemleri · ön anket.
 * POST adımları: dmdongu | anemi | obezite | tarama | htpanel | asi | asiprofil | duegorev | anketsoap.
 * Lab yalnız onaylı satırdan (labSerisi). Hekim kilidi dahiliye_kart_kilitleri (anemi.plan, obezite.plan, asi.plan, tarama.plan).
 */
import { NextResponse } from 'next/server'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { dmDongu } from '@/specialties/dahiliye/engines/dmLoop'
import { anemiDegerlendir } from '@/specialties/dahiliye/engines/anemi'
import { obeziteDegerlendir } from '@/specialties/dahiliye/engines/obezite'
import { taramaDue } from '@/specialties/dahiliye/engines/tarama'
import { asiTakvimi, type AsiKod } from '@/specialties/dahiliye/engines/asi'
import { HT_BASLANGIC_PANELI, HT_PANEL_DIPNOT, istemDurumu, type PanelKalem } from '@/specialties/dahiliye/engines/htPanel'
import { anketSablonu, type AnketKart } from '@/specialties/dahiliye/engines/anket'
import { type Sb, type LabSatir, son, sonDeger, gorevEkle } from './_ortak'

type Hasta = { id: string; yas: number | null; kadin: boolean }
type IlacR = { ilac_adi: string; etken_madde: string | null; aktif: boolean | null }
const lab = (m: Map<string, LabSatir[]>, k: string) => { const r = son(m, k); return r?.kanonik_deger != null && r.numune_tarihi ? { deger: r.kanonik_deger, tarih: r.numune_tarihi } : null }

/** Hastanın aktif kartları (anket şablonu ve kohort için). */
export async function aktifKartlar(sb: Sb, patientId: string): Promise<AnketKart[]> {
  const t = async (tablo: string) => { const { data } = await sb.from(tablo).select('id').eq('patient_id', patientId).limit(1); return !!data?.length }
  const [ht, dm, lipid, tiroid, ckd, hf, ak, pulm, gi] = await Promise.all(['dahiliye_ht', 'dahiliye_dm', 'dahiliye_lipid', 'dahiliye_tiroid', 'dahiliye_ckd', 'dahiliye_hf', 'dahiliye_antikoagulan', 'dahiliye_pulm', 'dahiliye_gi'].map((x) => t(x).catch(() => false)))
  const out: AnketKart[] = []
  if (ht) out.push('ht'); if (dm) out.push('dm'); if (lipid) out.push('lipid'); if (tiroid) out.push('tiroid'); if (ckd) out.push('ckd'); if (hf) out.push('hf'); if (ak) out.push('antikoagulan'); if (pulm) out.push('pulm'); if (gi) out.push('gi')
  return out
}

export async function wow2Verisi(sb: Sb, hasta: Hasta, labs: Map<string, LabSatir[]>, ilaclar: IlacR[], T: string) {
  const [dmQ, kvrQ, ckdQ, anemiQ, obQ, tarQ, ksQ, asiQ, asiPQ, istemQ, belgeQ, anketQ, evKiloQ] = await Promise.all([
    sb.from('dahiliye_dm').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_kvr').select('askvh, sigara').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_ckd').select('uacr_manual').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_anemi').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_obezite').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_tarama').select('*').eq('patient_id', hasta.id).maybeSingle(),
    hasta.kadin ? sb.from('kadin_sagligi').select('son_pap, son_hpv, son_mamografi, son_kolorektal, histerektomi').eq('patient_id', hasta.id).maybeSingle() : Promise.resolve({ data: null }),
    sb.from('dahiliye_asilar').select('id, asi, tarih').eq('patient_id', hasta.id).order('tarih', { ascending: false }).limit(60),
    sb.from('dahiliye_asi_profil').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_lab_istemleri').select('*').eq('patient_id', hasta.id).eq('durum', 'acik').order('istem_tarihi', { ascending: false }).limit(5),
    sb.from('belge_analizleri').select('olusturuldu, modality_final').eq('patient_id', hasta.id).eq('modality_final', 'ekg').order('olusturuldu', { ascending: false }).limit(10),
    sb.from('dahiliye_anketler').select('id, cevaplar, alarmlar, soap_metni, okundu_at, created_at').eq('patient_id', hasta.id).order('created_at', { ascending: false }).limit(1),
    sb.from('dahiliye_ev_kayitlari').select('deger, olcum_at').eq('patient_id', hasta.id).eq('tip', 'kilo').order('olcum_at', { ascending: false }).limit(40),
  ])
  const ilacMetin = ilaclar.filter((i) => i.aktif !== false).map((i) => `${i.ilac_adi} ${i.etken_madde || ''}`.toLowerCase())
  const egfr = sonDeger(labs, 'eGFR'), uacr = sonDeger(labs, 'UACR') ?? (ckdQ.data?.uacr_manual != null ? Number(ckdQ.data.uacr_manual) : null)
  const ob = obQ.data
  const kiloSerisi = [...(evKiloQ.data || []).filter((k) => k.deger != null).map((k) => ({ kg: Number(k.deger), tarih: String(k.olcum_at).slice(0, 10) })), ...(ob?.kilo_kg != null ? [{ kg: Number(ob.kilo_kg), tarih: String(ob.updated_at).slice(0, 10) }] : [])]
  const obSonuc = obeziteDegerlendir({ kiloKg: ob?.kilo_kg != null ? Number(ob.kilo_kg) : null, boyCm: ob?.boy_cm != null ? Number(ob.boy_cm) : null, belCm: ob?.bel_cm != null ? Number(ob.bel_cm) : null, kadin: hasta.kadin, yas: hasta.yas, komorbidite: { ...(ob?.komorbidite || {}), dm: !!dmQ.data || !!(ob?.komorbidite as Record<string, boolean> | undefined)?.dm }, kiloSerisi, farmakoterapiBaslangic: ob?.farmakoterapi_baslangic || null, glp1Var: ilacMetin.some((x) => /glutid|tirzepatid/.test(x)), bugun: T })

  const dm = dmQ.data
  const dmSonuc = dm ? dmDongu({ yas: hasta.yas, ilacMetinleri: ilacMetin, askvh: !!kvrQ.data?.askvh, kky: !!dm.kky, eGFR: egfr, uacr, vki: obSonuc.vki, alt: lab(labs, 'ALT'), ast: lab(labs, 'AST'), plt: lab(labs, 'Plt'), sonAyakFoto: dm.son_ayak_foto || null, bugun: T }) : null

  const an = anemiQ.data
  const anemiSonuc = anemiDegerlendir({ kadin: hasta.kadin, yas: hasta.yas, hb: sonDeger(labs, 'Hb'), mcv: sonDeger(labs, 'MCV'), rbc: sonDeger(labs, 'RBC'), wbc: sonDeger(labs, 'WBC'), plt: sonDeger(labs, 'Plt'), ferritin: sonDeger(labs, 'Ferritin'), b12: sonDeger(labs, 'B12'), folat: sonDeger(labs, 'Folate'), retic: sonDeger(labs, 'Retic'), crp: sonDeger(labs, 'CRP'), eGFR: egfr, tsh: sonDeger(labs, 'TSH'), ldh: sonDeger(labs, 'LDH'), tbil: sonDeger(labs, 'TBil'), menstruasyon: an?.menstruasyon ?? undefined, gisKanamaSemptom: !!an?.gis_kanama })

  const tr = tarQ.data, ks = ksQ.data as { son_pap?: string; son_hpv?: string; son_mamografi?: string; son_kolorektal?: string; histerektomi?: boolean } | null
  const enYeni = (...x: (string | null | undefined)[]) => (x.filter(Boolean) as string[]).sort().reverse()[0] || null
  const tarama = taramaDue({ yas: hasta.yas, kadin: hasta.kadin, histerektomi: !!tr?.histerektomi || !!ks?.histerektomi, sonGgk: enYeni(tr?.son_ggk, ks?.son_kolorektal), sonKolonoskopi: tr?.son_kolonoskopi, sonMamografi: enYeni(tr?.son_mamografi, ks?.son_mamografi), sonHpv: enYeni(tr?.son_hpv, ks?.son_hpv), sonPap: enYeni(tr?.son_pap, ks?.son_pap), ggkPozitif: !!tr?.ggk_pozitif, bugun: T })

  const ap = asiPQ.data
  const hbsag = son(labs, 'HBsAg')
  const asi = asiTakvimi({ yas: hasta.yas, kronik: { dm: !!dm, kbh: egfr != null && egfr < 60, kvh: !!kvrQ.data?.askvh || !!dm?.kky, akciger: !!ap?.akciger, karaciger: !!ap?.karaciger, immunsup: !!ap?.immunsup, asplenik: !!ap?.asplenik, sigara: !!kvrQ.data?.sigara, alkol: !!ap?.alkol }, dozlar: (asiQ.data || []).map((d) => ({ asi: d.asi as AsiKod, tarih: String(d.tarih) })), hbsag: hbsag ? (hbsag.value_text || (hbsag.kanonik_deger != null ? String(hbsag.kanonik_deger) : null)) : null, antiHbs: sonDeger(labs, 'AntiHBs'), bugun: T })

  const labTarihleri: Record<string, string[]> = {}
  for (const [k, arr] of labs) labTarihleri[k] = arr.map((x) => x.numune_tarihi).filter(Boolean) as string[]
  const ekgTarihleri = (belgeQ.data || []).map((b) => String(b.olusturuldu).slice(0, 10))
  const istemler = (istemQ.data || []).map((i) => ({ id: String(i.id), panel: String(i.panel), tarih: String(i.istem_tarihi), durum: istemDurumu({ id: String(i.id), tarih: String(i.istem_tarihi), kalemler: i.kalemler as PanelKalem[] }, labTarihleri, ekgTarihleri, T) }))

  const anket = anketQ.data?.[0] || null
  const anketTaze = anket && String(anket.created_at).slice(0, 10) >= new Date(Date.parse(T) - 14 * 86400000).toISOString().slice(0, 10) ? anket : null
  return {
    dm: dm ? { kky: !!dm.kky, son_ayak_foto: dm.son_ayak_foto || null, sonuc: dmSonuc } : null,
    anemi: { menstruasyon: an?.menstruasyon ?? null, gis_kanama: !!an?.gis_kanama, sonuc: anemiSonuc },
    obezite: { boy_cm: ob?.boy_cm ?? null, bel_cm: ob?.bel_cm ?? null, kilo_kg: ob?.kilo_kg ?? null, komorbidite: (ob?.komorbidite || {}) as Record<string, boolean>, farmakoterapi_baslangic: ob?.farmakoterapi_baslangic ?? null, sonuc: obSonuc },
    tarama: { satir: tr || null, due: tarama },
    asi: { profil: ap || null, dozlar: asiQ.data || [], due: asi },
    htPanel: { kalemler: HT_BASLANGIC_PANELI, dipnot: HT_PANEL_DIPNOT, istemler },
    anket: anketTaze ? { id: anketTaze.id, tarih: String(anketTaze.created_at).slice(0, 10), alarmlar: (anketTaze.alarmlar || []) as string[], soap: String(anketTaze.soap_metni || ''), okundu: !!anketTaze.okundu_at } : null,
  }
}
export type Wow2Veri = Awaited<ReturnType<typeof wow2Verisi>>

const tarihMi = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)

export async function wow2Post(adim: string, b: Record<string, unknown>, sb: Sb, userId: string, hasta: Hasta, T: string): Promise<NextResponse | null> {
  const ok = (x: Record<string, unknown> = {}) => NextResponse.json({ ok: true, ...x })
  const hata = (e: { message: string } | null) => (e ? NextResponse.json({ error: e.message }, { status: 500 }) : null)
  const num = (v: unknown) => (v == null || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null)
  if (adim === 'dmdongu') {
    const { data: dm } = await sb.from('dahiliye_dm').select('id').eq('patient_id', hasta.id).maybeSingle()
    if (!dm) return NextResponse.json({ error: 'Önce DM kartını değerlendirin' }, { status: 400 })
    const { error } = await sb.from('dahiliye_dm').update({ kky: !!b.kky, son_ayak_foto: tarihMi(b.sonAyakFoto), updated_at: new Date().toISOString() }).eq('patient_id', hasta.id)
    if (error) return hata(error)
    if (b.gorevler) {
      const g = Array.isArray(b.gorevler) ? (b.gorevler as { kod: string; ad: string; due: string }[]) : []
      await gorevEkle(sb, userId, hasta.id, g.slice(0, 10).map((x) => ({ kod: String(x.kod).slice(0, 40), ad: String(x.ad).slice(0, 200), due: tarihMi(x.due), kaynak: 'dm_dongu' })))
    }
    if (b.sevkNot) await sb.from('sevkler').insert({ patient_id: hasta.id, doctor_id: userId, hedef: 'gastroenteroloji', not_metni: String(b.sevkNot).slice(0, 500), kaynak: 'dm_fib4' })
    return ok()
  }
  if (adim === 'anemi') {
    const { error } = await sb.from('dahiliye_anemi').upsert({ patient_id: hasta.id, doctor_id: userId, menstruasyon: b.menstruasyon == null ? null : !!b.menstruasyon, gis_kanama: !!b.gisKanama, updated_at: new Date().toISOString() }, { onConflict: 'patient_id' })
    return hata(error) || ok()
  }
  if (adim === 'obezite') {
    const k = (b.komorbidite || {}) as Record<string, unknown>
    const komorbidite = Object.fromEntries(['prediyabet', 'ht', 'dislipidemi', 'osa', 'masld', 'osteoartrit', 'kvh'].map((x) => [x, !!k[x]]))
    const kilo = num(b.kiloKg), boy = num(b.boyCm), bel = num(b.belCm)
    if ((kilo != null && (kilo < 20 || kilo > 350)) || (boy != null && (boy < 100 || boy > 230))) return NextResponse.json({ error: 'Kilo/boy aralık dışı' }, { status: 400 })
    const { error } = await sb.from('dahiliye_obezite').upsert({ patient_id: hasta.id, doctor_id: userId, kilo_kg: kilo, boy_cm: boy, bel_cm: bel, komorbidite, farmakoterapi_baslangic: tarihMi(b.farmakoterapiBaslangic), updated_at: new Date().toISOString() }, { onConflict: 'patient_id' })
    if (error) return hata(error)
    if (kilo != null) await sb.from('dahiliye_ev_kayitlari').insert({ patient_id: hasta.id, doctor_id: userId, tip: 'kilo', deger: kilo, kaynak: 'hekim', not_metni: 'ofis tartı' })
    return ok()
  }
  if (adim === 'tarama') {
    const { error } = await sb.from('dahiliye_tarama').upsert({ patient_id: hasta.id, doctor_id: userId, son_ggk: tarihMi(b.sonGgk), son_kolonoskopi: tarihMi(b.sonKolonoskopi), son_mamografi: tarihMi(b.sonMamografi), son_hpv: tarihMi(b.sonHpv), son_pap: tarihMi(b.sonPap), histerektomi: !!b.histerektomi, ggk_pozitif: !!b.ggkPozitif, updated_at: new Date().toISOString() }, { onConflict: 'patient_id' })
    if (error) return hata(error)
    if (b.ggkPozitif) { const { data: v } = await sb.from('sevkler').select('id').eq('patient_id', hasta.id).eq('kaynak', 'ketem_ggk').eq('durum', 'acik').maybeSingle(); if (!v) await sb.from('sevkler').insert({ patient_id: hasta.id, doctor_id: userId, hedef: 'gastroenteroloji', not_metni: 'KETEM: gaitada gizli kan pozitif — kolonoskopi', kaynak: 'ketem_ggk' }) }
    return ok()
  }
  if (adim === 'htpanel') {
    const secili = Array.isArray(b.kalemler) ? (b.kalemler as string[]).map(String) : null
    const kalemler = HT_BASLANGIC_PANELI.filter((k) => !secili || secili.includes(k.ad))
    const { data, error } = await sb.from('dahiliye_lab_istemleri').insert({ patient_id: hasta.id, doctor_id: userId, panel: 'ht_baslangic', kalemler, istem_tarihi: T }).select('id').maybeSingle()
    if (error) return hata(error)
    const rn = await gununNotunaEkle(sb, userId, hasta.id, `HT başlangıç paneli istendi: ${kalemler.map((k) => k.ad).join(', ')} (Uzlaşı 2025). Sonuç 14 gün içinde gelmezse takip görevi açılır.`)
    return ok({ istemId: data?.id, notId: rn.eklendi ? rn.notId : null })
  }
  if (adim === 'htpanelkapat') {
    const { error } = await sb.from('dahiliye_lab_istemleri').update({ durum: b.iptal ? 'iptal' : 'tamam' }).eq('id', String(b.istemId || '')).eq('doctor_id', userId)
    return hata(error) || ok()
  }
  if (adim === 'asi') {
    const asi = String(b.asi || '')
    if (!['grip', 'pcv20', 'pcv13', 'ppsv23', 'zona', 'td', 'hbv', 'covid'].includes(asi)) return NextResponse.json({ error: 'Aşı geçersiz' }, { status: 400 })
    const tarih = tarihMi(b.tarih) || T
    if (tarih > T) return NextResponse.json({ error: 'Gelecek tarihli doz girilemez' }, { status: 400 })
    const { error } = await sb.from('dahiliye_asilar').insert({ patient_id: hasta.id, doctor_id: userId, asi, tarih })
    return hata(error) || ok()
  }
  if (adim === 'asiprofil') {
    const { error } = await sb.from('dahiliye_asi_profil').upsert({ patient_id: hasta.id, doctor_id: userId, akciger: !!b.akciger, karaciger: !!b.karaciger, immunsup: !!b.immunsup, asplenik: !!b.asplenik, alkol: !!b.alkol, updated_at: new Date().toISOString() }, { onConflict: 'patient_id' })
    return hata(error) || ok()
  }
  if (adim === 'duegorev') {
    const g = Array.isArray(b.gorevler) ? (b.gorevler as { kod: string; ad: string; due: string | null; kaynak: string }[]) : []
    await gorevEkle(sb, userId, hasta.id, g.slice(0, 20).map((x) => ({ kod: String(x.kod).slice(0, 40), ad: String(x.ad).slice(0, 200), due: tarihMi(x.due) || T, kaynak: ['asi', 'tarama', 'lab_takip'].includes(String(x.kaynak)) ? String(x.kaynak) : 'asi' })))
    return ok({ sayi: g.length })
  }
  if (adim === 'anketsoap') {
    const { data: a } = await sb.from('dahiliye_anketler').select('id, soap_metni').eq('id', String(b.anketId || '')).eq('patient_id', hasta.id).maybeSingle()
    if (!a) return NextResponse.json({ error: 'Anket bulunamadı' }, { status: 404 })
    const r = await gununNotunaEkle(sb, userId, hasta.id, String(a.soap_metni || ''), 'content_subjektif')
    await sb.from('dahiliye_anketler').update({ okundu_at: new Date().toISOString() }).eq('id', a.id)
    return r.eklendi ? ok({ notId: r.notId }) : NextResponse.json({ error: `Subjektif'e eklenemedi: ${r.sebep || ''} — metni kopyalayın.` }, { status: 409 })
  }
  return null
}

export { anketSablonu }
