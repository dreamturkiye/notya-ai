/**
 * HASTA-PORTALI-GUNLUK — doctor side: the "Ev verisi" card in the patient file, per-patient threshold editing, kritik
 * flags, acknowledging alerts, the Kontrol Öncesi Özet and the ONE consolidated Fısıltı item per patient. Server only.
 *
 * hasta-izolasyon: callers pass a doktorId from pratikOturum and a patientId that hastaSahibiMi has already proved; every
 * query below is scoped by BOTH. Consent (KVKK): without the patient's paylaşım onayı the doctor sees that the patient
 * has not shared home data — no values, no alerts, no summary.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { FisiltiItem } from '@/lib/doktor/fisiltiOrtak'
import { hastaAdiCoz } from '@/lib/iletisim/sunucu'
import { hekimAyarlariniTemizle, type HekimAyarlari } from './hedefler'
import { MODUL_ANAHTARLARI, type ModulAnahtari } from './moduller'
import { aktifIlacAdlari, klinikGirdi } from './ilacSinifi'
import { arsivsizIlaclar } from '@/lib/doktor/arsiv'
import { kontrolOncesiOzet, type KontrolOzeti } from './ozet'
import { evVerisiHesapla, type EvVerisiKarti } from './evVerisi'
import { kayitSatiri, notIcdSorgusu, OLCUM_SECIMI, olcumSatirlari, planSatiri, tercihSatiri, uyariSatiri, type IslemSonucu } from './sunucu'
import { hekimBransi } from '@/lib/doktor/hekimAdi'
import { gunEkle, trGun, trGunBasi, GUN_MS } from './zaman'
import { enYuksekTon, uyariTonu } from './uyariRenkleri'

export type { EvVerisiKarti }

type Sb = SupabaseClient

/** The card's data (all reads in one parallel batch; the computation is the pure evVerisiHesapla). */
export async function evVerisiKarti(sb: Sb, doktorId: string, patientId: string, simdiMs = Date.now()): Promise<EvVerisiKarti> {
  const bugun = trGun(simdiMs)
  const d90 = trGunBasi(gunEkle(bugun, -89)).toISOString()
  const d35 = trGunBasi(gunEkle(bugun, -34)).toISOString()
  const q = <T extends string>(t: T) => sb.from(t).select('*').eq('doctor_id', doktorId).eq('patient_id', patientId)
  const [tercih, hedef, brans, geb, olc, planR, kayitR, uyariR, ozetR, soruR, hasta, notlar, ilaclar] = await Promise.all([
    q('ev_tercihler').maybeSingle(),
    q('ev_hedefler').maybeSingle(),
    hekimBransi(sb, doktorId).catch(() => null),
    sb.from('gebelikler').select('id').eq('patient_id', patientId).eq('doctor_id', doktorId).eq('durum', 'aktif').limit(1).maybeSingle(),
    sb.from('ev_olcumleri').select(OLCUM_SECIMI).eq('doctor_id', doktorId).eq('patient_id', patientId).gte('olcum_at', d90).order('olcum_at', { ascending: true }).limit(1500),
    q('ev_ilac_planlari').limit(200),
    sb.from('ev_doz_kayitlari').select('id, plan_id, planlanan_at, durum, kayit_at, ertele_until').eq('doctor_id', doktorId).eq('patient_id', patientId).gte('planlanan_at', d35).limit(3000),
    q('ev_uyarilar').gte('olusturma_at', new Date(simdiMs - 30 * GUN_MS).toISOString()).order('olusturma_at', { ascending: false }).limit(50),
    q('ev_kontrol_ozetleri').order('olusturma_at', { ascending: false }).limit(1).maybeSingle(),
    sb.from('ev_sorular').select('metin, created_at').eq('doctor_id', doktorId).eq('patient_id', patientId).is('kapandi_at', null).order('created_at', { ascending: false }).limit(20),
    // HASTA-MODULLERI: what the patient file says — same parallel batch, no extra round trip.
    sb.from('patients').select('notes_encrypted').eq('id', patientId).eq('doctor_id', doktorId).maybeSingle(),
    notIcdSorgusu(sb, doktorId, patientId).then((r) => r, () => ({ data: [] })),
    arsivsizIlaclar(sb, 'id, ilac_adi, aktif, bitis_tarihi').eq('patient_id', patientId).eq('doctor_id', doktorId).eq('onay_durumu', 'onayli').eq('aktif', true).limit(60),
  ])
  return evVerisiHesapla({
    simdiMs, brans: await Promise.resolve(brans), gebelikAktif: !!geb.data, tercih: tercihSatiri(tercih.data), hekimAyarHam: hedef.data?.ayarlar,
    ...(() => { const o = olcumSatirlari(olc.data as Record<string, any>[]); return { olcumler: o.sayisal, isaretliOlcumler: o.isaretli } })(),
    planlar: ((planR.data || []) as Record<string, any>[]).map(planSatiri),
    kayitlar: ((kayitR.data || []) as Record<string, any>[]).map(kayitSatiri),
    uyarilar: ((uyariR.data || []) as Record<string, any>[]).map(uyariSatiri),
    kontrolOzeti: ozetR.data ? { id: String(ozetR.data.id), olusturmaAt: String(ozetR.data.olusturma_at), randevuAt: ozetR.data.randevu_at ?? null, ozet: ozetR.data.ozet as KontrolOzeti, metin: String(ozetR.data.metin) } : null,
    sorular: ((soruR.data || []) as Record<string, any>[]).map((s) => ({ metin: String(s.metin), tarih: String(s.created_at) })),
    klinik: klinikGirdi(hasta.data?.notes_encrypted ?? null, ((notlar as { data?: unknown }).data || []) as Array<Record<string, unknown>>, aktifIlacAdlari((ilaclar.data || []) as Record<string, any>[], bugun)),
  })
}

