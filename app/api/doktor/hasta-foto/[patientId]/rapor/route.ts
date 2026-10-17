/**
 * FOTO-ARSIV-01 (g) — clean PDF "fotoğraf raporu" of selected photos (referral letters, file copies).
 *   POST /api/doktor/hasta-foto/[patientId]/rapor   { duzen, baslik?, ogeler: [{ belgeId, gorsel }] }
 * `gorsel` is the device-rendered, annotated, EXIF-free JPEG of that photo. Every belgeId is proved against the patient and the
 * doctor; dates, region, tags and notes are read from the server's own rows (the client cannot forge them). Audit-logged as an export.
 */
import { NextRequest } from 'next/server'
import { pratikOturum } from '@/lib/doktor/pratikOturum'
import { hastaSahibiMi } from '@/lib/doktor/hastaSahipligi'
import { hekimAdi } from '@/lib/doktor/hekimAdi'
import { hastaAdiCoz } from '@/lib/doktor/hastaCozumleyici'
import { fotoArsiviAcikMi } from '@/lib/doktor/fotoArsiv/bayrak'
import { bolgeEtiketi } from '@/lib/doktor/fotoArsiv/bolgeler'
import { fotoBaglami, fotoMetasi } from '@/lib/doktor/fotoArsiv/sunucu'
import { RAPOR_OGE_AZAMI, fotoRaporuUret, type RaporDuzeni, type RaporOgesi } from '@/lib/doktor/fotoArsiv/raporPdf'
import { aralikMetni } from '@/lib/doktor/fotoArsiv/zamanCizelgesi'
import { bulunamadi, gecersiz, hataYaniti, idlerGecerli, jsonGovde, kapaliYaniti, NO_STORE } from '@/lib/doktor/fotoArsiv/rota'
import { gorselCoz } from '@/lib/doktor/muayeneEk/foto/fotoServis'
import { logFotoOlayi } from '@/lib/security/auditLogger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

type Ctx = { params: { patientId: string } | Promise<{ patientId: string }> }

const DUZENLER: readonly RaporDuzeni[] = ['kolaj', 'tek', 'karsilastirma']
const tarihMetni = (iso: string): string => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'long', year: 'numeric' })
}

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!fotoArsiviAcikMi()) return kapaliYaniti()
  const oturum = await pratikOturum(req)
  if ('hata' in oturum) return oturum.hata
  const { patientId } = await ctx.params
  if (!idlerGecerli(patientId)) return bulunamadi()
  const govde = (await jsonGovde(req, 4_200_000)) as Record<string, unknown> | null
  if (!govde || !Array.isArray(govde.ogeler) || !govde.ogeler.length) return gecersiz('Fotoğraf seçilmedi.')
  if (govde.ogeler.length > RAPOR_OGE_AZAMI) return gecersiz(`Bir raporda en fazla ${RAPOR_OGE_AZAMI} fotoğraf olabilir.`)
  const duzen = DUZENLER.includes(govde.duzen as RaporDuzeni) ? (govde.duzen as RaporDuzeni) : 'kolaj'
  if (duzen === 'karsilastirma' && govde.ogeler.length !== 2) return gecersiz('Karşılaştırma raporu için tam iki fotoğraf seçin.')

  const sb = oturum.supabase
  if (!(await hastaSahibiMi(sb, oturum.doktorId, patientId))) return bulunamadi()

  const ogeler: (RaporOgesi & { ham: string })[] = []
  for (const ham of govde.ogeler as Record<string, unknown>[]) {
    if (!ham || typeof ham !== 'object' || !idlerGecerli(ham.belgeId)) return bulunamadi()
    const belgeId = String(ham.belgeId)
    const g = gorselCoz(ham.gorsel)
    if ('hata' in g) return gecersiz(g.hata)
    const belge = await fotoBaglami(sb, oturum.doktorId, patientId, belgeId)
    if (!belge) return bulunamadi() // one foreign / unknown id fails the whole report: nothing is partially exported
    const m = await fotoMetasi(sb, oturum.doktorId, patientId, belgeId)
    const tarihIso = m.cekimTarihi ? `${m.cekimTarihi}T12:00:00.000Z` : belge.createdAt
    ogeler.push({
      ham: tarihIso, bolge: m.bolge ? bolgeEtiketi(m.bolge) : null, tarih: tarihMetni(tarihIso), etiketler: m.ozel.etiketler,
      not: m.ozel.not, yildiz: m.yildiz, anahtar: m.anahtar, gorsel: `data:${g.gorsel.mime};base64,${g.gorsel.base64}`,
    })
  }
  if (duzen === 'karsilastirma') ogeler.sort((a, b) => Date.parse(a.ham) - Date.parse(b.ham))

  try {
    const [{ data: hasta }, hekim] = await Promise.all([
      sb.from('patients').select('name_encrypted').eq('id', patientId).eq('doctor_id', oturum.doktorId).maybeSingle(),
      hekimAdi(sb, oturum.doktorId),
    ])
    const baslik = typeof govde.baslik === 'string' && govde.baslik.trim() ? Array.from(govde.baslik.trim()).slice(0, 80).join('') : 'Klinik fotoğraf raporu'
    const pdf = await fotoRaporuUret({
      baslik, hastaAdi: hastaAdiCoz((hasta?.name_encrypted as string | null) ?? null) || 'Hasta', hekimAdi: hekim,
      uretildi: tarihMetni(new Date().toISOString()), duzen,
      aralik: duzen === 'karsilastirma' ? aralikMetni(ogeler[0].ham, ogeler[1].ham) : null,
      ogeler: ogeler.map(({ ham: _ham, ...o }) => o),
    })
    try { await logFotoOlayi(oturum.user.id, 'rapor', patientId, { patientId, adet: ogeler.length }, req) } catch { /* never blocks */ }
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: { ...NO_STORE, 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="fotograf-raporu.pdf"', 'X-Content-Type-Options': 'nosniff' },
    })
  } catch (e) { return hataYaniti(e) }
}
