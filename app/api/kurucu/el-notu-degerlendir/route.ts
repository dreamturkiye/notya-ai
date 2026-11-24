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
 * Single-call mode (ESNEK-A-EVAL, 2026-11-24): body `{ paket, maskeliSayfa, cagri: { tur: 'gorsel' | 'metin', etiket, sistem,
 * parcalar?: ({ tur: 'metin', metin } | { tur: 'ref', ref: 'sayfa' | 'parca:<i>' | 'bolge:<id>' })[], mesaj?, azamiToken },
 * secenek?: { kademe? } }` → `{ cevap, kullanim, ms }`: ONE reader model call on the production path, so the harness can run
 * the reader orchestration locally (tuning without a deploy per change) while the model key stays on the host. Pictures are
 * never sent in this mode — only references into the package whose masking was just proven; text is capped.
 *
 * Evaluation pass (ESNEK-A-EVAL, 2026-11-24): `x-degerlendirme-anahtari: <token>` — a short-lived (≤ 2 h), single-purpose
 * pass whose SHA-256 sits in `degerlendirme_anahtarlari` (lib/kurucu/degerlendirmeAnahtari.ts). A presented but unknown,
 * revoked, expired or wrong-purpose pass → 403 (the other admin paths are not tried). No header → founder session or cron
 * secret, unchanged.
 *
 * Model: the reader's own path (lib/elNotu/model.ts → lib/ai/cagir.ts, task 'goruntu-inceleme' / 'klinik-analiz'); the
 * optional `kademe` is the central policy's existing per-call tier override. No doctor data is read: the lexicon is the
 * branş seed, the outline the build's default for the branş, the memory empty — the same as a new doctor's first page.
 */
import { NextRequest, NextResponse } from 'next/server'
import { servisSupabase } from '@/lib/doktor/serverAuth'
import { kurucuOturumu, yokCevabi } from '@/lib/kurucu/erisim'
import { cronYetkiliMi } from '@/lib/cronYetki'
import { degerlendirmeAnahtari } from '@/lib/kurucu/degerlendirmeAnahtari'
import { paketCoz, gorselMu } from '@/lib/elNotu/okumaServisi'
import { sayfaMaskeKaniti } from '@/lib/elNotu/maskeDogrula'
import { elNotuModeli, type ElNotuOlcum } from '@/lib/elNotu/model'
import { ilacEslesmesi } from '@/lib/elNotu/ilac'
import { sayfayiOku, kaynakMetni, type GorselBlok, type IstemParcasi, type SayfaPaketi } from '@/core/elNotu/okuyucu'
import { sozlukKur } from '@/core/elNotu/sozluk'
import { tohumlarTr, anahatTr } from '@/core/elNotu/tohum'
import { anahatOgren } from '@/core/elNotu/anahat'
import { kelimeAnahtari } from '@/core/elNotu/uzlastir'
import { sayfaPuanla, toplamPuan, icerir, type DegerlendirmeGercegi } from '@/core/elNotu/degerlendirme'
import { EL_NOTU_TR } from '@/core/elNotu/metinTr'
import { SPECIALTIES } from '@/lib/doktor/specialties'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const BASLIK = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }

/** Belt and braces on the way out: identity-shaped strings never leave in the reading (the page was masked already). */
function kimliksizlestir(t: string): string {
  return t.replace(/\S+@\S+\.\S+/g, '[…]').replace(/\d[\d\s.\-/]{8,}\d/g, '[…]').replace(/\b(t\.?\s?c\.?\s?kimlik|ad[iı][\s-]*soyad|kimlik\s*no|gsm|e-?posta|telefon)\b[^\n]*/gi, '[…]')
}

/** Strings inside a model answer pass the same identity filter (the page was masked already). */
function cevabiKimliksizlestir(x: unknown, derinlik = 0): unknown {
  if (typeof x === 'string') return kimliksizlestir(x)
  if (derinlik > 8 || x == null || typeof x !== 'object') return x
  if (Array.isArray(x)) return x.map((y) => cevabiKimliksizlestir(y, derinlik + 1))
  return Object.fromEntries(Object.entries(x as Record<string, unknown>).map(([k, v]) => [k, cevabiKimliksizlestir(v, derinlik + 1)]))
}

/** Usage of the calls of one request: tokens summed, models named, truncations counted. */
function kullanimOzeti(olcumler: ElNotuOlcum[]) {
  const top = (a: string) => olcumler.reduce((t, o) => t + (Number(o.usage[a]) || 0), 0)
  return {
    cagri: olcumler.length, girdi: top('input_tokens'), cikti: top('output_tokens'), onbellekOku: top('cache_read_input_tokens'), onbellekYaz: top('cache_creation_input_tokens'),
    kesik: olcumler.filter((o) => o.durma === 'max_tokens').length, modeller: [...new Set(olcumler.map((o) => `${o.gorev}:${o.model}`))], ms: olcumler.reduce((t, o) => t + o.ms, 0),
  }
}

