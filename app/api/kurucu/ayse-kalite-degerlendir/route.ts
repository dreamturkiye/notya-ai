/**
 * AKKS — POST /api/kurucu/ayse-kalite-degerlendir: run Ayşe Klinik Kalite Standardı items on the PRODUCTION text assistant
 * path (lib/akks/calistir.ts) without anyone handling the model key. Admin only, same pattern as el-notu-degerlendir:
 *   `x-degerlendirme-anahtari: <token>` — a short-lived (≤ 2 h) single-purpose pass ('ayse-kalite-degerlendir') whose
 *   SHA-256 sits in degerlendirme_anahtarlari; a presented but invalid pass → 403. No header → founder session
 *   (FOUNDER_EMAILS) or the cron secret; everyone else gets the same 404 as a missing route.
 *
 *   { islem: 'kosu-ac', etiket, tur: 'taban'|'elle'|'kapi', branslar?, soruIdleri?, sadeceIzleme?, bransBasina? } → { kosuId, soruIdleri }
 *   { islem: 'soru', kosuId, soruId }      → one item: answer + grade, stored → { soruId, puan, zararli, gecti, inceleme, rota, ms, hata, cevap }
 *   { islem: 'kalan', kosuId }             → planned items without a stored answer (resume)
 *   { islem: 'kosu-kapat', kosuId }        → summary per branş, gate vs. the accepted baseline, token cost
 *   { islem: 'ozet', kosuId }              → the stored run row (summary, gate, cost) — for scripts/akks/kapi.mts
 *   { islem: 'kayitlar', kosuId }          → the stored grades of a run (no answer text) — replay check
 *
 * Takes no patient, note or session id; the evaluation doctors have no patients.
 */
import { NextRequest, NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { kurucuOturumu, yokCevabi } from '@/lib/kurucu/erisim'
import { cronYetkiliMi } from '@/lib/cronYetki'
import { degerlendirmeAnahtari } from '@/lib/kurucu/degerlendirmeAnahtari'
import { kalanMaddeler, kosuAc, kosuKapat, kosuKayitlari, soruCalistir, type KosuTuru } from '@/lib/akks/calistir'

export const dynamic = 'force-dynamic'
export const maxDuration = 300
export const preferredRegion = 'iad1'

const BASLIK = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }
const kimlik = (x: unknown) => (typeof x === 'string' && /^[0-9a-f-]{36}$/.test(x) ? x : null)
const dizi = (x: unknown, n: number) => (Array.isArray(x) ? x.filter((v): v is string => typeof v === 'string' && v.length <= 40).slice(0, n) : undefined)

export async function POST(req: NextRequest) {
  const sb = servisSupabase()
  const anahtar = await degerlendirmeAnahtari(req, sb, 'ayse-kalite-degerlendir')
  if (anahtar === 'gecersiz') return NextResponse.json({ error: 'forbidden' }, { status: 403, headers: BASLIK })
  const kurucu = anahtar === 'tamam' || cronYetkiliMi(req) ? null : await kurucuOturumu(req, sb)
  if (anahtar !== 'tamam' && !cronYetkiliMi(req) && !kurucu) return yokCevabi()
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  try {
    switch (b?.islem) {
      case 'kosu-ac': {
        const tur = (['taban', 'elle', 'kapi'] as const).includes(b.tur as 'taban') ? (b.tur as KosuTuru) : 'elle'
        const r = await kosuAc(sb, {
          etiket: String(b.etiket || `${tur}-${new Date().toISOString().slice(0, 10)}`).replace(/[^\w.:-]/g, '-'), tur,
          branslar: dizi(b.branslar, 40), soruIdleri: dizi(b.soruIdleri, 2000), sadeceIzleme: b.sadeceIzleme === true,
          bransBasina: Number.isInteger(b.bransBasina) ? Math.max(1, Math.min(100, Number(b.bransBasina))) : undefined, olusturan: kurucu?.id ?? null,
        })
        return NextResponse.json({ kosuId: r.id, soruIdleri: r.soruIdleri }, { headers: BASLIK })
      }
      case 'soru': {
        const kosuId = kimlik(b.kosuId)
        if (!kosuId || typeof b.soruId !== 'string') return NextResponse.json({ error: 'invalid body' }, { status: 400, headers: BASLIK })
        return NextResponse.json(await soruCalistir(sb, kosuId, b.soruId), { headers: BASLIK })
      }
      case 'kalan': {
        const kosuId = kimlik(b.kosuId)
        if (!kosuId) return NextResponse.json({ error: 'invalid body' }, { status: 400, headers: BASLIK })
        return NextResponse.json({ kalan: await kalanMaddeler(sb, kosuId) }, { headers: BASLIK })
      }
      case 'kosu-kapat': {
        const kosuId = kimlik(b.kosuId)
        if (!kosuId) return NextResponse.json({ error: 'invalid body' }, { status: 400, headers: BASLIK })
        return NextResponse.json(await kosuKapat(sb, kosuId), { headers: BASLIK })
      }
      case 'ozet': {
        const kosuId = kimlik(b.kosuId)
        let q = sb.from('akks_kosular').select('id, etiket, tur, durum, branslar, basladi_at, bitti_at, ozet, kapi, maliyet, taban_mi, izlenen_ozet, surum')
        q = kosuId ? q.eq('id', kosuId) : q.eq('durum', 'tamam').order('basladi_at', { ascending: false })
        const { data } = await q.limit(1)
        return NextResponse.json({ kosu: data?.[0] ?? null }, { headers: BASLIK })
      }
      case 'kayitlar': {
        const kosuId = kimlik(b.kosuId)
        if (!kosuId) return NextResponse.json({ error: 'invalid body' }, { status: 400, headers: BASLIK })
        return NextResponse.json({ kayitlar: await kosuKayitlari(sb, kosuId) }, { headers: BASLIK })
      }
      default:
        return NextResponse.json({ error: 'invalid body' }, { status: 400, headers: BASLIK })
    }
  } catch (e) {
    const mesaj = e instanceof Error && e.message.startsWith('akks:') ? e.message : 'akks failed'
    return NextResponse.json({ error: mesaj }, { status: 502, headers: BASLIK })
  }
}
