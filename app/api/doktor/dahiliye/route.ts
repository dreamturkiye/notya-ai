/**
 * NOTYA-DAH-01 — Dahiliye API. Lab values are read from the lab engine (lab_satirlar onayli) — never re-parsed, never invented.
 * GET ?patientId= → header chips (KB, HbA1c+Δ, LDL, eGFR, TSH, ilaç sayısı, overdue), cards, görevler, sevkler, kırmızı bayraklar, refler
 * POST adim: kb {sbp,dbp,nabiz,kirilgan,sekonderSuphe,evreHekim?,hedefHekim?} | dm {...} | lipid {...} | tiroid {...} | checkup {panelIds,belgeIds,sustur?}
 *            | kirmizi {gogusAgrisi,yeniEkg,ates,acilSevkOnayi,not} | sevk {hedef,not,panelId?} | gorev {gorevId,durum}
 *            | WOW-NEXT (_wow5): polifarmasi_karar | polifarmasi_nota | hedefkart | sigara | vitamin | gut | osteo | osteo_belge | kart_nota
 */
import { NextRequest, NextResponse } from 'next/server'
import { doktorOturum } from '@/lib/doktor/serverAuth'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { aktifGebelikDurumu } from '@/lib/clinical/gebelikDurum'
import { htDegerlendir, dmDegerlendir, lipidDegerlendir, tiroidDegerlendir, checkupAraligi, dxaGorevi, ilacGuvenlik, kirmiziBayraklar, CHECKUP_SABLONU, SEVK_HEDEFLERI, REF_ACIKLAMA, KIRMIZI_DIPNOT, ILAC_GUVENLIK_DIPNOT } from '@/specialties/dahiliye/engines/dahiliye'
import { kvrDegerlendir } from '@/specialties/dahiliye/engines/score2'
import { ckdDegerlendir, nefroSevkPaketi } from '@/specialties/dahiliye/engines/ckd'
import { ilacIzlemGorevleri } from '@/specialties/dahiliye/engines/ilacIzlem'
import { evKbOzeti, evGlukozOzeti } from '@/specialties/dahiliye/engines/evKayit'
import { vizitSeridi } from '@/specialties/dahiliye/engines/serit'
import { kilitDogrula, kilitDegeri, type HekimKilit } from '@/specialties/dahiliye/engines/kart'
import { sgkRaporTaslagi, SGK_SABLONLARI, type SgkSablon, type SgkLab } from '@/specialties/dahiliye/engines/sgkRapor'
import { enabizSgkRapor } from '@/lib/enabiz/paket'
import { RAPOR_TIPLERI } from '@/lib/sgk/raporTipleri'
import { wow2Verisi, wow2Post } from './_wow2'
import { wow3Verisi, wow3Post } from './_wow3'
import { wow4Verisi, wow4Post } from './_wow4'
import { wow5Verisi, wow5Post } from './_wow5'
import { type Sb, type LabSatir, labSerisi, son, sonDeger, gorevEkle, hastaBilgi, hastaAdi, hekimKimlik, labKayit } from './_ortak'
import { arsivsizIlaclar } from '@/lib/doktor/arsiv'

