/**
 * GOZ-CHAPTER — Göz Hastalıkları API. Live truth = goz_* tables (migration 048); görüntü pikselleri core hasta_goruntulemeler.
 * GET ?patientId= → şerit, muayeneler + kopya taslağı, glokom, DR (+ açık dahiliye göz sevki), enjeksiyonlar + SUT kapıları,
 *                   SGK raporları, katarakt, görüntüler + dual-sign okumalar, kontroller, pediatrik, görevler, intake, acil, kaynaklar
 * POST adim: olcum | olcum_nota | fundus | fundus_nota | glokom | dr | dr_sevk_kapat | enjeksiyon | sgk_kapi | sgkrapor | sgkrapor_kilit | katarakt
 *            | goruntu_okuma | kontrol | pediatrik | gorev | intake_nota | acil | kuru_goz
 *            + GOZ-EXCEPTIONAL-01 (_ek.ts): serit_nota | fundus_dr | lazer | biyomikroskopi | keratokonus | on_segment_nota | katarakt_postop
 *              | katarakt_nota | rop | acil_kayit | acil_nota | oct_olcum | hatirlatma
 * Hekim kilitleri: tanı/evre/hedef/rejim/aralık yalnız hekim girişi; motor önerir, uyarır, görev açar. Sekreter yalnız okur.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { decrypt } from '@/lib/security/encryption'
import { gununNotunaEkle } from '@/lib/doktor/gununNotunaEkle'
import { olcumSchema, enjeksiyonSchema, drSchema, fundusSchema, SGK_SABLON } from '@/specialties/goz-hastaliklari/schema'
import { fundusBosMu, fundusMetni, fundusNormalize, type FundusKayit } from '@/specialties/goz-hastaliklari/engines/fundus'
import { vaCoz, vaGoster, enIyiUzak, kopyaIleriTaslak, type VaSeti } from '@/specialties/goz-hastaliklari/engines/va'
import { glokomDegerlendir, type Damla } from '@/specialties/goz-hastaliklari/engines/glokom'
import { drDegerlendir, dahiliyeGeriBildirim, type DrEvre, type Dmo } from '@/specialties/goz-hastaliklari/engines/dr'
import { sgkKapilari, sonrakiDoz, yuklemeTakvimi, type Enjeksiyon } from '@/specialties/goz-hastaliklari/engines/antiVegf'
import { gozSgkTaslak, GOZ_SGK_SABLONLARI, type GozSgkSablon } from '@/specialties/goz-hastaliklari/engines/sgkRapor'
import { kataraktHazirlik, KATARAKT_KONTROL, ON_SEGMENT_PROTOKOLLERI, pediatrikIzlem, gilSgkKontrol, GIL_EK3G_KALEMLERI, type PediatrikTip } from '@/specialties/goz-hastaliklari/engines/klinik'
import { kuruGozOzet } from '@/specialties/goz-hastaliklari/engines/kuruGoz'
import { ayseGoruntuTaslagi } from '@/specialties/goz-hastaliklari/engines/ayseGoruntu'
import { gozBolgeCoz, kiyasCifti, normalizeModalite } from '@/specialties/goz-hastaliklari/engines/kiyas'
import { acilTara, ACIL_KODLARI, type AcilKod } from '@/specialties/goz-hastaliklari/engines/acil'
import { gozSeridi, intakeSubjektif } from '@/specialties/goz-hastaliklari/engines/serit'
import { okumaGecisi, taslakTaniDiliUyarisi, GOZ_GORUNTU_DISCLAIMER, GOZ_MODALITELER } from '@/specialties/goz-hastaliklari/imaging/dualSign'
import { GOZ_KAYNAKLAR } from '@/specialties/goz-hastaliklari/protocols/sources'
import { olcumNotaMetni, refraksiyonNormalize, type OlcumSatiri } from '@/specialties/goz-hastaliklari/engines/muayene'
import { glokomMetaNormalize, GLOKOM_ARALIK_ONERILERI } from '@/specialties/goz-hastaliklari/engines/glokom'
import { ivtKontrolDogrula, type IvtKontrol } from '@/specialties/goz-hastaliklari/engines/antiVegf'
import { biyometriNormalize, postopUyarilari, type Biyometri, type PostopKayit, type PostopZaman } from '@/specialties/goz-hastaliklari/engines/katarakt'
import { gozEkAdim, gozEkVeri, gozGoruntuKopru } from './_ek'

export const dynamic = 'force-dynamic'
// Göz › Görüntü › Asistana raporla aynı Tier A yazıcıyı çağırır (Belge analiz rotasıyla aynı süre).
export const maxDuration = 120
const bugun = () => new Date().toISOString().slice(0, 10)
const tarihMi = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
const num = (v: unknown) => (v == null || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null)
const hata = (m: string, s = 400) => NextResponse.json({ error: m }, { status: s })
type Sb = Extract<Awaited<ReturnType<typeof pratikOturum>>, { supabase: unknown }>['supabase']
type MuayeneRow = { id: string; tarih: string; va: { sag?: VaSeti; sol?: VaSeti } | null; gib_sag: number | null; gib_sol: number | null; gib_yontem: string | null; rapd: string | null; ek: { fundus?: FundusKayit; refraksiyon?: unknown; biyomikroskopi?: unknown; keratokonus?: unknown } | null; kaynak: string; created_at: string }

async function hasta(sb: Sb, doktorId: string, patientId: string) {
  const { data } = await sb.from('patients').select('id, dob_encrypted, name_encrypted').eq('id', patientId).eq('doctor_id', doktorId).maybeSingle()
  if (!data) return null
  let yasAy: number | null = null, adSoyad = 'Hasta', dobIso: string | null = null
  try { if (data.dob_encrypted) { const d = new Date(decrypt(String(data.dob_encrypted))); if (!isNaN(d.getTime())) { dobIso = d.toISOString().slice(0, 10); const n = new Date(); yasAy = (n.getFullYear() - d.getFullYear()) * 12 + (n.getMonth() - d.getMonth()) - (n.getDate() < d.getDate() ? 1 : 0) } } } catch { yasAy = null }
  try { if (data.name_encrypted) { const p = JSON.parse(decrypt(String(data.name_encrypted))); adSoyad = `${p.ad || ''} ${p.soyad || ''}`.trim() || 'Hasta' } } catch { /* varsayılan */ }
  return { id: data.id as string, yasAy, yas: yasAy == null ? null : Math.floor(yasAy / 12), adSoyad, dobIso }
}