export async function hekimAyarKaydet(sb: Sb, doktorId: string, patientId: string, ham: unknown, userId: string): Promise<IslemSonucu> {
  const ayarlar = hekimAyarlariniTemizle(ham)
  // The thresholds panel does not carry the module switches: keep the stored ones (HASTA-MODULLERI).
  if (!(ham && typeof ham === 'object' && 'moduller' in ham)) {
    const { data } = await sb.from('ev_hedefler').select('ayarlar').eq('doctor_id', doktorId).eq('patient_id', patientId).maybeSingle()
    const once = data?.ayarlar ? hekimAyarlariniTemizle(data.ayarlar) : null
    if (once?.moduller) ayarlar.moduller = once.moduller
  }
  const { error } = await sb.from('ev_hedefler').upsert({ doctor_id: doktorId, patient_id: patientId, ayarlar, updated_by: userId, updated_at: new Date().toISOString() }, { onConflict: 'doctor_id,patient_id' })
  return error ? { ok: false, status: 500, hata: 'Kaydedilemedi.' } : { ok: true, ayarlar }
}

/**
 * HASTA-MODULLERI — the doctor switches one module for this patient: 'acik' / 'kapali' (always wins over the patient file,
 * the patient's choice and the branş default) or 'otomatik' (back to what the file / branş says). Read-merge-write of
 * ev_hedefler.ayarlar by doctor_id AND patient_id; the older `olcumler` / `kapali` lists are folded into `moduller`.
 */
export async function hekimModulKaydet(sb: Sb, doktorId: string, patientId: string, ham: { anahtar?: unknown; durum?: unknown }, userId: string): Promise<IslemSonucu> {
  const anahtar = ham?.anahtar as ModulAnahtari
  if (!MODUL_ANAHTARLARI.includes(anahtar) || !['acik', 'kapali', 'otomatik'].includes(String(ham?.durum))) return { ok: false, status: 422, hata: 'Geçersiz modül.' }
  const { data } = await sb.from('ev_hedefler').select('ayarlar').eq('doctor_id', doktorId).eq('patient_id', patientId).maybeSingle()
  const once: HekimAyarlari = data?.ayarlar ? hekimAyarlariniTemizle(data.ayarlar) : {}
  const acik = new Set<ModulAnahtari>([...(once.olcumler || []), ...(once.moduller?.acik || [])])
  const kapali = new Set<ModulAnahtari>([...(once.kapali || []), ...(once.moduller?.kapali || [])])
  for (const k of once.moduller?.acik || []) kapali.delete(k)
  for (const k of once.moduller?.kapali || []) acik.delete(k)
  acik.delete(anahtar); kapali.delete(anahtar)
  if (ham.durum === 'acik') acik.add(anahtar)
  if (ham.durum === 'kapali') kapali.add(anahtar)
  const { olcumler: _o, kapali: _k, ...kalan } = once
  const ayarlar: HekimAyarlari = { ...kalan, moduller: { acik: MODUL_ANAHTARLARI.filter((m) => acik.has(m)), kapali: MODUL_ANAHTARLARI.filter((m) => kapali.has(m)) } }
  const { error } = await sb.from('ev_hedefler').upsert({ doctor_id: doktorId, patient_id: patientId, ayarlar, updated_by: userId, updated_at: new Date().toISOString() }, { onConflict: 'doctor_id,patient_id' })
  return error ? { ok: false, status: 500, hata: 'Kaydedilemedi.' } : { ok: true, moduller: ayarlar.moduller }
}

