/**
 * ESNEK-GELISIM (Kaan, 2026-11-24) — El Notu regression guard: "any reader change must not lower it before shipping."
 *
 *   npx tsx scripts/el-notu-regresyon-bekcisi.mts --set <dir> [--taban-yaz]
 *   npx tsx scripts/el-notu-regresyon-bekcisi.mts --uretim
 *
 * Replays RECORDED model answers through the CURRENT reader code (core/elNotu/regresyonBekcisi.ts — the same replay key
 * as the evaluation harness' `--model kayit`) and compares the score with the baseline. No model is called.
 * Exit 1 when the score is lower (core `bekciKarari`) or when a recording is missing (a prompt or input change: the set
 * is STALE — re-record it on the production model, then the guard runs again; never a silent pass).
 *
 * --set <dir>   a local set: <dir>/sayfalar/<ad>.json = { ad, brans, paket, maskeliSayfa, gercekler } (masked packages and
 *               clinical-only ground truth), <dir>/kayit/<ad>.json = { kayit: { <replay key>: answer } }, <dir>/taban.json =
 *               the baseline score (toplamPuan), optional <dir>/onayli.json = { <branş>: [{ kisaltma, anlam }] }.
 *               --taban-yaz writes the current score as the new baseline (after an accepted improvement only).
 *               Real patient pages never go into this repo: keep the folder outside it.
 * --uretim      the production set: every consented set page with its latest weekly recording; baseline = the numbers
 *               the weekly run stored for that week (same answers, the reader build of that week). Needs
 *               NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment (never printed); nothing is
 *               written to disk. Only numbers are printed.
 */
import fs from 'node:fs'
import path from 'node:path'
import { setiOynat, bekciKarari, olcumdenPuan, type SetSayfasi, type OlcumOrtami, type OlcumSatiri } from '../core/elNotu/regresyonBekcisi'
import { toplamPuan, type ToplamPuan } from '../core/elNotu/degerlendirme'
import { tohumlarTr, anahatTr } from '../core/elNotu/tohum'
import { bransTohumuBirlestir } from '../core/elNotu/bransSozlukBuyume'
import { EL_NOTU_TR } from '../core/elNotu/metinTr'
import { SPECIALTIES } from '../lib/doktor/specialties'

const arg = (ad: string) => { const i = process.argv.indexOf(`--${ad}`); return i > 0 ? process.argv[i + 1] : undefined }
const bayrak = (ad: string) => process.argv.includes(`--${ad}`)
const KOK = path.resolve(new URL('.', import.meta.url).pathname, '..')

function ortam(onayli: Record<string, { kisaltma: string; anlam: string }[]>): OlcumOrtami {
  return {
    dil: EL_NOTU_TR.dil,
    tohum: (b) => { const t = tohumlarTr(b); return { brans: bransTohumuBirlestir(t.brans, (b && onayli[b]) || []), genel: t.genel } },
    anahat: (b) => anahatTr(b),
    // the same branş name the weekly production run passes (app/api/cron/el-notu-regresyon) — part of the prompt
    bransAdi: (b) => SPECIALTIES.find((x) => x.key === b)?.label || b || 'genel',
  }
}

function rapor(etiket: string, t: ToplamPuan) {
  return { etiket, sayfa: t.sayfa, gercek: t.gercek, dogrulaIleYuzde: t.dogrulaIleYuzde, kesinYuzde: t.kesinYuzde, uydurma: t.uydurma, dogrulaSayfaBasina: t.dogrulaSayfaBasina, korumaliDogrulaIle: t.korumali.dogrulaIle }
}

async function yerel(dizin: string) {
  if (path.resolve(dizin).startsWith(KOK) && !path.resolve(dizin).includes(`${path.sep}testing${path.sep}`)) { console.error('A real set never lives inside the repo: move the folder out.'); process.exit(2) }
  const oku = (f: string) => JSON.parse(fs.readFileSync(f, 'utf8'))
  const sayfalar: SetSayfasi[] = fs.readdirSync(path.join(dizin, 'sayfalar')).filter((f) => f.endsWith('.json')).sort().map((f) => oku(path.join(dizin, 'sayfalar', f)))
  const kayitlar: Record<string, Record<string, unknown>> = {}
  for (const s of sayfalar) { const f = path.join(dizin, 'kayit', `${s.ad}.json`); kayitlar[s.ad] = fs.existsSync(f) ? (oku(f).kayit || {}) : {} }
  const onayliDosya = path.join(dizin, 'onayli.json')
  const r = await setiOynat(sayfalar, kayitlar, ortam(fs.existsSync(onayliDosya) ? oku(onayliDosya) : {}))
  const tabanDosya = path.join(dizin, 'taban.json')
  if (bayrak('taban-yaz')) {
    if (r.eksik.length) { console.error(`${r.eksik.length} recordings missing: cannot write a baseline from a stale set.`); process.exit(1) }
    fs.writeFileSync(tabanDosya, JSON.stringify(r.toplam, null, 2)); console.log(JSON.stringify({ tabanYazildi: rapor('simdi', r.toplam) })); return
  }
  if (!fs.existsSync(tabanDosya)) { console.error('No taban.json: run once with --taban-yaz.'); process.exit(2) }
  return { taban: oku(tabanDosya) as ToplamPuan, simdi: r.toplam, eksik: r.eksik.length }
}

