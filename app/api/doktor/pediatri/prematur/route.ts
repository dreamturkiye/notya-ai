/**
 * PREMATURE-MODUL — Araçlar › Prematüre takip planı API (yalnız pediatri; pediOturum branş kapısı).
 * GET  ?patientId=  → { hasta, profil (hekim girdisi), etkin (plan girdisi), plan, protokol }. Plan türetilir, saklanmaz.
 *      ?patientId=&ozet=1 → { kapsamda, gecikti, zamaniGeldi } (hasta dosyası sekmesi için hafif özet).
 * PUT  { patientId, profil } → hekimin NICU öyküsünü kaydeder (profilTemizle ile sınırlı ve tür denetimli).
 * POST { patientId, ogeId, durum | null, tarih?, not? } → hekimin takip kalemi işareti (plana alındı / yapıldı / uygulanmaz).
 *   ogeId yalnız bu hastanın güncel planındaki bir kalemse kabul edilir. Hiçbir şey otomatik sipariş edilmez.
 * Her hasta kimliği pediHasta() ile doctor_id'ye karşı doğrulanır; yabancı kimlik 404.
 */
import { NextRequest, NextResponse } from 'next/server'
import { pediOturum, pediHasta, bulunamadi, bugunTr } from '../_ortak'
import { prematurKaynakVeri, profilKaydet, ogeKaydet } from '../_prematur'
import { prematurPlanHesapla } from '@/specialties/pediatri/engines/prematurKohort'
import { prematurProtokolu } from '@/lib/clinical/prematur/protokolTR'
import { profilTemizle } from '@/lib/clinical/prematur/protokol'
import { gestasyonMetni } from '@/lib/clinical/prematur/duzeltilmisYas'

export const dynamic = 'force-dynamic'

async function planCevabi(o: { sb: Parameters<typeof prematurKaynakVeri>[0]; doktorId: string }, h: { id: string; dogumIso: string | null; cinsiyet: 'male' | 'female' | null }) {
  if (!h.dogumIso) return NextResponse.json({ hasta: { id: h.id, dogumIso: null, cinsiyet: h.cinsiyet }, dogumBilinmiyor: true })
  const protokol = prematurProtokolu('tr')
  const v = await prematurKaynakVeri(o.sb, o.doktorId, { id: h.id, dogumIso: h.dogumIso })
  const { plan, etkin } = prematurPlanHesapla(v, bugunTr(), protokol)
  return NextResponse.json({
    hasta: { id: h.id, dogumIso: h.dogumIso, cinsiyet: h.cinsiyet },
    profil: v.profil,
    kart: { gestasyonHafta: v.kartGestasyonHafta, dogumKiloGr: v.kartDogumKiloGr, ozet: v.kartOzet },
    etkin: { gestasyon: gestasyonMetni(etkin.gestasyonGun), gestasyonKaynagi: etkin.gestasyonKaynagi, dogumKiloGr: etkin.dogumKiloGr, profil: etkin.profil },
    plan,
    bugun: bugunTr(),
    protokol: { ulke: protokol.ulke, ad: protokol.ad, surum: protokol.surum, kapsam: protokol.kapsam },
  })
}

export async function GET(req: NextRequest) {
  const o = await pediOturum(req)
  if ('hata' in o) return o.hata
  const h = await pediHasta(o.sb, o.doktorId, req.nextUrl.searchParams.get('patientId'))
  if (!h) return bulunamadi()
  if (req.nextUrl.searchParams.get('ozet') === '1') {
    // Hasta dosyası sekmesi için hafif özet: yalnız kapsamda mı ve kaç kalem geciken / zamanı gelen.
    if (!h.dogumIso) return NextResponse.json({ kapsamda: false })
    const { plan } = prematurPlanHesapla(await prematurKaynakVeri(o.sb, o.doktorId, { id: h.id, dogumIso: h.dogumIso }), bugunTr(), prematurProtokolu('tr'))
    return NextResponse.json({ kapsamda: plan.kapsamda, gecikti: plan.ozet.gecikti, zamaniGeldi: plan.ozet.zamaniGeldi })
  }
  return planCevabi(o, h)
}

export async function PUT(req: NextRequest) {
  const o = await pediOturum(req)
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as { patientId?: unknown; profil?: unknown } | null
  const h = await pediHasta(o.sb, o.doktorId, b?.patientId as string | undefined)
  if (!h) return bulunamadi()
  if (!(await profilKaydet(o.sb, o.doktorId, h.id, profilTemizle(b?.profil)))) return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 })
  return planCevabi(o, h)
}

export async function POST(req: NextRequest) {
  const o = await pediOturum(req)
  if ('hata' in o) return o.hata
  const b = (await req.json().catch(() => null)) as { patientId?: unknown; ogeId?: unknown; durum?: unknown; tarih?: unknown; not?: unknown } | null
  const h = await pediHasta(o.sb, o.doktorId, b?.patientId as string | undefined)
  if (!h || !h.dogumIso) return bulunamadi()
  const ogeId = String(b?.ogeId || '')
  const v = await prematurKaynakVeri(o.sb, o.doktorId, { id: h.id, dogumIso: h.dogumIso })
  const { plan } = prematurPlanHesapla(v, bugunTr(), prematurProtokolu('tr'))
  if (!plan.ogeler.some((x) => x.id === ogeId)) return NextResponse.json({ error: 'Bu kalem bu hastanın planında yok.' }, { status: 400 })
  const durum = b?.durum
  let kayit = null
  if (durum !== null && durum !== undefined) {
    if (durum !== 'plana_alindi' && durum !== 'yapildi' && durum !== 'uygulanmaz') return NextResponse.json({ error: 'Geçersiz durum.' }, { status: 400 })
    const tarih = /^\d{4}-\d{2}-\d{2}$/.test(String(b?.tarih || '')) ? String(b?.tarih) : null
    kayit = { durum, tarih, not: b?.not ? String(b.not).slice(0, 300) : null } as const
  }
  if (!(await ogeKaydet(o.sb, o.doktorId, h.id, ogeId, kayit))) return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 })
  return planCevabi(o, h)
}
