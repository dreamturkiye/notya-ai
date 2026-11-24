/**
 * ESNEK-READER-2 — POST /api/kurucu/el-notu-degerlendir: measure the El Notu reader on the PRODUCTION model path without
 * anyone handling the model key. Admin only: a founder session (FOUNDER_EMAILS, lib/kurucu/erisim.ts) or the cron secret
 * (lib/cronYetki.ts); everyone else gets the same 404 as a missing route.
 *
 *   body  { ad, paket, maskeliSayfa, gercekler, brans?, secenek?: { kademe?: 'hizli' | 'derin', okumaSayisi?: 1–3, butce?: 0–20 } }
 *         one page per call (the host's 4.5 MB body cap): the device package + the masked page exactly as the app sends
 *         them (scripts/el-notu-degerlendir.mts builds both with the on-device masker), plus clinical-only ground truth.
 *   200   { ad, puan, toplam, metin, dogrula, okumaSayisi, ms }   metrics + the de-identified reading; nothing is stored
 *   422   the package does not prove its masking (every declared identity box must be black on every picture) — refused
 *         before any model call
 *
 * Model: the reader's own path (lib/elNotu/model.ts → lib/ai/cagir.ts, task 'goruntu-inceleme' / 'klinik-analiz'); the
 * optional `kademe` is the central policy's existing per-call tier override. No doctor data is read: the lexicon is the
 * branş seed, the outline the build's default for the branş, the memory empty — the same as a new doctor's first page.
 */