async function gorevSenkron(sb: Sb, doktorId: string, patientId: string, gorevler: { kod: string; ad: string; due: string | null }[], kaynak: string) {
  for (const g of gorevler) {
    const { data } = await sb.from('goz_gorevler').select('id').eq('patient_id', patientId).eq('kod', g.kod).eq('durum', 'acik').maybeSingle()
    if (!data) await sb.from('goz_gorevler').insert({ patient_id: patientId, doctor_id: doktorId, kod: g.kod, ad: g.ad, due: g.due, kaynak })
  }
}

async function sonIntake(sb: Sb, doktorId: string, patientId: string): Promise<Record<string, unknown> | null> {
  const { data } = await sb.from('hasta_intake_formlari').select('form_data_encrypted, dolduruldu_at').eq('doktor_id', doktorId).eq('patient_id', patientId).eq('brans', 'goz-hastaliklari').not('dolduruldu_at', 'is', null).order('dolduruldu_at', { ascending: false }).limit(1).maybeSingle()
  if (!data?.form_data_encrypted) return null
  try {
    const y = JSON.parse(decrypt(String(data.form_data_encrypted))) as Record<string, unknown>
    return ((y.bransAlanlari as Record<string, unknown>) || y) as Record<string, unknown>
  } catch { return null }
}