export const dynamic = 'force-dynamic'
const bugun = () => new Date().toISOString().slice(0, 10)
// ---------- NOTYA-DAH-WOW W0/W1: kilitler, KVR, KBH, ev kayıt, ilaç izlem, şerit ----------
type IlacRow = { id: string; ilac_adi: string; etken_madde: string | null; doz: string | null; kullanim_sikli: string | null; baslangic_tarihi: string | null; aktif: boolean | null }
async function wowVerisi(sb: Sb, doctorId: string, hasta: { id: string; yas: number | null; kadin: boolean }, labs: Map<string, LabSatir[]>, ilaclar: IlacRow[], dm: Record<string, unknown> | null, ht: Record<string, unknown> | null, lipid: Record<string, unknown> | null, T: string) {
  const [kvrQ, ckdQ, evQ, kilitQ] = await Promise.all([
    sb.from('dahiliye_kvr').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_ckd').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_ev_kayitlari').select('id, tip, sbp, dbp, deger, aclik, olcum_at, kaynak').eq('patient_id', hasta.id).gte('olcum_at', new Date(Date.now() - 60 * 86400000).toISOString()).order('olcum_at', { ascending: false }).limit(200),
    sb.from('dahiliye_kart_kilitleri').select('kart, alan, deger, created_at').eq('patient_id', hasta.id).order('created_at', { ascending: false }).limit(200),
  ])
  const kilitler = (kilitQ.data || []) as HekimKilit[]
  const aktifIlac = ilaclar.filter((i) => i.aktif !== false)
  const ilacMetin = aktifIlac.map((i) => `${i.ilac_adi} ${i.etken_madde || ''}`.toLowerCase())
  const varMi = (re: RegExp) => ilacMetin.some((x) => re.test(x))
  const egfr = sonDeger(labs, 'eGFR'), egfrTarih = son(labs, 'eGFR')?.numune_tarihi || null
  const uacrLab = son(labs, 'UACR')
  const ckdRow = ckdQ.data || null
  const uacr = uacrLab?.kanonik_deger ?? (ckdRow?.uacr_manual != null ? Number(ckdRow.uacr_manual) : null)
  const uacrKaynak = uacrLab ? `lab ${uacrLab.numune_tarihi || ''}` : ckdRow?.uacr_manual != null ? `hekim girişi ${ckdRow.uacr_tarih || ''}` : ''
  const oncekiEGFR = (labs.get('eGFR') || []).slice(1).filter((x) => x.kanonik_deger != null && x.numune_tarihi).map((x) => ({ deger: x.kanonik_deger as number, tarih: x.numune_tarihi as string }))
  const ckdSonuc = ckdDegerlendir({ eGFR: egfr, eGFRTarih: egfrTarih, oncekiEGFR, uacr, uacrTarih: uacrLab?.numune_tarihi || ckdRow?.uacr_tarih || null, dm: !!dm, ht: !!ht, rasBlokeri: !!ckdRow?.ras_blokeri || varMi(/pril\b|sartan/), sglt2: !!ckdRow?.sglt2 || varMi(/gliflozin/), nsaii: !!ckdRow?.nsaii, k: sonDeger(labs, 'K'), hb: sonDeger(labs, 'Hb'), bugun: T })
  const kvrRow = kvrQ.data || null
  const dmSatir = dm as { tip?: string; tani_tarihi?: string | null } | null
  const dmSure10 = !!kvrRow?.dm_sure_10y || (!!dmSatir?.tani_tarihi && dmSatir.tani_tarihi <= new Date(Date.now() - 10 * 365 * 86400000).toISOString().slice(0, 10))
  const lipidSatir = lipid as { hedef_ldl?: number | null; statin?: string | null; ezetimib?: boolean } | null
  const taniYilOnce = dmSatir?.tani_tarihi ? Math.floor((Date.parse(T) - Date.parse(dmSatir.tani_tarihi)) / (365.25 * 86400000)) : null
  const dmTaniYasi = kvrRow?.dm_tani_yasi != null ? Number(kvrRow.dm_tani_yasi) : hasta.yas != null && taniYilOnce != null && taniYilOnce >= 0 ? hasta.yas - taniYilOnce : null
  const kvrSonuc = kvrDegerlendir({ hba1cYuzde: sonDeger(labs, 'HbA1c'), dmTaniYasi, yas: hasta.yas, cinsiyet: hasta.kadin ? 'kadin' : 'erkek', sigara: !!kvrRow?.sigara, sbp: (ht as { sbp?: number } | null)?.sbp, tcholMgdl: sonDeger(labs, 'TChol') ?? undefined, hdlMgdl: sonDeger(labs, 'HDL') ?? undefined, askvh: !!kvrRow?.askvh, dm: !!dm, dmTod: !!kvrRow?.dm_tod, dmSure10Yil: dmSure10, eGFR: egfr, uacr, ldlMgdl: sonDeger(labs, 'LDL'), statinYogunluk: (kvrRow?.statin_yogunluk as 'yok' | 'dusuk' | 'orta' | 'yuksek') || (lipidSatir?.statin ? 'orta' : 'yok'), ezetimib: !!kvrRow?.ezetimib || !!lipidSatir?.ezetimib })
  const evRows = (evQ.data || []) as { id: string; tip: string; sbp: number | null; dbp: number | null; deger: number | null; aclik: boolean | null; olcum_at: string; kaynak: string }[]
  const ofis = ht as { sbp?: number; dbp?: number } | null
  const evKb = evKbOzeti(evRows.filter((r) => r.tip === 'kb' && r.sbp != null && r.dbp != null).map((r) => ({ sbp: r.sbp as number, dbp: r.dbp as number, olcumAt: r.olcum_at })), ofis?.sbp != null && ofis.dbp != null ? { sbp: ofis.sbp, dbp: ofis.dbp } : null, T)
  const evGlukoz = evGlukozOzeti(evRows.filter((r) => r.tip === 'glukoz' && r.deger != null).map((r) => ({ deger: Number(r.deger), olcumAt: r.olcum_at, aclik: r.aclik !== false })), T)
  const sonLab: Record<string, string | null> = {}
  for (const [k, arr] of labs) sonLab[k] = arr[0]?.numune_tarihi || null
  const izlem = ilacIzlemGorevleri(aktifIlac.map((i) => ({ ad: i.ilac_adi, etken: i.etken_madde, baslangic: i.baslangic_tarihi, aktif: true })), sonLab, T)
  return {
    kvr: { dm_tani_yasi: dmTaniYasi, sigara: !!kvrRow?.sigara, askvh: !!kvrRow?.askvh, dm_tod: !!kvrRow?.dm_tod, dm_sure_10y: dmSure10, statin_yogunluk: String(kvrRow?.statin_yogunluk || 'yok'), ezetimib: !!kvrRow?.ezetimib, sonuc: kvrSonuc, kilitKategori: kilitDegeri<string>(kilitler, 'kvr', 'kategori'), kilitHedefLdl: kilitDegeri<number>(kilitler, 'kvr', 'hedef_ldl') ?? (lipidSatir?.hedef_ldl ?? null) },
    ckd: { uacr_manual: ckdRow?.uacr_manual ?? null, uacr_tarih: ckdRow?.uacr_tarih ?? null, ras_blokeri: !!ckdRow?.ras_blokeri, sglt2: !!ckdRow?.sglt2, nsaii: !!ckdRow?.nsaii, sonuc: ckdSonuc, egfr, uacr, uacrKaynak, kilitEvre: kilitDegeri<string>(kilitler, 'ckd', 'evre') },
    ev: { kb: evKb, glukoz: evGlukoz, kayitlar: evRows.slice(0, 40) },
    izlem, kilitler, ckdSonuc, kvrSonuc,
  }
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

  const w2 = await wow2Post(adim, b, sb, user.id, hasta, T); if (w2) return w2
  const w4 = await wow4Post(adim, b, sb, user.id, hasta); if (w4) return w4
  const w3 = await wow3Post(adim, b, sb, user.id, hasta, T, () => labSerisi(sb, hasta.id)); if (w3) return w3
  const w5 = await wow5Post(adim, b, sb, user, hasta, T, () => labSerisi(sb, hasta.id)); if (w5) return w5

  if (adim === 'gorev') { const { error } = await sb.from('dahiliye_gorevleri').update({ durum: String(b.durum || 'tamam'), tamam_at: b.durum === 'tamam' ? new Date().toISOString() : null }).eq('id', String(b.gorevId || '')).eq('doctor_id', user.id); return error ? NextResponse.json({ error: 'Yazılamadı' }, { status: 500 }) : NextResponse.json({ ok: true }) }

  if (adim === 'kilit') {
    const kart = String(b.kart || ''), alan = String(b.alan || '')
    const hata = kilitDogrula(kart, alan); if (hata) return NextResponse.json({ error: hata }, { status: 400 })
    const { error } = await sb.from('dahiliye_kart_kilitleri').insert({ patient_id: hasta.id, doctor_id: user.id, kart, alan, deger: b.deger ?? null, kaynak: b.kaynak ? String(b.kaynak) : null })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }
  if (adim === 'kvr') {
    const { error } = await sb.from('dahiliye_kvr').upsert({ patient_id: hasta.id, doctor_id: user.id, sigara: !!b.sigara, askvh: !!b.askvh, dm_tod: !!b.dmTod, dm_sure_10y: !!b.dmSure10Yil, statin_yogunluk: ['yok', 'dusuk', 'orta', 'yuksek'].includes(String(b.statinYogunluk)) ? String(b.statinYogunluk) : 'yok', ezetimib: !!b.ezetimib, ...(b.dmTaniYasi !== undefined ? { dm_tani_yasi: b.dmTaniYasi === '' || b.dmTaniYasi == null ? null : Math.round(Number(b.dmTaniYasi)) } : {}), updated_at: new Date().toISOString() }, { onConflict: 'patient_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }
  if (adim === 'ckd') {
    const guncel: Record<string, unknown> = { patient_id: hasta.id, doctor_id: user.id, ras_blokeri: !!b.rasBlokeri, sglt2: !!b.sglt2, nsaii: !!b.nsaii, updated_at: new Date().toISOString() }
    if (b.uacr != null && b.uacr !== '') { guncel.uacr_manual = num(b.uacr); guncel.uacr_tarih = b.uacrTarih ? String(b.uacrTarih) : T }
    const { error } = await sb.from('dahiliye_ckd').upsert(guncel, { onConflict: 'patient_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (b.sevk) {
      const labs = await labSerisi(sb, hasta.id)
      const [dm, ht, lipid, ilaclar] = await Promise.all([sb.from('dahiliye_dm').select('*').eq('patient_id', hasta.id).maybeSingle(), sb.from('dahiliye_ht').select('*').eq('patient_id', hasta.id).order('tarih', { ascending: false }).limit(1).maybeSingle(), sb.from('dahiliye_lipid').select('*').eq('patient_id', hasta.id).maybeSingle(), arsivsizIlaclar(sb, 'id, ilac_adi, etken_madde, doz, kullanim_sikli, baslangic_tarihi, aktif').eq('patient_id', hasta.id).eq('aktif', true)])
      const w = await wowVerisi(sb, user.id, hasta, labs, (ilaclar.data || []) as IlacRow[], dm.data, ht.data, lipid.data, T)
      const panel = ['eGFR', 'Kre', 'UACR', 'K', 'Na', 'Hb', 'HbA1c'].map((k) => { const r = son(labs, k); return r && r.kanonik_deger != null ? { ad: k, deger: String(r.kanonik_deger), tarih: r.numune_tarihi || '' } : null }).filter((x): x is { ad: string; deger: string; tarih: string } => !!x)
      const paket = nefroSevkPaketi(w.ckdSonuc, panel, { yas: hasta.yas, kadin: hasta.kadin }, (ilaclar.data || []).map((i) => i.ilac_adi))
      const { data: p } = await sb.from('lab_paneller').select('id').eq('patient_id', hasta.id).in('durum', ['onaylandi', 'muayene_onayli']).order('created_at', { ascending: false }).limit(1).maybeSingle()
      await sb.from('sevkler').insert({ patient_id: hasta.id, doctor_id: user.id, hedef: 'nefroloji', not_metni: paket, ek_lab_panel_id: p?.id || null, kaynak: 'dahiliye_ckd' })
    }
    return NextResponse.json({ ok: true })
  }
  if (adim === 'evkayit') {
    const tip = String(b.tip || 'kb')
    if (!['kb', 'glukoz', 'kilo', 'nabiz'].includes(tip)) return NextResponse.json({ error: 'tip geçersiz' }, { status: 400 })
    const satir: Record<string, unknown> = { patient_id: hasta.id, doctor_id: user.id, tip, olcum_at: b.olcumAt ? new Date(String(b.olcumAt)).toISOString() : new Date().toISOString(), kaynak: 'hekim' }
    if (tip === 'kb') { satir.sbp = num(b.sbp); satir.dbp = num(b.dbp); if (satir.sbp == null || satir.dbp == null) return NextResponse.json({ error: 'SBP/DBP zorunlu' }, { status: 400 }) }
    else { satir.deger = num(b.deger); if (satir.deger == null) return NextResponse.json({ error: 'değer zorunlu' }, { status: 400 }); if (tip === 'glukoz') satir.aclik = b.aclik !== false }
    const { error } = await sb.from('dahiliye_ev_kayitlari').insert(satir)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }
  if (adim === 'ilacizlem') {
    const labs = await labSerisi(sb, hasta.id)
    const { data: ilaclar } = await arsivsizIlaclar(sb, 'id, ilac_adi, etken_madde, doz, kullanim_sikli, baslangic_tarihi, aktif').eq('patient_id', hasta.id).eq('aktif', true)
    const sonLab: Record<string, string | null> = {}
    for (const [k, arr] of labs) sonLab[k] = arr[0]?.numune_tarihi || null
    const g = ilacIzlemGorevleri(((ilaclar || []) as IlacRow[]).map((i) => ({ ad: i.ilac_adi, etken: i.etken_madde, baslangic: i.baslangic_tarihi, aktif: true })), sonLab, T)
    await gorevEkle(sb, user.id, hasta.id, g.map((x) => ({ kod: x.kod, ad: `${x.ad} (${x.ilac})`, due: x.due, kaynak: 'ilac_izlem' })))
    return NextResponse.json({ ok: true, sayi: g.length })
  }
  if (adim === 'sgkrapor') {
    const sablon = String(b.sablon || '') as SgkSablon
    if (!SGK_SABLONLARI.some((x) => x.id === sablon)) return NextResponse.json({ error: 'Şablon geçersiz' }, { status: 400 })
    const [labs, ilaclar, htQ, dmQ, kvrQ, kilitQ, ad, hekim] = await Promise.all([
      labSerisi(sb, hasta.id),
      arsivsizIlaclar(sb, 'ilac_adi, etken_madde, aktif').eq('patient_id', hasta.id).eq('aktif', true),
      sb.from('dahiliye_ht').select('sbp, dbp, tarih, evre_hekim').eq('patient_id', hasta.id).order('tarih', { ascending: false }).limit(3),
      sb.from('dahiliye_dm').select('tip').eq('patient_id', hasta.id).maybeSingle(),
      sb.from('dahiliye_kvr').select('askvh').eq('patient_id', hasta.id).maybeSingle(),
      sb.from('dahiliye_kart_kilitleri').select('kart, alan, deger, created_at').eq('patient_id', hasta.id).in('kart', ['kvr', 'ht']).order('created_at', { ascending: false }).limit(50),
      hastaAdi(sb, user.id, hasta.id), hekimKimlik(sb, user),
    ])
    const kilitler = (kilitQ.data || []) as HekimKilit[]
    const cv = (b.chaVasc || {}) as Record<string, unknown>
    const sonuc = sgkRaporTaslagi({ sablon, hasta: { adSoyad: ad, yas: hasta.yas, kadin: hasta.kadin }, bugun: T,
      ilaclar: (ilaclar.data || []).map((i) => ({ ad: String(i.ilac_adi), etken: i.etken_madde, aktif: true })), labs: labKayit(labs),
      kbSerisi: (htQ.data || []).map((h) => ({ sbp: Number(h.sbp), dbp: Number(h.dbp), tarih: String(h.tarih) })),
      htEvreHekim: kilitDegeri<string>(kilitler, 'ht', 'evre') || (htQ.data?.find((h) => h.evre_hekim)?.evre_hekim as string | undefined) || null,
      dmTip: (dmQ.data?.tip as 'T2' | 'T1' | 'diger' | undefined) || null, kvrKategoriHekim: kilitDegeri<string>(kilitler, 'kvr', 'kategori'), askvh: !!kvrQ.data?.askvh,
      doakEndikasyon: ['af', 'dvt', 'pe'].includes(String(b.doakEndikasyon)) ? (String(b.doakEndikasyon) as 'af' | 'dvt' | 'pe') : null,
      chaVasc: { kky: !!cv.kky, ht: !!cv.ht, dm: !!cv.dm, inmeTia: !!cv.inmeTia, vaskuler: !!cv.vaskuler }, mekanikKapak: !!b.mekanikKapak, sureAy: num(b.sureAy) ?? 12 })
    const tip = RAPOR_TIPLERI.find((t) => t.id === 'ilac_kullanim')!
    const enabiz = enabizSgkRapor({ raporTipiId: tip.id, raporTipiLabel: tip.label, draft: sonuc.draft, hekim })
    const { data: kayit, error } = await sb.from('dahiliye_sgk_raporlari').insert({ patient_id: hasta.id, doctor_id: user.id, sablon, draft: { ...sonuc.draft, hastaAdi: '', tcSon4: '' }, sut_kontrol: sonuc.sutKontrol, eksikler: sonuc.eksikler }).select('id').maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, raporId: kayit?.id || null, ...sonuc, hekim, enabiz, raporTipi: tip })
  }
  if (adim === 'sgkkilit') {
    const raporId = String(b.raporId || '')
    const { data: r } = await sb.from('dahiliye_sgk_raporlari').select('id, eksikler, draft').eq('id', raporId).eq('doctor_id', user.id).eq('patient_id', hasta.id).maybeSingle()
    if (!r) return NextResponse.json({ error: 'Rapor bulunamadı' }, { status: 404 })
    if ((r.eksikler as string[] | null)?.some((e) => /MEKANİK KAPAK/.test(e))) return NextResponse.json({ error: 'Mekanik kapakta DOAK raporu kilitlenemez' }, { status: 409 })
    const duzen = (b.draft || {}) as Record<string, unknown>
    const draft = { ...(r.draft as Record<string, unknown>), ...(typeof duzen.hekim_degerlendirmesi === 'string' ? { hekim_degerlendirmesi: String(duzen.hekim_degerlendirmesi).slice(0, 3000) } : {}), hastaAdi: '', tcSon4: '' }
    const { error } = await sb.from('dahiliye_sgk_raporlari').update({ durum: 'kilitli', kilit_at: new Date().toISOString(), draft }).eq('id', raporId).eq('doctor_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const rn = await gununNotunaEkle(sb, user.id, hasta.id, `SGK ilaç kullanım raporu taslağı hekim tarafından onaylandı (${String((r.draft as { tani?: { icd10?: string } })?.tani?.icd10 || '')}) — Medula'ya e-imza ile girilir.`)
    return NextResponse.json({ ok: true, notId: rn.eklendi ? rn.notId : null }) // NOTYA-MUAYENEYE-DON-01
  }
  if (adim === 'kb') {
    const sbp = num(b.sbp), dbp = num(b.dbp)
    if (sbp == null || dbp == null) return NextResponse.json({ error: 'SBP/DBP zorunlu (her vizit)' }, { status: 400 })
    const { data: onceki } = await sb.from('dahiliye_ht').select('sbp, dbp, tarih').eq('patient_id', hasta.id).order('tarih', { ascending: false }).limit(3)
    const { data: ilaclar } = await arsivsizIlaclar(sb, 'ilac_adi, etken_madde, aktif').eq('patient_id', hasta.id).eq('aktif', true)
    const anti = (ilaclar || []).filter((i) => /ramipril|lisinopril|enalapril|perindopril|valsartan|losartan|telmisartan|kandesartan|irbesartan|olmesartan|amlodipin|nifedipin|lerkanidipin|hidroklorotiyazid|indapamid|klortalidon|spironolakton|bisoprolol|metoprolol|nebivolol|doksazosin|pril|sartan|dipin/i.test(`${i.ilac_adi} ${i.etken_madde || ''}`))
    const diuretik = anti.some((i) => /hidroklorotiyazid|indapamid|klortalidon|spironolakton|furosemid/i.test(`${i.ilac_adi} ${i.etken_madde || ''}`))
    const d = htDegerlendir({ sbp, dbp, yas: hasta.yas, kirilgan: !!b.kirilgan, onceki: (onceki || []).map((o) => ({ sbp: Number(o.sbp), dbp: Number(o.dbp), tarih: String(o.tarih) })), aktifAntihipertansif: anti.length, diuretikVar: diuretik, sekonderSuphe: !!b.sekonderSuphe })
    const { error } = await sb.from('dahiliye_ht').insert({ patient_id: hasta.id, doctor_id: user.id, sbp, dbp, nabiz: num(b.nabiz), ev_kb: (b.evKb || null) as object | null, kirilgan: !!b.kirilgan, evre_taslak: d.sinif, evre_hekim: b.evreHekim ? String(b.evreHekim) : null, hedef_hekim: (b.hedefHekim || null) as object | null, sekonder_suphe: !!b.sekonderSuphe, degerlendirme: d, teknik_onay: b.teknikOnay === undefined ? false : !!b.teknikOnay, teknik_liste: Array.isArray(b.teknikListe) ? b.teknikListe : null })
    if (error) return NextResponse.json({ error: 'KB yazılamadı' }, { status: 500 })
    if (d.dogrulanmisHt) await gorevEkle(sb, user.id, hasta.id, d.baslangicTetkik.map((t, i) => ({ kod: `ht_tetkik_${i}`, ad: `HT başlangıç: ${t}`, due: T, kaynak: 'ht' })))
    if (d.sinif === 'artmis') await gorevEkle(sb, user.id, hasta.id, [{ kod: 'ht_kontrol_3ay', ad: 'Artmış KB: 3 ay yaşam tarzı → kontrol KB', due: new Date(Date.UTC(+T.slice(0, 4), +T.slice(5, 7) + 2, +T.slice(8, 10))).toISOString().slice(0, 10), kaynak: 'ht' }])
    for (const s of d.sevk) await sb.from('sevkler').insert({ patient_id: hasta.id, doctor_id: user.id, hedef: /nefro/i.test(s) ? 'nefroloji' : 'endokrinoloji', not_metni: s, kaynak: 'ht' })
    await gununNotunaEkle(sb, user.id, hasta.id, `KB ${sbp}/${dbp}${b.nabiz ? ` nabız ${b.nabiz}` : ''} — ${d.sinif} (Uzlaşı 2025 taslak)${b.evreHekim ? `; hekim evre: ${b.evreHekim}` : ''}${d.hedefteMi ? '; hedefte' : b.teknikOnay ? '; hedef dışı' : '; hedef dışı (ölçüm tekniği doğrulanmadı — kontrolsüz denmeden önce doğrulayın)'}`)
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
  const [labs, ht, dm, lipid, tiroid, checkup, gorevler, sevkler, ilaclar, gebe, jineDue, sgkRaporlar] = await Promise.all([
    labSerisi(sb, hasta.id),
    sb.from('dahiliye_ht').select('*').eq('patient_id', hasta.id).order('tarih', { ascending: false }).limit(6),
    sb.from('dahiliye_dm').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_lipid').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_tiroid').select('*').eq('patient_id', hasta.id).maybeSingle(),
    sb.from('dahiliye_checkup').select('*').eq('patient_id', hasta.id).order('tarih', { ascending: false }).limit(3),
    sb.from('dahiliye_gorevleri').select('*').eq('patient_id', hasta.id).eq('durum', 'acik').order('due'),
    sb.from('sevkler').select('*').eq('patient_id', hasta.id).eq('durum', 'acik').order('created_at', { ascending: false }),
    arsivsizIlaclar(sb, 'id, ilac_adi, etken_madde, doz, kullanim_sikli, baslangic_tarihi, aktif').eq('patient_id', hasta.id).order('created_at', { ascending: false }),
    sb.from('gebelikler').select('durum').eq('patient_id', hasta.id),
    hasta.kadin ? sb.from('jine_gorevleri').select('ad, due').eq('patient_id', hasta.id).eq('durum', 'acik').in('kod', ['pap', 'hpv', 'mamografi']).limit(3) : Promise.resolve({ data: [] as { ad: string; due: string | null }[] }),
    sb.from('dahiliye_sgk_raporlari').select('id, sablon, draft, sut_kontrol, eksikler, durum, kilit_at, created_at').eq('patient_id', hasta.id).order('created_at', { ascending: false }).limit(6),
  ])
  const sonKb = ht.data?.[0] || null
  const kronikKart = !!(sonKb || dm.data || lipid.data || tiroid.data)
  const [wow, wow2, wow3, wow4, wow5] = await Promise.all([wowVerisi(sb, user.id, hasta, labs, (ilaclar.data || []) as IlacRow[], dm.data, sonKb, lipid.data, T), wow2Verisi(sb, hasta, labs, (ilaclar.data || []) as IlacRow[], T), wow3Verisi(sb, hasta, labs, (ilaclar.data || []) as IlacRow[], T), wow4Verisi(sb, hasta, sonKb ? { hedefteMi: (sonKb.degerlendirme as { hedefteMi?: boolean } | null)?.hedefteMi, teknik_onay: sonKb.teknik_onay } : null, kronikKart, T), wow5Verisi(sb, hasta, labs, (ilaclar.data || []) as IlacRow[], T)])
  const hba1c = (labs.get('HbA1c') || []).filter((x) => x.kanonik_deger != null)
  const ilacListe = (ilaclar.data || []).map((i) => ({ ad: `${i.ilac_adi} ${i.etken_madde || ''}`, aktif: i.aktif !== false }))
  const guvenlik = ilacGuvenlik(ilacListe, sonDeger(labs, 'eGFR'))
  const overdue = gorevler.data?.some((g) => g.due && g.due < T) || false
  const kbBugun = sonKb?.tarih === T
  const chips = { kb: sonKb ? { sbp: sonKb.sbp, dbp: sonKb.dbp, tarih: sonKb.tarih, bugun: kbBugun } : null, hba1c: hba1c[0] ? { deger: hba1c[0].kanonik_deger, tarih: hba1c[0].numune_tarihi, delta: hba1c[1] ? Math.round(((hba1c[0].kanonik_deger as number) - (hba1c[1].kanonik_deger as number)) * 10) / 10 : null } : null, ldl: son(labs, 'LDL'), egfr: son(labs, 'eGFR'), tsh: son(labs, 'TSH'), k: son(labs, 'K'), hb: son(labs, 'Hb'), ilacSayi: guvenlik.aktifSayi, polifarmasi: guvenlik.polifarmasi, kirmizi: overdue || !kbBugun }
  const ldlSon = son(labs, 'LDL'), egfrSon = son(labs, 'eGFR')
  const planlar: { kaynak: string; madde: string }[] = []
  const htDeg = sonKb?.degerlendirme as { plan?: string[]; hedefteMi?: boolean } | null | undefined
  for (const p of htDeg?.plan || []) planlar.push({ kaynak: 'HT', madde: p })
  for (const p of ((dm.data?.degerlendirme as { plan?: string[] } | null)?.plan) || []) planlar.push({ kaynak: 'DM', madde: p })
  for (const p of ((lipid.data?.degerlendirme as { plan?: string[] } | null)?.plan) || []) planlar.push({ kaynak: 'Lipid', madde: p })
  for (const p of wow.ckdSonuc.plan) planlar.push({ kaynak: 'KBH', madde: p })
  for (const p of wow.kvrSonuc.statinAcigi) planlar.push({ kaynak: 'KVR', madde: p })
  for (const p of [...(wow2.dm?.sonuc?.plan || []), ...(wow2.dm?.sonuc?.sevk || [])]) planlar.push({ kaynak: 'DM döngü', madde: p })
  if (wow2.anemi.sonuc.anemi) for (const p of [...wow2.anemi.sonuc.olasiNeden, ...wow2.anemi.sonuc.sonrakiTestler.map((t) => `sonraki test: ${t}`)]) planlar.push({ kaynak: 'Anemi', madde: p })
  for (const d of [...wow2.tarama.due, ...wow2.asi.due].filter((x) => x.durum === 'gecikti' || x.durum === 'zamani' || x.durum === 'sevk' || x.durum === 'seroloji')) planlar.push({ kaynak: 'Tarama/Aşı', madde: `${d.ad}: ${d.not}` })
  for (const i of wow2.htPanel.istemler.filter((x) => x.durum.gecikti)) planlar.push({ kaynak: 'Lab takip', madde: i.durum.takipGorevi!.ad })
  for (const p of [...(wow3.hf?.sonuc?.uyarilar || []), ...(wow3.hf?.sonuc?.eksik || []).map((e) => `eksik GDMT: ${e}`), ...(wow3.hf?.sonuc?.sevk || [])]) planlar.push({ kaynak: 'KY', madde: p })
  for (const p of [...(wow3.antikoagulan?.sonuc?.uyarilar || []), ...(wow3.antikoagulan?.sonuc?.uygunluk || [])]) planlar.push({ kaynak: 'Antikoagülan', madde: p })
  if (wow3.antikoagulan?.sonuc?.sonrakiInr) planlar.push({ kaynak: 'Antikoagülan', madde: `Sonraki INR: ${wow3.antikoagulan.sonuc.sonrakiInr}` })
  for (const p of [...(wow3.pulm?.sonuc?.uyarilar || []), ...(wow3.pulm?.sonuc?.sevk || [])]) planlar.push({ kaynak: 'Solunum', madde: p })
  for (const p of [...(wow3.gi?.sonuc?.sevk || []), ...(wow3.gi?.sonuc?.hp.plan || [])]) planlar.push({ kaynak: 'GI', madde: p })
  for (const n of wow3.noduller) for (const p of n.sonuc.sevk) planlar.push({ kaynak: 'Tiroid nodül', madde: p })
  if (wow3.ramazan?.sonuc) planlar.push({ kaynak: 'Ramazan', madde: `Risk: ${wow3.ramazan.sonuc.risk.replace('_', ' ')} — ${wow3.ramazan.sonuc.oruc}` })
  for (const n of wow4.nudgeler) planlar.push({ kaynak: 'Kalite', madde: `${n.ad}: ${n.neden}` })
  for (const o of wow5.polifarmasi.sonuc.oneriler.filter((x) => x.engelleyici)) planlar.push({ kaynak: 'Polifarmasi', madde: `${o.baslik} — hekim kararı bekliyor` })
  for (const p of [...wow5.vitamin.sonuc.d.plan, ...wow5.vitamin.sonuc.b12.plan]) planlar.push({ kaynak: 'Vit D/B12', madde: p })
  for (const p of wow5.gut.sonuc.ultMerdiven.slice(0, 1)) planlar.push({ kaynak: 'Gut', madde: p })
  for (const p of wow5.osteo.sonuc.tedaviSinifi) planlar.push({ kaynak: 'Osteoporoz', madde: p })
  if (wow2.anket && !wow2.anket.okundu) planlar.unshift({ kaynak: 'Ön anket', madde: `${wow2.anket.tarih} yanıtı var — Subjektif'e ekle` })
  const kirmizi: string[] = []
  const kSon = sonDeger(labs, 'K'); if (kSon != null && kSon > 6) kirmizi.push(`K ${kSon} >6,0 — EKG + acil`)
  if (wow.ckdSonuc.hizliDusus) kirmizi.push('eGFR 1 yılda >%25 düşüş — nefroloji')
  for (const k of wow2.anemi.sonuc.kirmizi) kirmizi.push(k)
  for (const k of wow3.antikoagulan?.sonuc?.kirmizi || []) kirmizi.push(k)
  for (const k of wow5.gut.sonuc.kirmizi) kirmizi.push(k)
  if (wow2.anket && !wow2.anket.okundu) for (const a of wow2.anket.alarmlar) kirmizi.push(`Ön anket: ${a}`)
  const serit = vizitSeridi({ bugun: T, kb: sonKb ? { sbp: sonKb.sbp, dbp: sonKb.dbp, tarih: sonKb.tarih, hedefteMi: htDeg?.hedefteMi ?? null, teknikOnay: sonKb.teknik_onay == null ? undefined : !!sonKb.teknik_onay } : null,
    hba1c: hba1c[0] ? { deger: hba1c[0].kanonik_deger as number, delta: hba1c[1] ? Math.round(((hba1c[0].kanonik_deger as number) - (hba1c[1].kanonik_deger as number)) * 10) / 10 : null, tarih: hba1c[0].numune_tarihi, hedef: dm.data?.hedef_hba1c != null ? Number(dm.data.hedef_hba1c) : null } : null,
    ldl: ldlSon?.kanonik_deger != null ? { deger: ldlSon.kanonik_deger, tarih: ldlSon.numune_tarihi, hedef: wow.kvr.kilitHedefLdl } : null,
    egfr: egfrSon?.kanonik_deger != null ? { deger: egfrSon.kanonik_deger, tarih: egfrSon.numune_tarihi, evre: wow.ckdSonuc.g, renk: wow.ckdSonuc.renk } : null,
    gorevler: (gorevler.data || []).map((g) => ({ kod: g.kod, ad: g.ad, due: g.due })), planlar, kirmizi })
  const { ckdSonuc: _c, kvrSonuc: _k, kilitler: _kl, ...wowOut } = wow
  return NextResponse.json({ wow: { ...wowOut, w2: wow2, w3: wow3, w4: wow4, w5: wow5, sgkRaporlar: sgkRaporlar.data || [], sgkSablonlar: SGK_SABLONLARI }, serit, hasta: { yas: hasta.yas, kadin: hasta.kadin, gebe: (gebe.data || []).some((g) => aktifGebelikDurumu(g.durum)) }, chips, ht: ht.data || [], dm: dm.data, lipid: lipid.data, tiroid: tiroid.data, checkup: checkup.data || [], gorevler: gorevler.data || [], sevkler: sevkler.data || [], ilaclar: ilaclar.data || [], ilacUyari: guvenlik.uyarilar, jineDue: jineDue.data || [], checkupAralik: checkupAraligi(hasta.yas), kutuphane: { checkup: CHECKUP_SABLONU, sevk: SEVK_HEDEFLERI, refler: REF_ACIKLAMA, kirmiziDipnot: KIRMIZI_DIPNOT, ilacDipnot: ILAC_GUVENLIK_DIPNOT } })
}