import { NextRequest, NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { kurucuOturumu, yokCevabi } from '@/lib/kurucu/erisim'
import { cronYetkiliMi } from '@/lib/cronYetki'
import { paketCoz, gorselMu } from '@/lib/elNotu/okumaServisi'
import { sayfaMaskeKaniti } from '@/lib/elNotu/maskeDogrula'
import { elNotuModeli } from '@/lib/elNotu/model'
import { ilacEslesmesi } from '@/lib/elNotu/ilac'
import { sayfayiOku, kaynakMetni, type GorselBlok } from '@/core/elNotu/okuyucu'
import { sozlukKur } from '@/core/elNotu/sozluk'
import { tohumlarTr, anahatTr } from '@/core/elNotu/tohum'
import { anahatOgren } from '@/core/elNotu/anahat'
import { kelimeAnahtari } from '@/core/elNotu/uzlastir'
import { sayfaPuanla, toplamPuan, type DegerlendirmeGercegi } from '@/core/elNotu/degerlendirme'
import { EL_NOTU_TR } from '@/core/elNotu/metinTr'
import { SPECIALTIES } from '@/lib/doktor/specialties'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const BASLIK = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

/** Belt and braces on the way out: identity-shaped strings never leave in the reading (the page was masked already). */
function kimliksizlestir(t: string): string {
  return t.replace(/\S+@\S+\.\S+/g, '[…]').replace(/\d[\d\s.\-/]{8,}\d/g, '[…]').replace(/\b(t\.?\s?c\.?\s?kimlik|ad[iı][\s-]*soyad|kimlik\s*no|gsm|e-?posta|telefon)\b[^\n]*/gi, '[…]')
}

function gercekleriCoz(x: unknown): DegerlendirmeGercegi[] | null {
  if (!Array.isArray(x) || x.length > 60) return null
  const out: DegerlendirmeGercegi[] = []
  for (const g of x as Record<string, unknown>[]) {
    if (!g || typeof g.id !== 'string' || !Array.isArray(g.anahtarlar)) return null
    const anahtarlar = (g.anahtarlar as unknown[]).filter(Array.isArray).map((grup) => (grup as unknown[]).map(String).slice(0, 8)).slice(0, 6)
    out.push({ id: g.id.slice(0, 40), metin: String(g.metin || '').slice(0, 200), anahtarlar, korumali: g.korumali === true, belirsiz: g.belirsiz === true })
  }
  return out
}

export async function POST(req: NextRequest) {
  const supabase = servisSupabase()
  if (!cronYetkiliMi(req) && !(await kurucuOturumu(req, supabase))) return yokCevabi()
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const paket = paketCoz(b?.paket)
  const sayfa = b?.maskeliSayfa as GorselBlok | undefined
  const gercekler = gercekleriCoz(b?.gercekler ?? [])
  if (!paket || !gorselMu(sayfa) || !gercekler) return NextResponse.json({ error: 'invalid body' }, { status: 400, headers: BASLIK })
  const kanit = sayfaMaskeKaniti(paket, sayfa, true)
  if (!kanit.tamam) return NextResponse.json({ error: 'masking not proven', neden: 'neden' in kanit ? kanit.neden : 'kutu_yok' }, { status: 422, headers: BASLIK })
  const s = (b?.secenek || {}) as Record<string, unknown>
  const kademe = s.kademe === 'hizli' || s.kademe === 'derin' ? s.kademe : undefined
  const okumaSayisi = Number.isInteger(s.okumaSayisi) ? Math.max(1, Math.min(3, Number(s.okumaSayisi))) : undefined
  const butce = Number.isInteger(s.butce) ? Math.max(0, Math.min(20, Number(s.butce))) : undefined
  const brans = typeof b?.brans === 'string' ? b.brans : 'kulak-burun-bogaz'
  const bransAdi = SPECIALTIES.find((x) => x.key === brans)?.label || brans
  const tohum = tohumlarTr(brans)
  const sozluk = sozlukKur([], tohum.brans, tohum.genel)
  const anlam = new Set(sozluk.girdiler.flatMap((x) => x.anlam.split(/\s+/)).map(kelimeAnahtari))
  const t0 = Date.now()
  try {
    const r = await sayfayiOku(paket, {
      bransAdi, dil: EL_NOTU_TR.dil, sozluk, hafiza: [], dagarcik: new Map(), sorulmusKisaltmalar: new Set(), ilac: ilacEslesmesi, sozcukMu: (t) => anlam.has(kelimeAnahtari(t)),
      sayfaGorseli: sayfa, anahat: anahatOgren([], anahatTr(brans)), okumaSayisi, dogrulaButcesi: butce,
    }, elNotuModeli({ doctorId: null, kademe }))
    const metin = kaynakMetni([r], EL_NOTU_TR.dil, (id) => paket.bolgeler.find((x) => x.id === id)?.etiket || id)
    const puan = sayfaPuanla({
      metin, dogrula: r.dogrula, gercekler,
      hamKelimeler: r.satirlar.flatMap((l) => l.kelimeler.flatMap((k) => [k.metin, ...k.adaylar])),
      izinli: [...sozluk.girdiler.flatMap((x) => [x.kisaltma, x.anlam]), ...EL_NOTU_TR.dil.bagSozcukleri, EL_NOTU_TR.dil.cizimBasligi, ...Object.values(EL_NOTU_TR.dil.taraf), ...paket.bolgeler.map((x) => x.etiket)],
      okunamadi: EL_NOTU_TR.dil.okunamadi,
    })
    return NextResponse.json({
      ad: String(b?.ad || '').replace(/[^\w-]/g, '').slice(0, 16), puan, toplam: toplamPuan([puan]),
      metin: kimliksizlestir(metin), dogrula: r.dogrula.map((d) => ({ sinif: d.sinif, korumaliTur: d.korumaliTur ?? null, okunan: kimliksizlestir(d.okunan), adaylar: d.adaylar.map(kimliksizlestir) })),
      okumaSayisi: r.okumaSayisi, butceDisi: r.butceDisi, okunamadi: r.okunamadi, ms: Date.now() - t0,
    }, { headers: BASLIK })
  } catch (e) {
    return NextResponse.json({ error: 'reader failed', tur: e instanceof Error ? e.name : 'Error' }, { status: 502, headers: BASLIK })
  }
}
