/**
 * NOTYA-DAH-WOW Wave 3 — geniş kartlar sunucu katmanı (route.ts çağırır).
 * GET: KY/GDMT · antikoagülan · KOAH/astım · GI · EKG raporları · tiroid nodülleri · Ramazan · check-up paket defteri.
 * POST: hf | antikoagulan | pulm | gi | ekg | ekgonay | nodul | nodulkapat | ramazan | checkuppaket | checkupmanuel | checkuprapor | checkupkilit.
 * EKG acil bayrağı mevcut kırmızı bayrak kapısına bağlıdır (acilSevkOnayi yoksa 409). Lab yalnız onaylı satır.
 */
import { NextResponse } from 'next/server'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { aktifGebelikDurumu } from '@/lib/clinical/gebelikDurum'
import { hfDegerlendir } from '@/specialties/dahiliye/engines/hf'
import { antikoagulanDegerlendir, ajanBul } from '@/specialties/dahiliye/engines/antikoagulan'
import { pulmDegerlendir, INHALER_TEKNIK } from '@/specialties/dahiliye/engines/pulm'
import { giDegerlendir } from '@/specialties/dahiliye/engines/gi'
import { ekgDegerlendir, EKG_SABLONLARI, type EkgGirdi } from '@/specialties/dahiliye/engines/ekg'
import { nodulDegerlendir, type NodulGirdi } from '@/specialties/dahiliye/engines/tiroidNodul'
import { ramazanDegerlendir } from '@/specialties/dahiliye/engines/ramazan'
import { PAKETLER, uygunPaketler, paketDurumu, birlesikRapor, CHECKUP_DIPNOT } from '@/specialties/dahiliye/engines/checkupPaket'
import { type Sb, type LabSatir, son, sonDeger, gorevEkle, hastaAdi } from './_ortak'

type Hasta = { id: string; yas: number | null; kadin: boolean }
type IlacR = { ilac_adi: string; etken_madde: string | null; aktif: boolean | null }
const tarihMi = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)
const sayi = (v: unknown) => (v == null || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null)
const bool = (o: unknown, k: string) => !!(o && typeof o === 'object' && (o as Record<string, unknown>)[k])

async function belgeTarihleri(sb: Sb, patientId: string, sadeceOnayli = false) {
  let q = sb.from('belge_analizleri').select('modality_final, olusturuldu, durum, hekim_ozet, sonuc').eq('patient_id', patientId).order('olusturuldu', { ascending: false }).limit(60)
  if (sadeceOnayli) q = q.in('durum', ['onaylandi', 'muayene_onaylandi'])
  const { data } = await q
  const m: Record<string, string[]> = {}
  for (const b of data || []) { const k = String(b.modality_final); (m[k] ||= []).push(String(b.olusturuldu).slice(0, 10)) }
  return { m, satirlar: data || [] }
}

/** Check-up tarama kalemleri (W4.2 dahiliye_taramalar): tip → kayıt tarihleri. */
async function taramaTarihleri(sb: Sb, patientId: string) {
  const { data } = await sb.from('dahiliye_taramalar').select('tip, created_at').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(30)
  const m: Record<string, string[]> = {}
  for (const t of data || []) (m[String(t.tip)] ||= []).push(String(t.created_at).slice(0, 10))
  return m
}