export async function planHekimAyari(sb: Sb, doktorId: string, patientId: string, ham: { planId?: unknown; kritik?: unknown; minAralikSaat?: unknown }): Promise<IslemSonucu> {
  if (typeof ham.planId !== 'string') return { ok: false, status: 422, hata: 'İlaç bulunamadı.' }
  const g: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof ham.kritik === 'boolean') g.kritik = ham.kritik
  if (ham.minAralikSaat === null) g.min_aralik_saat = null
  else if (ham.minAralikSaat !== undefined) { const n = Number(ham.minAralikSaat); if (!(n > 0 && n <= 72)) return { ok: false, status: 422, hata: 'Aralık 1–72 saat olmalı.' }; g.min_aralik_saat = n }
  const { data } = await sb.from('ev_ilac_planlari').update(g).eq('id', ham.planId).eq('doctor_id', doktorId).eq('patient_id', patientId).select('id')
  return data && data.length ? { ok: true } : { ok: false, status: 404, hata: 'İlaç bulunamadı.' }
}

export async function uyarilariGordum(sb: Sb, doktorId: string, patientId: string): Promise<IslemSonucu> {
  await sb.from('ev_uyarilar').update({ hekim_gordu_at: new Date().toISOString() }).eq('doctor_id', doktorId).eq('patient_id', patientId).is('hekim_gordu_at', null)
  await sb.from('ev_kontrol_ozetleri').update({ hekim_gordu_at: new Date().toISOString() }).eq('doctor_id', doktorId).eq('patient_id', patientId).is('hekim_gordu_at', null)
  return { ok: true }
}

/** Build (or rebuild) the summary now. With `randevu` it is tied to that appointment (cron: the day before). */
export async function kontrolOzetiOlustur(sb: Sb, doktorId: string, patientId: string, randevu: { id: string; baslangic: string } | null, simdiMs = Date.now()): Promise<IslemSonucu> {
  const kart = await evVerisiKarti(sb, doktorId, patientId, simdiMs)
  if (!kart.onay) return { ok: false, status: 403, hata: 'Hasta ev verisini paylaşmaya onay vermedi.' }
  const d35 = new Date(simdiMs - 35 * GUN_MS).toISOString()
  const [olc, planR, kayitR, uyariR] = await Promise.all([
    sb.from('ev_olcumleri').select(OLCUM_SECIMI).eq('doctor_id', doktorId).eq('patient_id', patientId).gte('olcum_at', d35).limit(1500),
    sb.from('ev_ilac_planlari').select('*').eq('doctor_id', doktorId).eq('patient_id', patientId).limit(200),
    sb.from('ev_doz_kayitlari').select('id, plan_id, planlanan_at, durum, kayit_at, ertele_until').eq('doctor_id', doktorId).eq('patient_id', patientId).gte('planlanan_at', d35).limit(3000),
    sb.from('ev_uyarilar').select('*').eq('doctor_id', doktorId).eq('patient_id', patientId).gte('olusturma_at', d35).neq('duzey', 'bilgi').limit(100),
  ])
  const olcRows = olcumSatirlari(olc.data as Record<string, any>[])
  const ozet = kontrolOncesiOzet({
    olcumler: olcRows.sayisal, isaretliOlcumler: olcRows.isaretli,
    planlar: ((planR.data || []) as Record<string, any>[]).map(planSatiri),
    kayitlar: ((kayitR.data || []) as Record<string, any>[]).map(kayitSatiri),
    uyarilar: ((uyariR.data || []) as Record<string, any>[]).map(uyariSatiri),
    sorular: kart.sorular.map((s) => ({ metin: s.metin, createdAt: s.tarih })),
    esikler: kart.esikler as never, simdi: new Date(simdiMs).toISOString(), randevuAt: randevu?.baslangic ?? null, takipTipleri: kart.olcumTipleri,
  })
  const satir = { doctor_id: doktorId, patient_id: patientId, randevu_id: randevu?.id ?? null, randevu_at: randevu?.baslangic ?? null, ozet, metin: ozet.metin, olusturma_at: new Date(simdiMs).toISOString(), hekim_gordu_at: null }
  const { error } = randevu
    ? await sb.from('ev_kontrol_ozetleri').upsert(satir, { onConflict: 'randevu_id' })
    : await sb.from('ev_kontrol_ozetleri').insert(satir)
  return error ? { ok: false, status: 500, hata: 'Özet kaydedilemedi.' } : { ok: true, ozet }
}