export async function GET(req: NextRequest) {
  const o = await pratikOturum(req)
  if ('hata' in o) return o.hata
  const { supabase: sb, doktorId } = o
  const patientId = new URL(req.url).searchParams.get('patientId') || ''
  const h = await hasta(sb, doktorId, patientId)
  if (!h) return hata('Hasta bulunamadı.', 404)
  const T = bugun()

  const [muQ, glQ, drQ, enjQ, rapQ, katQ, imgQ, okQ, konQ, pedQ, sevkQ, notQ, kuruQ] = await Promise.all([
    sb.from('goz_muayeneler').select('id, tarih, va, gib_sag, gib_sol, gib_yontem, rapd, ek, kaynak, created_at').eq('patient_id', h.id).eq('doctor_id', doktorId).order('tarih', { ascending: false }).order('created_at', { ascending: false }).limit(30),
    sb.from('goz_glokom').select('*').eq('patient_id', h.id).eq('doctor_id', doktorId).maybeSingle(),
    sb.from('goz_dr').select('*').eq('patient_id', h.id).eq('doctor_id', doktorId).maybeSingle(),
    sb.from('goz_enjeksiyonlar').select('id, goz, ajan, endikasyon, faz, doz_no, tarih, durum, yanit, ivt_kontrol').eq('patient_id', h.id).eq('doctor_id', doktorId).order('tarih', { ascending: false }).limit(80),
    sb.from('goz_sgk_raporlari').select('id, sablon, draft, eksikler, durum, kilit_at, created_at').eq('patient_id', h.id).eq('doctor_id', doktorId).order('created_at', { ascending: false }).limit(20),
    sb.from('goz_katarakt').select('*').eq('patient_id', h.id).eq('doctor_id', doktorId).order('created_at', { ascending: false }).limit(10),
    sb.from('hasta_goruntulemeler').select('id, modalite, vucut_bolgesi, goruntuleme_tarihi, created_at, dosya_url').eq('patient_id', h.id).eq('doctor_id', doktorId).in('modalite', [...GOZ_MODALITELER]).order('created_at', { ascending: false }).limit(60),
    sb.from('goz_goruntu_okumalari').select('*').eq('patient_id', h.id).eq('doctor_id', doktorId).order('created_at', { ascending: false }).limit(100),
    sb.from('goz_kontroller').select('id, tarih, neden, dilatasyon, durum').eq('patient_id', h.id).eq('doctor_id', doktorId).order('tarih', { ascending: false }).limit(20),
    sb.from('goz_pediatrik').select('*').eq('patient_id', h.id).eq('doctor_id', doktorId).maybeSingle(),
    sb.from('sevkler').select('id, not_metni, kaynak, created_at, doctor_id').eq('patient_id', h.id).eq('hedef', 'goz').eq('durum', 'acik').order('created_at', { ascending: false }).limit(5),
    sb.from('sessions').select('id').eq('patient_id', h.id).eq('doctor_id', doktorId).gte('created_at', `${T}T00:00:00`).limit(5),
    sb.from('goz_kuru_goz').select('*').eq('patient_id', h.id).eq('doctor_id', doktorId).order('tarih', { ascending: false }).limit(20),
  ])

  const muayeneler = (muQ.data || []) as MuayeneRow[]
  const olcumler = muayeneler.map((m) => ({ tarih: m.tarih, va: m.va || {}, gibSag: m.gib_sag == null ? null : Number(m.gib_sag), gibSol: m.gib_sol == null ? null : Number(m.gib_sol), gibYontem: m.gib_yontem }))
  const kopya = kopyaIleriTaslak(olcumler[0] || null, T)

  const gl = glQ.data as Record<string, unknown> | null
  const glokomKart = gl ? { taniHekim: (gl.tani_hekim as string) || null, goz: (gl.goz as 'sag' | 'sol' | 'iki') || null, hedefSag: num(gl.hedef_gib_sag), hedefSol: num(gl.hedef_gib_sol), damlalar: (gl.damlalar as Damla[]) || [], sonGormeAlani: (gl.son_gorme_alani as string) || null, sonOctRnfl: (gl.son_oct_rnfl as string) || null, gaAralikAy: num(gl.ga_aralik_ay), octAralikAy: num(gl.oct_aralik_ay) } : null
  const glokomMeta = gl ? { shafferSag: num(gl.shaffer_sag), shafferSol: num(gl.shaffer_sol), gonyoSag: (gl.gonyo_sag as string) || null, gonyoSol: (gl.gonyo_sol as string) || null, pakiSag: num(gl.paki_sag), pakiSol: num(gl.paki_sol), gormeAlaniCihaz: (gl.gorme_alani_cihaz as string) || null, octCihaz: (gl.oct_cihaz as string) || null, aralikOnerisi: (gl.aralik_onerisi as string) || null } : null
  const glokom = glokomKart ? glokomDegerlendir(glokomKart, olcumler.map((x) => ({ tarih: x.tarih, sag: x.gibSag, sol: x.gibSol })), T) : null

  const dr = drQ.data as Record<string, unknown> | null
  const drSonuc = dr ? drDegerlendir({ dmTip: (dr.dm_tip as 'T1' | 'T2' | 'diger') || null, dmTaniTarihi: (dr.dm_tani_tarihi as string) || null, yas: h.yas, gebe: !!dr.gebe, evreSag: (dr.evre_sag as DrEvre) || null, evreSol: (dr.evre_sol as DrEvre) || null, dmoSag: (dr.dmo_sag as Dmo) || null, dmoSol: (dr.dmo_sol as Dmo) || null, sonFundus: (dr.son_fundus as string) || null, bugun: T }) : null

  const enj: Array<Enjeksiyon & { ivtKontrol: IvtKontrol | null }> = (enjQ.data || []).map((e) => ({ id: e.id, goz: e.goz, ajan: e.ajan, endikasyon: e.endikasyon, faz: e.faz, dozNo: e.doz_no, tarih: e.tarih, durum: e.durum, ivtKontrol: (e.ivt_kontrol as IvtKontrol) || null }))
  const sonraki = { sag: sonrakiDoz(enj, 'sag', T), sol: sonrakiDoz(enj, 'sol', T) }
  const planli = enj.filter((e) => e.durum === 'planli' && e.tarih >= T).sort((a, b) => (a.tarih < b.tarih ? -1 : 1))[0]

  const imgs = (imgQ.data || []).map((i) => ({ id: i.id, modalite: i.modalite, goz: i.vucut_bolgesi, tarih: String(i.goruntuleme_tarihi || i.created_at).slice(0, 10), url: i.dosya_url, okumalar: (okQ.data || []).filter((r) => r.goruntu_id === i.id) }))
  // GOZ-EXCEPTIONAL-01: Belge kasasından (Tier A) aktarılan okumalar — hasta_goruntulemeler satırı yok, belge_id var.
  const belgeOkumalari = (okQ.data || []).filter((r) => !r.goruntu_id && r.belge_id)

  const ped = pedQ.data as Record<string, unknown> | null
  const sonVa = muayeneler[0]?.va
  const vaSagOnd = sonVa?.sag ? (vaCoz(enIyiUzak(sonVa.sag) || '')?.ondalik ?? null) : null
  const vaSolOnd = sonVa?.sol ? (vaCoz(enIyiUzak(sonVa.sol) || '')?.ondalik ?? null) : null
  const pedIzlem = pediatrikIzlem({
    yasAy: h.yasAy, tip: (ped?.tip as PediatrikTip) || null, kapamaHekim: (ped?.kapama_hekim as string) || null,
    sonrakiKontrol: (ped?.sonraki_kontrol as string) || null, bugun: T,
    vaSag: vaSagOnd, vaSol: vaSolOnd,
    sasilikVeyaNistagmus: ped?.tip === 'sasilik' || ped?.tip === 'ambliyopi_sasilik',
  })

  const kuruSatirlar = (kuruQ.data || []).map((r) => {
    const girdi = { osdi: num(r.osdi), schirmerSag: num(r.schirmer_sag), schirmerSol: num(r.schirmer_sol), tbutSag: num(r.tbut_sag), tbutSol: num(r.tbut_sol), notHekim: (r.not_hekim as string) || null }
    return { ...r, ozet: kuruGozOzet(girdi) }
  })

  // Görev senkronu (idempotent, açık kod başına bir satır)
  await gorevSenkron(sb, doktorId, h.id, [...(glokom?.gorevler || []), ...(drSonuc?.taramaGorevi ? [drSonuc.taramaGorevi] : []), ...pedIzlem.gorevler], 'motor')
  const { data: gorevler } = await sb.from('goz_gorevler').select('id, kod, ad, due, kaynak').eq('patient_id', h.id).eq('doctor_id', doktorId).eq('durum', 'acik').order('due', { ascending: true, nullsFirst: false }).limit(50)

  const intakeYanit = await sonIntake(sb, doktorId, h.id)
  const intake = intakeYanit ? intakeSubjektif(intakeYanit) : null
  let bugunSikayet: string[] = []
  const seansIdler = (notQ.data || []).map((s) => s.id)
  if (seansIdler.length) {
    const { data: notlar } = await sb.from('notes').select('basvuru_yakinmasi, content_subjektif').in('session_id', seansIdler).limit(5)
    bugunSikayet = (notlar || []).flatMap((n) => [n.basvuru_yakinmasi, n.content_subjektif]).filter(Boolean) as string[]
  }
  const sikayetler = [...bugunSikayet, intake?.subjektif || '']

  const serit = gozSeridi({ hekimIsaretleri: intake?.acilKodlari || [], muayeneler: olcumler, hedefSag: glokomKart?.hedefSag ?? null, hedefSol: glokomKart?.hedefSol ?? null, evreSag: (dr?.evre_sag as DrEvre) || null, evreSol: (dr?.evre_sol as DrEvre) || null, sonrakiEnjeksiyon: planli ? `${planli.tarih} ${planli.goz === 'sag' ? 'OD' : 'OS'}` : null, gorevDue: (gorevler || []).map((g) => g.due), sikayetMetinleri: sikayetler, bugun: T })

  const sonEk = <T,>(k: 'refraksiyon' | 'biyomikroskopi' | 'keratokonus'): (T & { tarih: string }) | null => { for (const m of muayeneler) { const v = m.ek?.[k]; if (v && typeof v === 'object') return { ...(v as T), tarih: m.tarih } } return null }
  const ek = await gozEkVeri(sb, doktorId, h, T, ped)
  const sonFundusKayit = (() => {
    for (const m of muayeneler) {
      const f = m.ek && typeof m.ek === 'object' ? (m.ek as { fundus?: FundusKayit }).fundus : null
      if (f && !fundusBosMu(fundusNormalize(f))) return { ...fundusNormalize(f), muayeneId: m.id }
    }
    return null
  })()

  return NextResponse.json({
    hasta: { yas: h.yas, yasAy: h.yasAy },
    rol: o.rol,
    serit,
    muayeneler: muayeneler.map((m) => ({ ...m, gosterim: { sag: vaGoster(enIyiUzak(m.va?.sag)), sol: vaGoster(enIyiUzak(m.va?.sol)) } })),
    sonRefraksiyon: sonEk('refraksiyon'), sonBiyomikroskopi: sonEk('biyomikroskopi'), sonKeratokonus: sonEk('keratokonus'),
    ...ek,
    sonFundus: sonFundusKayit,
    kopya,
    glokom: gl ? { kart: glokomKart, meta: glokomMeta, degerlendirme: glokom } : null,
    dr: dr ? { satir: dr, degerlendirme: drSonuc } : null,
    acikGozSevkleri: sevkQ.data || [],
    enjeksiyonlar: enj, sonrakiDoz: sonraki,
    sgkRaporlari: rapQ.data || [], sgkSablonlari: GOZ_SGK_SABLONLARI,
    katarakt: (katQ.data || []).map((k) => ({ ...k, hazirlik: kataraktHazirlik((k.checklist as Record<string, boolean>) || {}), gilSgk: gilSgkKontrol((k.gil_tipi_hekim as string) || null), postopUyari: postopUyarilari((k.postop as Partial<Record<PostopZaman, PostopKayit>>) || {}).acil })), kataraktKontrol: KATARAKT_KONTROL, gilEk3g: GIL_EK3G_KALEMLERI,
    goruntuler: imgs, belgeOkumalari, goruntuDisclaimer: GOZ_GORUNTU_DISCLAIMER,
    kontroller: konQ.data || [],
    pediatrik: { satir: ped, izlem: pedIzlem },
    kuruGoz: kuruSatirlar,
    gorevler: gorevler || [],
    intake,
    acil: serit.acil, acilKodlari: ACIL_KODLARI,
    protokoller: ON_SEGMENT_PROTOKOLLERI,
    kaynaklar: GOZ_KAYNAKLAR,
  })
}

