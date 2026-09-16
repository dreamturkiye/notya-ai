/**
 * NOTYA-DAH-01 — Dahiliye API. Lab values are read from the lab engine (lab_satirlar onayli) — never re-parsed, never invented.
 * GET ?patientId= → header chips (KB, HbA1c+Δ, LDL, eGFR, TSH, ilaç sayısı, overdue), cards, görevler, sevkler, kırmızı bayraklar, refler
 * POST adim: kb {sbp,dbp,nabiz,kirilgan,sekonderSuphe,evreHekim?,hedefHekim?} | dm {...} | lipid {...} | tiroid {...} | checkup {panelIds,belgeIds,sustur?}
 *            | kirmizi {gogusAgrisi,yeniEkg,ates,acilSevkOnayi,not} | sevk {hedef,not,panelId?} | gorev {gorevId,durum}
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { decrypt } from '@/lib/security/encryption'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { aktifGebelikDurumu } from '@/lib/clinical/gebelikDurum'
import { htDegerlendir, dmDegerlendir, lipidDegerlendir, tiroidDegerlendir, checkupAraligi, dxaGorevi, ilacGuvenlik, kirmiziBayraklar, CHECKUP_SABLONU, SEVK_HEDEFLERI, REF_ACIKLAMA } from '@/specialties/dahiliye/engines/dahiliye'

export const dynamic = 'force-dynamic'
const bugun = () => new Date().toISOString().slice(0, 10)
type Sb = Awaited<ReturnType<typeof doktorOturum>> extends infer T ? (T extends { supabase: infer S } ? S : never) : never
type LabSatir = { canonical_key: string; kanonik_deger: number | null; value_text: string | null; numune_tarihi: string | null }

async function labSerisi(sb: Sb, patientId: string): Promise<Map<string, LabSatir[]>> {
  const { data } = await sb.from('lab_satirlar').select('canonical_key, kanonik_deger, value_text, numune_tarihi').eq('patient_id', patientId).eq('onayli', true).in('canonical_key', ['HbA1c', 'Glu', 'LDL', 'HDL', 'TG', 'TChol', 'Kre', 'eGFR', 'TSH', 'FT4', 'K', 'Na', 'Hb', 'WBC', 'ALT', 'AST', 'CK', 'Ferritin', 'B12', 'Folate', 'UA_protein']).not('numune_tarihi', 'is', null).order('numune_tarihi', { ascending: false }).limit(400)
  const m = new Map<string, LabSatir[]>()
  for (const r of data || []) { const k = String(r.canonical_key); if (!m.has(k)) m.set(k, []); m.get(k)!.push({ canonical_key: k, kanonik_deger: r.kanonik_deger == null ? null : Number(r.kanonik_deger), value_text: r.value_text, numune_tarihi: r.numune_tarihi ? String(r.numune_tarihi) : null }) }
  return m
}
const son = (m: Map<string, LabSatir[]>, k: string) => m.get(k)?.[0] ?? null
const sonDeger = (m: Map<string, LabSatir[]>, k: string) => son(m, k)?.kanonik_deger ?? null
async function gorevEkle(sb: Sb, doctorId: string, patientId: string, g: { kod: string; ad: string; due?: string | null; kaynak: string }[]) {
  for (const x of g) { const { data } = await sb.from('dahiliye_gorevleri').select('id').eq('patient_id', patientId).eq('kod', x.kod).eq('durum', 'acik').maybeSingle(); if (!data) await sb.from('dahiliye_gorevleri').insert({ patient_id: patientId, doctor_id: doctorId, kod: x.kod, ad: x.ad, due: x.due || null, kaynak: x.kaynak }) }
}
async function hastaBilgi(sb: Sb, doctorId: string, patientId: string) {
  const { data } = await sb.from('patients').select('id, dob_encrypted, gender_encrypted').eq('id', patientId).eq('doctor_id', doctorId).maybeSingle()
  if (!data) return null
  let yas: number | null = null, kadin = false
  try { if (data.dob_encrypted) { const d = new Date(decrypt(String(data.dob_encrypted))); const a = new Date(); yas = a.getFullYear() - d.getFullYear() - (a.getMonth() < d.getMonth() || (a.getMonth() === d.getMonth() && a.getDate() < d.getDate()) ? 1 : 0) } } catch { yas = null }
  try { kadin = data.gender_encrypted ? /^k|^f/i.test(decrypt(String(data.gender_encrypted))) : false } catch { kadin = false }
  return { id: data.id, yas, kadin }
}

export async function POST(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!b?.adim) return NextResponse.json({ error: 'adim gerekli' }, { status: 400 })
  const adim = String(b.adim)
  const hasta = await hastaBilgi(sb, user.id, String(b.patientId || ''))
  if (!hasta) return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
  const num = (v: unknown) => (v == null || v === '' ? null : Number(v))
  const T = bugun()

  if (adim === 'gorev') { const { error } = await sb.from('dahiliye_gorevleri').update({ durum: String(b.durum || 'tamam'), tamam_at: b.durum === 'tamam' ? new Date().toISOString() : null }).eq('id', String(b.gorevId || '')).eq('doctor_id', user.id); return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true }) }

  if (adim === 'kb') {
    const sbp = num(b.sbp), dbp = num(b.dbp)
    if (sbp == null || dbp == null) return NextResponse.json({ error: 'SBP/DBP zorunlu (her vizit)' }, { status: 400 })
    const { data: onceki } = await sb.from('dahiliye_ht').select('sbp, dbp, tarih').eq('patient_id', hasta.id).order('tarih', { ascending: false }).limit(3)
    const { data: ilaclar } = await sb.from('hasta_ilaclar').select('ilac_adi, etken_madde, aktif').eq('patient_id', hasta.id).eq('aktif', true)
    const anti = (ilaclar || []).filter((i) => /ramipril|lisinopril|enalapril|perindopril|valsartan|losartan|telmisartan|kandesartan|irbesartan|olmesartan|amlodipin|nifedipin|lerkanidipin|hidroklorotiyazid|indapamid|klortalidon|spironolakton|bisoprolol|metoprolol|nebivolol|doksazosin|pril|sartan|dipin/i.test(`${i.ilac_adi} ${i.etken_madde || ''}`))
    const diuretik = anti.some((i) => /hidroklorotiyazid|indapamid|klortalidon|spironolakton|furosemid/i.test(`${i.ilac_adi} ${i.etken_madde || ''}`))
    const d = htDegerlendir({ sbp, dbp, yas: hasta.yas, kirilgan: !!b.kirilgan, onceki: (onceki || []).map((o) => ({ sbp: Number(o.sbp), dbp: Number(o.dbp), tarih: String(o.tarih) })), aktifAntihipertansif: anti.length, diuretikVar: diuretik, sekonderSuphe: !!b.sekonderSuphe })
    const { error } = await sb.from('dahiliye_ht').insert({ patient_id: hasta.id, doctor_id: user.id, sbp, dbp, nabiz: num(b.nabiz), ev_kb: (b.evKb || null) as object | null, kirilgan: !!b.kirilgan, evre_taslak: d.sinif, evre_hekim: b.evreHekim ? String(b.evreHekim) : null, hedef_hekim: (b.hedefHekim || null) as object | null, sekonder_suphe: !!b.sekonderSuphe, degerlendirme: d })
    if (error) return NextResponse.json({ error: 'KB yazılamadı' }, { status: 500 })
    if (d.dogrulanmisHt) await gorevEkle(sb, user.id, hasta.id, d.baslangicTetkik.map((t, i) => ({ kod: `ht_tetkik_${i}`, ad: `HT başlangıç: ${t}`, due: T, kaynak: 'ht' })))
    if (d.sinif === 'artmis') await gorevEkle(sb, user.id, hasta.id, [{ kod: 'ht_kontrol_3ay', ad: 'Artmış KB: 3 ay yaşam tarzı → kontrol KB', due: new Date(Date.UTC(+T.slice(0, 4), +T.slice(5, 7) + 2, +T.slice(8, 10))).toISOString().slice(0, 10), kaynak: 'ht' }])
    for (const s of d.sevk) await sb.from('sevkler').insert({ patient_id: hasta.id, doctor_id: user.id, hedef: /nefro/i.test(s) ? 'nefroloji' : 'endokrinoloji', not_metni: s, kaynak: 'ht' })
    await gununNotunaEkle(sb, user.id, hasta.id, `KB ${sbp}/${dbp}${b.nabiz ? ` nabız ${b.nabiz}` : ''} — ${d.sinif} (Uzlaşı 2025 taslak)${b.evreHekim ? `; hekim evre: ${b.evreHekim}` : ''}${d.hedefteMi ? '; hedefte' : '; hedef dışı'}`)
    return NextResponse.json({ ok: true, degerlendirme: d })
  }
  const labs = await labSerisi(sb, hasta.id)
  if (adim === 'dm') {
    const hba1cSeri = (labs.get('HbA1c') || []).filter((x) => x.kanonik_deger != null)
    const siniflar = (Array.isArray(b.ilacSiniflari) ? b.ilacSiniflari : []).map(String)
    const d = dmDegerlendir({ tip: (b.tip as 'T2' | 'T1' | 'diger') || 'T2', taniTarihi: b.taniTarihi ? String(b.taniTarihi) : null, hba1c: hba1cSeri[0]?.kanonik_deger ?? null, oncekiHba1c: hba1cSeri.slice(1, 4).map((x) => ({ deger: x.kanonik_deger as number, tarih: x.numune_tarihi! })), hedefHba1c: num(b.hedefHba1c), ilacSiniflari: siniflar, eGFR: sonDeger(labs, 'eGFR'), sonUacr: b.sonUacr ? String(b.sonUacr) : son(labs, 'UA_protein')?.numune_tarihi || null, sonGozDibi: b.sonGozDibi ? String(b.sonGozDibi) : null, sonAyak: b.sonAyak ? String(b.sonAyak) : null, sonLipid: son(labs, 'LDL')?.numune_tarihi || null, bugun: T })
    const satir = { patient_id: hasta.id, doctor_id: user.id, tip: (b.tip as string) || 'T2', tani_tarihi: b.taniTarihi ? String(b.taniTarihi) : null, hedef_hba1c: num(b.hedefHba1c), ilac_siniflari: siniflar, son_uacr: b.sonUacr ? String(b.sonUacr) : null, son_goz_dibi: b.sonGozDibi ? String(b.sonGozDibi) : null, son_ayak: b.sonAyak ? String(b.sonAyak) : null, hipo_dka_notu: b.hipoDka ? String(b.hipoDka).slice(0, 500) : null, degerlendirme: d, updated_at: new Date().toISOString() }
    const { error } = await sb.from('dahiliye_dm').upsert(satir, { onConflict: 'patient_id' })
    if (error) return NextResponse.json({ error: 'DM yazılamadı' }, { status: 500 })
    await gorevEkle(sb, user.id, hasta.id, d.gorevler.map((g) => ({ ...g, kaynak: 'dm' })))
    if (d.gorevler.some((g) => g.kod === 'dm_goz')) { const { data: v } = await sb.from('sevkler').select('id').eq('patient_id', hasta.id).eq('hedef', 'goz').eq('durum', 'acik').maybeSingle(); if (!v) await sb.from('sevkler').insert({ patient_id: hasta.id, doctor_id: user.id, hedef: 'goz', not_metni: 'DM yıllık göz dibi (retinopati taraması)', kaynak: 'dm' }) }
    return NextResponse.json({ ok: true, degerlendirme: d })
  }
  if (adim === 'lipid') {
    const { data: dm } = await sb.from('dahiliye_dm').select('id').eq('patient_id', hasta.id).maybeSingle()
    const { data: ht } = await sb.from('dahiliye_ht').select('degerlendirme').eq('patient_id', hasta.id).order('tarih', { ascending: false }).limit(1).maybeSingle()
    const d = lipidDegerlendir({ tc: sonDeger(labs, 'TChol'), ldl: sonDeger(labs, 'LDL'), hdl: sonDeger(labs, 'HDL'), tg: sonDeger(labs, 'TG'), hedefLdl: num(b.hedefLdl), statinVar: !!b.statin, statinBaslangic: b.statinBaslangic ? String(b.statinBaslangic) : null, alt: (labs.get('ALT') || []).filter((x) => x.kanonik_deger != null).map((x) => ({ deger: x.kanonik_deger as number, tarih: x.numune_tarihi! })), ck: sonDeger(labs, 'CK'), dm: !!dm, ht: !!ht && (ht.degerlendirme as { dogrulanmisHt?: boolean })?.dogrulanmisHt === true, obezite: !!b.obezite, bugun: T })
    const { error } = await sb.from('dahiliye_lipid').upsert({ patient_id: hasta.id, doctor_id: user.id, hedef_ldl: num(b.hedefLdl), statin: b.statin ? String(b.statin) : null, statin_baslangic: b.statinBaslangic ? String(b.statinBaslangic) : null, ezetimib: !!b.ezetimib, diger: b.diger ? String(b.diger) : null, degerlendirme: d, updated_at: new Date().toISOString() }, { onConflict: 'patient_id' })
    if (error) return NextResponse.json({ error: 'Lipid yazılamadı' }, { status: 500 })
    if (d.yillikPanel) await gorevEkle(sb, user.id, hasta.id, [{ kod: 'lipid_yillik', ad: 'Yıllık lipid paneli (DM/HT/obezite)', due: son(labs, 'LDL')?.numune_tarihi ? new Date(Date.UTC(+son(labs, 'LDL')!.numune_tarihi!.slice(0, 4) + 1, +son(labs, 'LDL')!.numune_tarihi!.slice(5, 7) - 1, +son(labs, 'LDL')!.numune_tarihi!.slice(8, 10))).toISOString().slice(0, 10) : T, kaynak: 'lipid' }])
    return NextResponse.json({ ok: true, degerlendirme: d })
  }
  if (adim === 'tiroid') {
    const d = tiroidDegerlendir({ tsh: sonDeger(labs, 'TSH'), ft4: sonDeger(labs, 'FT4'), levoMcg: num(b.levoMcg), kiloKg: num(b.kiloKg), sonDozDegisim: b.sonDozDegisim ? String(b.sonDozDegisim) : null, nodulVar: !!b.nodul, bugun: T })
    const { error } = await sb.from('dahiliye_tiroid').upsert({ patient_id: hasta.id, doctor_id: user.id, levo_mcg: num(b.levoMcg), kilo_kg: num(b.kiloKg), son_doz_degisim: b.sonDozDegisim ? String(b.sonDozDegisim) : null, nodul: !!b.nodul, degerlendirme: d, updated_at: new Date().toISOString() }, { onConflict: 'patient_id' })
    if (error) return NextResponse.json({ error: 'Tiroid yazılamadı' }, { status: 500 })
    await gorevEkle(sb, user.id, hasta.id, d.gorevler.map((g) => ({ ...g, kaynak: 'tiroid' })))
    for (const s of d.sevk) await sb.from('sevkler').insert({ patient_id: hasta.id, doctor_id: user.id, hedef: 'endokrinoloji', not_metni: s, kaynak: 'tiroid' })
    return NextResponse.json({ ok: true, degerlendirme: d })
  }
  if (adim === 'checkup') {
    const ar = checkupAraligi(hasta.yas)
    const dxa = dxaGorevi(hasta.kadin, hasta.yas, !!b.erkenRisk)
    const { error } = await sb.from('dahiliye_checkup').insert({ patient_id: hasta.id, doctor_id: user.id, panel_ids: (Array.isArray(b.panelIds) ? b.panelIds : []).map(String), belge_ids: (Array.isArray(b.belgeIds) ? b.belgeIds : []).map(String), analiz_id: b.analizId ? String(b.analizId) : null, susturuldu: b.sustur === true })
    if (error) return NextResponse.json({ error: 'Check-up yazılamadı' }, { status: 500 })
    const g = [{ kod: 'checkup_tekrar', ad: `Sonraki check-up (${ar.not})`, due: new Date(Date.UTC(+T.slice(0, 4), +T.slice(5, 7) - 1 + ar.ay, +T.slice(8, 10))).toISOString().slice(0, 10), kaynak: 'checkup' }]
    if (dxa.gerekli) g.push({ kod: 'dxa', ad: 'DXA hatırlatması (TEMD Osteoporoz 2025)', due: T, kaynak: 'checkup' })
    if (!b.sustur) await gorevEkle(sb, user.id, hasta.id, g)
    await gununNotunaEkle(sb, user.id, hasta.id, `Dahiliye check-up paketi kaydedildi (${CHECKUP_SABLONU.length} kalem); Belgeler › Lab › Asistana raporla ile değerlendirilir.`)
    return NextResponse.json({ ok: true, aralik: ar, dxa })
  }
  if (adim === 'kirmizi') {
    const egfrSeri = (labs.get('eGFR') || []).filter((x) => x.kanonik_deger != null)
    const bayraklar = kirmiziBayraklar({ gogusAgrisi: !!b.gogusAgrisi, yeniEkg: !!b.yeniEkg, k: sonDeger(labs, 'K'), hb: sonDeger(labs, 'Hb'), eGFR: egfrSeri[0]?.kanonik_deger ?? null, oncekiEGFR: egfrSeri[1]?.kanonik_deger ?? null, ates: !!b.ates, wbc: sonDeger(labs, 'WBC') })
    if (bayraklar.length && !b.acilSevkOnayi) return NextResponse.json({ error: `Kırmızı bayrak: ${bayraklar.join(' | ')} — Onayla öncesi "acil / sevk" kutusu işaretlenmeli.`, bayraklar }, { status: 409 })
    if (bayraklar.length) { await sb.from('dahiliye_kirmizi').insert({ patient_id: hasta.id, doctor_id: user.id, bayraklar, acil_sevk_onayi: true, not_metni: b.not ? String(b.not).slice(0, 500) : null }); await gununNotunaEkle(sb, user.id, hasta.id, `⚠ Kırmızı bayrak: ${bayraklar.join('; ')} — hekim acil/sevk onayı verdi${b.not ? `: ${String(b.not)}` : ''}`) }
    return NextResponse.json({ ok: true, bayraklar })
  }
  if (adim === 'sevk') {
    const hedef = String(b.hedef || ''); if (!(SEVK_HEDEFLERI as readonly string[]).includes(hedef)) return NextResponse.json({ error: 'Sevk hedefi geçersiz' }, { status: 400 })
    const { data: panel } = await sb.from('lab_paneller').select('id').eq('patient_id', hasta.id).in('durum', ['onaylandi', 'muayene_onaylandi']).order('numune_tarihi', { ascending: false }).limit(1).maybeSingle()
    const { error } = await sb.from('sevkler').insert({ patient_id: hasta.id, doctor_id: user.id, hedef, not_metni: b.not ? String(b.not).slice(0, 500) : null, ek_lab_panel_id: panel?.id || null, kaynak: 'hekim' })
    if (error) return NextResponse.json({ error: 'Sevk yazılamadı' }, { status: 500 })
    await gununNotunaEkle(sb, user.id, hasta.id, `Sevk: ${hedef}${b.not ? ` — ${String(b.not)}` : ''}${panel ? ' (son onaylı lab paneli eklendi)' : ''}`)
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Geçersiz adim' }, { status: 400 })
}

export async function GET(req: NextRequest) {
  const oturum = await doktorOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { user, supabase: sb } = oturum
  const patientId = req.nextUrl.searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId gerekli' }, { status: 400 })
  const hasta = await hastaBilgi(sb, user.id, patientId)
  if (!hasta) return NextResponse.json({ error: 'Hasta bulunamadı' }, { status: 404 })
  const T = bugun()
  const [labs, ht, dm, lipid, tiroid, checkup, gorevler, sevkler, ilaclar, gebe, jineDue] = await Promise.all([
    labSerisi(sb, hasta.id),
    sb.from('dahiliye_ht').select('*').eq('patient_id', hasta.id).order('tarih', { ascending: false }).limit(6),
    sb.from('dahiliye_dm').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_lipid').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_tiroid').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_checkup').select('*').eq('patient_id', hasta.id).order('tarih', { ascending: false }).limit(3),
    sb.from('dahiliye_gorevleri').select('*').eq('patient_id', hasta.id).eq('durum', 'acik').order('due'),
    sb.from('sevkler').select('*').eq('patient_id', hasta.id).eq('durum', 'acik').order('created_at', { ascending: false }),
    sb.from('hasta_ilaclar').select('id, ilac_adi, etken_madde, doz, kullanim_sikli, baslangic_tarihi, aktif').eq('patient_id', hasta.id).order('created_at', { ascending: false }),
    sb.from('gebelikler').select('durum').eq('patient_id', hasta.id),
    hasta.kadin ? sb.from('jine_gorevleri').select('ad, due').eq('patient_id', hasta.id).eq('durum', 'acik').in('kod', ['pap', 'hpv', 'mamografi']).limit(3) : Promise.resolve({ data: [] as { ad: string; due: string | null }[] }),
  ])
  const sonKb = ht.data?.[0] || null
  const hba1c = (labs.get('HbA1c') || []).filter((x) => x.kanonik_deger != null)
  const ilacListe = (ilaclar.data || []).map((i) => ({ ad: `${i.ilac_adi} ${i.etken_madde || ''}`, aktif: i.aktif !== false }))
  const guvenlik = ilacGuvenlik(ilacListe, sonDeger(labs, 'eGFR'))
  const overdue = gorevler.data?.some((g) => g.due && g.due < T) || false
  const kbBugun = sonKb?.tarih === T
  const chips = { kb: sonKb ? { sbp: sonKb.sbp, dbp: sonKb.dbp, tarih: sonKb.tarih, bugun: kbBugun } : null, hba1c: hba1c[0] ? { deger: hba1c[0].kanonik_deger, tarih: hba1c[0].numune_tarihi, delta: hba1c[1] ? Math.round(((hba1c[0].kanonik_deger as number) - (hba1c[1].kanonik_deger as number)) * 10) / 10 : null } : null, ldl: son(labs, 'LDL'), egfr: son(labs, 'eGFR'), tsh: son(labs, 'TSH'), k: son(labs, 'K'), hb: son(labs, 'Hb'), ilacSayi: guvenlik.aktifSayi, polifarmasi: guvenlik.polifarmasi, kirmizi: overdue || !kbBugun }
  return NextResponse.json({ hasta: { yas: hasta.yas, kadin: hasta.kadin, gebe: (gebe.data || []).some((g) => aktifGebelikDurumu(g.durum)) }, chips, ht: ht.data || [], dm: dm.data, lipid: lipid.data, tiroid: tiroid.data, checkup: checkup.data || [], gorevler: gorevler.data || [], sevkler: sevkler.data || [], ilaclar: ilaclar.data || [], ilacUyari: guvenlik.uyarilar, jineDue: jineDue.data || [], checkupAralik: checkupAraligi(hasta.yas), kutuphane: { checkup: CHECKUP_SABLONU, sevk: SEVK_HEDEFLERI, refler: REF_ACIKLAMA } })
}