export async function wow3Verisi(sb: Sb, hasta: Hasta, labs: Map<string, LabSatir[]>, ilaclar: IlacR[], T: string) {
  const [hfQ, akQ, pulmQ, giQ, ekgQ, nodulQ, ramQ, paketQ, evQ, htQ, dmQ, kvrQ, gebeQ, belge, tarama] = await Promise.all([
    sb.from('dahiliye_hf').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_antikoagulan').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_pulm').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_gi').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_ekg').select('id, girdi, rapor, acil, durum, created_at').eq('patient_id', hasta.id).order('created_at', { ascending: false }).limit(5),
    sb.from('dahiliye_tiroid_nodul').select('*').eq('patient_id', hasta.id).eq('aktif', true).order('us_tarihi', { ascending: false }).limit(6),
    sb.from('dahiliye_ramazan').select('*').eq('patient_id', hasta.id).order('yil', { ascending: false }).limit(1),
    sb.from('dahiliye_checkup_paketleri').select('*').eq('patient_id', hasta.id).neq('durum', 'iptal').order('created_at', { ascending: false }).limit(4),
    sb.from('dahiliye_ev_kayitlari').select('deger, olcum_at').eq('patient_id', hasta.id).eq('tip', 'kilo').order('olcum_at', { ascending: false }).limit(20),
    sb.from('dahiliye_ht').select('sbp, dbp, nabiz, tarih').eq('patient_id', hasta.id).order('tarih', { ascending: false }).limit(1),
    sb.from('dahiliye_dm').select('tip').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_kvr').select('sigara, askvh').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('gebelikler').select('durum').eq('patient_id', hasta.id),
    belgeTarihleri(sb, hasta.id),
    taramaTarihleri(sb, hasta.id),
  ])
  const ilacMetin = ilaclar.filter((i) => i.aktif !== false).map((i) => `${i.ilac_adi} ${i.etken_madde || ''}`.toLowerCase())
  const kb = htQ.data?.[0] || null
  const seri = (k: string) => (labs.get(k) || []).filter((x) => x.kanonik_deger != null && x.numune_tarihi).map((x) => ({ deger: x.kanonik_deger as number, tarih: x.numune_tarihi as string }))
  const kiloSerisi = (evQ.data || []).filter((k) => k.deger != null).map((k) => ({ kg: Number(k.deger), tarih: String(k.olcum_at).slice(0, 10) }))

  const hf = hfQ.data
  const ntp = seri('NTproBNP')
  const hfSonuc = hf ? hfDegerlendir({ ef: hf.ef != null ? Number(hf.ef) : null, nyha: (hf.nyha as 1 | 2 | 3 | 4 | null) ?? null, ilacMetinleri: ilacMetin, sbp: kb?.sbp ?? null, nabiz: kb?.nabiz ?? null, k: sonDeger(labs, 'K'), eGFR: sonDeger(labs, 'eGFR'), ntprobnp: ntp[0]?.deger ?? null, oncekiNtprobnp: ntp[1]?.deger ?? null, kiloSerisi, yatis12Ay: !!hf.yatis_12ay, ekoTarihi: hf.eko_tarihi || (belge.m.eko || [])[0] || null, bugun: T }) : null

  const ak = akQ.data
  const ajan = ajanBul(ilacMetin)
  const akSonuc = ak || ajan ? antikoagulanDegerlendir({ ajan, endikasyon: (ak?.endikasyon as 'af' | 'vte' | 'mekanik_kapak' | 'diger' | null) ?? null, hedefInr: ak?.hedef_inr_alt != null && ak?.hedef_inr_ust != null ? [Number(ak.hedef_inr_alt), Number(ak.hedef_inr_ust)] : null, yas: hasta.yas, kadin: hasta.kadin, kiloKg: ak?.kilo_kg != null ? Number(ak.kilo_kg) : kiloSerisi[0]?.kg ?? null, kre: sonDeger(labs, 'Kre'), hb: sonDeger(labs, 'Hb'), plt: sonDeger(labs, 'Plt'), inr: seri('INR'), ilacMetinleri: ilacMetin, sbp: kb?.sbp ?? null, hasBled: (ak?.has_bled || {}) as Record<string, boolean>, bugun: T }) : null

  const pu = pulmQ.data
  const pulmSonuc = pu ? pulmDegerlendir({ tani: (pu.tani as 'koah' | 'astim' | null) ?? null, fev1Fvc: pu.fev1_fvc != null ? Number(pu.fev1_fvc) : null, fev1Yuzde: pu.fev1_yuzde != null ? Number(pu.fev1_yuzde) : null, bdFev1ArtisYuzde: pu.bd_artis_yuzde != null ? Number(pu.bd_artis_yuzde) : null, bdFev1ArtisMl: pu.bd_artis_ml != null ? Number(pu.bd_artis_ml) : null, mmrc: pu.mmrc ?? null, cat: pu.cat ?? null, ortaAlevlenme12Ay: pu.orta_alevlenme || 0, yatisliAlevlenme12Ay: pu.yatisli_alevlenme || 0, eozinofil: sonDeger(labs, 'Eo'), spo2: pu.spo2 != null ? Number(pu.spo2) : null, sigara: !!kvrQ.data?.sigara, astimKontrol: pu.astim_kontrol || null, oralSteroidKur12Ay: pu.oks_kur || 0, ilacMetinleri: ilacMetin, sonSpirometri: pu.son_spirometri || null, bugun: T }) : null

  const gi = giQ.data
  const giSonuc = gi ? giDegerlendir({ yas: hasta.yas, alarm: (gi.alarm || {}) as Record<string, boolean>, gerd: gi.gerd || null, ibs: gi.ibs || null, hp: gi.hp || null, masld: { alt: sonDeger(labs, 'ALT'), ast: sonDeger(labs, 'AST'), plt: sonDeger(labs, 'Plt') }, hb: sonDeger(labs, 'Hb'), bugun: T }) : null

  const tsh = sonDeger(labs, 'TSH')
  const noduller = (nodulQ.data || []).map((n) => ({ id: String(n.id), lokasyon: n.lokasyon as string | null, usTarihi: String(n.us_tarihi), sonuc: nodulDegerlendir({ ...(n.girdi as Omit<NodulGirdi, 'tsh' | 'bugun'>), tsh, bugun: T }) }))

  const ram = ramQ.data?.[0] || null
  const hba1c = sonDeger(labs, 'HbA1c')
  const ramGirdi = (ram?.girdi || {}) as Record<string, boolean>
  const ramSonuc = ram?.aktif ? ramazanDegerlendir({ dmTip: (dmQ.data?.tip as 'T1' | 'T2' | 'diger' | undefined) ?? null, hba1c, eGFR: sonDeger(labs, 'eGFR'), yas: hasta.yas, gebe: (gebeQ.data || []).some((g) => aktifGebelikDurumu(g.durum)), ilacMetinleri: ilacMetin, htVar: !!kb, son3AyAgirHipo: !!ramGirdi.son3AyAgirHipo, son3AyDkaHhs: !!ramGirdi.son3AyDkaHhs, hipoFarkindalikAzalmis: !!ramGirdi.hipoFarkindalikAzalmis, tekrarlayanHipo: !!ramGirdi.tekrarlayanHipo, ileriMakrovaskuler: !!ramGirdi.ileriMakrovaskuler || !!kvrQ.data?.askvh, akutHastalik: !!ramGirdi.akutHastalik, yalnizYasiyor: !!ramGirdi.yalnizYasiyor, kirilgan: !!ramGirdi.kirilgan, agirFizikselIs: !!ramGirdi.agirFizikselIs }) : null

  const labTarihleri: Record<string, string[]> = {}
  for (const [k, arr] of labs) labTarihleri[k] = arr.map((x) => x.numune_tarihi).filter(Boolean) as string[]
  const paketler = (paketQ.data || []).map((p) => ({ id: String(p.id), sku: String(p.sku), ad: PAKETLER.find((x) => x.sku === p.sku)?.ad || String(p.sku), tarih: String(p.tarih), ucret: p.ucret != null ? Number(p.ucret) : null, durum: String(p.durum), raporKilitli: !!p.rapor_kilit_at, ...paketDurumu({ sku: String(p.sku), tarih: String(p.tarih), manuelTamam: (p.manuel_tamam || []) as string[] }, labTarihleri, belge.m, tarama) }))

  return {
    hf: hf ? { ef: hf.ef, nyha: hf.nyha, eko_tarihi: hf.eko_tarihi, yatis_12ay: !!hf.yatis_12ay, sonuc: hfSonuc } : null,
    antikoagulan: ak || ajan ? { endikasyon: ak?.endikasyon ?? null, hedef_inr_alt: ak?.hedef_inr_alt ?? null, hedef_inr_ust: ak?.hedef_inr_ust ?? null, kilo_kg: ak?.kilo_kg ?? null, has_bled: (ak?.has_bled || {}) as Record<string, boolean>, sonuc: akSonuc } : null,
    pulm: pu ? { satir: pu, sonuc: pulmSonuc } : null, inhalerTeknik: INHALER_TEKNIK,
    gi: gi ? { satir: gi, sonuc: giSonuc } : null,
    ekg: { raporlar: ekgQ.data || [], sablonlar: Object.fromEntries(Object.entries(EKG_SABLONLARI).map(([k, v]) => [k, v.ad])) },
    noduller, tsh,
    ramazan: ram ? { yil: ram.yil, aktif: !!ram.aktif, girdi: ramGirdi, sonuc: ramSonuc } : null,
    checkup: { uygun: uygunPaketler(hasta.yas, hasta.kadin).map((p) => ({ sku: p.sku, ad: p.ad, kalemSayi: p.kalemler.length })), paketler, dipnotlar: CHECKUP_DIPNOT },
  }
}
export type Wow3Veri = Awaited<ReturnType<typeof wow3Verisi>>