export async function POST(req: NextRequest) {
  const o = await pratikOturum(req)
  if ('hata' in o) return o.hata
  const yasak = sadeceDoktor(o)
  if (yasak) return yasak
  const { supabase: sb, doktorId } = o
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const h = await hasta(sb, doktorId, String(b.patientId || ''))
  if (!h) return hata('Hasta bulunamadı.', 404)
  const T = bugun()
  const adim = String(b.adim || '')
  const ortak = { patient_id: h.id, doctor_id: doktorId }

  if (adim === 'olcum') {
    const p = olcumSchema.safeParse(b.olcum)
    if (!p.success) return hata(`Ölçüm biçimi hatalı: ${p.error.issues.map((i) => i.path.join('.')).join(', ')}`)
    const v = p.data
    for (const taraf of ['sag', 'sol'] as const) for (const alan of ['uzak_sc', 'uzak_cc', 'yakin'] as const) {
      const ham = v.va?.[taraf]?.[alan]
      if (ham && String(ham).trim() && !vaCoz(String(ham)) && alan !== 'yakin') return hata(`${taraf === 'sag' ? 'Sağ' : 'Sol'} göz ${alan.replace('_', ' ')} okunamadı: "${ham}" (ör. 0,8 · 6/12 · PS 1m · EH · IH · IHY)`)
    }
    const rf = refraksiyonNormalize(b.refraksiyon as Record<string, unknown> | null)
    if (rf.hatalar.length) return hata(`Refraksiyon: ${rf.hatalar.join('; ')}`)
    const bos = !v.va?.sag && !v.va?.sol && v.gibSag == null && v.gibSol == null && !rf.refraksiyon && !v.rapd
    if (bos) return hata('En az bir VA, GİB, RAPD veya refraksiyon değeri girin.')
    const { data, error } = await sb.from('goz_muayeneler').insert({ ...ortak, tarih: tarihMi(v.tarih) ? v.tarih : T, va: v.va || {}, gib_sag: v.gibSag ?? null, gib_sol: v.gibSol ?? null, gib_yontem: v.gibYontem ?? null, rapd: v.rapd ?? null, ek: rf.refraksiyon ? { refraksiyon: rf.refraksiyon } : null, kaynak: v.kopyaOnayli ? 'kopya_onayli' : 'hekim' }).select('id').single()
    if (error) return hata(error.message, 500)
    return NextResponse.json({ ok: true, id: data.id })
  }

  if (adim === 'olcum_nota') {
    // Fundus / biyomikroskopi satırları (va boş) atlanır — son GERÇEK ölçüm yazılır.
    const { data: rows } = await sb.from('goz_muayeneler').select('tarih, va, gib_sag, gib_sol, gib_yontem, rapd, ek').eq('patient_id', h.id).eq('doctor_id', doktorId).order('tarih', { ascending: false }).order('created_at', { ascending: false }).limit(30)
    const m = ((rows || []) as OlcumSatiri[]).find((x) => (x.va && ((x.va as Record<string, unknown>).sag || (x.va as Record<string, unknown>).sol)) || x.gib_sag != null || x.gib_sol != null || x.rapd || x.ek?.refraksiyon)
    if (!m) return hata('Kayıtlı ölçüm yok.')
    const satir = olcumNotaMetni(m)
    const r = await gununNotunaEkle(sb, doktorId, h.id, satir, 'content_objektif')
    // NOTYA-MUAYENEYE-DON-01: notId'yi geri veriyoruz ki kart onayında "Muayene Formuna Dön" çıksın.
    return NextResponse.json({ ok: r.eklendi, sebep: r.sebep, satir, notId: r.eklendi ? r.notId : null })
  }

  if (adim === 'fundus') {
    const p = fundusSchema.safeParse(b.fundus || b)
    if (!p.success) return hata('Fundus kaydı hatalı.')
    const kayit = fundusNormalize({
      tarih: p.data.tarih,
      dilate: p.data.dilate ?? null,
      ortam: p.data.ortam,
      sag: p.data.sag || {},
      sol: p.data.sol || {},
    })
    if (fundusBosMu(kayit)) return hata('En az bir göz için disk / makula / damar / perifer girin veya «normal» kullanın.')
    const { data: son } = await sb.from('goz_muayeneler').select('id, ek, tarih').eq('patient_id', h.id).eq('doctor_id', doktorId).eq('tarih', kayit.tarih).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (son?.id) {
      const ekOnce = (son.ek && typeof son.ek === 'object' ? son.ek : {}) as Record<string, unknown>
      const { error } = await sb.from('goz_muayeneler').update({ ek: { ...ekOnce, fundus: kayit } }).eq('id', son.id)
      if (error) return hata(error.message, 500)
      return NextResponse.json({ ok: true, id: son.id, metin: fundusMetni(kayit) })
    }
    const { data, error } = await sb.from('goz_muayeneler').insert({ ...ortak, tarih: kayit.tarih, va: {}, ek: { fundus: kayit }, kaynak: 'hekim' }).select('id').single()
    if (error) return hata(error.message, 500)
    return NextResponse.json({ ok: true, id: data.id, metin: fundusMetni(kayit) })
  }

  if (adim === 'fundus_nota') {
    const { data: rows } = await sb.from('goz_muayeneler').select('ek').eq('patient_id', h.id).eq('doctor_id', doktorId).order('tarih', { ascending: false }).order('created_at', { ascending: false }).limit(15)
    let kayit: FundusKayit | null = null
    for (const row of rows || []) {
      const f = row.ek && typeof row.ek === 'object' ? (row.ek as { fundus?: FundusKayit }).fundus : null
      if (f && !fundusBosMu(fundusNormalize(f))) { kayit = fundusNormalize(f); break }
    }
    if (!kayit) return hata('Kayıtlı göz dibi muayenesi yok — önce Fundus sekmesinden kaydedin.')
    const satir = fundusMetni(kayit)
    const r = await gununNotunaEkle(sb, doktorId, h.id, satir, 'content_objektif')
    return NextResponse.json({ ok: r.eklendi, sebep: r.sebep, satir, notId: r.eklendi ? r.notId : null })
  }

  if (adim === 'glokom') {
    const damlalar = Array.isArray(b.damlalar) ? (b.damlalar as Damla[]).filter((d) => d && String(d.ad || '').trim()).slice(0, 8).map((d) => ({ ad: String(d.ad).slice(0, 80), goz: ['sag', 'sol', 'iki'].includes(String(d.goz)) ? d.goz : 'iki', siklik: String(d.siklik || '').slice(0, 60), baslangic: tarihMi(d.baslangic) ? d.baslangic : null })) : []
    const gm = glokomMetaNormalize(b)
    if (gm.hatalar.length) return hata(gm.hatalar.join('; '))
    const oneri = GLOKOM_ARALIK_ONERILERI.find((x) => x.kod === b.aralikOnerisi)?.kod || null
    const satir = { ...ortak, shaffer_sag: gm.meta.shafferSag, shaffer_sol: gm.meta.shafferSol, gonyo_sag: gm.meta.gonyoSag, gonyo_sol: gm.meta.gonyoSol, paki_sag: gm.meta.pakiSag, paki_sol: gm.meta.pakiSol, gorme_alani_cihaz: gm.meta.gormeAlaniCihaz, oct_cihaz: gm.meta.octCihaz, aralik_onerisi: oneri, tani_hekim: b.taniHekim ? String(b.taniHekim).slice(0, 120) : null, goz: ['sag', 'sol', 'iki'].includes(String(b.goz)) ? b.goz : null, hedef_gib_sag: num(b.hedefSag), hedef_gib_sol: num(b.hedefSol), damlalar, son_gorme_alani: tarihMi(b.sonGormeAlani) ? b.sonGormeAlani : null, son_oct_rnfl: tarihMi(b.sonOctRnfl) ? b.sonOctRnfl : null, ga_aralik_ay: num(b.gaAralikAy), oct_aralik_ay: num(b.octAralikAy), updated_at: new Date().toISOString() }
    const { error } = await sb.from('goz_glokom').upsert(satir, { onConflict: 'patient_id' })
    if (error) return hata(error.message, 500)
    // Tamamlanan tetkik tarihi girilince açık görev kapanır
    if (satir.son_gorme_alani) await sb.from('goz_gorevler').update({ durum: 'tamam', tamam_at: new Date().toISOString() }).eq('patient_id', h.id).eq('kod', 'glokom_ga').eq('durum', 'acik')
    if (satir.son_oct_rnfl) await sb.from('goz_gorevler').update({ durum: 'tamam', tamam_at: new Date().toISOString() }).eq('patient_id', h.id).eq('kod', 'glokom_oct').eq('durum', 'acik')
    if (satir.ga_aralik_ay) await sb.from('goz_gorevler').update({ durum: 'iptal' }).eq('patient_id', h.id).eq('kod', 'glokom_ga_aralik').eq('durum', 'acik')
    if (satir.oct_aralik_ay) await sb.from('goz_gorevler').update({ durum: 'iptal' }).eq('patient_id', h.id).eq('kod', 'glokom_oct_aralik').eq('durum', 'acik')
    return NextResponse.json({ ok: true })
  }

  if (adim === 'dr') {
    const p = drSchema.safeParse(b.dr)
    if (!p.success) return hata('DR kaydı hatalı.')
    const d = p.data
    const { error } = await sb.from('goz_dr').upsert({ ...ortak, dm_tip: d.dmTip ?? null, dm_tani_tarihi: tarihMi(d.dmTaniTarihi) ? d.dmTaniTarihi : null, gebe: !!d.gebe, evre_sag: d.evreSag ?? null, evre_sol: d.evreSol ?? null, dmo_sag: d.dmoSag ?? null, dmo_sol: d.dmoSol ?? null, son_fundus: tarihMi(d.sonFundus) ? d.sonFundus : null, sonraki_kontrol: tarihMi(d.sonrakiKontrol) ? d.sonrakiKontrol : null, updated_at: new Date().toISOString() }, { onConflict: 'patient_id' })
    if (error) return hata(error.message, 500)
    if (tarihMi(d.sonFundus)) await sb.from('goz_gorevler').update({ durum: 'tamam', tamam_at: new Date().toISOString() }).eq('patient_id', h.id).eq('kod', 'dr_tarama').eq('durum', 'acik')
    if (tarihMi(d.sonrakiKontrol)) await sb.from('goz_kontroller').insert({ ...ortak, tarih: d.sonrakiKontrol, neden: 'Göz dibi (retina) kontrolü', dilatasyon: true })
    return NextResponse.json({ ok: true })
  }

  if (adim === 'dr_sevk_kapat') {
    // Dahiliye köprüsü: açık "goz" sevkini kapat, dahiliye DM kartına son göz dibi tarihini yaz (aynı muayenehane hekimi).
    const sevkId = String(b.sevkId || '')
    const { data: dr } = await sb.from('goz_dr').select('*').eq('patient_id', h.id).eq('doctor_id', doktorId).maybeSingle()
    if (!dr?.son_fundus || (!dr.evre_sag && !dr.evre_sol)) return hata('Önce DR kartında fundus tarihi ve en az bir göz için evre girin (hekim).')
    const { data: sevk } = await sb.from('sevkler').select('id, doctor_id').eq('id', sevkId).eq('patient_id', h.id).eq('hedef', 'goz').eq('durum', 'acik').maybeSingle()
    if (!sevk) return hata('Açık göz sevki bulunamadı.', 404)
    const s = drDegerlendir({ dmTip: dr.dm_tip, dmTaniTarihi: dr.dm_tani_tarihi, yas: h.yas, gebe: !!dr.gebe, evreSag: dr.evre_sag, evreSol: dr.evre_sol, dmoSag: dr.dmo_sag, dmoSol: dr.dmo_sol, sonFundus: dr.son_fundus, bugun: T })
    const geri = dahiliyeGeriBildirim(s, dr.son_fundus)
    await sb.from('sevkler').update({ durum: 'kapandi', not_metni: geri }).eq('id', sevk.id)
    await sb.from('dahiliye_dm').update({ son_goz_dibi: dr.son_fundus }).eq('patient_id', h.id)
    await sb.from('dahiliye_gorevleri').update({ durum: 'tamam', tamam_at: new Date().toISOString() }).eq('patient_id', h.id).eq('kod', 'dm_goz').eq('durum', 'acik')
    await sb.from('goz_dr').update({ kapatilan_sevk_id: sevk.id }).eq('patient_id', h.id)
    return NextResponse.json({ ok: true, geriBildirim: geri })
  }

  if (adim === 'enjeksiyon' || adim === 'sgk_kapi') {
    const { data: gecmisHam } = await sb.from('goz_enjeksiyonlar').select('id, goz, ajan, endikasyon, faz, doz_no, tarih, durum').eq('patient_id', h.id).eq('doctor_id', doktorId)
    const gecmis: Enjeksiyon[] = (gecmisHam || []).map((e) => ({ id: e.id, goz: e.goz, ajan: e.ajan, endikasyon: e.endikasyon, faz: e.faz, dozNo: e.doz_no, tarih: e.tarih, durum: e.durum }))
    const p = enjeksiyonSchema.safeParse(b.enjeksiyon)
    if (!p.success) return hata('Enjeksiyon kaydı hatalı.')
    const e = p.data
    const basamak = (['muayenehane', '2', '3'].includes(String(b.basamak)) ? b.basamak : 'muayenehane') as 'muayenehane' | '2' | '3'
    const kapi = sgkKapilari({ ajan: e.ajan, goz: e.goz, tarih: e.tarih, basamak, gecmis: gecmis.filter((x) => x.id !== b.id), son3AydaMiVeyaSvo: !!b.son3AydaMiVeyaSvo })
    const takvim = e.faz === 'yukleme' && (e.dozNo ?? 1) === 1 ? yuklemeTakvimi(e.tarih, e.ajan, e.endikasyon, !!b.dmoBesDoz) : []
    if (adim === 'sgk_kapi') return NextResponse.json({ kapi, takvim })
    // GOZ-EXCEPTIONAL-01: "yapıldı" yalnız IVT odası kontrol listesi tamamsa (veya hekim "geçmiş kayıt" beyanıyla)
    let ivtKontrol: IvtKontrol | null = null
    if (e.durum === 'yapildi') {
      const ivt = ivtKontrolDogrula(b.ivtKontrol as IvtKontrol | null, e.goz)
      if (!ivt.tamam) return hata(`IVT kontrol listesi eksik: ${ivt.eksikler.join('; ')}`)
      ivtKontrol = ivt.kontrol
    }
    const satir = { ...ortak, goz: e.goz, ajan: e.ajan, endikasyon: e.endikasyon, faz: e.faz, doz_no: e.dozNo ?? null, tarih: e.tarih, durum: e.durum, yanit: b.yanit && typeof b.yanit === 'object' ? b.yanit : null, ...(ivtKontrol ? { ivt_kontrol: ivtKontrol } : {}) }
    const q = b.id ? sb.from('goz_enjeksiyonlar').update(satir).eq('id', String(b.id)).eq('doctor_id', doktorId) : sb.from('goz_enjeksiyonlar').insert(satir)
    const { error } = await q
    if (error) return hata(error.message, 500)
    return NextResponse.json({ ok: true, kapi, takvim })
  }

  if (adim === 'sgkrapor') {
    const sablon = String(b.sablon) as GozSgkSablon
    if (!(SGK_SABLON as readonly string[]).includes(sablon)) return hata('Şablon seçin.')
    const { data: gecmisHam } = await sb.from('goz_enjeksiyonlar').select('goz, ajan, endikasyon, faz, doz_no, tarih, durum').eq('patient_id', h.id).eq('doctor_id', doktorId)
    const gecmis: Enjeksiyon[] = (gecmisHam || []).map((e) => ({ goz: e.goz, ajan: e.ajan, endikasyon: e.endikasyon, faz: e.faz, dozNo: e.doz_no, tarih: e.tarih, durum: e.durum }))
    const s = (k: string) => (b[k] == null || b[k] === '' ? null : String(b[k]))
    let gil = null
    if (sablon === 'katarakt_gil') {
      const { data: k } = await sb.from('goz_katarakt').select('checklist, gil_tipi_hekim, ek3g_kod, biyometri, planlanan_tarih').eq('patient_id', h.id).eq('doctor_id', doktorId).eq('goz', b.goz === 'sol' ? 'sol' : 'sag').order('created_at', { ascending: false }).limit(1).maybeSingle()
      gil = k ? { tip: (k.gil_tipi_hekim as string) || null, ek3gKod: (k.ek3g_kod as string) || null, biyometri: (k.biyometri as Biyometri) || null, kontrolEksik: kataraktHazirlik((k.checklist as Record<string, boolean>) || {}).eksikZorunlu, planlananTarih: (k.planlanan_tarih as string) || null } : null
    }
    const sonuc = gozSgkTaslak({ gil, sablon, hasta: { adSoyad: h.adSoyad }, goz: b.goz === 'sol' ? 'sol' : 'sag', ajan: (s('ajan') as never) || null, endikasyon: (s('endikasyon') as never) || null, anamnez: s('anamnez'), vaBaslangic: s('vaBaslangic'), vaOnceki: s('vaOnceki'), vaSimdi: s('vaSimdi'), mfkBaslangic: num(b.mfkBaslangic), mfkOnceki: num(b.mfkOnceki), mfkSimdi: num(b.mfkSimdi), renkliResim: s('renkliResim'), ffa: s('ffa'), ffaKontrendike: !!b.ffaKontrendike, okt: s('okt'), gecmis, hekimYanitVarBeyani: !!b.hekimYanitVarBeyani, bugun: T })
    // Hasta adı saklanmaz — render sırasında doldurulur (dahiliye_sgk_raporlari ile aynı ilke)
    const { data, error } = await sb.from('goz_sgk_raporlari').insert({ ...ortak, sablon, draft: { ...sonuc.draft, hastaAdi: '', raporTipi: sonuc.raporTipi, sutKontrol: sonuc.sutKontrol, dipnotlar: sonuc.dipnotlar }, eksikler: sonuc.eksikler }).select('id').single()
    if (error) return hata(error.message, 500)
    return NextResponse.json({ ok: true, id: data.id, ...sonuc })
  }

  if (adim === 'sgkrapor_kilit') {
    const { data: r } = await sb.from('goz_sgk_raporlari').select('id, eksikler, durum').eq('id', String(b.id || '')).eq('patient_id', h.id).eq('doctor_id', doktorId).maybeSingle()
    if (!r) return hata('Rapor bulunamadı.', 404)
    if ((r.eksikler || []).length && !b.eksikRaganKilitle) return hata(`Eksikler var: ${(r.eksikler as string[]).join('; ')}`)
    await sb.from('goz_sgk_raporlari').update({ durum: 'kilitli', kilit_at: new Date().toISOString() }).eq('id', r.id)
    return NextResponse.json({ ok: true })
  }

  if (adim === 'katarakt') {
    const goz = b.goz === 'sol' ? 'sol' : 'sag'
    const checklist = Object.fromEntries(KATARAKT_KONTROL.map((m) => [m.kod, !!(b.checklist as Record<string, unknown> | undefined)?.[m.kod]]))
    const hz = kataraktHazirlik(checklist)
    const gil = ['monofokal', 'torik', 'multifokal', 'edof', 'diger'].includes(String(b.gilTipi)) ? b.gilTipi : null
    const bio = b.biyometri && typeof b.biyometri === 'object' ? biyometriNormalize(b.biyometri as Record<string, unknown>) : null
    if (bio?.hatalar.length) return hata(`Biyometri: ${bio.hatalar.join('; ')}`)
    const ek3g = GIL_EK3G_KALEMLERI.some((k) => k.kod === b.ek3gKod) ? String(b.ek3gKod) : null
    const satir = { ...ortak, goz, checklist, gil_tipi_hekim: gil, ek3g_kod: ek3g, ...(bio ? { biyometri: bio.biyometri } : {}), planlanan_tarih: tarihMi(b.planlananTarih) ? b.planlananTarih : null, durum: b.durum === 'yapildi' || b.durum === 'iptal' ? b.durum : hz.hazir ? 'hazir' : 'planlama', updated_at: new Date().toISOString() }
    const { error } = b.id ? await sb.from('goz_katarakt').update(satir).eq('id', String(b.id)).eq('doctor_id', doktorId) : await sb.from('goz_katarakt').insert(satir)
    if (error) return hata(error.message, 500)
    return NextResponse.json({ ok: true, hazirlik: hz })
  }

  if (adim === 'goruntu_okuma') {
    const eylem = String(b.eylem || 'taslak')
    const kopru = await gozGoruntuKopru(eylem, { sb, doktorId, h, b, T })
    if (kopru) return kopru
    if (eylem === 'ayse_taslak') {
      const { data: img } = await sb.from('hasta_goruntulemeler').select('id, modalite, vucut_bolgesi').eq('id', String(b.goruntuId || '')).eq('patient_id', h.id).eq('doctor_id', doktorId).maybeSingle()
      if (!img) return hata('Görüntü bulunamadı.', 404)
      const mod = normalizeModalite(String(img.modalite || ''))
      if (!mod) return hata('Yalnız OCT / fundus / ön segment için Ayşe taslağı.')
      const goz = gozBolgeCoz(String(b.goz || img.vucut_bolgesi || ''))
      const a = ayseGoruntuTaslagi({ modalite: mod, goz })
      const { error } = await sb.from('goz_goruntu_okumalari').insert({ ...ortak, goruntu_id: img.id, goz, taslak: a.taslak, taslak_yazan: 'asistan', durum: 'draft', disclaimer: a.disclaimer })
      if (error) return hata(error.message, 500)
      return NextResponse.json({ ok: true, uyarilar: a.uyarilar, uyari: taslakTaniDiliUyarisi(a.taslak) })
    }
    if (eylem === 'kiyas') {
      const { data: imgs } = await sb.from('hasta_goruntulemeler').select('id, modalite, vucut_bolgesi, goruntuleme_tarihi, created_at, dosya_url').eq('patient_id', h.id).eq('doctor_id', doktorId).in('id', [String(b.aId || ''), String(b.bId || '')])
      const a = (imgs || []).find((x) => x.id === String(b.aId)), c = (imgs || []).find((x) => x.id === String(b.bId))
      if (!a || !c) return hata('İki görüntü de bulunmalı.', 404)
      const r = kiyasCifti(
        { id: a.id, modalite: String(a.modalite), goz: gozBolgeCoz(a.vucut_bolgesi), tarih: String(a.goruntuleme_tarihi || a.created_at), url: a.dosya_url },
        { id: c.id, modalite: String(c.modalite), goz: gozBolgeCoz(c.vucut_bolgesi), tarih: String(c.goruntuleme_tarihi || c.created_at), url: c.dosya_url },
      )
      if (!r.ok) return hata(r.hata)
      return NextResponse.json({ ok: true, baslik: r.baslik, a: { id: a.id, url: a.dosya_url, tarih: String(a.goruntuleme_tarihi || a.created_at).slice(0, 10) }, b: { id: c.id, url: c.dosya_url, tarih: String(c.goruntuleme_tarihi || c.created_at).slice(0, 10) } })
    }
    if (eylem === 'taslak') {
      const { data: img } = await sb.from('hasta_goruntulemeler').select('id').eq('id', String(b.goruntuId || '')).eq('patient_id', h.id).eq('doctor_id', doktorId).maybeSingle()
      if (!img) return hata('Görüntü bulunamadı.', 404)
      const taslak = String(b.taslak || '').trim().slice(0, 3000)
      if (!taslak) return hata('Taslak metni boş.')
      const yazan = b.taslakYazan === 'uzman' ? 'uzman' : 'asistan'
      const { error } = await sb.from('goz_goruntu_okumalari').insert({ ...ortak, goruntu_id: img.id, goz: ['sag', 'sol', 'iki'].includes(String(b.goz)) ? b.goz : null, taslak, taslak_yazan: yazan, durum: 'draft', disclaimer: GOZ_GORUNTU_DISCLAIMER })
      if (error) return hata(error.message, 500)
      return NextResponse.json({ ok: true, uyari: taslakTaniDiliUyarisi(taslak) })
    }
    const { data: ok } = await sb.from('goz_goruntu_okumalari').select('*').eq('id', String(b.id || '')).eq('patient_id', h.id).eq('doctor_id', doktorId).maybeSingle()
    if (!ok) return hata('Okuma bulunamadı.', 404)
    // Uzman = doktor hesabı (sadeceDoktor geçti). Asistan hekim taslağı ayrı aktördür; asistan onaylayamaz.
    const g = okumaGecisi({ taslak: ok.taslak, taslakYazan: ok.taslak_yazan, durum: ok.durum, uzmanMetin: ok.uzman_metin }, eylem as 'onayla' | 'duzelt' | 'reddet', 'uzman', b.uzmanMetin ? String(b.uzmanMetin) : undefined)
    if (!g.ok) return hata(g.hata, 403)
    await sb.from('goz_goruntu_okumalari').update({ durum: g.okuma.durum, uzman_metin: g.okuma.uzmanMetin, onay_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', ok.id)
    return NextResponse.json({ ok: true })
  }

  if (adim === 'kuru_goz') {
    const osdi = num(b.osdi), schirmerSag = num(b.schirmerSag), schirmerSol = num(b.schirmerSol), tbutSag = num(b.tbutSag), tbutSol = num(b.tbutSol)
    const ozet = kuruGozOzet({ osdi, schirmerSag, schirmerSol, tbutSag, tbutSol, notHekim: b.notHekim ? String(b.notHekim).slice(0, 500) : null })
    if (ozet.uyarilar.some((u) => u.includes('0–100'))) return hata(ozet.uyarilar[0])
    const satir = { ...ortak, tarih: tarihMi(b.tarih) ? b.tarih : bugun(), osdi, schirmer_sag: schirmerSag, schirmer_sol: schirmerSol, tbut_sag: tbutSag, tbut_sol: tbutSol, not_hekim: b.notHekim ? String(b.notHekim).slice(0, 500) : null, updated_at: new Date().toISOString() }
    const { error } = await sb.from('goz_kuru_goz').insert(satir)
    if (error) return hata(error.message, 500)
    return NextResponse.json({ ok: true, ozet })
  }

  if (adim === 'kontrol') {
    if (b.id) {
      const durum = ['planli', 'yapildi', 'iptal'].includes(String(b.durum)) ? b.durum : 'planli'
      await sb.from('goz_kontroller').update({ durum }).eq('id', String(b.id)).eq('doctor_id', doktorId)
      return NextResponse.json({ ok: true })
    }
    if (!tarihMi(b.tarih)) return hata('Kontrol tarihi girin.')
    const { error } = await sb.from('goz_kontroller').insert({ ...ortak, tarih: b.tarih, neden: String(b.neden || 'Göz kontrolü').slice(0, 120), dilatasyon: !!b.dilatasyon })
    if (error) return hata(error.message, 500)
    return NextResponse.json({ ok: true })
  }

  if (adim === 'pediatrik') {
    const tip = ['ambliyopi', 'sasilik', 'ambliyopi_sasilik', 'refraktif'].includes(String(b.tip)) ? b.tip : null
    if (!tip) return hata('Tip seçin.')
    const { error } = await sb.from('goz_pediatrik').upsert({ ...ortak, tip, kapama_hekim: b.kapamaHekim ? String(b.kapamaHekim).slice(0, 200) : null, gozluk: !!b.gozluk, sonraki_kontrol: tarihMi(b.sonrakiKontrol) ? b.sonrakiKontrol : null, notlar: b.notlar ? String(b.notlar).slice(0, 500) : null, cover_test: b.coverTest ? String(b.coverTest).slice(0, 200) : null, hirschberg: b.hirschberg ? String(b.hirschberg).slice(0, 120) : null, krimsky: b.krimsky ? String(b.krimsky).slice(0, 120) : null, updated_at: new Date().toISOString() }, { onConflict: 'patient_id' })
    if (error) return hata(error.message, 500)
    return NextResponse.json({ ok: true })
  }

  if (adim === 'gorev') {
    const durum = b.durum === 'iptal' ? 'iptal' : 'tamam'
    await sb.from('goz_gorevler').update({ durum, tamam_at: new Date().toISOString() }).eq('id', String(b.gorevId || '')).eq('doctor_id', doktorId)
    return NextResponse.json({ ok: true })
  }

  if (adim === 'intake_nota') {
    const y = await sonIntake(sb, doktorId, h.id)
    if (!y) return hata('Doldurulmuş göz ön formu yok.')
    const { subjektif } = intakeSubjektif(y)
    if (!subjektif) return hata('Formda aktarılacak yanıt yok.')
    const r = await gununNotunaEkle(sb, doktorId, h.id, subjektif, 'content_subjektif')
    return NextResponse.json({ ok: r.eklendi, sebep: r.sebep, notId: r.eklendi ? r.notId : null }) // NOTYA-MUAYENEYE-DON-01
  }

  if (adim === 'acil') {
    const kodlar = (Array.isArray(b.kodlar) ? b.kodlar : []).map(String).filter((k) => ACIL_KODLARI.some((a) => a.kod === k)) as AcilKod[]
    return NextResponse.json({ acil: acilTara([String(b.metin || '')], kodlar) })
  }

  const ekYanit = await gozEkAdim(adim, { sb, doktorId, h, b, T })
  if (ekYanit) return ekYanit
  return hata('Bilinmeyen adım.')
}