/**
 * Fısıltı: ONE item per patient with unseen hekime_bildir / acil home-data alerts (consented patients only), plus a
 * waiting pre-visit summary. Two queries + one name lookup, independent of the number of patients.
 */
export async function evFisiltiOgeleri(sb: Sb, doktorId: string, brans: string): Promise<FisiltiItem[]> {
  const [uy, oz] = await Promise.all([
    sb.from('ev_uyarilar').select('patient_id, duzey, kural, hekim_metni, olusturma_at').eq('doctor_id', doktorId).is('hekim_gordu_at', null).in('duzey', ['hekime_bildir', 'acil']).gte('olusturma_at', new Date(Date.now() - 30 * GUN_MS).toISOString()).order('olusturma_at', { ascending: true }).limit(300),
    sb.from('ev_kontrol_ozetleri').select('patient_id, randevu_at, olusturma_at').eq('doctor_id', doktorId).is('hekim_gordu_at', null).gte('olusturma_at', new Date(Date.now() - 3 * GUN_MS).toISOString()).limit(100),
  ])
  if (uy.error || oz.error) return []
  const hastalar = new Map<string, { uyarilar: Array<{ duzey: string; kural: string; metin: string; at: string }>; ozet: string | null }>()
  for (const r of (uy.data || []) as Record<string, any>[]) {
    const h = hastalar.get(String(r.patient_id)) || { uyarilar: [], ozet: null }
    h.uyarilar.push({ duzey: String(r.duzey), kural: String(r.kural || ''), metin: String(r.hekim_metni), at: String(r.olusturma_at) })
    hastalar.set(String(r.patient_id), h)
  }
  for (const r of (oz.data || []) as Record<string, any>[]) {
    const h = hastalar.get(String(r.patient_id)) || { uyarilar: [], ozet: null }
    h.ozet = String(r.olusturma_at)
    hastalar.set(String(r.patient_id), h)
  }
  const ids = [...hastalar.keys()]
  if (!ids.length) return []
  const [onay, adlar] = await Promise.all([
    sb.from('ev_tercihler').select('patient_id').eq('doctor_id', doktorId).eq('paylasim_onayi', true).in('patient_id', ids),
    sb.from('patients').select('id, name_encrypted').eq('doctor_id', doktorId).in('id', ids),
  ])
  const onayli = new Set(((onay.data || []) as Record<string, any>[]).map((r) => String(r.patient_id)))
  const ad = new Map(((adlar.data || []) as Record<string, any>[]).map((r) => [String(r.id), hastaAdiCoz(r.name_encrypted) || 'Hasta']))
  const out: FisiltiItem[] = []
  for (const [pid, h] of hastalar) {
    if (!onayli.has(pid) || !ad.has(pid)) continue
    const acil = h.uyarilar.some((u) => u.duzey === 'acil')
    const baslik = h.uyarilar.length ? `Ev verisi: ${h.uyarilar.length} uyarı${acil ? ' (acil eşik)' : ''}` : 'Kontrol öncesi ev verisi özeti hazır'
    const detay = [...h.uyarilar.slice(-3).reverse().map((u) => u.metin), ...(h.ozet ? ['Kontrol öncesi özet hazır.'] : [])]
    // UYARI-RENKLERI: the item's tone = its most urgent alert (clinical outranks an adherence lapse).
    const evTon = enYuksekTon(h.uyarilar.map((u) => uyariTonu(u.duzey, u.kural)))
    out.push({ id: `ev:${pid}`, brans, patientId: pid, ad: ad.get(pid) as string, baslik, detay, enErkenTarih: h.uyarilar[0]?.at ?? h.ozet, hedefYol: `/dashboard/doktor/hastalar/${pid}?ev=1${h.uyarilar.length ? '&evAyrinti=uyarilar' : ''}`, toplamBekleyen: h.uyarilar.length, kaynak: 'ev', ...(evTon ? { evTon } : {}) })
  }
  return out
}