export async function wow3Post(adim: string, b: Record<string, unknown>, sb: Sb, userId: string, hasta: Hasta, T: string, labs: () => Promise<Map<string, LabSatir[]>>): Promise<NextResponse | null> {
  const ok = (x: Record<string, unknown> = {}) => NextResponse.json({ ok: true, ...x })
  const hata = (e: { message: string } | null) => (e ? NextResponse.json({ error: e.message }, { status: 500 }) : null)
  const simdi = new Date().toISOString()
  if (adim === 'hf') {
    const ef = sayi(b.ef), nyha = sayi(b.nyha)
    if (ef != null && (ef < 5 || ef > 85)) return NextResponse.json({ error: 'EF aralık dışı (5–85)' }, { status: 400 })
    const { error } = await sb.from('dahiliye_hf').upsert({ patient_id: hasta.id, doctor_id: userId, ef, nyha: nyha != null && nyha >= 1 && nyha <= 4 ? Math.round(nyha) : null, eko_tarihi: tarihMi(b.ekoTarihi), yatis_12ay: !!b.yatis12Ay, updated_at: simdi }, { onConflict: 'patient_id' })
    return hata(error) || ok()
  }
  if (adim === 'antikoagulan') {
    const end = ['af', 'vte', 'mekanik_kapak', 'diger'].includes(String(b.endikasyon)) ? String(b.endikasyon) : null
    const alt = sayi(b.hedefInrAlt), ust = sayi(b.hedefInrUst)
    if (alt != null && ust != null && (alt >= ust || alt < 1.5 || ust > 4.5)) return NextResponse.json({ error: 'Hedef INR aralığı geçersiz' }, { status: 400 })
    const hb = (b.hasBled || {}) as Record<string, unknown>
    const { error } = await sb.from('dahiliye_antikoagulan').upsert({ patient_id: hasta.id, doctor_id: userId, endikasyon: end, hedef_inr_alt: alt, hedef_inr_ust: ust, kilo_kg: sayi(b.kiloKg), has_bled: { karaciger: !!hb.karaciger, inme: !!hb.inme, kanama: !!hb.kanama, alkol: !!hb.alkol }, updated_at: simdi }, { onConflict: 'patient_id' })
    if (error) return hata(error)
    if (b.inrGorev && tarihMi(b.inrGorev)) await gorevEkle(sb, userId, hasta.id, [{ kod: 'ak_inr', ad: 'INR kontrolü (antikoagülan kartı)', due: String(b.inrGorev), kaynak: 'antikoagulan' }])
    return ok()
  }
  if (adim === 'pulm') {
    const tani = ['koah', 'astim'].includes(String(b.tani)) ? String(b.tani) : null
    const oran = sayi(b.fev1Fvc)
    const ak = (b.astimKontrol || null) as Record<string, unknown> | null
    const { error } = await sb.from('dahiliye_pulm').upsert({ patient_id: hasta.id, doctor_id: userId, tani, fev1_fvc: oran != null && oran > 1.5 ? oran / 100 : oran, fev1_yuzde: sayi(b.fev1Yuzde), bd_artis_yuzde: sayi(b.bdArtisYuzde), bd_artis_ml: sayi(b.bdArtisMl), mmrc: sayi(b.mmrc), cat: sayi(b.cat), orta_alevlenme: sayi(b.ortaAlevlenme) ?? 0, yatisli_alevlenme: sayi(b.yatisliAlevlenme) ?? 0, spo2: sayi(b.spo2), astim_kontrol: ak ? { gunduzSemptom: !!ak.gunduzSemptom, geceUyanma: !!ak.geceUyanma, kurtariciIhtiyac: !!ak.kurtariciIhtiyac, aktiviteKisit: !!ak.aktiviteKisit } : null, oks_kur: sayi(b.oksKur) ?? 0, son_spirometri: tarihMi(b.sonSpirometri), teknik: Array.isArray(b.teknik) ? (b.teknik as unknown[]).map(String).filter((x) => INHALER_TEKNIK.includes(x)) : [], updated_at: simdi }, { onConflict: 'patient_id' })
    return hata(error) || ok()
  }
  if (adim === 'gi') {
    const a = (b.alarm || {}) as Record<string, unknown>
    const alarm = Object.fromEntries(['disfaji', 'kiloKaybi', 'gisKanama', 'anemi', 'kusma', 'aileGisKanser', 'geceSemptom'].map((k) => [k, !!a[k]]))
    const gerd = b.gerd ? { tipikSemptom: bool(b.gerd, 'tipikSemptom'), ppiYanitsiz8Hafta: bool(b.gerd, 'ppiYanitsiz8Hafta') } : null
    const ibs = b.ibs ? Object.fromEntries(['karinAgrisiHaftada1Gun3Ay', 'defekasyonIliskili', 'siklikDegisimi', 'formDegisimi', 'baslangic6AyOnce'].map((k) => [k, bool(b.ibs, k)])) : null
    const h = (b.hp || null) as Record<string, unknown> | null
    const hp = h ? { test: ['pozitif', 'negatif'].includes(String(h.test)) ? String(h.test) : null, eradikasyonBitis: tarihMi(h.eradikasyonBitis), ppiKesimTarihi: tarihMi(h.ppiKesimTarihi), kontrolSonuc: ['pozitif', 'negatif'].includes(String(h.kontrolSonuc)) ? String(h.kontrolSonuc) : null } : null
    const { error } = await sb.from('dahiliye_gi').upsert({ patient_id: hasta.id, doctor_id: userId, alarm, gerd, ibs, hp, updated_at: simdi }, { onConflict: 'patient_id' })
    if (error) return hata(error)
    if (hp?.eradikasyonBitis && !hp.kontrolSonuc) { const r = giDegerlendir({ yas: hasta.yas, alarm: {}, gerd: null, ibs: null, hp: hp as never, masld: null, hb: null, bugun: T }); if (r.hp.gorev) await gorevEkle(sb, userId, hasta.id, [{ ...r.hp.gorev, kaynak: 'gi' }]) }
    return ok()
  }
  if (adim === 'ekg') {
    const sab = b.sablon ? EKG_SABLONLARI[String(b.sablon)]?.g || {} : {}
    const x = { ...sab, ...((b.girdi || {}) as Record<string, unknown>) } as Record<string, unknown>
    const girdi: EkgGirdi = { ritim: (['sinus', 'af', 'flutter', 'svt', 'vt', 'pacemaker', 'diger'].includes(String(x.ritim)) ? x.ritim : 'sinus') as EkgGirdi['ritim'], hiz: sayi(x.hiz), pr: sayi(x.pr), qrs: sayi(x.qrs), qt: sayi(x.qt), aks: (['normal', 'sol', 'sag', 'belirsiz'].includes(String(x.aks)) ? x.aks : 'normal') as EkgGirdi['aks'], stElevasyon: !!x.stElevasyon, stDepresyon: !!x.stDepresyon, tInversiyon: !!x.tInversiyon, yeniLbbb: !!x.yeniLbbb, rbbb: !!x.rbbb, avBlok: (['yok', '1', '2_mobitz1', '2_mobitz2', '3'].includes(String(x.avBlok)) ? x.avBlok : 'yok') as EkgGirdi['avBlok'], deltaDalga: !!x.deltaDalga, lvh: !!x.lvh, gogusAgrisi: !!x.gogusAgrisi, not: typeof x.not === 'string' ? x.not.slice(0, 300) : undefined }
    const d = ekgDegerlendir(girdi)
    if (b.onizleme) return ok({ degerlendirme: d })
    if (d.acil.length && !b.acilSevkOnayi) return NextResponse.json({ error: `Kırmızı bayrak (EKG): ${d.acil.join(' | ')} — kaydetmeden önce "acil / sevk" kutusu işaretlenmeli.`, bayraklar: d.acil, degerlendirme: d }, { status: 409 })
    const { data, error } = await sb.from('dahiliye_ekg').insert({ patient_id: hasta.id, doctor_id: userId, girdi, rapor: d.rapor, acil: d.acil, belge_id: typeof b.belgeId === 'string' ? b.belgeId : null }).select('id').maybeSingle()
    if (error) return hata(error)
    if (d.acil.length) { await sb.from('dahiliye_kirmizi').insert({ patient_id: hasta.id, doctor_id: userId, bayraklar: d.acil, acil_sevk_onayi: true, not_metni: 'EKG raporu' }); await gununNotunaEkle(sb, userId, hasta.id, `⚠ EKG kırmızı bayrak: ${d.acil.join('; ')} — hekim acil/sevk onayı verdi`) }
    return ok({ ekgId: data?.id, degerlendirme: d })
  }
  if (adim === 'ekgonay') {
    const { data: e } = await sb.from('dahiliye_ekg').select('id, rapor').eq('id', String(b.ekgId || '')).eq('doctor_id', userId).eq('patient_id', hasta.id).maybeSingle()
    if (!e) return NextResponse.json({ error: 'EKG raporu bulunamadı' }, { status: 404 })
    const rapor = typeof b.rapor === 'string' && b.rapor.trim() ? b.rapor.slice(0, 2000) : String(e.rapor)
    const { error } = await sb.from('dahiliye_ekg').update({ durum: 'onayli', rapor }).eq('id', e.id)
    if (error) return hata(error)
    const rn = await gununNotunaEkle(sb, userId, hasta.id, `EKG: ${rapor.replace(' (taslak — hekim onaylar)', '')}`)
    return ok({ notId: rn.eklendi ? rn.notId : null }) // NOTYA-MUAYENEYE-DON-01
  }
  if (adim === 'nodul') {
    const g = (b.girdi || {}) as Record<string, unknown>
    const secim = <T extends string>(v: unknown, izin: readonly T[], d: T): T => (izin.includes(v as T) ? (v as T) : d)
    const girdi = { bilesim: secim(g.bilesim, ['kistik', 'sungerimsi', 'mikst', 'solid'] as const, 'solid'), ekojenite: secim(g.ekojenite, ['anekoik', 'hiper_izo', 'hipo', 'cok_hipo'] as const, 'hiper_izo'), sekil: secim(g.sekil, ['genis', 'uzun'] as const, 'genis'), kenar: secim(g.kenar, ['duzgun', 'belirsiz', 'lobule_duzensiz', 'ekstratiroidal'] as const, 'duzgun'), odak: secim(g.odak, ['yok', 'makro', 'periferik', 'punktat'] as const, 'yok'), boyutMm: sayi(g.boyutMm) ?? 0, usTarihi: tarihMi(g.usTarihi) || T }
    if (girdi.boyutMm <= 0 || girdi.boyutMm > 120) return NextResponse.json({ error: 'Boyut (mm) gerekli' }, { status: 400 })
    const L = await labs()
    const sonuc = nodulDegerlendir({ ...girdi, tsh: sonDeger(L, 'TSH'), bugun: T })
    const { error } = await sb.from('dahiliye_tiroid_nodul').insert({ patient_id: hasta.id, doctor_id: userId, lokasyon: typeof b.lokasyon === 'string' ? b.lokasyon.slice(0, 60) : null, girdi, sonuc, us_tarihi: girdi.usTarihi })
    if (error) return hata(error)
    if (sonuc.sonrakiUs) await gorevEkle(sb, userId, hasta.id, [{ kod: `nodul_us_${girdi.usTarihi}`, ad: `Tiroid nodül US izlemi (TR${sonuc.tr}, ${girdi.boyutMm} mm)`, due: sonuc.sonrakiUs, kaynak: 'tiroid' }])
    for (const s of sonuc.sevk) await sb.from('sevkler').insert({ patient_id: hasta.id, doctor_id: userId, hedef: 'endokrinoloji', not_metni: `${s}\n${sonuc.tarif}`, kaynak: 'tiroid_nodul' })
    return ok({ sonuc })
  }
  if (adim === 'nodulkapat') {
    const { error } = await sb.from('dahiliye_tiroid_nodul').update({ aktif: false }).eq('id', String(b.nodulId || '')).eq('doctor_id', userId)
    return hata(error) || ok()
  }
  if (adim === 'ramazan') {
    const yil = sayi(b.yil) ?? Number(T.slice(0, 4))
    const g = (b.girdi || {}) as Record<string, unknown>
    const girdi = Object.fromEntries(['son3AyAgirHipo', 'son3AyDkaHhs', 'hipoFarkindalikAzalmis', 'tekrarlayanHipo', 'ileriMakrovaskuler', 'akutHastalik', 'yalnizYasiyor', 'kirilgan', 'agirFizikselIs'].map((k) => [k, !!g[k]]))
    const { error } = await sb.from('dahiliye_ramazan').upsert({ patient_id: hasta.id, doctor_id: userId, yil, aktif: b.aktif !== false, girdi, updated_at: simdi }, { onConflict: 'patient_id,yil' })
    return hata(error) || ok()
  }
  if (adim === 'checkuppaket') {
    const sku = String(b.sku || '')
    if (!PAKETLER.some((p) => p.sku === sku)) return NextResponse.json({ error: 'Paket geçersiz' }, { status: 400 })
    const { error } = await sb.from('dahiliye_checkup_paketleri').insert({ patient_id: hasta.id, doctor_id: userId, sku, tarih: tarihMi(b.tarih) || T, ucret: sayi(b.ucret) })
    if (error) return hata(error)
    await gununNotunaEkle(sb, userId, hasta.id, `Check-up paketi başlatıldı: ${PAKETLER.find((p) => p.sku === sku)!.ad} — kendi ödemeli (SGK'ya fatura edilmez).`)
    return ok()
  }
  if (adim === 'checkupmanuel') {
    const { data: p } = await sb.from('dahiliye_checkup_paketleri').select('id, manuel_tamam').eq('id', String(b.paketId || '')).eq('doctor_id', userId).maybeSingle()
    if (!p) return NextResponse.json({ error: 'Paket bulunamadı' }, { status: 404 })
    const set = new Set((p.manuel_tamam || []) as string[]); const kod = String(b.kod || '').slice(0, 40)
    if (b.tamam) set.add(kod); else set.delete(kod)
    const { error } = await sb.from('dahiliye_checkup_paketleri').update({ manuel_tamam: Array.from(set) }).eq('id', p.id)
    return hata(error) || ok()
  }
  if (adim === 'checkuprapor' || adim === 'checkupkilit') {
    const { data: p } = await sb.from('dahiliye_checkup_paketleri').select('*').eq('id', String(b.paketId || '')).eq('doctor_id', userId).eq('patient_id', hasta.id).maybeSingle()
    if (!p) return NextResponse.json({ error: 'Paket bulunamadı' }, { status: 404 })
    if (adim === 'checkupkilit') {
      const { error } = await sb.from('dahiliye_checkup_paketleri').update({ rapor_kilit_at: simdi, durum: 'tamam' }).eq('id', p.id)
      if (error) return hata(error)
      await gununNotunaEkle(sb, userId, hasta.id, `Check-up birleşik raporu hekim tarafından onaylandı (${PAKETLER.find((x) => x.sku === p.sku)?.ad || p.sku}).`)
      return ok()
    }
    const [L, belge, tarama, kilitQ, ad] = await Promise.all([labs(), belgeTarihleri(sb, hasta.id, true), taramaTarihleri(sb, hasta.id), sb.from('dahiliye_kart_kilitleri').select('kart, alan, deger, created_at').eq('patient_id', hasta.id).order('created_at', { ascending: false }).limit(200), hastaAdi(sb, userId, hasta.id)])
    const labTarihleri: Record<string, string[]> = {}
    for (const [k, arr] of L) labTarihleri[k] = arr.map((x) => x.numune_tarihi).filter(Boolean) as string[]
    const durum = paketDurumu({ sku: String(p.sku), tarih: String(p.tarih), manuelTamam: (p.manuel_tamam || []) as string[] }, labTarihleri, belge.m, tarama)
    const labSatir: { ad: string; deger: string; tarih: string }[] = []
    for (const [k, arr] of L) { const r = arr.find((x) => x.numune_tarihi && x.numune_tarihi >= String(p.tarih)); if (r) labSatir.push({ ad: k, deger: r.kanonik_deger != null ? String(r.kanonik_deger).replace('.', ',') : String(r.value_text || ''), tarih: String(r.numune_tarihi) }) }
    const belgeler = belge.satirlar.filter((x) => String(x.olusturuldu).slice(0, 10) >= String(p.tarih)).map((x) => ({ tur: String(x.modality_final).toUpperCase(), tarih: String(x.olusturuldu).slice(0, 10), ozet: String(x.hekim_ozet || (x.sonuc as { ozet?: string } | null)?.ozet || 'onaylı rapor') }))
    const gorulen = new Set<string>(); const kartOzetleri: { kart: string; satir: string }[] = []
    for (const k of kilitQ.data || []) { const key = `${k.kart}.${k.alan}`; if (gorulen.has(key)) continue; gorulen.add(key); kartOzetleri.push({ kart: String(k.kart).toUpperCase(), satir: `${k.alan}: ${typeof k.deger === 'string' ? k.deger : JSON.stringify(k.deger)} (${String(k.created_at).slice(0, 10)})` }) }
    const rapor = birlesikRapor({ hasta: { adSoyad: ad, yas: hasta.yas, kadin: hasta.kadin }, paketAd: PAKETLER.find((x) => x.sku === p.sku)?.ad || String(p.sku), paketTarih: String(p.tarih), labs: labSatir, belgeler, kartOzetleri, eksikKalemler: durum.kalemler.filter((x) => !x.tamam && !x.opsiyonel).map((x) => x.ad), hekimKilitli: !!p.rapor_kilit_at, bugun: T })
    return ok({ rapor })
  }
  return null
}