async function uretim() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anahtar = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anahtar) { console.error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set'); process.exit(2) }
  const { createClient } = await import('@supabase/supabase-js')
  const sb = createClient(url, anahtar, { auth: { persistSession: false } })
  const { data: set, error } = await sb.from('el_notu_regresyon_sayfalari').select('id, brans, depo_yolu, gercekler').eq('durum', 'hazir').limit(1000)
  if (error) throw new Error('set unavailable')
  const { data: onay } = await sb.from('brans_sozluk_onerileri').select('brans, kisaltma, anlam').eq('durum', 'onayli').limit(5000)
  const onayli: Record<string, { kisaltma: string; anlam: string }[]> = {}
  for (const o of (onay || []) as { brans: string; kisaltma: string; anlam: string }[]) (onayli[o.brans] ||= []).push({ kisaltma: o.kisaltma, anlam: o.anlam })
  const sayfalar: SetSayfasi[] = [], kayitlar: Record<string, Record<string, unknown>> = {}, taban: OlcumSatiri[] = []
  const metin = async (yol: string) => { const { data } = await sb.storage.from('el-notu-regresyon').download(yol); return data ? JSON.parse(await data.text()) : null }
  for (const r of (set || []) as { id: string; brans: string | null; depo_yolu: string; gercekler: SetSayfasi['gercekler'] }[]) {
    const k = await metin(`kayit/${r.depo_yolu}`).catch(() => null) as { hafta?: string; kayit?: Record<string, unknown> } | null
    if (!k?.hafta || !k.kayit) continue
    const { data: o } = await sb.from('el_notu_regresyon_olcumleri').select('gercek, kesin, dogrulamada, adayda, isaretli, kacan, dogrula, korumali_soru, korumali_gercek, korumali_dogrula_ile, uydurma, hata').eq('hafta', k.hafta).eq('sayfa_id', r.id).maybeSingle()
    if (!o || (o as { hata?: string | null }).hata) continue
    const n = await metin(r.depo_yolu).catch(() => null) as { paket: SetSayfasi['paket']; maskeliSayfa: SetSayfasi['maskeliSayfa'] } | null
    if (!n) continue
    sayfalar.push({ ad: r.id, brans: r.brans, paket: n.paket, maskeliSayfa: n.maskeliSayfa, gercekler: r.gercekler || [] })
    kayitlar[r.id] = k.kayit
    taban.push(o as OlcumSatiri)
  }
  if (!sayfalar.length) { console.log(JSON.stringify({ bekci: 'no recorded set pages yet — nothing to compare' })); return null }
  const r = await setiOynat(sayfalar, kayitlar, ortam(onayli))
  return { taban: toplamPuan(taban.map(olcumdenPuan)), simdi: r.toplam, eksik: r.eksik.length }
}

async function ana() {
  const dizin = arg('set')
  const sonuc = dizin ? await yerel(dizin) : bayrak('uretim') ? await uretim() : (console.error('--set <dir> or --uretim'), process.exit(2))
  if (!sonuc) return
  const karar = bekciKarari(sonuc.taban, sonuc.simdi)
  const bayat = sonuc.eksik > 0
  console.log(JSON.stringify({ bekci: karar.gecti && !bayat ? 'pass' : 'FAIL', taban: rapor('taban', sonuc.taban), simdi: rapor('simdi', sonuc.simdi), eksikKayit: sonuc.eksik, nedenler: [...(bayat ? [`${sonuc.eksik} model calls have no recording: the set is stale for this reader (prompt or input changed) — re-record on the production model`] : []), ...karar.nedenler] }, null, 2))
  if (!karar.gecti || bayat) process.exitCode = 1
}

void ana()
