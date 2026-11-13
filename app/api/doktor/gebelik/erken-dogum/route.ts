/**
 * PREMATURE-MODUL — Kadın Hastalıkları ve Doğum › Erken doğum risk paneli API. KD ONLY: başka her branş 403
 * (kadinDogumBransi, hekimin kendi users.specialty'si). Yalnız hekim (sekreter yok).
 *
 *   GET ?patientId=            → { gebelikVar, gebelikId?, sat, tdt, durum, cogulTipi, kayit, sonuc, bugun }
 *   PUT { patientId, kayit }   → kaydı (serviks günlüğü, öykü, PPROM, steroid kürü, magnezyum, progesteron olgusu) yazar; yanıt GET ile aynı
 *
 * Kayıt gebelikler.erken_dogum (jsonb) içinde durur ve yazmadan önce motorun temizleyicisinden (erkenDogumTemizle) geçer. Motor doz,
 * tetkik, ilaç ya da serklaj ÖNERMEZ; "kriter karşılandı" göstergeleri ve hekimin kayıtları döner.
 * HASTA-IZOLASYON: hasta hastaSahibiMi ile, gebelik ayrıca doctor_id ile aranır; yabancı kimlik 404.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pratikOturum, sadeceDoktor } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { doktorBransi } from '@/lib/doktor/kdTaramaSunucu'
import { kadinDogumBransi } from '@/lib/doktor/hastaDosyaSekmeleri'
import { aktifGebelikDurumu } from '@/lib/clinical/gebelikDurum'
import { BOS_KAYIT, erkenDogumDegerlendir, erkenDogumTemizle } from '@/specialties/kadin-dogum/engines/erkenDogum'

export const dynamic = 'force-dynamic'
const NO_STORE = { 'Cache-Control': 'private, no-store' }
const yanit = (g: unknown, status = 200) => NextResponse.json(g, { status, headers: NO_STORE })
const BULUNAMADI = () => yanit({ error: 'Hasta bulunamadı.' }, 404)
const bugunTr = () => new Date(Date.now() + 3 * 3600e3).toISOString().slice(0, 10)

async function kapi(req: NextRequest) {
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return { hata: oturum.hata }
  const engel = sadeceDoktor(oturum)
  if (engel) return { hata: engel }
  if (!kadinDogumBransi(await doktorBransi(oturum.supabase, oturum.doktorId))) {
    return { hata: yanit({ error: 'Bu bölüm yalnız Kadın Hastalıkları ve Doğum hekimleri içindir.', kod: 'kd_degil' }, 403) }
  }
  return { oturum }
}

type Sb = NonNullable<Awaited<ReturnType<typeof kapi>>['oturum']>['supabase']

async function gebelikGetir(sb: Sb, doktorId: string, patientId: string) {
  const { data } = await sb.from('gebelikler').select('id, sat, tdt, durum, dogum_tarihi, cogul_gebelik_tipi, erken_dogum, created_at')
    .eq('patient_id', patientId).eq('doctor_id', doktorId).order('created_at', { ascending: false }).limit(20)
  const liste = (data || []) as Array<{ id: string; sat: string | null; tdt: string | null; durum: string | null; dogum_tarihi: string | null; cogul_gebelik_tipi: string | null; erken_dogum: unknown }>
  return liste.find((g) => aktifGebelikDurumu(g.durum)) || null
}

function cevap(g: NonNullable<Awaited<ReturnType<typeof gebelikGetir>>>) {
  const bugun = bugunTr()
  const kayit = erkenDogumTemizle(g.erken_dogum, bugun).kayit
  const sat = g.sat ? String(g.sat).slice(0, 10) : null, tdt = g.tdt ? String(g.tdt).slice(0, 10) : null
  const sonuc = erkenDogumDegerlendir({ sat, tdt, cogulTipi: g.cogul_gebelik_tipi ?? null, durum: 'aktif', kayit }, bugun)
  return { gebelikVar: true, gebelikId: g.id, sat, tdt, durum: 'aktif', cogulTipi: g.cogul_gebelik_tipi ?? null, kayit, sonuc, bugun }
}

export async function GET(req: NextRequest) {
  const k = await kapi(req)
  if ('hata' in k) return k.hata
  const { supabase, doktorId } = k.oturum
  const patientId = req.nextUrl.searchParams.get('patientId') || ''
  if (!patientId || !(await hastaSahibiMi(supabase, doktorId, patientId))) return BULUNAMADI()
  const g = await gebelikGetir(supabase, doktorId, patientId)
  return yanit(g ? cevap(g) : { gebelikVar: false, kayit: BOS_KAYIT, bugun: bugunTr() })
}

export async function PUT(req: NextRequest) {
  const k = await kapi(req)
  if ('hata' in k) return k.hata
  const { supabase, doktorId } = k.oturum
  const b = (await req.json().catch(() => null)) as { patientId?: unknown; kayit?: unknown } | null
  const patientId = typeof b?.patientId === 'string' ? b.patientId : ''
  if (!patientId || !(await hastaSahibiMi(supabase, doktorId, patientId))) return BULUNAMADI()
  const g = await gebelikGetir(supabase, doktorId, patientId)
  if (!g) return yanit({ error: 'Bu hastanın aktif gebelik kaydı yok.', kod: 'gebelik_yok' }, 404)
  const { kayit, hata } = erkenDogumTemizle(b?.kayit, bugunTr())
  if (hata) return yanit({ error: hata, kod: 'gecersiz' }, 400)
  const { error } = await supabase.from('gebelikler').update({ erken_dogum: kayit, updated_at: new Date().toISOString() }).eq('id', g.id).eq('doctor_id', doktorId)
  if (error) return yanit({ error: 'Kaydedilemedi.' }, 500)
  return yanit(cevap({ ...g, erken_dogum: kayit }))
}