type CagriGovdesi = { tur: 'gorsel' | 'metin'; etiket: string; sistem: string; parcalar?: unknown[]; mesaj?: unknown; azamiToken: number }
/** Single-call body → model input; pictures only by reference into the proven package. null = refused. */
function cagriCoz(x: unknown, paket: SayfaPaketi, sayfa: GorselBlok): { tur: 'gorsel'; parcalar: IstemParcasi[]; c: CagriGovdesi } | { tur: 'metin'; mesaj: string; c: CagriGovdesi } | null {
  const c = x as CagriGovdesi
  if (!c || typeof c !== 'object' || typeof c.sistem !== 'string' || c.sistem.length > 40_000 || typeof c.etiket !== 'string') return null
  if (!Number.isInteger(c.azamiToken) || c.azamiToken < 100 || c.azamiToken > 24_000) return null
  if (c.tur === 'metin') return typeof c.mesaj === 'string' && c.mesaj.length <= 60_000 ? { tur: 'metin', mesaj: c.mesaj, c } : null
  if (c.tur !== 'gorsel' || !Array.isArray(c.parcalar) || !c.parcalar.length || c.parcalar.length > 40) return null
  const parcalar: IstemParcasi[] = []
  for (const p of c.parcalar as Record<string, unknown>[]) {
    if (p?.tur === 'metin' && typeof p.metin === 'string' && p.metin.length <= 20_000) { parcalar.push({ tur: 'metin', metin: p.metin }); continue }
    if (p?.tur !== 'ref' || typeof p.ref !== 'string') return null
    const r = p.ref
    const g = r === 'sayfa' ? sayfa
      : /^parca:\d$/.test(r) ? paket.parcalar?.[Number(r.slice(6))]?.gorsel
      : r.startsWith('bolge:') ? paket.bolgeler.find((b) => b.id === r.slice(6))?.gorsel : null
    if (!g) return null
    parcalar.push({ tur: 'gorsel', gorsel: g })
  }
  return { tur: 'gorsel', parcalar, c }
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
  const anahtar = await degerlendirmeAnahtari(req, supabase, 'el-notu-degerlendir')
  if (anahtar === 'gecersiz') return NextResponse.json({ error: 'forbidden' }, { status: 403, headers: BASLIK })
  if (anahtar !== 'tamam' && !cronYetkiliMi(req) && !(await kurucuOturumu(req, supabase))) return yokCevabi()
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const paket = paketCoz(b?.paket)
  const sayfa = b?.maskeliSayfa as GorselBlok | undefined
  const gercekler = gercekleriCoz(b?.gercekler ?? [])
  if (!paket || !gorselMu(sayfa)) return NextResponse.json({ error: 'invalid body' }, { status: 400, headers: BASLIK })
  const kanit = sayfaMaskeKaniti(paket, sayfa, true)
  if (!kanit.tamam) return NextResponse.json({ error: 'masking not proven', neden: 'neden' in kanit ? kanit.neden : 'kutu_yok' }, { status: 422, headers: BASLIK })
  const s = (b?.secenek || {}) as Record<string, unknown>
  const kademe = s.kademe === 'hizli' || s.kademe === 'derin' ? s.kademe : undefined
  const olcumler: ElNotuOlcum[] = []
  if (b?.cagri !== undefined) {
    const cagri = cagriCoz(b.cagri, paket, sayfa)
    if (!cagri) return NextResponse.json({ error: 'invalid call' }, { status: 400, headers: BASLIK })
    const model = elNotuModeli({ doctorId: null, kademe, olcum: (o) => olcumler.push(o) })
    const t0 = Date.now()
    try {
      const cevap = cagri.tur === 'gorsel'
        ? await model.gorselJson({ sistem: cagri.c.sistem, parcalar: cagri.parcalar, azamiToken: cagri.c.azamiToken, etiket: cagri.c.etiket })
        : await model.metinJson({ sistem: cagri.c.sistem, mesaj: cagri.mesaj, azamiToken: cagri.c.azamiToken, etiket: cagri.c.etiket })
      return NextResponse.json({ cevap: cevabiKimliksizlestir(cevap), kullanim: kullanimOzeti(olcumler), ms: Date.now() - t0 }, { headers: BASLIK })
    } catch (e) {
      return NextResponse.json({ error: 'model call failed', tur: e instanceof Error ? e.name : 'Error', kullanim: kullanimOzeti(olcumler) }, { status: 502, headers: BASLIK })
    }
  }
  if (!gercekler) return NextResponse.json({ error: 'invalid body' }, { status: 400, headers: BASLIK })
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
    }, elNotuModeli({ doctorId: null, kademe, olcum: (o) => olcumler.push(o) }))
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
      okumaSayisi: r.okumaSayisi, butceDisi: r.butceDisi, okunamadi: r.okunamadi, ms: Date.now() - t0, kullanim: kullanimOzeti(olcumler),
      // reading ceiling: facts whose keys appear anywhere in the reads (every word, every alternative, the drawing text)
      herhangiOkumada: gercekler.filter((g) => { const ham = `${r.satirlar.flatMap((l) => l.kelimeler.flatMap((k) => [k.metin, ...k.adaylar])).join(' ')}\n${metin}\n${r.dogrula.flatMap((d) => [d.okunan, ...d.adaylar]).join(' ')}`; return g.anahtarlar.every((grup) => grup.some((a) => icerir(ham, a))) }).length,
    }, { headers: BASLIK })
  } catch (e) {
    return NextResponse.json({ error: 'reader failed', tur: e instanceof Error ? e.name : 'Error' }, { status: 502, headers: BASLIK })
  }
}
